import { NomicEmbeddings } from '$lib/server/ai/embeddings/nomic';
import { TableVectorStore, type EmbeddableTable } from '$lib/server/ai/vector-store/base';
import * as schema from '$lib/server/db/schema';
import { AVAILABLE_SCHEMAS, type SchemaModule } from '$lib/server/db/schema/index';
import { getTableName, isNull, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { Resource } from 'sst';
import * as helpers from '../helpers';
// ============================================================================
// DATABASE CONNECTION (standalone - avoids $app/environment)
// ============================================================================

const { Pool } = pg;

const pool = new Pool({
	host: Resource.Database.host,
	port: Resource.Database.port,
	user: Resource.Database.username,
	password: Resource.Database.password,
	database: Resource.Database.database
});

const db = drizzle(pool, { schema });

// ============================================================================
// TYPES
// ============================================================================

interface EmbedTableResult {
	tableName: string;
	total: number;
	embedded: number;
	skipped: number;
	alreadyEmbedded: number;
}

interface EmbedSchemaResult {
	schemaName: string;
	tables: EmbedTableResult[];
	totalEmbedded: number;
	totalSkipped: number;
	duration: number;
}


/**
 * Get records missing embeddings in batches
 */
async function getRecordsMissingEmbeddings(
	table: EmbeddableTable,
	batchSize: number = 100
): Promise<{ id: number | string }[]> {
	const records = await db
		.select({ id: table.id })
		.from(table)
		.where(isNull(table.embedding))
		.limit(batchSize);

	return records as { id: number | string }[];
}

/**
 * Get count of records with and without embeddings
 */
async function getEmbeddingCounts(table: EmbeddableTable): Promise<{
	total: number;
	withEmbedding: number;
	withoutEmbedding: number;
}> {
	const [result] = await db
		.select({
			total: sql<number>`count(*)::int`,
			withEmbedding: sql<number>`count(${table.embedding})::int`
		})
		.from(table);

	return {
		total: result.total,
		withEmbedding: result.withEmbedding,
		withoutEmbedding: result.total - result.withEmbedding
	};
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Embed all missing embeddings for a single table
 */
async function embedTable(
	table: EmbeddableTable,
	embeddings: NomicEmbeddings,
	batchSize: number = 50
): Promise<EmbedTableResult> {
	const tableName = getTableName(table);
	const vectorStore = TableVectorStore.for(table, embeddings);

	try {
		const counts = await getEmbeddingCounts(table);

		if (counts.withoutEmbedding === 0) {
			return {
				tableName,
				total: counts.total,
				embedded: 0,
				skipped: 0,
				alreadyEmbedded: counts.withEmbedding
			};
		}

		console.log(`  ${tableName}: Embedding ${counts.withoutEmbedding}/${counts.total} records...`);

		let embedded = 0;
		let skipped = 0;

		// Process in batches
		while (true) {
			const records = await getRecordsMissingEmbeddings(table, batchSize);

			if (records.length === 0) break;

			const ids = records.map((r) => r.id);

			try {
				await vectorStore.updateEmbeddingsBatch(ids);
				embedded += ids.length;
				console.log(`    Progress: ${embedded}/${counts.withoutEmbedding}`);
			} catch {
				// Try one by one if batch fails
				for (const id of ids) {
					try {
						await vectorStore.updateEmbedding(id);
						embedded++;
					} catch {
						skipped++;
					}
				}
			}
		}
		return {
			tableName,
			total: counts.total,
			embedded,
			skipped,
			alreadyEmbedded: counts.withEmbedding
		};
	} catch {
		return {
			tableName,
			total: 0,
			embedded: 0,
			skipped: 0,
			alreadyEmbedded: 0
		};
	}
}

/**
 * Embed all embeddable tables in a schema module
 */
export async function embedSchemaModule(
	schemaModule: SchemaModule,
	schemaName: string,
	options: { batchSize?: number; onlyMissing?: boolean } = {}
): Promise<EmbedSchemaResult> {
	const startTime = Date.now();
	const batchSize = options.batchSize ?? 50;

	console.log(`\n${'═'.repeat(70)}`);
	console.log(`  Embedding Schema: ${schemaName}`);
	console.log(`${'═'.repeat(70)}\n`);

	const embeddings = new NomicEmbeddings();
	const embeddableTables = helpers.getEmbeddableTablesFromModule(schemaModule);

	if (embeddableTables.length === 0) {
		console.log(`  No embeddable tables found in schema "${schemaName}"`);
		return {
			schemaName,
			tables: [],
			totalEmbedded: 0,
			totalSkipped: 0,
			duration: Date.now() - startTime
		};
	}

	console.log(`  Found ${embeddableTables.length} embeddable tables:\n`);

	for (const table of embeddableTables) {
		console.log(`    - ${getTableName(table)}`);
	}
	console.log('');

	const results: EmbedTableResult[] = [];

	for (const table of embeddableTables) {
		const result = await embedTable(table, embeddings, batchSize);
		results.push(result);
	}

	const totalEmbedded = results.reduce((sum, r) => sum + r.embedded, 0);
	const totalSkipped = results.reduce((sum, r) => sum + r.skipped, 0);
	const duration = Date.now() - startTime;

	return {
		schemaName,
		tables: results,
		totalEmbedded,
		totalSkipped,
		duration
	};
}

/**
 * Embed all embeddable tables across multiple schema modules
 */
export async function embedAllSchemas(
	schemas: { module: SchemaModule; name: string }[],
	options: { batchSize?: number } = {}
): Promise<EmbedSchemaResult[]> {
	const results: EmbedSchemaResult[] = [];

	for (const { module, name } of schemas) {
		const result = await embedSchemaModule(module, name, options);
		results.push(result);
	}

	return results;
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
	const args = process.argv.slice(2);
	const schemaArg = args[0];
	const batchSize = parseInt(args.find((a) => a.startsWith('--batch='))?.split('=')[1] || '50');

	if (!schemaArg || schemaArg === '--help') {
		console.log('Usage: pnpm embed:schema <schema-name|all> [--batch=50]');
		console.log('');
		console.log('Available schemas:');
		for (const name of Object.keys(AVAILABLE_SCHEMAS)) {
			console.log(`  - ${name}`);
		}
		console.log('  - all (embeds all schemas)');
		console.log('');
		console.log('Options:');
		console.log('  --batch=N   Batch size for processing (default: 50)');
		console.log('');
		console.log('Examples:');
		console.log('  npm run embed:schema curriculum');
		console.log('  npm run embed:schema task --batch=100');
		console.log('  npm run embed:schema all');
		process.exit(0);
	}

	if (schemaArg === 'all') {
		const schemas = Object.entries(AVAILABLE_SCHEMAS).map(([name, module]) => ({
			name,
			module
		}));
		await embedAllSchemas(schemas, { batchSize });
	} else {
		const schemaModule = AVAILABLE_SCHEMAS[schemaArg];

		if (!schemaModule) {
			console.log(`Available schemas: ${Object.keys(AVAILABLE_SCHEMAS).join(', ')}`);
			process.exit(1);
		}

		await embedSchemaModule(schemaModule, schemaArg, { batchSize });
	}

	// Clean up database connection
	await pool.end();
}

// Run if executed directly
main().catch((err) => {
	console.error('Error:', err);
	process.exit(1);
});

import * as schema from '$lib/server/db/schema';
import 'dotenv/config';
import { getTableName } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as helpers from '../helpers';
import { exportSchemaToFile, exportTableToFile } from './sql-generator';

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

const { Pool } = pg;

const pool = new Pool({
	host: process.env.DB_HOST,
	port: parseInt(process.env.DB_PORT || '5432', 10),
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME
});

const db = drizzle(pool, { schema });

// ============================================================================
// CLI
// ============================================================================

function printHelp() {
	console.log('SQL Export Tool - Generate .sql files from database tables');
	console.log('');
	console.log('Usage:');
	console.log('  npm run sql:export schema <schema-name> [options]');
	console.log('  npm run sql:export table <table-name> [options]');
	console.log('  npm run sql:export list');
	console.log('');
	console.log('Commands:');
	console.log('  schema <name>   Export all tables in a schema to a single .sql file');
	console.log('  table <name>    Export a single table to a .sql file');
	console.log('  list            List all available schemas and tables');
	console.log('');
	console.log('Available schemas:');
	for (const name of Object.keys(schema.AVAILABLE_SCHEMAS)) {
		const tables = helpers.getTablesFromModule(schema.AVAILABLE_SCHEMAS[name]);
		console.log(`  - ${name} (${tables.length} tables)`);
	}
	console.log('');
	console.log('Options:');
	console.log('  --output=<dir>     Output directory (default: data/sql-exports)');
	console.log('  --transaction      Wrap in BEGIN/COMMIT transaction');
	console.log('  --override-id      Use OVERRIDING SYSTEM VALUE for identity columns');
	console.log('  --no-header        Omit file header comment');
	console.log('  --omit-ids         Omit primary key IDs (let DB assign new ones)');
	console.log('  --id-offset=<n>    Add offset to all ID columns (e.g., --id-offset=10000)');
	console.log('');
	console.log('ID Conflict Resolution:');
	console.log('  When exporting data for different environments or curricula that may');
	console.log('  have overlapping IDs, use one of these approaches:');
	console.log('');
	console.log('  --omit-ids         Best when FK relationships are not critical or will');
	console.log('                     be re-established via other means. Lets PostgreSQL');
	console.log('                     assign fresh sequential IDs.');
	console.log('');
	console.log('  --id-offset=N      Best when preserving FK relationships. Shifts all');
	console.log('                     IDs (primary and foreign keys) by N. Use different');
	console.log('                     offsets for different data sets:');
	console.log('                       Curriculum 1: --id-offset=0 (or omit)');
	console.log('                       Curriculum 2: --id-offset=100000');
	console.log('                       Curriculum 3: --id-offset=200000');
	console.log('');
	console.log('Examples:');
	console.log('  npm run sql:export schema curriculum');
	console.log('  npm run sql:export table crclm_sub_la --transaction');
	console.log('  npm run sql:export schema task --output=./exports');
	console.log('  npm run sql:export schema curriculum --id-offset=100000');
	console.log('  npm run sql:export list');
}

async function exportSchema(
	schemaName: string,
	options: {
		outputDir?: string;
		wrapInTransaction?: boolean;
		overrideIdentity?: boolean;
		includeHeader?: boolean;
		omitIds?: boolean;
		idOffset?: number;
	}
) {
	const schemaModule = schema.AVAILABLE_SCHEMAS[schemaName];

	if (!schemaModule) {
		console.error(` Schema "${schemaName}" not found.`);
		console.log(`Available schemas: ${Object.keys(schema.AVAILABLE_SCHEMAS).join(', ')}`);
		process.exit(1);
	}

	const tables = helpers.getTablesFromModule(schemaModule);

	if (tables.length === 0) {
		return;
	}

	console.log(`\n Exporting schema: ${schemaName}`);
	console.log(`   Tables: ${tables.length}`);
	if (options.idOffset) {
		console.log(`   ID Offset: ${options.idOffset}`);
	}
	if (options.omitIds) {
		console.log(`   Omitting IDs (PostgreSQL will assign new ones)`);
	}

	const filePath = await exportSchemaToFile(db, tables, schemaName, options);

	console.log(`\nExported to: ${filePath}`);
}

async function exportTable(
	tableName: string,
	options: {
		outputDir?: string;
		wrapInTransaction?: boolean;
		overrideIdentity?: boolean;
		includeHeader?: boolean;
		omitIds?: boolean;
		idOffset?: number;
	}
) {
	const table = helpers.findTableByName(tableName);

	if (!table) {
		console.error(`Table "${tableName}" not found.`);
		console.log('\nUse "npm run sql:export list" to see available tables.');
		process.exit(1);
	}

	console.log(`\n Exporting table: ${tableName}`);
	if (options.idOffset) {
		console.log(`   ID Offset: ${options.idOffset}`);
	}
	if (options.omitIds) {
		console.log(`   Omitting IDs (PostgreSQL will assign new ones)`);
	}

	const filePath = await exportTableToFile(db, table, options);

	console.log(`\nExported to: ${filePath}`);
}

function listSchemas() {
	console.log('\nAvailable Schemas and Tables:\n');
	for (const [schemaName, schemaModule] of Object.entries(schema.AVAILABLE_SCHEMAS)) {
		const tables = helpers.getTablesFromModule(schemaModule);
		console.log(`${schemaName}/ (${tables.length} tables)`);

		for (const table of tables) {
			console.log(`  └─ ${getTableName(table)}`);
		}
		console.log('');
	}
}

async function main() {
	const args = process.argv.slice(2);
	const command = args[0];
	const target = args[1];

	// Parse options
	const outputDir = args.find((a) => a.startsWith('--output='))?.split('=')[1];
	const wrapInTransaction = args.includes('--transaction');
	const overrideIdentity = args.includes('--override-id');
	const includeHeader = !args.includes('--no-header');
	const omitIds = args.includes('--omit-ids');
	const idOffsetArg = args.find((a) => a.startsWith('--id-offset='))?.split('=')[1];
	const idOffset = idOffsetArg ? parseInt(idOffsetArg, 10) : undefined;

	// Validate id-offset
	if (idOffsetArg && (isNaN(idOffset!) || idOffset! < 0)) {
		console.error('Error: --id-offset must be a non-negative integer');
		process.exit(1);
	}

	// Warn if both omitIds and idOffset are set
	if (omitIds && idOffset) {
		console.warn(
			'Warning: --omit-ids and --id-offset are both set. --omit-ids will take precedence for primary keys.'
		);
	}

	const options = {
		outputDir,
		wrapInTransaction,
		overrideIdentity,
		includeHeader,
		omitIds,
		idOffset
	};

	if (!command || command === '--help' || command === '-h') {
		printHelp();
		process.exit(0);
	}

	try {
		switch (command) {
			case 'schema':
				if (!target) {
					console.error('Please specify a schema name.');
					printHelp();
					process.exit(1);
				}
				await exportSchema(target, options);
				break;

			case 'table':
				if (!target) {
					console.error('Please specify a table name.');
					printHelp();
					process.exit(1);
				}
				await exportTable(target, options);
				break;

			case 'list':
				listSchemas();
				break;

			default:
				console.error(`Unknown command: ${command}`);
				printHelp();
				process.exit(1);
		}
	} finally {
		await pool.end();
	}
}

// Run if executed directly
main().catch((err) => {
	console.error('Error:', err);
	process.exit(1);
});

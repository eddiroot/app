import * as schema from '$lib/server/db/schema';
import { getTableName } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { PgTable } from 'drizzle-orm/pg-core';
import pg from 'pg';
import { Resource } from 'sst';

// Import schema modules
import * as coursemapModule from '$lib/server/db/schema/coursemap';
import * as curriculumModule from '$lib/server/db/schema/curriculum';
import * as eventsModule from '$lib/server/db/schema/events';
import * as newsModule from '$lib/server/db/schema/news';
import * as resourceModule from '$lib/server/db/schema/resource';
import * as schoolModule from '$lib/server/db/schema/schools';
import * as subjectsModule from '$lib/server/db/schema/subjects';
import * as taskModule from '$lib/server/db/schema/task';
import * as timetableModule from '$lib/server/db/schema/timetables';
import * as userModule from '$lib/server/db/schema/user';

import { exportSchemaToFile, exportTableToFile } from './sql-generator';

// ============================================================================
// DATABASE CONNECTION
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

type SchemaModule = Record<string, unknown>;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Check if a value is a Drizzle table
 */
function isTable(value: unknown): value is PgTable {
	try {
		return typeof getTableName(value as PgTable) === 'string';
	} catch {
		return false;
	}
}

/**
 * Get all tables from a schema module
 */
function getTablesFromModule(schemaModule: SchemaModule): PgTable[] {
	const tables: PgTable[] = [];

	for (const value of Object.values(schemaModule)) {
		if (isTable(value)) {
			tables.push(value);
		}
	}

	return tables;
}

/**
 * Find a table by name across all schema modules
 */
function findTableByName(tableName: string): PgTable | null {
	for (const schemaModule of Object.values(AVAILABLE_SCHEMAS)) {
		for (const value of Object.values(schemaModule)) {
			if (isTable(value)) {
				const name = getTableName(value);
				if (name === tableName) {
					return value;
				}
			}
		}
	}
	return null;
}

// ============================================================================
// SCHEMA REGISTRY
// ============================================================================

const AVAILABLE_SCHEMAS: Record<string, SchemaModule> = {
	curriculum: curriculumModule,
	task: taskModule,
	school: schoolModule,
	user: userModule,
	news: newsModule,
	subjects: subjectsModule,
	timetable: timetableModule,
	events: eventsModule,
	resource: resourceModule,
	coursemap: coursemapModule
};

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
	for (const name of Object.keys(AVAILABLE_SCHEMAS)) {
		const tables = getTablesFromModule(AVAILABLE_SCHEMAS[name]);
		console.log(`  - ${name} (${tables.length} tables)`);
	}
	console.log('');
	console.log('Options:');
	console.log('  --output=<dir>     Output directory (default: data/sql-exports)');
	console.log('  --transaction      Wrap in BEGIN/COMMIT transaction');
	console.log('  --override-id      Use OVERRIDING SYSTEM VALUE for identity columns');
	console.log('  --no-header        Omit file header comment');
	console.log('');
	console.log('Examples:');
	console.log('  npm run sql:export schema curriculum');
	console.log('  npm run sql:export table crclm_sub_la --transaction');
	console.log('  npm run sql:export schema task --output=./exports');
	console.log('  npm run sql:export list');
}

async function exportSchema(schemaName: string, options: {
	outputDir?: string;
	wrapInTransaction?: boolean;
	overrideIdentity?: boolean;
	includeHeader?: boolean;
}) {
	const schemaModule = AVAILABLE_SCHEMAS[schemaName];

	if (!schemaModule) {
		console.error(`❌ Schema "${schemaName}" not found.`);
		console.log(`Available schemas: ${Object.keys(AVAILABLE_SCHEMAS).join(', ')}`);
		process.exit(1);
	}

	const tables = getTablesFromModule(schemaModule);

	if (tables.length === 0) {
		return;
	}

	console.log(`\n Exporting schema: ${schemaName}`);
	console.log(`   Tables: ${tables.length}`);

	const filePath = await exportSchemaToFile(db, tables, schemaName, options);

	console.log(`\nExported to: ${filePath}`);
}

async function exportTable(tableName: string, options: {
	outputDir?: string;
	wrapInTransaction?: boolean;
	overrideIdentity?: boolean;
	includeHeader?: boolean;
}) {
	const table = findTableByName(tableName);

	if (!table) {
		console.error(`Table "${tableName}" not found.`);
		console.log('\nUse "npm run sql:export list" to see available tables.');
		process.exit(1);
	}

	console.log(`\n Exporting table: ${tableName}`);

	const filePath = await exportTableToFile(db, table, options);

	console.log(`\nExported to: ${filePath}`);
}

function listSchemas() {
	console.log('\nAvailable Schemas and Tables:\n');
	for (const [schemaName, schemaModule] of Object.entries(AVAILABLE_SCHEMAS)) {
		const tables = getTablesFromModule(schemaModule);
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

	const options = {
		outputDir,
		wrapInTransaction,
		overrideIdentity,
		includeHeader
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

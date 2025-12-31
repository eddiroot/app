import { db } from '$lib/server/db';
import { eq, getTableName } from 'drizzle-orm';
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

// ============================================================================
// TYPES
// ============================================================================

interface SqlGeneratorOptions {
	/** Include transaction wrapper (BEGIN/COMMIT) */
	wrapInTransaction?: boolean;
	/** Include header comment with generation timestamp */
	includeHeader?: boolean;
	/** Use OVERRIDING SYSTEM VALUE for identity columns */
	overrideIdentity?: boolean;
	/** Output directory for generated files */
	outputDir?: string;
}

interface TableWithId extends PgTable {
	id: PgColumn;
}

// ============================================================================
// SQL VALUE ESCAPING
// ============================================================================

/**
 * Escape a JavaScript value for SQL insertion
 */
function escapeValue(value: unknown): string {
	if (value === null || value === undefined) {
		return 'NULL';
	}

	if (typeof value === 'number') {
		if (Number.isNaN(value)) return 'NULL';
		return String(value);
	}

	if (typeof value === 'boolean') {
		return value ? 'TRUE' : 'FALSE';
	}

	if (value instanceof Date) {
		return `'${value.toISOString()}'`;
	}

	// Vector embedding array (all numbers)
	if (Array.isArray(value)) {
		if (value.length > 0 && value.every((v) => typeof v === 'number')) {
			return `'[${value.join(',')}]'::vector`;
		}
		// Other arrays (text[], etc.)
		return `ARRAY[${value.map((v) => escapeValue(v)).join(',')}]`;
	}

	// JSON/JSONB objects
	if (typeof value === 'object') {
		const jsonStr = JSON.stringify(value).replace(/'/g, "''");
		return `'${jsonStr}'::jsonb`;
	}

	// String - escape single quotes
	const strValue = String(value).replace(/'/g, "''");
	return `'${strValue}'`;
}

/**
 * Get the schema name from a table if it has one
 */
function getSchemaName(table: PgTable): string | null {
	// Access internal drizzle property for schema
	const tableConfig = (table as unknown as { _: { schema?: string } })._;
	return tableConfig?.schema || null;
}

/**
 * Get fully qualified table name (schema.table or just table)
 */
function getFullTableName(table: PgTable): string {
	const tableName = getTableName(table);
	const schemaName = getSchemaName(table);

	if (schemaName) {
		return `"${schemaName}"."${tableName}"`;
	}
	return `"${tableName}"`;
}

/**
 * Convert a drizzle column key to its SQL column name
 */
function getColumnName(table: PgTable, key: string): string {
	const columns = table as unknown as Record<string, { name?: string }>;
	return columns[key]?.name || key;
}

// ============================================================================
// SQL GENERATION
// ============================================================================

/**
 * Generate INSERT statement for a single record
 */
function generateInsertStatement(
	table: PgTable,
	record: Record<string, unknown>,
	options: { overrideIdentity?: boolean } = {}
): string {
	const tableName = getFullTableName(table);
	const columns: string[] = [];
	const values: string[] = [];

	for (const [key, value] of Object.entries(record)) {
		if (value === undefined) continue;

		const colName = getColumnName(table, key);
		columns.push(`"${colName}"`);
		values.push(escapeValue(value));
	}

	const override = options.overrideIdentity ? ' OVERRIDING SYSTEM VALUE' : '';
	return `INSERT INTO ${tableName} (${columns.join(', ')})${override} VALUES (${values.join(', ')});`;
}

/**
 * Generate batch INSERT statement for multiple records
 */
function generateBatchInsertStatement(
	table: PgTable,
	records: Record<string, unknown>[],
	options: { overrideIdentity?: boolean } = {}
): string {
	if (records.length === 0) return '';

	const tableName = getFullTableName(table);

	// Get columns from first record
	const firstRecord = records[0];
	const columnKeys = Object.keys(firstRecord).filter((k) => firstRecord[k] !== undefined);
	const columns = columnKeys.map((k) => `"${getColumnName(table, k)}"`);

	// Generate value rows
	const valueRows = records.map((record) => {
		const values = columnKeys.map((key) => escapeValue(record[key]));
		return `  (${values.join(', ')})`;
	});

	const override = options.overrideIdentity ? ' OVERRIDING SYSTEM VALUE' : '';
	return `INSERT INTO ${tableName} (${columns.join(', ')})${override} VALUES\n${valueRows.join(',\n')};`;
}

/**
 * Generate SQL file header
 */
function generateHeader(description: string): string {
	return [
		'-- ============================================================================',
		`-- ${description}`,
		`-- Generated: ${new Date().toISOString()}`,
		'-- DO NOT EDIT MANUALLY - Regenerate using sql-generator',
		'-- ============================================================================',
		''
	].join('\n');
}

/**
 * Generate section comment
 */
function generateSection(title: string): string {
	return ['', `-- ${'─'.repeat(76)}`, `-- ${title}`, `-- ${'─'.repeat(76)}`, ''].join('\n');
}

// ============================================================================
// MAIN EXPORT FUNCTIONS
// ============================================================================

/**
 * Export a single record from a table by its primary key ID
 */
export async function exportRecordToSql(
	table: TableWithId,
	id: number | string,
	options: SqlGeneratorOptions = {}
): Promise<string> {
	const tableName = getTableName(table);

	// Fetch the record
	const [record] = await db.select().from(table).where(eq(table.id, id)).limit(1);

	if (!record) {
		throw new Error(`Record with id ${id} not found in table ${tableName}`);
	}

	const statements: string[] = [];

	if (options.includeHeader !== false) {
		statements.push(generateHeader(`Single record export: ${tableName} (id: ${id})`));
	}

	if (options.wrapInTransaction) {
		statements.push('BEGIN;');
	}

	statements.push(
		generateInsertStatement(table, record as Record<string, unknown>, {
			overrideIdentity: options.overrideIdentity
		})
	);

	if (options.wrapInTransaction) {
		statements.push('');
		statements.push('COMMIT;');
	}

	return statements.join('\n');
}

/**
 * Export all records from a single table
 */
export async function exportTableToSql(
	table: PgTable,
	options: SqlGeneratorOptions = {}
): Promise<string> {
	const tableName = getTableName(table);

	// Fetch all records
	const records = await db.select().from(table);

	if (records.length === 0) {
		return `-- No records found in ${tableName}`;
	}

	const statements: string[] = [];

	if (options.includeHeader !== false) {
		statements.push(
			generateHeader(`Table export: ${getFullTableName(table)} (${records.length} records)`)
		);
	}

	if (options.wrapInTransaction) {
		statements.push('BEGIN;');
	}

	statements.push(
		generateBatchInsertStatement(table, records as Record<string, unknown>[], {
			overrideIdentity: options.overrideIdentity
		})
	);

	if (options.wrapInTransaction) {
		statements.push('');
		statements.push('COMMIT;');
	}

	return statements.join('\n');
}

/**
 * Export multiple tables (a "schema") to SQL
 * Tables are exported in the order provided (important for foreign key constraints)
 */
export async function exportSchemaToSql(
	tables: PgTable[],
	schemaName: string,
	options: SqlGeneratorOptions = {}
): Promise<string> {
	const statements: string[] = [];

	if (options.includeHeader !== false) {
		statements.push(generateHeader(`Schema export: ${schemaName}`));
	}

	if (options.wrapInTransaction) {
		statements.push('BEGIN;');
	}

	for (const table of tables) {
		const tableName = getTableName(table);
		const records = await db.select().from(table);

		if (records.length === 0) {
			statements.push(`-- Skipping ${tableName}: no records`);
			continue;
		}

		statements.push(generateSection(`${tableName} (${records.length} records)`));
		statements.push(
			generateBatchInsertStatement(table, records as Record<string, unknown>[], {
				overrideIdentity: options.overrideIdentity
			})
		);
	}

	if (options.wrapInTransaction) {
		statements.push('');
		statements.push('COMMIT;');
	}

	return statements.join('\n');
}

// ============================================================================
// FILE WRITING UTILITIES
// ============================================================================

/**
 * Write SQL content to a file
 */
export function writeSqlFile(
	content: string,
	fileName: string,
	outputDir: string = join(process.cwd(), 'data', 'sql-exports')
): string {
	if (!existsSync(outputDir)) {
		mkdirSync(outputDir, { recursive: true });
	}

	const filePath = join(outputDir, fileName.endsWith('.sql') ? fileName : `${fileName}.sql`);
	writeFileSync(filePath, content, 'utf-8');

	console.log(`📄 Wrote SQL file: ${filePath}`);
	return filePath;
}

/**
 * Export and write a table to SQL file
 */
export async function exportTableToFile(
	table: PgTable,
	options: SqlGeneratorOptions & { fileName?: string } = {}
): Promise<string> {
	const tableName = getTableName(table);
	const sql = await exportTableToSql(table, options);
	const fileName = options.fileName || `${tableName}.sql`;

	return writeSqlFile(sql, fileName, options.outputDir);
}

/**
 * Export and write a schema to SQL file
 */
export async function exportSchemaToFile(
	tables: PgTable[],
	schemaName: string,
	options: SqlGeneratorOptions & { fileName?: string } = {}
): Promise<string> {
	const sql = await exportSchemaToSql(tables, schemaName, options);
	const fileName = options.fileName || `${schemaName}.sql`;

	return writeSqlFile(sql, fileName, options.outputDir);
}

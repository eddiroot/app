import { eq, getTableName } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
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
	/** Omit ID columns - let PostgreSQL assign new IDs (incompatible with foreign keys) */
	omitIds?: boolean;
	/** Add offset to all ID columns (both primary and foreign keys) */
	idOffset?: number;
}

interface TableWithId extends PgTable {
	id: PgColumn;
}

// ============================================================================
// ID COLUMN DETECTION
// ============================================================================

/**
 * Check if a SQL column name is an ID column (ends with _id or is exactly 'id')
 */
function isIdColumn(columnName: string): boolean {
	return columnName === 'id' || columnName.endsWith('_id');
}

/**
 * Check if a JSONB key is an ID field (ends with 'Id' in camelCase)
 */
function isJsonbIdKey(key: string): boolean {
	return key === 'id' || key.endsWith('Id');
}

// ============================================================================
// SQL VALUE ESCAPING
// ============================================================================

/**
 * Apply ID offset to JSONB object recursively
 */
function applyIdOffsetToJsonb(obj: unknown, offset: number): unknown {
	if (obj === null || obj === undefined) return obj;

	if (Array.isArray(obj)) {
		return obj.map((item) => applyIdOffsetToJsonb(item, offset));
	}

	if (typeof obj === 'object') {
		const result: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
			// Check if key is an ID field that should be offset (ends with 'Id' in camelCase)
			if (isJsonbIdKey(key) && typeof value === 'number') {
				result[key] = value + offset;
			} else if (typeof value === 'object' && value !== null) {
				// Recursively process nested objects
				result[key] = applyIdOffsetToJsonb(value, offset);
			} else {
				result[key] = value;
			}
		}
		return result;
	}

	return obj;
}

/**
 * Escape a JavaScript value for SQL insertion
 */
function escapeValue(value: unknown, idOffset?: number): string {
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
		return `ARRAY[${value.map((v) => escapeValue(v, idOffset)).join(',')}]`;
	}

	// JSON/JSONB objects
	if (typeof value === 'object') {
		// Apply ID offset to JSONB content if offset is provided
		const processedValue = idOffset ? applyIdOffsetToJsonb(value, idOffset) : value;
		const jsonStr = JSON.stringify(processedValue).replace(/'/g, "''");
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
	options: { overrideIdentity?: boolean; omitIds?: boolean; idOffset?: number } = {}
): string {
	const tableName = getFullTableName(table);
	const columns: string[] = [];
	const values: string[] = [];

	for (const [key, value] of Object.entries(record)) {
		if (value === undefined) continue;

		const colName = getColumnName(table, key);

		// Skip ID column if omitIds is set
		if (options.omitIds && colName === 'id') continue;

		columns.push(`"${colName}"`);

		// Apply offset to ID columns (columns ending with _id or exactly 'id')
		if (options.idOffset && isIdColumn(colName) && typeof value === 'number') {
			values.push(String(value + options.idOffset));
		} else {
			values.push(escapeValue(value, options.idOffset));
		}
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
	options: { overrideIdentity?: boolean; omitIds?: boolean; idOffset?: number } = {}
): string {
	if (records.length === 0) return '';

	const tableName = getFullTableName(table);

	// Get columns from first record
	const firstRecord = records[0];
	let columnKeys = Object.keys(firstRecord).filter((k) => firstRecord[k] !== undefined);

	// Filter out 'id' column if omitIds is set
	if (options.omitIds) {
		columnKeys = columnKeys.filter((k) => getColumnName(table, k) !== 'id');
	}

	const columns = columnKeys.map((k) => `"${getColumnName(table, k)}"`);

	// Generate value rows
	const valueRows = records.map((record) => {
		const values = columnKeys.map((key) => {
			const colName = getColumnName(table, key);
			const value = record[key];

			// Apply offset to ID columns (columns ending with _id or exactly 'id')
			if (options.idOffset && isIdColumn(colName) && typeof value === 'number') {
				return String(value + options.idOffset);
			}
			return escapeValue(value, options.idOffset);
		});
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
// DATABASE TYPE
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DrizzleDb = NodePgDatabase<any>;

// ============================================================================
// MAIN EXPORT FUNCTIONS
// ============================================================================

/**
 * Export a single record from a table by its primary key ID
 */
export async function exportRecordToSql(
	db: DrizzleDb,
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
			overrideIdentity: options.overrideIdentity,
			omitIds: options.omitIds,
			idOffset: options.idOffset
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
	db: DrizzleDb,
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
			overrideIdentity: options.overrideIdentity,
			omitIds: options.omitIds,
			idOffset: options.idOffset
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
	db: DrizzleDb,
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
				overrideIdentity: options.overrideIdentity,
				omitIds: options.omitIds,
				idOffset: options.idOffset
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
	return filePath;
}

/**
 * Export and write a table to SQL file
 */
export async function exportTableToFile(
	db: DrizzleDb,
	table: PgTable,
	options: SqlGeneratorOptions & { fileName?: string } = {}
): Promise<string> {
	const tableName = getTableName(table);
	const sql = await exportTableToSql(db, table, options);
	const fileName = options.fileName || `${tableName}.sql`;

	return writeSqlFile(sql, fileName, options.outputDir);
}

/**
 * Export and write a schema to SQL file
 */
export async function exportSchemaToFile(
	db: DrizzleDb,
	tables: PgTable[],
	schemaName: string,
	options: SqlGeneratorOptions & { fileName?: string } = {}
): Promise<string> {
	const sql = await exportSchemaToSql(db, tables, schemaName, options);
	const fileName = options.fileName || `${schemaName}.sql`;
	return writeSqlFile(sql, fileName, options.outputDir);
}

import { hash } from '@node-rs/argon2';
import { existsSync, readFileSync } from 'fs';
import type { Database } from './types';

let cachedPasswordHash: string | null = null;

/**
 * Get a cached password hash for seeding (avoids repeated hashing)
 */
export async function getDefaultPasswordHash(): Promise<string> {
	if (!cachedPasswordHash) {
		cachedPasswordHash = await hash('password123');
	}
	return cachedPasswordHash;
}

/**
 * Log a section header for better console output
 */
export function logSection(title: string): void {
	console.log('\n' + '='.repeat(60));
	console.log(title);
	console.log('='.repeat(60));
}

/**
 * Log a subsection
 */
export function logSubsection(title: string): void {
	console.log('\n' + '-'.repeat(40));
	console.log(title);
	console.log('-'.repeat(40));
}

/**
 * Truncate specified tables (skips tables that don't exist)
 */
export async function truncateTables(
	db: Database,
	pool: import('pg').Pool,
	tableNames: string[]
): Promise<void> {
	if (tableNames.length === 0) return;

	// Get list of existing tables
	const result = await pool.query(`
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `);
	const existingTables = new Set(result.rows.map((row: { tablename: string }) => row.tablename));

	// Filter to only tables that exist
	const tablesToTruncate = tableNames.filter((name) => existingTables.has(name));

	if (tablesToTruncate.length === 0) {
		console.log('No tables to truncate.');
		return;
	}

	const formattedNames = tablesToTruncate.map((name) => `"${name}"`).join(', ');
	await pool.query(`TRUNCATE TABLE ${formattedNames} RESTART IDENTITY CASCADE`);
	console.log(`Truncated ${tablesToTruncate.length} tables.`);
}

/**
 * Truncate all tables in all user schemas (excluding system schemas)
 */
export async function truncateAllTables(pool: import('pg').Pool): Promise<void> {
	// Get list of all tables in all user schemas (excluding system schemas and drizzle tables)
	const result = await pool.query(`
        SELECT schemaname, tablename FROM pg_tables 
        WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
        AND tablename NOT LIKE 'drizzle%'
    `);

	const tables = result.rows.map(
		(row: { schemaname: string; tablename: string }) =>
			`"${row.schemaname}"."${row.tablename}"`
	);

	if (tables.length === 0) {
		console.log('No tables to truncate.');
		return;
	}

	await pool.query(`TRUNCATE TABLE ${tables.join(', ')} RESTART IDENTITY CASCADE`);
	console.log(`Truncated ${tables.length} tables.`);
}

/**
 * Check if a SQL file exists for a given TypeScript seed file
 * Convention: If vc2.sql exists alongside vc2.ts, use the SQL file
 */
export function getSqlFilePath(tsFilePath: string): string | null {
	const sqlPath = tsFilePath.replace(/\.ts$/, '.sql');
	return existsSync(sqlPath) ? sqlPath : null;
}

/**
 * Execute a SQL file against the database
 */
export async function executeSqlFile(pool: import('pg').Pool, sqlFilePath: string): Promise<void> {
	const sql = readFileSync(sqlFilePath, 'utf-8');
	console.log(`Executing SQL file: ${sqlFilePath}`);
	await pool.query(sql);
	console.log(`SQL file executed successfully.`);
}

/**
 * Try to run a SQL file if it exists, otherwise return false to indicate
 * the caller should run the TypeScript seeder instead.
 *
 * @param pool - Database pool for executing raw SQL
 * @param callerFilePath - The __filename of the calling .ts file (use import.meta.url)
 * @returns true if SQL file was executed, false if caller should run TS seeder
 */
export async function tryRunSqlFile(
	pool: import('pg').Pool,
	callerFileUrl: string
): Promise<boolean> {
	// Convert file:// URL to path
	const callerFilePath = new URL(callerFileUrl).pathname;
	const sqlPath = getSqlFilePath(callerFilePath);

	if (sqlPath) {
		await executeSqlFile(pool, sqlPath);
		return true;
	}

	return false;
}

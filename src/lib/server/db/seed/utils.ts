import { hash } from '@node-rs/argon2';
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
    const tablesToTruncate = tableNames.filter(name => existingTables.has(name));
    
    if (tablesToTruncate.length === 0) {
        console.log('No tables to truncate.');
        return;
    }
    
    const formattedNames = tablesToTruncate.map((name) => `"${name}"`).join(', ');
    await pool.query(`TRUNCATE TABLE ${formattedNames} RESTART IDENTITY CASCADE`);
    console.log(`Truncated ${tablesToTruncate.length} tables.`);
}

/**
 * Truncate all tables in the public schema
 */
export async function truncateAllTables(
    pool: import('pg').Pool
): Promise<void> {
    // Get list of all tables in public schema (excluding system tables)
    const result = await pool.query(`
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename NOT LIKE 'drizzle%'
    `);
    
    const tableNames = result.rows.map((row: { tablename: string }) => row.tablename);
    
    if (tableNames.length === 0) {
        console.log('No tables to truncate.');
        return;
    }
    
    const formattedNames = tableNames.map((name: string) => `"${name}"`).join(', ');
    await pool.query(`TRUNCATE TABLE ${formattedNames} RESTART IDENTITY CASCADE`);
    console.log(`Truncated ${tableNames.length} tables.`);
}
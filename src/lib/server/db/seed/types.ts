import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type pg from 'pg';
import type * as schema from '../schema';

export type Database = NodePgDatabase<typeof schema>;

export interface SeedContext {
	db: Database;
	/** Raw pg Pool for executing SQL files */
	pool: pg.Pool;
}

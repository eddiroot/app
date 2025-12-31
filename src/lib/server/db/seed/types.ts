import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from '../schema';

export type Database = NodePgDatabase<typeof schema>;

export interface SeedContext {
    db: Database;
    /** If true, truncate tables before seeding */
    fresh?: boolean;
}

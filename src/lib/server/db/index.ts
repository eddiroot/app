import { building } from '$app/environment';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { Resource } from 'sst';
import * as schema from './schema';

let _db:
	| (NodePgDatabase<typeof schema> & {
		$client: Pool;
	})
	| null = null;

if (!building) {
	const pool = new Pool({
		host: Resource.Database.host,
		port: Resource.Database.port,
		user: Resource.Database.username,
		password: Resource.Database.password,
		database: Resource.Database.database
	});

	_db = drizzle(pool, { schema });
}

export const db = _db!;

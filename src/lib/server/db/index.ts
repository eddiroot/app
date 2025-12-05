import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { Resource } from 'sst';
import * as schema from './schema';

let _db: NodePgDatabase<typeof schema> | null = null;

export const db = new Proxy({} as NodePgDatabase<typeof schema>, {
	get(_, prop) {
		if (!_db) {
			const pool = new Pool({
				host: Resource.Database.host,
				port: Resource.Database.port,
				user: Resource.Database.username,
				password: Resource.Database.password,
				database: Resource.Database.database
			});
			_db = drizzle(pool, { schema });
		}
		return Reflect.get(_db, prop);
	}
});

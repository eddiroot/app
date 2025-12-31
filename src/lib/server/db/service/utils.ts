import { getTableName } from 'drizzle-orm';
import type { PgSchema, PgTable } from 'drizzle-orm/pg-core';

export function getSchemaTables(schema: PgSchema): PgTable[] {
	const schemaObjects = Object.values(schema);

	return schemaObjects.filter((item): item is PgTable => {
		// Check if it's a table by trying to get its table name
		try {
			return typeof getTableName(item as PgTable) === 'string';
		} catch {
			return false;
		}
	});
}

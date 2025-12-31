import { RecordFlagEnum } from '$lib/enums';
import { db } from '$lib/server/db';
import { eq, getTableName, sql } from 'drizzle-orm';
import type { PgColumn, PgSchema, PgTable } from 'drizzle-orm/pg-core';


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

// ============================================================================
// FLAG UTILITIES
// ============================================================================

export type TableWithFlags = PgTable & {
    id: PgColumn;
    flags: PgColumn;
};

/**
 * Set a flag on a record
 */
export async function setFlag(
    table: TableWithFlags,
    id: number,
    flag: RecordFlagEnum
) {
    return db
        .update(table)
        .set({ flags: sql`${table.flags} | ${flag}` })
        .where(eq(table.id, id));
}

/**
 * Clear a flag on a record
 */
export async function clearFlag(
    table: TableWithFlags,
    id: number,
    flag: RecordFlagEnum
) {
    return db
        .update(table)
        .set({ flags: sql`${table.flags} & ~${flag}` })
        .where(eq(table.id, id));
}

/**
 * Archive a record
 */
export async function archiveRecord(table: TableWithFlags, id: number) {
    return setFlag(table, id, RecordFlagEnum.archived);
}

/**
 * Unarchive a record
 */
export async function unarchiveRecord(table: TableWithFlags, id: number) {
    return clearFlag(table, id, RecordFlagEnum.archived);
}

/**
 * Request public approval
 */
export async function requestPublic(table: TableWithFlags, id: number) {
    return setFlag(table, id, RecordFlagEnum.publicRequested);
}

/**
 * Approve public request
 */
export async function approvePublic(table: TableWithFlags, id: number) {
    return db
        .update(table)
        .set({ 
            flags: sql`${table.flags} | ${RecordFlagEnum.publicApproved}` 
        })
        .where(eq(table.id, id));
}
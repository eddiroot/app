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

// ============================================================================
// SQL WHERE CLAUSE HELPERS
// ============================================================================

/**
 * SQL condition to check if a flag is set (for WHERE clauses)
 * Usage: where(hasFlag(table.flags, RecordFlagEnum.archived))
 */
export function hasFlag(flagsColumn: PgColumn, flag: RecordFlagEnum) {
    return sql`(${flagsColumn} & ${flag}) != 0`;
}

/**
 * SQL condition to check if a flag is NOT set (for WHERE clauses)
 * Usage: where(notHasFlag(table.flags, RecordFlagEnum.archived))
 */
export function notHasFlag(flagsColumn: PgColumn, flag: RecordFlagEnum) {
    return sql`(${flagsColumn} & ${flag}) = 0`;
}

/**
 * SQL condition to check if record is archived
 * Usage: where(isArchived(table.flags))
 */
export function isArchived(flagsColumn: PgColumn) {
    return hasFlag(flagsColumn, RecordFlagEnum.archived);
}

/**
 * SQL condition to check if record is NOT archived
 * Usage: where(notArchived(table.flags))
 */
export function notArchived(flagsColumn: PgColumn) {
    return notHasFlag(flagsColumn, RecordFlagEnum.archived);
}

/**
 * SQL expression to set a flag (for UPDATE SET)
 * Usage: .set({ flags: setFlagExpr(table.flags, RecordFlagEnum.archived) })
 */
export function setFlagExpr(flagsColumn: PgColumn, flag: RecordFlagEnum) {
    return sql`${flagsColumn} | ${flag}`;
}

/**
 * SQL expression to clear a flag (for UPDATE SET)
 * Usage: .set({ flags: clearFlagExpr(table.flags, RecordFlagEnum.archived) })
 */
export function clearFlagExpr(flagsColumn: PgColumn, flag: RecordFlagEnum) {
    return sql`${flagsColumn} & ~${flag}`;
}
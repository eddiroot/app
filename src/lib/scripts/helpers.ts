import { type EmbeddableTable } from '$lib/server/ai/vector-store/base';
import * as schema from '$lib/server/db/schema';
import { type SchemaModule } from '$lib/server/db/schema/index';
import { getTableName } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';

/**
 * Check if a value is a Drizzle table
 */
export function isTable(value: unknown): value is PgTable {
    try {
        return typeof getTableName(value as PgTable) === 'string';
    } catch {
        return false;
    }
}

/**
 * Check if a table has embedding columns (is embeddable)
 */
export function isEmbeddableTable(table: PgTable): table is EmbeddableTable {
    const tableObj = table as unknown as Record<string, unknown>;
    return 'embedding' in tableObj && 'id' in tableObj && 'embeddingMetadata' in tableObj;
}

/**
 * Get all embeddable tables from a schema module's exports
 */
export function getEmbeddableTablesFromModule(schemaModule: SchemaModule): EmbeddableTable[] {
    const tables: EmbeddableTable[] = [];

    for (const value of Object.values(schemaModule)) {
        if (isTable(value) && isEmbeddableTable(value)) {
            tables.push(value);
        }
    }

    return tables;
}

/**
 * Get all tables from a schema module
 */
export function getTablesFromModule(schemaModule: SchemaModule): PgTable[] {
    const tables: PgTable[] = [];

    for (const value of Object.values(schemaModule)) {
        if (isTable(value)) {
            tables.push(value);
        }
    }

    return tables;
}

/**
 * Find a table by name across all schema modules
 */
export function findTableByName(tableName: string): PgTable | null {
    for (const schemaModule of Object.values(schema.AVAILABLE_SCHEMAS)) {
        for (const value of Object.values(schemaModule)) {
            if (isTable(value)) {
                const name = getTableName(value);
                if (name === tableName) {
                    return value;
                }
            }
        }
    }
    return null;
}

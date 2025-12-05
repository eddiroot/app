import type { yearLevelEnum } from '$lib/enums';
import { db } from '$lib/server/db';
import { and, cosineDistance, eq, sql, type SQL } from 'drizzle-orm';
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';

export interface EmbeddingMetadataFilter {
    subjectId?: number;
    curriculumSubjectId?: number;
    yearLevel?: yearLevelEnum;
    [key: string]: unknown;
}

export async function createRecordWithEmbedding(
    table: PgTable,
    record: Record<string, unknown>,
    embedding: number[] | number[][],
    metadata?: EmbeddingMetadataFilter
) {
    // Handle both single vector and array of vectors (use first if array)
    const vectorData = Array.isArray(embedding[0]) ? embedding[0] : embedding;
    
    await db.insert(table).values({
        ...record,
        // Drizzle's vector type expects the array directly, not stringified
        embedding: vectorData,
        embeddingMetadata: {
            usageCount: 0,
            lastUsedAt: null,
            ...metadata
        }
    });
}

export async function updateRecordEmbedding(
    table: PgTable & { embedding: PgColumn; id: PgColumn; embeddingMetadata?: PgColumn },
    recordId: number | string,
    embedding: number[] | number[][],
    metadata?: EmbeddingMetadataFilter
) {
    // Handle both single vector and array of vectors (use first if array)
    const vectorData = Array.isArray(embedding[0]) ? embedding[0] : embedding;
    
    const updateData: Record<string, unknown> = {
        // Drizzle's vector type expects the array directly, not stringified
        embedding: vectorData
    };

    if (metadata && Object.keys(metadata).length > 0) {
        // Merge with base metadata fields
        updateData.embeddingMetadata = {
            usageCount: 0,
            lastUsedAt: null,
            ...metadata
        };
    }

    await db
        .update(table)
        .set(updateData)
        .where(eq(table.id, recordId));
}

export async function getRecord(table: PgTable & { embedding: PgColumn; id: PgColumn }, recordId: number | string) {
    const results = await db
        .select()
        .from(table)
        .where(eq(table.id, recordId))
        .limit(1);
    
    return results[0];
}

export interface VectorSearchResult<T> {
  record: T;           
  distance: number;
}

/**
 * Build metadata filter conditions for JSONB queries
 */
function buildMetadataFilters(
    embeddingMetadataColumn: PgColumn,
    filter: EmbeddingMetadataFilter
): SQL[] {
    const conditions: SQL[] = [];

    if (filter.subjectId !== undefined) {
        conditions.push(
            sql`${embeddingMetadataColumn}->>'subjectId' = ${filter.subjectId.toString()}`
        );
    }

    if (filter.curriculumSubjectId !== undefined) {
        conditions.push(
            sql`${embeddingMetadataColumn}->>'curriculumSubjectId' = ${filter.curriculumSubjectId.toString()}`
        );
    }

    if (filter.yearLevel !== undefined) {
        conditions.push(
            sql`${embeddingMetadataColumn}->>'yearLevel' = ${filter.yearLevel}`
        );
    }

    // Handle custom metadata filters
    for (const [key, value] of Object.entries(filter)) {
        if (!['subjectId', 'curriculumSubjectId', 'yearLevel'].includes(key) && value !== undefined) {
            if (typeof value === 'string') {
                conditions.push(
                    sql`${embeddingMetadataColumn}->>${key} = ${value}`
                );
            } else if (typeof value === 'number') {
                conditions.push(
                    sql`${embeddingMetadataColumn}->>${key} = ${value.toString()}`
                );
            } else if (typeof value === 'boolean') {
                conditions.push(
                    sql`(${embeddingMetadataColumn}->>${key})::boolean = ${value}`
                );
            }
        }
    }

    return conditions;
}

export async function vectorSimilaritySearch<T>(
    table: PgTable & { embedding: PgColumn; embeddingMetadata: PgColumn },
    queryEmbedding: number[],
    k: number,
    filter?: EmbeddingMetadataFilter
): Promise<VectorSearchResult<T>[]> {
    // Calculate cosine distance (lower is more similar)
    const distance = sql<number>`${cosineDistance(table.embedding, JSON.stringify(queryEmbedding))}`;

    // Build the base query
    let query = db
        .select({
            record: table,
            distance
        })
        .from(table);

    // Apply metadata filters if provided
    if (filter) {
        const metadataConditions = buildMetadataFilters(table.embeddingMetadata, filter);
        if (metadataConditions.length > 0) {
            query = query.where(and(...metadataConditions)) as typeof query;
        }
    }

    // Execute query with ordering and limit
    // Note: Cosine distance is lower = more similar, so we order ascending
    const results = await query
        .orderBy(distance)
        .limit(k);

    return results.map(row => ({
        record: row.record as T,
        distance: row.distance
    }));
}
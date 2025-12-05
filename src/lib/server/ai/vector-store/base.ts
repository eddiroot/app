import type { yearLevelEnum } from "$lib/enums";
import { buildEmbeddingText, parseEmbeddingText } from "$lib/server/ai/vector-store/config";
import { createRecordWithEmbedding, getRecord, updateRecordEmbedding, vectorSimilaritySearch, type EmbeddingMetadataFilter } from "$lib/server/db/service";
import { Document } from "@langchain/core/documents";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { VectorStore } from "@langchain/core/vectorstores";
import { getTableName } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";

export type ExtractMetadata<T> = (record: Partial<T>) => Promise<EmbeddingMetadataFilter>;

export type BaseEmbeddingMetadata = {
    subjectId?: number;
    curriculumSubjectId?: number;
    yearLevel?: yearLevelEnum;
    [key: string]: unknown;
};

export interface TableVectorStoreConfig<T extends Record<string, unknown>> {
    table: PgTable & { embedding: PgColumn; id: PgColumn; embeddingMetadata: PgColumn };
    embeddings: EmbeddingsInterface;
    extractMetadata?: ExtractMetadata<T>;
}

export abstract class TableVectorStore<T extends Record<string, unknown>> extends VectorStore {
    protected table: PgTable & { embedding: PgColumn; id: PgColumn; embeddingMetadata: PgColumn };
    protected tableName: string;
    protected config: TableVectorStoreConfig<T>;

    _vectorstoreType(): string {
        return "table_vector_store";
    }

    constructor(config: TableVectorStoreConfig<T>) {
        super(config.embeddings, {});
        this.table = config.table;
        this.tableName = getTableName(config.table);
        this.config = config;
    }

    /**
     * Convert record to Document using JSON.stringify on configured columns
     */
    protected toDocument(record: T): Document {
        return new Document({
            pageContent: buildEmbeddingText(this.tableName, record),
            metadata: { id: record.id, tableName: this.tableName }
        });
    }

    /**
     * Convert Document back to partial record using JSON.parse
     */
    protected fromDocument(doc: Document): Partial<T> {
        return parseEmbeddingText<T>(doc.pageContent);
    }

    async addVectors(vectors: number[][], documents: Document[]): Promise<void> {
        if (vectors.length !== documents.length) {
            throw new Error("Vectors and documents must have the same length");
        }

        for (let i = 0; i < vectors.length; i++) {
            const record = this.fromDocument(documents[i]);
            const metadata = await this.config.extractMetadata?.(record) || {};
            await createRecordWithEmbedding(this.table, record, [vectors[i]], metadata);
        }
    }

    async similaritySearchVectorWithScore(
        query: number[],
        k: number,
        filter?: EmbeddingMetadataFilter
    ): Promise<[Document, number][]> {
        const results = await vectorSimilaritySearch(this.table, query, k, filter);
        return results.map(result => [
            this.toDocument(result.record as T),
            result.distance
        ]);
    }

    async addDocuments(docs: Document[]): Promise<void> {
        if (docs.length === 0) return;
        const texts = docs.map(doc => doc.pageContent);
        const embeddings = await this.embeddings.embedDocuments(texts);
        await Promise.all(
            docs.map(async (doc, idx) => {
                const record = this.fromDocument(doc);
                const metadata = await this.config.extractMetadata?.(record) || {};
                await createRecordWithEmbedding(this.table, record, [embeddings[idx]], metadata);
            })
        );
    }

    async addRecord(records: Partial<T>[]): Promise<void> {
        for (const record of records) {
            const text = buildEmbeddingText(this.tableName, record as T);
            const embedding = await this.embeddings.embedDocuments([text]);
            const metadata = await this.config.extractMetadata?.(record) || {};
            await createRecordWithEmbedding(this.table, record, embedding, metadata);
        }
    }

    async searchWithScores(queryEmbedding: number[], k: number, filter?: EmbeddingMetadataFilter): Promise<[Document, number][]> {
        const results = await vectorSimilaritySearch(this.table, queryEmbedding, k, filter);
        return results.map(result => [this.toDocument(result.record as T), result.distance]);
    }

    async similaritySearchAsDocuments(query: string, k: number, filter?: EmbeddingMetadataFilter): Promise<Document[]> {
        const queryEmbedding = await this.embeddings.embedQuery(query);
        const results = await vectorSimilaritySearch(this.table, queryEmbedding, k, filter);
        return results.map(result => this.toDocument(result.record as T));
    }

    async similaritySearchAsRecords(query: string, k: number): Promise<T[]> {
        const queryEmbedding = await this.embeddings.embedQuery(query);
        const results = await vectorSimilaritySearch(this.table, queryEmbedding, k);
        return results.map(result => result.record as T);
    }

    async updateEmbedding(recordId: number | string): Promise<void> {
        const record = await getRecord(this.table, recordId);
        const text = buildEmbeddingText(this.tableName, record as unknown as T);
        const embedding = await this.embeddings.embedDocuments([text]);
        const metadata = await this.config.extractMetadata?.(record as unknown as Partial<T>) || {};
        await updateRecordEmbedding(this.table, recordId, embedding, metadata);
    }

    async updateEmbeddingsBatch(recordIds: (number | string)[]): Promise<void> {
        if (recordIds.length === 0) return;

        const records = await Promise.all(
            recordIds.map(id => getRecord(this.table, id))
        );

        const texts = records.map(record =>
            buildEmbeddingText(this.tableName, record as unknown as T)
        );

        const embeddings = await this.embeddings.embedDocuments(texts);

        const metadataList = await Promise.all(
            records.map(record =>
                this.config.extractMetadata?.(record as unknown as Partial<T>) || Promise.resolve({})
            )
        );

        await Promise.all(
            recordIds.map((id, idx) =>
                updateRecordEmbedding(this.table, id, [embeddings[idx]], metadataList[idx])
            )
        );
    }
}
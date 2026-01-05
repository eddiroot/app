import {
    buildEmbeddingText,
    extractMetadata,
    parseEmbeddingText
} from '$lib/server/ai/vector-store/config';
import {
    createRecordWithEmbedding,
    getRecord,
    updateRecordEmbedding,
    vectorSimilaritySearch,
    type EmbeddingMetadata
} from '$lib/server/db/service';
import { Document } from '@langchain/core/documents';
import type { EmbeddingsInterface } from '@langchain/core/embeddings';
import { VectorStore } from '@langchain/core/vectorstores';
import { getTableName } from 'drizzle-orm';
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';

export type EmbeddableTable = PgTable & {
	embedding: PgColumn;
	id: PgColumn;
	embeddingMetadata: PgColumn;
};

export class TableVectorStore<T extends Record<string, unknown>> extends VectorStore {
	protected table: EmbeddableTable;
	protected tableName: string;

	_vectorstoreType(): string {
		return 'table_vector_store';
	}

	constructor(table: EmbeddableTable, embeddings: EmbeddingsInterface) {
		super(embeddings, {});
		this.table = table;
		this.tableName = getTableName(table);
	}

	/**
	 * Factory method to create a vector store for any table
	 */
	static for<T extends Record<string, unknown>>(
		table: PgTable & { embedding: PgColumn; id: PgColumn; embeddingMetadata: PgColumn },
		embeddings: EmbeddingsInterface
	): TableVectorStore<T> {
		return new TableVectorStore<T>(table, embeddings);
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
			throw new Error('Vectors and documents must have the same length');
		}

		for (let i = 0; i < vectors.length; i++) {
			const record = this.fromDocument(documents[i]);
			const metadata = await extractMetadata(this.tableName, record);
			await createRecordWithEmbedding(this.table, record, [vectors[i]], metadata);
		}
	}

	async similaritySearchVectorWithScore(
		query: number[],
		k: number,
		filter?: EmbeddingMetadata
	): Promise<[Document, number][]> {
		const results = await vectorSimilaritySearch(this.table, query, k, filter);
		return results.map((result) => [this.toDocument(result.record as T), result.distance]);
	}

	async addDocuments(docs: Document[]): Promise<void> {
		if (docs.length === 0) return;
		const texts = docs.map((doc) => doc.pageContent);
		const embeddings = await this.embeddings.embedDocuments(texts);
		await Promise.all(
			docs.map(async (doc, idx) => {
				const record = this.fromDocument(doc);
				const metadata = await extractMetadata(this.tableName, record);
				await createRecordWithEmbedding(this.table, record, [embeddings[idx]], metadata);
			})
		);
	}

	async addRecord(records: Partial<T>[]): Promise<void> {
		for (const record of records) {
			const text = buildEmbeddingText(this.tableName, record as T);
			const embedding = await this.embeddings.embedDocuments([text]);
			const metadata = await extractMetadata(this.tableName, record);
			await createRecordWithEmbedding(this.table, record, embedding, metadata);
		}
	}

	async searchWithScores(
		queryEmbedding: number[],
		k: number,
		filter?: EmbeddingMetadata
	): Promise<[Document, number][]> {
		const results = await vectorSimilaritySearch(this.table, queryEmbedding, k, filter);
		return results.map((result) => [this.toDocument(result.record as T), result.distance]);
	}

	async similaritySearchAsDocuments(
		query: string,
		k: number,
		filter?: EmbeddingMetadata
	): Promise<Document[]> {
		const queryEmbedding = await this.embeddings.embedQuery(query);
		const results = await vectorSimilaritySearch(this.table, queryEmbedding, k, filter);
		return results.map((result) => this.toDocument(result.record as T));
	}

	async similaritySearchAsRecords(query: string, k: number): Promise<T[]> {
		const queryEmbedding = await this.embeddings.embedQuery(query);
		const results = await vectorSimilaritySearch(this.table, queryEmbedding, k);
		return results.map((result) => result.record as T);
	}

	async updateEmbedding(recordId: number | string): Promise<void> {
		const record = await getRecord(this.table, recordId);
		const text = buildEmbeddingText(this.tableName, record as unknown as T);
		const embedding = await this.embeddings.embedDocuments([text]);
		const metadata = await extractMetadata(this.tableName, record as unknown as Partial<T>);
		await updateRecordEmbedding(this.table, recordId, embedding, metadata);
	}

	async updateEmbeddingsBatch(recordIds: (number | string)[]): Promise<void> {
		if (recordIds.length === 0) return;

		const records = await Promise.all(recordIds.map((id) => getRecord(this.table, id)));

		const texts = records.map((record) =>
			buildEmbeddingText(this.tableName, record as unknown as T)
		);

		const embeddings = await this.embeddings.embedDocuments(texts);

		const metadataList = await Promise.all(
			records.map((record) => extractMetadata(this.tableName, record as unknown as Partial<T>))
		);

		await Promise.all(
			recordIds.map((id, idx) =>
				updateRecordEmbedding(this.table, id, [embeddings[idx]], metadataList[idx])
			)
		);
	}
}
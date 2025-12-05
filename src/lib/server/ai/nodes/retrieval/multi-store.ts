import type { EmbeddingMetadataFilter } from "$lib/server/db/service/vector";
import type { Document } from "@langchain/core/documents";
import type { TableVectorStore } from "../../vector-store/base";

export interface RAGRetrievalInput {
    query: string;
    k?: number;
    filter?: EmbeddingMetadataFilter;
}

export interface RAGRetrievalNodeConfig {
    vectorStores: TableVectorStore<Record<string, unknown>>[];
    defaultK?: number;
}

/**
 * Creates a generalized RAG retrieval node that searches across multiple vector stores
 * with proper filtering support
 */
export function createRAGRetrievalNode(config: RAGRetrievalNodeConfig) {
    const { vectorStores, defaultK = 10 } = config;

    return async (input: RAGRetrievalInput): Promise<Document[]> => {
        const { query, k = defaultK, filter } = input;       
        const results: [Document, number][] = [];
        const perStoreLimit = Math.ceil(k);
        
        // Embed the query once
        const queryEmbed = await vectorStores[0].embeddings.embedQuery(query);

        // Search each store with the filter
        await Promise.all(vectorStores.map(async (vectorStore) => {
            try {
                const storeResults = await vectorStore.searchWithScores(
                    queryEmbed,
                    perStoreLimit, 
                    filter  
                );
                results.push(...storeResults);
            } catch {
                // Silently skip stores that fail
            }
        }));
        
        // Sort by distance (lower is better) and return top k documents
        results.sort((a, b) => a[1] - b[1]);
        return results.slice(0, k).map(([doc]) => doc);
    };
}

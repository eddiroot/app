import type { EmbeddingMetadata } from "$lib/server/db/service/vector";
import type { Document } from "@langchain/core/documents";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { TableVectorStore } from "../../vector-store/base";

/**
 * Creates a tool that queries a single vector store table 
 */

export function createVectorStoreTool<T extends Record<string, unknown>>(
    vectorStore: TableVectorStore<T>,
    name: string,
    description: string,
    k?: number 
) {
    return tool(
        // @ts-expect-error - Zod 4 incompatibility with LangChain, see: https://github.com/langchain-ai/langgraphjs/issues/1472
        async ({ query, limit}) => {
            // Perform similarity search and return a list of documents
            return await vectorStore.similaritySearchAsDocuments(
                query,
                limit ?? k ?? 5
            );
        },
        {
            name,
            description,
            schema: z.object({
                query: z.string().describe("The search query to find relevant information."),
                limit: z.number().optional().describe("The maximum number of results to return.")
            })
        }
    );
}

/**
 * Create a tool that decides which table vector store to query based on input
 */

export function createDynamicVectorStoreTool<T extends Record<string, unknown>>(
    vectorStores: Record<string, TableVectorStore<T>>,
    name: string,
    description: string,
    k?: number
) {
    return tool(
        // @ts-expect-error - Zod 4 incompatibility with LangChain, see: https://github.com/langchain-ai/langgraphjs/issues/1472
        async ({ storeName, query, limit }) => {
            const vectorStore = vectorStores[storeName];
            if (!vectorStore) {
                throw new Error(`Vector store with name "${storeName}" not found.`);
            }
            return await vectorStore.similaritySearchAsDocuments(
                query,
                limit ?? k ?? 5
            );
        },
        {
            name,
            description,
            schema: z.object({
                storeName: z.string().describe("The name of the vector store to query."),
                query: z.string().describe("The search query to find relevant information."),
                limit: z.number().optional().describe("The maximum number of results to return.")
            })
        }
    );
}


/**
 * Creates a tool that queries multiple vector store tables and aggregates results and returns a limit
 */
export function createMultiTableVectorStoreTool<T extends Record<string, unknown>>(
    vectorStores: TableVectorStore<T>[],
    name: string,
    description: string,
    filter?: EmbeddingMetadata,
    k?: number
) {
    return tool(
        // @ts-expect-error - Zod 4 incompatibility with LangChain, see: https://github.com/langchain-ai/langgraphjs/issues/1472
        async ({ query, limit }) => {
            const results: [Document, number][] = [];
            const perStoreLimit = Math.ceil((limit ?? k ?? 5) / vectorStores.length);
            
            const queryEmbed = await vectorStores[0].embeddings.embedQuery(query);

            for (const vectorStore of vectorStores) {
                
                const storeResults = await vectorStore.searchWithScores(
                    queryEmbed,
                    perStoreLimit, 
                    filter
                );
                results.push(...storeResults);
            }
            // Sort results by distance and return top 'limit' results and return documents only
            results.sort((a, b) => a[1] - b[1]);
            return results.slice(0, limit ?? k ?? 5).map(([doc]) => doc);
        },
        {
            name,
            description,
            schema: z.object({
                query: z.string().describe("The search query to find relevant information."),
                limit: z.number().optional().describe("The maximum number of results to return.")
            })
        }
    );
}

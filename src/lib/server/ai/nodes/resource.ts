import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import type { Document } from "@langchain/core/documents";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { TempPoolVectorStore } from "../vector-store/temp-pool";

export interface PDFProcessorConfig {
    embeddings: EmbeddingsInterface;
    chunkSize?: number;
    chunkOverlap?: number;
    batchSize?: number; 
}

export interface PDFProcessorInput {
    filePath: string;
    metadata?: Record<string, unknown>;
}

export interface PDFProcessorOutput {
    documentCount: number;
    chunks: Document[];
}

/**
 * Creates a node that processes PDFs:
 * 1. Loads and splits the PDF into chunks
 * 2. Embeds chunks in parallel batches
 * 3. Stores in TempPoolVectorStore
 */
export function createPDFProcessorNode(config: PDFProcessorConfig) {
    const {
        embeddings,
        chunkSize = 1000,
        chunkOverlap = 200,
        batchSize = 10,
    } = config;

    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize,
        chunkOverlap,
    });

    const tempPoolStore = new TempPoolVectorStore(embeddings);

    return async (input: PDFProcessorInput): Promise<PDFProcessorOutput> => {
        
        const loader = new PDFLoader(input.filePath, {
            splitPages: true,
        });
        const docs = await loader.load();

        // 2. Split into chunks
        const chunks = await textSplitter.splitDocuments(docs);

        // Add custom metadata to each chunk
        if (input.metadata) {
            chunks.forEach(chunk => {
                chunk.metadata = { ...chunk.metadata, ...input.metadata };
            });
        }

        // 3. Embed and store in parallel batches
        await embedAndStoreInParallel(chunks, tempPoolStore, batchSize);

        return {
            documentCount: chunks.length,
            chunks,
        };
    };
}

/**
 * Embeds and stores documents in parallel batches
 */
async function embedAndStoreInParallel(
    docs: Document[],
    store: TempPoolVectorStore,
    batchSize: number
): Promise<void> {
    // Split docs into batches
    const batches: Document[][] = [];
    for (let i = 0; i < docs.length; i += batchSize) {
        batches.push(docs.slice(i, i + batchSize));
    }

    await Promise.all(
        batches.map(async (batch) => {
            await store.addDocuments(batch);
        })
    );
    
}
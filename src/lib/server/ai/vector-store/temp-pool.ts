import { tempPool, type TempPool } from "$lib/server/db/schema/utils";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { TableVectorStore } from "./base";

export class TempPoolVectorStore extends TableVectorStore<TempPool> {
    constructor(embeddings: EmbeddingsInterface) {
        super({
            table: tempPool,
            embeddings,
            extractMetadata: async (record) => {
                return record.embeddingMetadata ?? {};
            }
        });
    }
}

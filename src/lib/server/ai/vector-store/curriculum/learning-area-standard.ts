import { learningAreaStandard, type LearningAreaStandard } from "$lib/server/db/schema";
import { getLearningAreaStandardMetadataByLearningAreaId } from "$lib/server/db/service/curriculum";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { TableVectorStore } from "../base";

export class LearningAreaStandardVectorStore extends TableVectorStore<LearningAreaStandard> {
  constructor(embeddings: EmbeddingsInterface) {
    super({
      table: learningAreaStandard,
      embeddings,
      extractMetadata: async (record) => {
        if (!record.learningAreaId) {
          return {
            name: record.name,
            yearLevel: record.yearLevel
          };
        }
    
        try {
          const metadata = await getLearningAreaStandardMetadataByLearningAreaId(record.learningAreaId);
          
          return {
            ...metadata,
            name: record.name,
            yearLevel: record.yearLevel
          };
        } catch (error) {
          console.error('Error extracting learning area standard metadata:', error);
          return {
            learningAreaId: record.learningAreaId,
            name: record.name,
            yearLevel: record.yearLevel
          };
        }
      }
    });
  }
}


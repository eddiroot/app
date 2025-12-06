import { learningAreaContent, type LearningAreaContent } from "$lib/server/db/schema";
import { getLearningAreaContentMetadataByLearningAreaId } from "$lib/server/db/service/curriculum";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { TableVectorStore } from "../base";

export class LearningAreaContentVectorStore extends TableVectorStore<LearningAreaContent> {
  constructor(embeddings: EmbeddingsInterface) {
    super({
      table: learningAreaContent,
      embeddings,
      extractMetadata: async (record) => {
        if (!record.learningAreaId) {
          return {
            number: record.number
          };
        }
    
        try {
          const metadata = await getLearningAreaContentMetadataByLearningAreaId(record.learningAreaId);
          
          return {
            ...metadata,
            number: record.number
          };
        } catch (error) {
          console.error('Error extracting learning area content metadata:', error);
          return {
            learningAreaId: record.learningAreaId,
            number: record.number
          };
        }
      }
    });
  }
}

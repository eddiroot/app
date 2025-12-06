import { standardElaboration, type StandardElaboration } from "$lib/server/db/schema";
import { getStandardElaborationMetadataByLearningAreaStandardId } from "$lib/server/db/service/curriculum";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { TableVectorStore } from "../base";

export class StandardElaborationVectorStore extends TableVectorStore<StandardElaboration> {
  constructor(embeddings: EmbeddingsInterface) {
    super({
      table: standardElaboration,
      embeddings,
      extractMetadata: async (record) => {
        if (!record.learningAreaStandardId) {
          return {
            name: record.name
          };
        }
    
        try {
          const metadata = await getStandardElaborationMetadataByLearningAreaStandardId(record.learningAreaStandardId);
          
          return {
            ...metadata,
            name: record.name
          };
        } catch (error) {
          console.error('Error extracting standard elaboration metadata:', error);
          return {
            learningAreaStandardId: record.learningAreaStandardId,
            name: record.name
          };
        }
      }
    });
  }
}

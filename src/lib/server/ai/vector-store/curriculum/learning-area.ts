import { learningArea, type LearningArea } from "$lib/server/db/schema";
import { getLearningAreaMetadataByCurriculumSubjectId } from "$lib/server/db/service/curriculum";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { TableVectorStore } from "../base";

export class LearningAreaVectorStore extends TableVectorStore<LearningArea> {
  constructor(embeddings: EmbeddingsInterface) {
    super({
      table: learningArea,
      embeddings,
      extractMetadata: async (record) => {
        if (!record.curriculumSubjectId) {
          return {
            name: record.name,
            abbreviation: record.abbreviation
          };
        }
    
        try {
          const metadata = await getLearningAreaMetadataByCurriculumSubjectId(record.curriculumSubjectId);
          
          return {
            ...metadata,
            name: record.name,
            abbreviation: record.abbreviation
          };
        } catch (error) {
          console.error('Error extracting learning area metadata:', error);
          return {
            curriculumSubjectId: record.curriculumSubjectId,
            name: record.name,
            abbreviation: record.abbreviation
          };
        }
      }
    });
  }
}

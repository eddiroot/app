import { learningActivity, type LearningActivity } from "$lib/server/db/schema";
import { getLearningActivityMetadataByCurriculumSubjectId } from "$lib/server/db/service/curriculum";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { TableVectorStore } from "../base";

export class LearningActivityVectorStore extends TableVectorStore<LearningActivity> {
  constructor(embeddings: EmbeddingsInterface) {
    super({
      table: learningActivity,
      embeddings,
      extractMetadata: async (record) => {
        if (!record.curriculumSubjectId) {
          return {
            yearLevel: record.yearLevel
          };
        }
    
        try {
          const metadata = await getLearningActivityMetadataByCurriculumSubjectId(record.curriculumSubjectId);
          
          return {
            ...metadata,
            yearLevel: record.yearLevel
          };
        } catch (error) {
          console.error('Error extracting learning activity metadata:', error);
          return {
            curriculumSubjectId: record.curriculumSubjectId,
            yearLevel: record.yearLevel
          };
        }
      }
    });
  }
}


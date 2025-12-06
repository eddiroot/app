import { courseMapItemAssessmentPlan, type CourseMapItemAssessmentPlan } from "$lib/server/db/schema";
import { getAssessmentPlanMetadataByCourseMapItemId } from "$lib/server/db/service/coursemap";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { TableVectorStore } from "../base";

export class CourseMapItemAssessmentPlanVectorStore extends TableVectorStore<CourseMapItemAssessmentPlan> {
  constructor(embeddings: EmbeddingsInterface) {
    super({
      table: courseMapItemAssessmentPlan,
      embeddings,
      extractMetadata: async (record) => {
        if (!record.courseMapItemId) {
          return {
            name: record.name,
            rubricId: record.rubricId
          };
        }
    
        try {
          const metadata = await getAssessmentPlanMetadataByCourseMapItemId(record.courseMapItemId);
          
          return {
            ...metadata,
            name: record.name,
            rubricId: record.rubricId
          };
        } catch (error) {
          console.error('Error extracting assessment plan metadata:', error);
          return {
            courseMapItemId: record.courseMapItemId,
            name: record.name,
            rubricId: record.rubricId
          };
        }
      }
    });
  }
}

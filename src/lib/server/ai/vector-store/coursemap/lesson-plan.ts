import { courseMapItemLessonPlan, type CourseMapItemLessonPlan } from "$lib/server/db/schema";
import { getLessonPlanMetadataByCourseMapItemId } from "$lib/server/db/service/coursemap";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { TableVectorStore } from "../base";

export class CourseMapItemLessonPlanVectorStore extends TableVectorStore<CourseMapItemLessonPlan> {
  constructor(embeddings: EmbeddingsInterface) {
    super({
      table: courseMapItemLessonPlan,
      embeddings,
      extractMetadata: async (record) => {
        if (!record.courseMapItemId) {
          return {
            name: record.name
          };
        }
    
        try {
          const metadata = await getLessonPlanMetadataByCourseMapItemId(record.courseMapItemId);
          
          return {
            ...metadata,
            name: record.name
          };
        } catch (error) {
          console.error('Error extracting lesson plan metadata:', error);
          return {
            courseMapItemId: record.courseMapItemId,
            name: record.name
          };
        }
      }
    });
  }
}

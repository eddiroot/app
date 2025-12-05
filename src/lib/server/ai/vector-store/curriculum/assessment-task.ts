import { assessmentTask, type AssessmentTask } from "$lib/server/db/schema";
import { getAssessmentTaskMetadataByCurriculumSubjectId } from "$lib/server/db/service/curriculum";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { TableVectorStore } from "../base";

export class AssessmentTaskVectorStore extends TableVectorStore<AssessmentTask> {
  constructor(embeddings: EmbeddingsInterface) {
    super({
      table: assessmentTask,
      embeddings,
      extractMetadata: async (record) => {
        if (!record.curriculumSubjectId) {
          return {
            yearLevel: record.yearLevel
          };
        }

        try {
          const metadata = await getAssessmentTaskMetadataByCurriculumSubjectId(record.curriculumSubjectId);
          
          return {
            ...metadata,
            yearLevel: record.yearLevel
          };
        } catch (error) {
          console.error('Error extracting assessment task metadata:', error);
          return {
            curriculumSubjectId: record.curriculumSubjectId,
            yearLevel: record.yearLevel
          };
        }
      }
    });
  }
}

import { examQuestion, type ExamQuestion } from "$lib/server/db/schema";
import { getExamQuestionMetadataByCurriculumSubjectId } from "$lib/server/db/service/curriculum";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { TableVectorStore } from "../base";

export class ExamQuestionVectorStore extends TableVectorStore<ExamQuestion> {
  constructor(embeddings: EmbeddingsInterface) {
    super({
      table: examQuestion,
      embeddings,
      extractMetadata: async (record) => {
        if (!record.curriculumSubjectId) {
          return {
            yearLevel: record.yearLevel
          };
        }

        try {
          const metadata = await getExamQuestionMetadataByCurriculumSubjectId(record.curriculumSubjectId);
          
          return {
            ...metadata,
            yearLevel: record.yearLevel
          };
        } catch (error) {
          console.error('Error extracting exam question metadata:', error);
          return {
            curriculumSubjectId: record.curriculumSubjectId,
            yearLevel: record.yearLevel
          };
        }
      }
    });
  }
}
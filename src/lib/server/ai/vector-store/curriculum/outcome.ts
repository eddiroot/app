import { outcome, type Outcome } from "$lib/server/db/schema";
import { getOutcomeMetadataByCurriculumSubjectId } from "$lib/server/db/service/curriculum";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { TableVectorStore } from "../base";

export class OutcomeVectorStore extends TableVectorStore<Outcome> {
  constructor(embeddings: EmbeddingsInterface) {
    super({
      table: outcome,
      embeddings,
      extractMetadata: async (record) => {
        if (!record.curriculumSubjectId) {
          return {
            number: record.number
          };
        }
    
        try {
          const metadata = await getOutcomeMetadataByCurriculumSubjectId(record.curriculumSubjectId);
          
          return {
            ...metadata,
            number: record.number
          };
        } catch (error) {
          console.error('Error extracting outcome metadata:', error);
          return {
            curriculumSubjectId: record.curriculumSubjectId,
            number: record.number
          };
        }
      }
    });
  }
}


import { subjectThreadResponse, type SubjectThreadResponse } from "$lib/server/db/schema";
import { getSubjectThreadResponseMetadataBySubjectThreadId } from "$lib/server/db/service/subjects";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { TableVectorStore } from "../base";

export class SubjectThreadResponseVectorStore extends TableVectorStore<SubjectThreadResponse> {
  constructor(embeddings: EmbeddingsInterface) {
    super({
      table: subjectThreadResponse,
      embeddings,
      extractMetadata: async (record) => {
        if (!record.subjectThreadId) {
          return {
            type: record.type,
            userId: record.userId,
            parentResponseId: record.parentResponseId
          };
        }

        try {
          const metadata = await getSubjectThreadResponseMetadataBySubjectThreadId(record.subjectThreadId);
          
          return {
            ...metadata,
            type: record.type,
            userId: record.userId,
            parentResponseId: record.parentResponseId
          };
        } catch (error) {
          console.error('Error extracting subject thread response metadata:', error);
          return {
            subjectThreadId: record.subjectThreadId,
            type: record.type,
            userId: record.userId
          };
        }
      }
    });
  }
}
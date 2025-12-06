import { subjectThread, type SubjectThread } from "$lib/server/db/schema";
import { getSubjectThreadMetadataBySubjectOfferingId } from "$lib/server/db/service/subjects";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { TableVectorStore } from "../base";

export class SubjectThreadVectorStore extends TableVectorStore<SubjectThread> {
  constructor(embeddings: EmbeddingsInterface) {
    super({
      table: subjectThread,
      embeddings,
      extractMetadata: async (record) => {
        if (!record.subjectOfferingId) {
          return {
            type: record.type,
            userId: record.userId
          };
        }

        try {
          const metadata = await getSubjectThreadMetadataBySubjectOfferingId(record.subjectOfferingId);
          
          return {
            ...metadata,
            type: record.type,
            userId: record.userId,
            title: record.title
          };
        } catch (error) {
          console.error('Error extracting subject thread metadata:', error);
          return {
            subjectOfferingId: record.subjectOfferingId,
            type: record.type,
            userId: record.userId
          };
        }
      }
    });
  }
}


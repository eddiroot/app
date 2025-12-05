import { classTaskBlockResponse, type ClassTaskBlockResponse } from "$lib/server/db/schema/task";
import { getClassTaskBlockResponseMetadataByTaskBlockId } from "$lib/server/db/service/task";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { TableVectorStore } from "../base";

export class TaskBlockResponseVectorStore extends TableVectorStore<ClassTaskBlockResponse> {
  constructor(embeddings: EmbeddingsInterface) {
    super({
      table: classTaskBlockResponse,
      embeddings,
      extractMetadata: async (record) => {
        if (!record.taskBlockId) {
          return {
            classTaskId: record.classTaskId,
            authorId: record.authorId
          };
        }
        try {
          const metadata = await getClassTaskBlockResponseMetadataByTaskBlockId(record.taskBlockId);
          return {
            ...metadata,
            taskBlockId: record.taskBlockId,
            classTaskId: record.classTaskId,
            authorId: record.authorId,
            marks: record.marks
          };
        } catch {
          return {
            taskBlockId: record.taskBlockId,
            classTaskId: record.classTaskId,
            authorId: record.authorId
          };
        }
      }
    });
  }
}

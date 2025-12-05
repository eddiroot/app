import { taskBlock, type TaskBlockMisconception } from "$lib/server/db/schema/task";
import { getTaskBlockMisconceptionMetadataByTaskBlockId } from "$lib/server/db/service/task";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { TableVectorStore } from "../base";

export class TaskBlockMisconceptionVectorStore extends TableVectorStore<TaskBlockMisconception> {
  constructor(embeddings: EmbeddingsInterface) {
    super({
      table: taskBlock,
      embeddings,
      extractMetadata: async (record) => {
        if (!record.taskBlockId) {
          return {};
        }
        try {
          const metadata = await getTaskBlockMisconceptionMetadataByTaskBlockId(record.taskBlockId);
          return {
            ...metadata,
            taskBlockId: record.taskBlockId
          };
        } catch {
          return {
            taskBlockId: record.taskBlockId
          };
        }
      }
    });
  }
}
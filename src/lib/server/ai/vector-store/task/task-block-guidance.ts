import { taskBlock, type TaskBlockGuidance } from "$lib/server/db/schema/task";
import { getTaskBlockGuidanceMetadataByTaskBlockId } from "$lib/server/db/service/task";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { TableVectorStore } from "../base";

export class TaskBlockGuidanceVectorStore extends TableVectorStore<TaskBlockGuidance> {
  constructor(embeddings: EmbeddingsInterface) {
    super({
      table: taskBlock,
      embeddings,
      extractMetadata: async (record) => {
        if (!record.taskBlockId) {
          return {};
        }
        try {
          const metadata = await getTaskBlockGuidanceMetadataByTaskBlockId(record.taskBlockId);
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

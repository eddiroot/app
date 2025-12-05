import { taskBlock, type TaskBlock } from "$lib/server/db/schema/task";
import { getTaskBlockMetadataByTaskId } from "$lib/server/db/service";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { TableVectorStore } from "../base";

export class TaskBlockVectorStore extends TableVectorStore<TaskBlock> {
    constructor(embeddings: EmbeddingsInterface) {
        super({
            table: taskBlock,
            embeddings,
            extractMetadata: async (record) => {
                if (!record.taskId) return { blockType: record.type };
                try {
                    const metadata = await getTaskBlockMetadataByTaskId(record.taskId);
                    return { ...metadata, taskId: record.taskId, blockType: record.type };
                } catch {
                    return { taskId: record.taskId, blockType: record.type };
                }
            }
        });
    }
}
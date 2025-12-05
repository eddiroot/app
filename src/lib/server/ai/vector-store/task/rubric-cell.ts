import { taskBlock, type RubricCell } from "$lib/server/db/schema/task";
import { getRubricCellMetadataByRowId } from "$lib/server/db/service/task";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { TableVectorStore } from "../base";

export class RubricCellVectorStore extends TableVectorStore<RubricCell> {
  constructor(embeddings: EmbeddingsInterface) {
    super({
      table: taskBlock,
      embeddings,
      extractMetadata: async (record) => {
        if (!record.rowId) {
          return {
            level: record.level,
            marks: record.marks
          };
        }
        try {
          const metadata = await getRubricCellMetadataByRowId(record.rowId);
          return {
            ...metadata,
            rowId: record.rowId,
            level: record.level,
            marks: record.marks
          };
        } catch {
          return {
            rowId: record.rowId,
            level: record.level
          };
        }
      }
    });
  }
}
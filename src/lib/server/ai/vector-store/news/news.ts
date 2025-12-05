import { news, type News } from "$lib/server/db/schema";
import { getNewsMetadataBySchoolId } from "$lib/server/db/service/news";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { TableVectorStore } from "../base";

export class NewsVectorStore extends TableVectorStore<News> {
  constructor(embeddings: EmbeddingsInterface) {
    super({
      table: news,
      embeddings,
      extractMetadata: async (record) => {
        if (!record.schoolId) {
          return {
            authorId: record.authorId,
            status: record.status,
            visibility: record.visibility,
            priority: record.priority,
            isPinned: record.isPinned
          };
        }

        try {
          const metadata = await getNewsMetadataBySchoolId(
            record.schoolId,
            record.campusId,
            record.categoryId,
            record.authorId
          );
          
          return {
            ...metadata,
            status: record.status,
            visibility: record.visibility,
            priority: record.priority,
            isPinned: record.isPinned,
            tags: record.tags
          };
        } catch (error) {
          console.error('Error extracting news metadata:', error);
          return {
            schoolId: record.schoolId,
            authorId: record.authorId
          };
        }
      }
    });
  }
}


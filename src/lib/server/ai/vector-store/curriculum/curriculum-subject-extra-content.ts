import { curriculumSubjectExtraContent, type CurriculumSubjectExtraContent } from "$lib/server/db/schema";
import { getCurriculumSubjectExtraContentMetadataByCurriculumSubjectId } from "$lib/server/db/service/curriculum";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { TableVectorStore } from "../base";

export class CurriculumSubjectExtraContentVectorStore extends TableVectorStore<CurriculumSubjectExtraContent> {
  constructor(embeddings: EmbeddingsInterface) {
    super({
      table: curriculumSubjectExtraContent,
      embeddings,
      extractMetadata: async (record) => {
        if (!record.curriculumSubjectId) {
          return {
            contentType: record.content ? extractContentType(record.content) : undefined
          };
        }

        try {
          const metadata = await getCurriculumSubjectExtraContentMetadataByCurriculumSubjectId(record.curriculumSubjectId);
          const contentType = record.content ? extractContentType(record.content) : undefined;
          
          return {
            ...metadata,
            contentType
          };
        } catch (error) {
          console.error('Error extracting curriculum subject extra content metadata:', error);
          return {
            curriculumSubjectId: record.curriculumSubjectId,
            contentType: record.content ? extractContentType(record.content) : undefined
          };
        }
      }
    });
  }
}

/**
 * Extract contentType from the standardized format in content field
 * Format: "ContentType: {type}\n\n{actual content}"
 */
function extractContentType(content: string): string {
  const match = content.match(/^ContentType:\s*(\w+)\s*\n\n/);
  return match ? match[1] : 'unknown';
}

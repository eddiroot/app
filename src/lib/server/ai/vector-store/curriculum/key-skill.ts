import { keySkill, type KeySkill } from "$lib/server/db/schema";
import { getKeySkillMetadata } from "$lib/server/db/service/curriculum";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { TableVectorStore } from "../base";

export class KeySkillVectorStore extends TableVectorStore<KeySkill> {
  constructor(embeddings: EmbeddingsInterface) {
    super({
      table: keySkill,
      embeddings,
      extractMetadata: async (record) => {
        if (!record.curriculumSubjectId || !record.outcomeId) {
          return {
            number: record.number,
            topicName: record.topicName
          };
        }
        try {
          const metadata = await getKeySkillMetadata(record.curriculumSubjectId, record.outcomeId);
          
          return {
            ...metadata,
            number: record.number,
            topicName: record.topicName
          };
        } catch (error) {
          console.error('Error extracting key skill metadata:', error);
          return {
            curriculumSubjectId: record.curriculumSubjectId,
            outcomeId: record.outcomeId,
            number: record.number
          };
        } 
      }
    });
  }
}



import { keyKnowledge, type KeyKnowledge } from "$lib/server/db/schema";
import { getKeyKnowledgeMetadata } from "$lib/server/db/service/curriculum";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { TableVectorStore } from "../base";

export class KeyKnowledgeVectorStore extends TableVectorStore<KeyKnowledge> {
  constructor(embeddings: EmbeddingsInterface) {
    super({
      table: keyKnowledge,
      embeddings,
      extractMetadata: async (record) => {
        if (!record.curriculumSubjectId || !record.outcomeId) {
          return {
            number: record.number,
            topicName: record.topicName
          };
        }
        try {
          const metadata = await getKeyKnowledgeMetadata(record.curriculumSubjectId, record.outcomeId);
          
          return {
            ...metadata,
            number: record.number,
            topicName: record.topicName
          };
        } catch (error) {
          console.error('Error extracting key knowledge metadata:', error);
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
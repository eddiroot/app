
import type { collectionTypeEnum, difficultyLevelEnum, subjectGroupEnum, yearLevelEnum } from "$lib/enums";
import { BaseDocumentLoader } from "@langchain/core/document_loaders/base";
import { Document } from "@langchain/core/documents";

export interface VectorMetadata {
    type?: collectionTypeEnum
    userId?: string
    subjectId?: number
    courseMapItemId?: number
    taskId?: number
    sectionId?: number
    taskBlockId?: number
    yearLevel?: yearLevelEnum
    subjectGroup?: subjectGroupEnum
    difficultyLevel?: difficultyLevelEnum
    qualityScore?: number
    usageCount?: number
    lastUsedAt?: string
    keyKnowledgeId?: number
    keySkillId?: number
    learningAreaId?: number
    learningStandardId?: number
    standardElaborationId?: number
}

export abstract class VectorDocumentLoader extends BaseDocumentLoader {
  protected metadata: VectorMetadata;

  constructor(metadata: VectorMetadata) {
    super();
    this.metadata = metadata;
  }

  protected enrichDocument(doc: Document): Document {
    return new Document({
      ...doc,
      metadata: {
        ...this.metadata,
        ...doc.metadata,
        timestamp: new Date().toISOString()
      }
    });
  }
}
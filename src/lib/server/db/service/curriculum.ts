import type { yearLevelEnum } from '$lib/enums';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import type {
	CurriculumSubject,
	LearningArea,
	LearningAreaStandard,
	LearningAreaTopic,
	StandardElaboration
} from '$lib/server/db/schema/curriculum';
import { and, eq, inArray } from 'drizzle-orm';
import type { EmbeddingMetadata } from './vector';

// ============================================================================
// CRUD METHODS
// ============================================================================

export async function getCurriculumSubjectsByCurriculumId(curriculumId: number) {
	const results = await db
		.select()
		.from(table.curriculumSubject)
		.where(eq(table.curriculumSubject.curriculumId, curriculumId));

	return results;
}

export interface LearningStandardsWithElaborations {
	learningAreaStandard: LearningAreaStandard;
	standardsWithElaborations: StandardElaboration[];
}

export interface TopicWithStandards {
	topic: LearningAreaTopic;
	standardsWithElaborations: LearningStandardsWithElaborations[];
}

export interface LearningAreaData {
	learningArea: LearningArea;
	topics: TopicWithStandards[];
	orphanStandards: LearningStandardsWithElaborations[];
}

export interface CurriculumSubjectData {
	curriculumSubject: CurriculumSubject;
	learningAreas: LearningAreaData[];
}

export async function getCurriculumDataForCurriculumSubjectId(
	curriculumSubjectId: number,
	yearLevel?: yearLevelEnum
): Promise<CurriculumSubjectData | null> {
	const [curriculumSubject] = await db
		.select()
		.from(table.curriculumSubject)
		.where(eq(table.curriculumSubject.id, curriculumSubjectId))
		.limit(1);

	if (!curriculumSubject) {
		return null;
	}

	const learningAreas = await db
		.select()
		.from(table.learningArea)
		.where(eq(table.learningArea.curriculumSubjectId, curriculumSubjectId));

	if (learningAreas.length === 0) {
		return {
			curriculumSubject,
			learningAreas: []
		};
	}

	const learningAreaIds = learningAreas.map((la) => la.id);

	const standardsQuery = db
		.select()
		.from(table.learningAreaStandard)
		.where(
			yearLevel
				? and(
						inArray(table.learningAreaStandard.learningAreaId, learningAreaIds),
						eq(table.learningAreaStandard.yearLevel, yearLevel)
					)
				: inArray(table.learningAreaStandard.learningAreaId, learningAreaIds)
		);

	const [topics, standards, elaborations] = await Promise.all([
		db
			.select()
			.from(table.learningAreaTopic)
			.where(inArray(table.learningAreaTopic.learningAreaId, learningAreaIds)),
		standardsQuery,
		db.select().from(table.standardElaboration)
	]);

	const elaborationsByStandardId = new Map<number, typeof elaborations>();
	for (const elab of elaborations) {
		const standardId = elab.learningAreaStandardId;
		if (!elaborationsByStandardId.has(standardId)) {
			elaborationsByStandardId.set(standardId, []);
		}
		elaborationsByStandardId.get(standardId)!.push(elab);
	}

	const buildStandardWithElaborations = (
		standard: (typeof standards)[0]
	): LearningStandardsWithElaborations => ({
		learningAreaStandard: standard,
		standardsWithElaborations: elaborationsByStandardId.get(standard.id) || []
	});

	const learningAreasData: LearningAreaData[] = learningAreas.map((la) => {
		const topicsForArea = topics.filter((t) => t.learningAreaId === la.id);
		const standardsForArea = standards.filter((s) => s.learningAreaId === la.id);

		return {
			learningArea: la,
			topics: topicsForArea.map((topic) => {
				const standardsForTopic = standardsForArea.filter(
					(s) => s.learningAreaTopicId === topic.id
				);
				return {
					topic,
					standardsWithElaborations: standardsForTopic.map(buildStandardWithElaborations)
				};
			}),
			orphanStandards: standardsForArea
				.filter((s) => s.learningAreaTopicId === null)
				.map(buildStandardWithElaborations)
		};
	});

	return {
		curriculumSubject,
		learningAreas: learningAreasData
	};
}

// ============================================================================
// METADATA EXTRACTION METHODS
// ============================================================================

export async function getLearningAreaEmbeddingMetadata(
	record: Record<string, unknown>
): Promise<EmbeddingMetadata> {
	return {
		curriculumSubjectId: record.curriculumSubjectId as number
	};
}

export async function getLearningAreaContentEmbeddingMetadata(
	record: Record<string, unknown>
): Promise<EmbeddingMetadata> {
	const learningAreaId = record.learningAreaId as number;

	if (!learningAreaId) {
		return {};
	}

	const [result] = await db
		.select()
		.from(table.learningArea)
		.where(eq(table.learningArea.id, learningAreaId))
		.limit(1);

	return {
		learningAreaId,
		curriculumSubjectId: result?.curriculumSubjectId
	};
}

export async function getLearningAreaStandardEmbeddingMetadata(
	record: Record<string, unknown>
): Promise<EmbeddingMetadata> {
	const learningAreaId = record.learningAreaId as number;
	const yearLevel = record.yearLevel as yearLevelEnum;

	if (!learningAreaId) {
		return { yearLevel };
	}

	const [result] = await db
		.select({ curriculumSubjectId: table.learningArea.curriculumSubjectId })
		.from(table.learningArea)
		.where(eq(table.learningArea.id, learningAreaId))
		.limit(1);

	return {
		learningAreaStandardId: record.id as number,
		learningAreaId,
		curriculumSubjectId: result?.curriculumSubjectId,
		yearLevel
	};
}

export async function getStandardElaborationEmbeddingMetadata(
	record: Record<string, unknown>
): Promise<EmbeddingMetadata> {
	const learningAreaStandardId = record.learningAreaStandardId as number;

	if (!learningAreaStandardId) {
		return {};
	}

	const [result] = await db
		.select({
			curriculumSubjectId: table.learningArea.curriculumSubjectId,
			learningAreaId: table.learningAreaStandard.learningAreaId,
			yearLevel: table.learningAreaStandard.yearLevel
		})
		.from(table.learningAreaStandard)
		.innerJoin(
			table.learningArea,
			eq(table.learningAreaStandard.learningAreaId, table.learningArea.id)
		)
		.where(eq(table.learningAreaStandard.id, learningAreaStandardId))
		.limit(1);

	return {
		learningAreaStandardId,
		learningAreaId: result?.learningAreaId,
		curriculumSubjectId: result?.curriculumSubjectId,
		yearLevel: result?.yearLevel
	};
}

export async function getOutcomeEmbeddingMetadata(
	record: Record<string, unknown>
): Promise<EmbeddingMetadata> {
	return {
		curriculumSubjectId: record.curriculumSubjectId as number
	};
}

export async function getKeySkillEmbeddingMetadata(
	record: Record<string, unknown>
): Promise<EmbeddingMetadata> {
	return {
		curriculumSubjectId: record.curriculumSubjectId as number,
		outcomeId: record.outcomeId as number
	};
}

export async function getKeyKnowledgeEmbeddingMetadata(
	record: Record<string, unknown>
): Promise<EmbeddingMetadata> {
	return {
		curriculumSubjectId: record.curriculumSubjectId as number,
		outcomeId: record.outcomeId as number
	};
}

export async function getExamQuestionEmbeddingMetadata(
	record: Record<string, unknown>
): Promise<EmbeddingMetadata> {
	return {
		curriculumSubjectId: record.curriculumSubjectId as number,
		yearLevel: record.yearLevel as yearLevelEnum
	};
}

export async function getLearningActivityEmbeddingMetadata(
	record: Record<string, unknown>
): Promise<EmbeddingMetadata> {
	return {
		curriculumSubjectId: record.curriculumSubjectId as number,
		yearLevel: record.yearLevel as yearLevelEnum
	};
}

export async function getAssessmentTaskEmbeddingMetadata(
	record: Record<string, unknown>
): Promise<EmbeddingMetadata> {
	return {
		curriculumSubjectId: record.curriculumSubjectId as number,
		yearLevel: record.yearLevel as yearLevelEnum
	};
}

export async function getCurriculumSubjectExtraContentEmbeddingMetadata(
	record: Record<string, unknown>
): Promise<EmbeddingMetadata> {
	return {
		curriculumSubjectId: record.curriculumSubjectId as number
	};
}

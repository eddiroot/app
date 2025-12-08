import type { yearLevelEnum } from '$lib/enums';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import type { EmbeddingMetadata } from './vector';

// ============================================================================
// CURRICULUM & SUBJECT METHODS
// ============================================================================

/**
 * Get all curricula
 */
export async function getAllCurricula() {
	return await db
		.select()
		.from(table.curriculum)
		.where(eq(table.curriculum.isArchived, false))
		.orderBy(table.curriculum.name);
}

/**
 * Get curriculum by ID
 */
export async function getCurriculumById(curriculumId: number) {
	const [curriculum] = await db
		.select()
		.from(table.curriculum)
		.where(
			and(
				eq(table.curriculum.id, curriculumId),
				eq(table.curriculum.isArchived, false)
			)
		)
		.limit(1);
	
	return curriculum;
}

/**
 * Get all subjects for a curriculum
 */
export async function getSubjectsByCurriculum(curriculumId: number) {
	return await db
		.select()
		.from(table.curriculumSubject)
		.where(
			and(
				eq(table.curriculumSubject.curriculumId, curriculumId),
				eq(table.curriculumSubject.isArchived, false)
			)
		)
		.orderBy(table.curriculumSubject.name);
}

/**
 * Get subject by ID with curriculum info
 */
export async function getCurriculumSubjectById(subjectId: number) {
	const [result] = await db
		.select({
			subject: table.curriculumSubject,
			curriculum: table.curriculum
		})
		.from(table.curriculumSubject)
		.innerJoin(table.curriculum, eq(table.curriculumSubject.curriculumId, table.curriculum.id))
		.where(
			and(
				eq(table.curriculumSubject.id, subjectId),
				eq(table.curriculumSubject.isArchived, false)
			)
		)
		.limit(1);
	
	return result;
}

// ============================================================================
// LEARNING AREA METHODS
// ============================================================================

/**
 * Get all learning areas for a curriculum subject
 */
export async function getLearningAreasBySubject(curriculumSubjectId: number) {
	return await db
		.select()
		.from(table.learningArea)
		.where(
			and(
				eq(table.learningArea.curriculumSubjectId, curriculumSubjectId),
				eq(table.learningArea.isArchived, false)
			)
		)
		.orderBy(table.learningArea.name);
}

/**
 * Get learning areas by unit (based on abbreviation pattern like U1A1, U1A2, etc.)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getLearningAreasByUnit(curriculumSubjectId: number, unitNumber: number) {
	// TODO: Implement unit filtering - currently returns all learning areas for the subject
	// When implemented, should filter by abbreviation pattern like U${unitNumber}A%
	return await db
		.select()
		.from(table.learningArea)
		.where(
			and(
				eq(table.learningArea.curriculumSubjectId, curriculumSubjectId),
				eq(table.learningArea.isArchived, false)
				// TODO: Add LIKE filter on abbreviation for unit pattern matching
				// Example: like(table.learningArea.abbreviation, `U${unitNumber}A%`)
			)
		)
		.orderBy(table.learningArea.name);
}

/**
 * Get learning area by ID with content
 */
export async function getLearningAreaById(learningAreaId: number) {
	const learningArea = await db
		.select()
		.from(table.learningArea)
		.where(
			and(
				eq(table.learningArea.id, learningAreaId),
				eq(table.learningArea.isArchived, false)
			)
		)
		.limit(1);

	const content = await db
		.select()
		.from(table.learningAreaContent)
		.where(
			and(
				eq(table.learningAreaContent.learningAreaId, learningAreaId),
				eq(table.learningAreaContent.isArchived, false)
			)
		)
		.orderBy(table.learningAreaContent.number);

	return {
		learningArea: learningArea[0],
		content
	};
}

/**
 * Get learning area content by learning area
 */
export async function getLearningAreaContent(learningAreaId: number) {
	return await db
		.select()
		.from(table.learningAreaContent)
		.where(
			and(
				eq(table.learningAreaContent.learningAreaId, learningAreaId),
				eq(table.learningAreaContent.isArchived, false)
			)
		)
		.orderBy(table.learningAreaContent.number);
}

// ============================================================================
// OUTCOME METHODS
// ============================================================================

/**
 * Get all outcomes for a curriculum subject
 */
export async function getOutcomesBySubject(curriculumSubjectId: number) {
	return await db
		.select()
		.from(table.outcome)
		.where(
			and(
				eq(table.outcome.curriculumSubjectId, curriculumSubjectId),
				eq(table.outcome.isArchived, false)
			)
		)
		.orderBy(table.outcome.number);
}

/**
 * Get outcomes by unit (filtered by learning area outcomes)
 */
export async function getOutcomesByUnit(curriculumSubjectId: number, unitNumber: number) {
	// First get learning areas for the unit
	const learningAreas = await getLearningAreasByUnit(curriculumSubjectId, unitNumber);
	const learningAreaIds = learningAreas.map(la => la.id);
	
	if (learningAreaIds.length === 0) {
		return [];
	}

	// Get outcomes linked to these learning areas
	const outcomes = await db
		.select({
			outcome: table.outcome
		})
		.from(table.outcome)
		.innerJoin(table.learningAreaOutcome, eq(table.outcome.id, table.learningAreaOutcome.outcomeId))
		.where(
			and(
				inArray(table.learningAreaOutcome.learningAreaId, learningAreaIds),
				eq(table.outcome.isArchived, false),
				eq(table.learningAreaOutcome.isArchived, false)
			)
		)
		.orderBy(table.outcome.number);

	return outcomes.map(row => row.outcome);
}

// ============================================================================
// VCE CURRICULUM SEEDING METHODS
// ============================================================================

/**
 * Get or create curriculum by name
 */
export async function getOrCreateCurriculum(name: string, version: string) {
	const [existing] = await db
		.select()
		.from(table.curriculum)
		.where(eq(table.curriculum.name, name))
		.limit(1);

	if (existing) {
		return existing;
	}

	const [curriculum] = await db
		.insert(table.curriculum)
		.values({
			name,
			version,
			isArchived: false
		})
		.returning();

	return curriculum;
}

/**
 * Get or create curriculum subject
 */
export async function getOrCreateCurriculumSubject(
	name: string, 
	curriculumId: number
) {
	const existingSubjects = await db
		.select()
		.from(table.curriculumSubject)
		.where(eq(table.curriculumSubject.name, name));
	
	const existingSubject = existingSubjects.find(s => s.curriculumId === curriculumId);

	if (existingSubject) {
		return { subject: existingSubject, isNew: false };
	}

	const [subject] = await db
		.insert(table.curriculumSubject)
		.values({
			name,
			curriculumId,
			isArchived: false
		})
		.returning();

	return { subject, isNew: true };
}

/**
 * Create learning area
 */
export async function createLearningArea(data: {
	curriculumSubjectId: number;
	name: string;
	abbreviation?: string;
	description?: string;
}) {
	const [learningArea] = await db
		.insert(table.learningArea)
		.values({
			...data,
			isArchived: false
		})
		.returning();

	return learningArea;
}

/**
 * Create outcome
 */
export async function createOutcome(data: {
	curriculumSubjectId: number;
	number: number;
	description: string;
}) {
	const [outcome] = await db
		.insert(table.outcome)
		.values({
			...data,
			isArchived: false
		})
		.returning();

	return outcome;
}

/**
 * Create key skill
 */
export async function createKeySkill(data: {
	description: string;
	outcomeId?: number | null;
	curriculumSubjectId?: number | null;
	number: number;
	topicName?: string | null;
}) {
	return await db
		.insert(table.keySkill)
		.values({
			...data,
			isArchived: false
		});
}

/**
 * Create key knowledge
 */
export async function createKeyKnowledge(data: {
	description: string;
	outcomeId?: number | null;
	curriculumSubjectId?: number | null;
	number: number;
	topicName?: string | null;
}) {
	return await db
		.insert(table.keyKnowledge)
		.values({
			...data,
			isArchived: false
		});
}

/**
 * Create core subject
 */
export async function createCoreSubject(data: {
	name: string;
	description: string;
	curriculumSubjectId: number;
	schoolId: number;
}) {
	const [coreSubject] = await db
		.insert(table.coreSubject)
		.values({
			...data,
			isArchived: false
		})
		.returning();

	return coreSubject;
}

/**
 * Get curriculum subjects for indexing
 */
export async function getAllCurriculumSubjects() {
	return await db.select().from(table.curriculumSubject);
}

/**
 * Get curriculum data for a subject (for indexing)
 */
export async function getCurriculumDataForSubject(subjectId: number) {
	const [keyKnowledge, keySkills, learningAreas, outcomes] = await Promise.all([
		db.select({
			kk: table.keyKnowledge,
			o: table.outcome
		})
		.from(table.keyKnowledge)
		.leftJoin(table.outcome, eq(table.keyKnowledge.outcomeId, table.outcome.id))
		.where(eq(table.keyKnowledge.curriculumSubjectId, subjectId)),
		
		db.select({
			ks: table.keySkill,
			o: table.outcome
		})
		.from(table.keySkill)
		.leftJoin(table.outcome, eq(table.keySkill.outcomeId, table.outcome.id))
		.where(eq(table.keySkill.curriculumSubjectId, subjectId)),
		
		db.select()
		.from(table.learningArea)
		.where(eq(table.learningArea.curriculumSubjectId, subjectId)),
		
		db.select()
		.from(table.outcome)
		.where(eq(table.outcome.curriculumSubjectId, subjectId))
	]);

	return {
		keyKnowledge,
		keySkills,
		learningAreas,
		outcomes
	};
}

/**
 * Find subject by name (for indexing)
 */
export async function findSubjectByName(subjectName: string) {
	try {
		// Try exact match first
		const [exactMatch] = await db
			.select()
			.from(table.curriculumSubject)
			.where(eq(table.curriculumSubject.name, subjectName))
			.limit(1);
		
		if (exactMatch) {
			return exactMatch;
		}
		
		// Try finding by partial match (for subjects with units)
		const allSubjects = await db.select().from(table.curriculumSubject);
		
		for (const subject of allSubjects) {
			if (subject.name.toLowerCase().includes(subjectName.toLowerCase()) ||
				subjectName.toLowerCase().includes(subject.name.toLowerCase())) {
				return subject;
			}
		}
		
		return null;
	} catch (error) {
		console.error(`Error finding subject ${subjectName}:`, error);
		return null;
	}
}


export async function getLearningAreaEmbeddingMetadata(record: Record<string, unknown>): Promise<EmbeddingMetadata> {
	return {
		curriculumSubjectId: record.curriculumSubjectId as number
	};
}

export async function getLearningAreaContentEmbeddingMetadata(record: Record<string, unknown>): Promise<EmbeddingMetadata> {
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

export async function getLearningAreaStandardEmbeddingMetadata(record: Record<string, unknown>): Promise<EmbeddingMetadata> {
	const learningAreaId = record.learningAreaId as number;
	const yearLevel = record.yearLevel as yearLevelEnum; 

	if (!learningAreaId) {
		return {yearLevel}
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

export async function getStandardElaborationEmbeddingMetadata(record: Record<string, unknown>): Promise<EmbeddingMetadata> {
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
        .innerJoin(table.learningArea, eq(table.learningAreaStandard.learningAreaId, table.learningArea.id))
        .where(eq(table.learningAreaStandard.id, learningAreaStandardId))
        .limit(1);

	return {
		learningAreaStandardId,
		learningAreaId: result?.learningAreaId,
		curriculumSubjectId: result?.curriculumSubjectId,
		yearLevel: result?.yearLevel
	};
}

export async function getOutcomeEmbeddingMetadata(record: Record<string, unknown>): Promise<EmbeddingMetadata> {
	return {
		curriculumSubjectId: record.curriculumSubjectId as number
	};
}

export async function getKeySkillEmbeddingMetadata(record: Record<string, unknown>): Promise<EmbeddingMetadata> {
    return {
        curriculumSubjectId: record.curriculumSubjectId as number,
        outcomeId: record.outcomeId as number
    };
}

export async function getKeyKnowledgeEmbeddingMetadata(record: Record<string, unknown>): Promise<EmbeddingMetadata> {
    return {
        curriculumSubjectId: record.curriculumSubjectId as number,
        outcomeId: record.outcomeId as number
    };
}

export async function getExamQuestionEmbeddingMetadata(record: Record<string, unknown>): Promise<EmbeddingMetadata> {
    return {
        curriculumSubjectId: record.curriculumSubjectId as number,
        yearLevel: record.yearLevel as yearLevelEnum
    };
}

export async function getLearningActivityEmbeddingMetadata(record: Record<string, unknown>): Promise<EmbeddingMetadata> {
    return {
        curriculumSubjectId: record.curriculumSubjectId as number,
		yearLevel: record.yearLevel as yearLevelEnum
    };
}

export async function getAssessmentTaskEmbeddingMetadata(record: Record<string, unknown>): Promise<EmbeddingMetadata> {
    return {
        curriculumSubjectId: record.curriculumSubjectId as number,
		yearLevel: record.yearLevel as yearLevelEnum
    };
}

export async function getCurriculumSubjectExtraContentEmbeddingMetadata(record: Record<string, unknown>): Promise<EmbeddingMetadata> {
    return {
        curriculumSubjectId: record.curriculumSubjectId as number
    };
}


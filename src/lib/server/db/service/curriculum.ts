import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import type { EmbeddingMetadataFilter } from '.';

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

// ============================================================================
// EMBEDDING METADATA EXTRACTION METHODS
// ============================================================================

/**
 * Extract metadata for LearningArea
 */
export async function getLearningAreaMetadataByCurriculumSubjectId(curriculumSubjectId: number): Promise<EmbeddingMetadataFilter> {
	try {
		return {
			curriculumSubjectId
		};
	} catch (error) {
		console.error('Error extracting learning area metadata:', error);
		return { curriculumSubjectId };
	}
}

/**
 * Extract metadata for LearningAreaContent by joining through LearningArea
 */
export async function getLearningAreaContentMetadataByLearningAreaId(learningAreaId: number): Promise<EmbeddingMetadataFilter> {
	try {
		const result = await db
			.select({
				curriculumSubjectId: table.learningArea.curriculumSubjectId
			})
			.from(table.learningArea)
			.where(eq(table.learningArea.id, learningAreaId))
			.limit(1);

		if (result.length === 0) {
			return {};
		}

		return {
			curriculumSubjectId: result[0].curriculumSubjectId,
			learningAreaId
		};
	} catch (error) {
		console.error('Error extracting learning area content metadata:', error);
		return { learningAreaId };
	}
}

/**
 * Extract metadata for LearningAreaStandard by joining through LearningArea
 */
export async function getLearningAreaStandardMetadataByLearningAreaId(learningAreaId: number): Promise<EmbeddingMetadataFilter> {
	try {
		const result = await db
			.select({
				curriculumSubjectId: table.learningArea.curriculumSubjectId
			})
			.from(table.learningArea)
			.where(eq(table.learningArea.id, learningAreaId))
			.limit(1);

		if (result.length === 0) {
			return {};
		}

		return {
			curriculumSubjectId: result[0].curriculumSubjectId,
			learningAreaId
		};
	} catch (error) {
		console.error('Error extracting learning area standard metadata:', error);
		return { learningAreaId };
	}
}

/**
 * Extract metadata for StandardElaboration by joining through LearningAreaStandard and LearningArea
 */
export async function getStandardElaborationMetadataByLearningAreaStandardId(learningAreaStandardId: number): Promise<EmbeddingMetadataFilter> {
	try {
		const result = await db
			.select({
				curriculumSubjectId: table.learningArea.curriculumSubjectId,
				learningAreaId: table.learningAreaStandard.learningAreaId
			})
			.from(table.learningAreaStandard)
			.innerJoin(table.learningArea, eq(table.learningAreaStandard.learningAreaId, table.learningArea.id))
			.where(eq(table.learningAreaStandard.id, learningAreaStandardId))
			.limit(1);

		if (result.length === 0) {
			return {};
		}

		return {
			curriculumSubjectId: result[0].curriculumSubjectId,
			learningAreaId: result[0].learningAreaId,
			learningAreaStandardId
		};
	} catch (error) {
		console.error('Error extracting standard elaboration metadata:', error);
		return { learningAreaStandardId };
	}
}

/**
 * Extract metadata for Outcome
 */
export async function getOutcomeMetadataByCurriculumSubjectId(curriculumSubjectId: number): Promise<EmbeddingMetadataFilter> {
	try {
		return {
			curriculumSubjectId
		};
	} catch (error) {
		console.error('Error extracting outcome metadata:', error);
		return { curriculumSubjectId };
	}
}

/**
 * Extract metadata for LearningAreaOutcome by joining through both LearningArea and Outcome
 */
export async function getLearningAreaOutcomeMetadataByIds(learningAreaId: number, outcomeId: number): Promise<EmbeddingMetadataFilter> {
	try {
		const result = await db
			.select({
				curriculumSubjectId: table.learningArea.curriculumSubjectId
			})
			.from(table.learningArea)
			.where(eq(table.learningArea.id, learningAreaId))
			.limit(1);

		if (result.length === 0) {
			return { learningAreaId, outcomeId };
		}

		return {
			curriculumSubjectId: result[0].curriculumSubjectId,
			learningAreaId,
			outcomeId
		};
	} catch (error) {
		console.error('Error extracting learning area outcome metadata:', error);
		return { learningAreaId, outcomeId };
	}
}

/**
 * Extract metadata for KeySkill
 */
export async function getKeySkillMetadata(curriculumSubjectId?: number | null, outcomeId?: number | null): Promise<EmbeddingMetadataFilter> {
	try {
		const metadata: EmbeddingMetadataFilter = {};
		
		if (curriculumSubjectId) {
			metadata.curriculumSubjectId = curriculumSubjectId;
		}
		
		if (outcomeId) {
			metadata.outcomeId = outcomeId;
		}
		
		return metadata;
	} catch (error) {
		console.error('Error extracting key skill metadata:', error);
		return {};
	}
}

/**
 * Extract metadata for KeyKnowledge
 */
export async function getKeyKnowledgeMetadata(curriculumSubjectId?: number | null, outcomeId?: number | null): Promise<EmbeddingMetadataFilter> {
	try {
		const metadata: EmbeddingMetadataFilter = {};
		
		if (curriculumSubjectId) {
			metadata.curriculumSubjectId = curriculumSubjectId;
		}
		
		if (outcomeId) {
			metadata.outcomeId = outcomeId;
		}
		
		return metadata;
	} catch (error) {
		console.error('Error extracting key knowledge metadata:', error);
		return {};
	}
}

/**
 * Extract metadata for ExamQuestion
 */
export async function getExamQuestionMetadataByCurriculumSubjectId(curriculumSubjectId: number): Promise<EmbeddingMetadataFilter> {
	try {
		return {
			curriculumSubjectId
		};
	} catch (error) {
		console.error('Error extracting exam question metadata:', error);
		return { curriculumSubjectId };
	}
}

/**
 * Extract metadata for LearningActivity
 */
export async function getLearningActivityMetadataByCurriculumSubjectId(curriculumSubjectId: number): Promise<EmbeddingMetadataFilter> {
	try {
		return {
			curriculumSubjectId
		};
	} catch (error) {
		console.error('Error extracting learning activity metadata:', error);
		return { curriculumSubjectId };
	}
}

/**
 * Extract metadata for AssessmentTask
 */
export async function getAssessmentTaskMetadataByCurriculumSubjectId(curriculumSubjectId: number): Promise<EmbeddingMetadataFilter> {
	try {
		const [subjectInfo] = await db
			.select({
				curriculumId: table.curriculum.id,
				curriculumName: table.curriculum.name,
				subjectName: table.curriculumSubject.name
			})
			.from(table.curriculumSubject)
			.innerJoin(table.curriculum, eq(table.curriculumSubject.curriculumId, table.curriculum.id))
			.where(eq(table.curriculumSubject.id, curriculumSubjectId))
			.limit(1);

		return subjectInfo ? { curriculumSubjectId, ...subjectInfo } : { curriculumSubjectId };
	} catch (error) {
		console.error('Error extracting assessment task metadata:', error);
		return { curriculumSubjectId };
	}
}

/**
 * Extract metadata for CurriculumSubjectExtraContent
 */
export async function getCurriculumSubjectExtraContentMetadataByCurriculumSubjectId(curriculumSubjectId: number): Promise<EmbeddingMetadataFilter> {
	try {
		const [subjectInfo] = await db
			.select({
				curriculumId: table.curriculum.id,
				curriculumName: table.curriculum.name,
				subjectName: table.curriculumSubject.name
			})
			.from(table.curriculumSubject)
			.innerJoin(table.curriculum, eq(table.curriculumSubject.curriculumId, table.curriculum.id))
			.where(eq(table.curriculumSubject.id, curriculumSubjectId))
			.limit(1);

		return subjectInfo ? { curriculumSubjectId, ...subjectInfo } : { curriculumSubjectId };
	} catch (error) {
		console.error('Error extracting curriculum subject extra content metadata:', error);
		return { curriculumSubjectId };
	}
}


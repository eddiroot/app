import {
	jsonb,
	pgSchema,
	timestamp,
	vector
} from 'drizzle-orm/pg-core';
import { yearLevelEnum } from '../../../enums';

export const utilsSchema = pgSchema('utils');

export const timestamps = {
	createdAt: timestamp({ mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'date' })
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull()
};


// Enums used across multiple schema files - defined here to avoid circular dependencies
export const yearLevelEnumPg = utilsSchema.enum('enum_year_level', [
	yearLevelEnum.none,
	yearLevelEnum.foundation,
	yearLevelEnum.year1,
	yearLevelEnum.year2,
	yearLevelEnum.year3,
	yearLevelEnum.year4,
	yearLevelEnum.year5,
	yearLevelEnum.year6,
	yearLevelEnum.year7,
	yearLevelEnum.year8,
	yearLevelEnum.year9,
	yearLevelEnum.year10,
	yearLevelEnum.year11,
	yearLevelEnum.year12
]);

export const embeddings = {
	embedding: vector('embedding', { dimensions: 768 }),
	embeddingMetadata: jsonb('embedding_metadata').$type<{
		qualityScore?: number;
		usageCount?: number;
		lastUsedAt?: Date;
		userId?: string;
		subjectId?: number;
		curriculumSubjectId?: number;
		yearLevel?: yearLevelEnum;
		[key: string]: unknown;
	}>()
};

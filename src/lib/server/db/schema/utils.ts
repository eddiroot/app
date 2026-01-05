import {
	boolean,
	index,
	integer,
	jsonb,
	pgSchema,
	text,
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

/**
 * When a user partially links or uploads a document that is not stored permanently.
 * These can be cleaned up periodically.
 * 
 * For example, if a user attaches a video or a document to use when creating a task but does not want to permanently store it.
 */
export const tempPool = utilsSchema.table(
	'temp_pool',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		content: text('content').notNull(),
		...embeddings,
		isArchived: boolean('is_archived').notNull().default(false),
		...timestamps
	},
	(self) => [
		index('temp_pool_embedding_idx').using('hnsw', self.embedding.op('vector_cosine_ops')),
		index('temp_pool_metadata_idx').using('gin', self.embeddingMetadata)
	]
);

export type TempPool = typeof tempPool.$inferSelect;


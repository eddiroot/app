import { yearLevelEnum } from '$lib/enums';
import { boolean, index, integer, jsonb, pgEnum, pgTable, text, timestamp, vector } from 'drizzle-orm/pg-core';

export const timestamps = {
	createdAt: timestamp({ mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'date' })
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull()
};

// Enums used across multiple schema files - defined here to avoid circular dependencies
export const yearLevelEnumPg = pgEnum('enum_year_level', [
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
	yearLevelEnum.year12,
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

// Temporary pool table for documents that are not saved.
export const tempPool = pgTable('temp_pool', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	content: text('content').notNull(),
	...embeddings,
	...timestamps
},
(self)	=> [
	index('temp_pool_embedding_idx').using('hnsw', self.embedding.op('vector_cosine_ops')),
	index('temp_pool_metadata_idx').using('gin', self.embeddingMetadata),
]
);

export type TempPool = typeof tempPool.$inferSelect;

export const publish = {
	isPublicRequested: boolean('is_public_requested').notNull().default(false),
	isPublicApproved: boolean('is_public_approved').notNull().default(false),
	publicRequestedAt: timestamp({ mode: 'date' }),
	publicApprovedAt: timestamp({ mode: 'date' })
}
import { boolean, index, integer, pgEnum, pgTable, text } from 'drizzle-orm/pg-core';
import { yearLevelEnum } from '../../../enums';
import { embeddings, timestamps } from './utils';

export const curriculum = pgTable('crclm', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	name: text('name').notNull(),
	version: text('version').notNull(),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type Curriculum = typeof curriculum.$inferSelect;

export const curriculumSubject = pgTable('crclm_sub', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	name: text('name').notNull(),
	curriculumId: integer('cur_id')
		.notNull()
		.references(() => curriculum.id, { onDelete: 'cascade' }),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type CurriculumSubject = typeof curriculumSubject.$inferSelect;

export const learningArea = pgTable('crclm_sub_la', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	curriculumSubjectId: integer('cur_sub_id')
		.notNull()
		.references(() => curriculumSubject.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	abbreviation: text('abbreviation'),
	description: text('description'),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps,
	...embeddings
},
	(self) => [
		index('crclm_sub_la_embedding_idx').using('hnsw', self.embedding.op('vector_cosine_ops')),
		index('crclm_sub_la_metadata_idx').using('gin', self.embeddingMetadata),
	]

);

export type LearningArea = typeof learningArea.$inferSelect;

export const learningAreaContent = pgTable('lrn_a_cont', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	learningAreaId: integer('lrn_a_id')
		.notNull()
		.references(() => learningArea.id, { onDelete: 'cascade' }),
	description: text('description').notNull(),
	number: integer('number').notNull(), 
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps,
	...embeddings
},
	(self) => [
		index('lrn_a_cont_embedding_idx').using('hnsw', self.embedding.op('vector_cosine_ops')),
		index('lrn_a_cont_metadata_idx').using('gin', self.embeddingMetadata),
	]

);

export type LearningAreaContent = typeof learningAreaContent.$inferSelect;

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
	yearLevelEnum.year10A,
	yearLevelEnum.year11,
	yearLevelEnum.year12,
	yearLevelEnum.year13,
	yearLevelEnum.VCE,
	yearLevelEnum.VCE12,
	yearLevelEnum.VCE34
]);

export const learningAreaStandard = pgTable('lrn_a_std', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	learningAreaId: integer('lrn_a_id')
		.notNull()
		.references(() => learningArea.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	description: text('description'),
	yearLevel: yearLevelEnumPg().notNull(),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps,
	...embeddings
},
	(self) => [
		index('lrn_a_std_embedding_idx').using('hnsw', self.embedding.op('vector_cosine_ops')),
		index('lrn_a_std_metadata_idx').using('gin', self.embeddingMetadata),
	]

);

export type LearningAreaStandard = typeof learningAreaStandard.$inferSelect;

export const standardElaboration = pgTable('lrn_a_std_elab', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	learningAreaStandardId: integer('lrn_a_std_id')
		.notNull()
		.references(() => learningAreaStandard.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	standardElaboration: text('std_elab').notNull(),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps,
	...embeddings
},
	(self) => [
		index('lrn_a_std_elab_embedding_idx').using('hnsw', self.embedding.op('vector_cosine_ops')),
		index('lrn_a_std_elab_metadata_idx').using('gin', self.embeddingMetadata),
	]

);

export type StandardElaboration = typeof standardElaboration.$inferSelect;

export const outcome = pgTable('outcome', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	curriculumSubjectId: integer('cur_sub_id')
		.notNull()
		.references(() => curriculumSubject.id, { onDelete: 'cascade' }),
	number: integer('number').notNull(),
	description: text('description').notNull(),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps,
	...embeddings
},
	(self) => [
		index('outcome_embedding_idx').using('hnsw', self.embedding.op('vector_cosine_ops')),
		index('outcome_metadata_idx').using('gin', self.embeddingMetadata),
	]

);

export type Outcome = typeof outcome.$inferSelect;

export const learningAreaOutcome = pgTable('lrn_a_outcome', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	learningAreaId: integer('lrn_a_id')
		.notNull()
		.references(() => learningArea.id, { onDelete: 'cascade' }),
	outcomeId: integer('out_id')
		.notNull()
		.references(() => outcome.id, { onDelete: 'cascade' }),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps,
},
);

export type LearningAreaOutcome = typeof learningAreaOutcome.$inferSelect;


export const keySkill = pgTable('key_skill', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	description: text('description').notNull(),
	outcomeId: integer('out_id')
		.references(() => outcome.id, { onDelete: 'cascade' }),
	curriculumSubjectId: integer('cur_sub_id')
		.references(() => curriculumSubject.id, { onDelete: 'cascade' }),
	number: integer('number').notNull(), // e.g. 1/2/3
	topicName: text('topic_name'),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps,
	...embeddings	
},
	(self) => [
		index('key_skill_embedding_idx').using('hnsw', self.embedding.op('vector_cosine_ops')),
		index('key_skill_metadata_idx').using('gin', self.embeddingMetadata),
	]
);

export type KeySkill = typeof keySkill.$inferSelect;

export const keyKnowledge = pgTable('key_knowledge', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	description: text('description').notNull(),
	outcomeId: integer('out_id')
		.references(() => outcome.id, { onDelete: 'cascade' }),
	topicName: text('topic_name'),
	curriculumSubjectId: integer('cur_sub_id')
		.references(() => curriculumSubject.id, { onDelete: 'cascade' }),
	number: integer('number').notNull(), // e.g. 1/2/3
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps,
	...embeddings
},
	(self) => [
		index('key_knowledge_embedding_idx').using('hnsw', self.embedding.op('vector_cosine_ops')),
		index('key_knowledge_metadata_idx').using('gin', self.embeddingMetadata),
	]

);

export type KeyKnowledge = typeof keyKnowledge.$inferSelect;

export const examQuestion = pgTable('exam_question', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	question: text('question').notNull(),
	answer: text('answer').notNull(),
	curriculumSubjectId: integer('cur_sub_id')
		.notNull()
		.references(() => curriculumSubject.id, { onDelete: 'cascade' }),
	yearLevel: yearLevelEnumPg().notNull(),
	...timestamps,
	...embeddings
},
	(self) => [
		index('exam_question_embedding_idx').using('hnsw', self.embedding.op('vector_cosine_ops')),
		index('exam_question_metadata_idx').using('gin', self.embeddingMetadata),
	]
);

export type ExamQuestion = typeof examQuestion.$inferSelect;

export const learningActivity = pgTable('lrn_activity', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	content: text('content').notNull(),
	curriculumSubjectId: integer('cur_sub_id')
		.notNull()
		.references(() => curriculumSubject.id, { onDelete: 'cascade' }),
	yearLevel: yearLevelEnumPg().notNull(),
	...timestamps,
	...embeddings
},
	(self) => [
		index('learning_activity_embedding_idx').using('hnsw', self.embedding.op('vector_cosine_ops')),
		index('learning_activity_metadata_idx').using('gin', self.embeddingMetadata),
	]
);

export type LearningActivity = typeof learningActivity.$inferSelect;

export const assessmentTask = pgTable('assess_task', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	content: text('content').notNull(),
	curriculumSubjectId: integer('cur_sub_id')
		.notNull()
		.references(() => curriculumSubject.id, { onDelete: 'cascade' }),
	yearLevel: yearLevelEnumPg().notNull(),
	...timestamps,
	...embeddings
},
	(self) => [
		index('assessment_task_embedding_idx').using('hnsw', self.embedding.op('vector_cosine_ops')),
		index('assessment_task_metadata_idx').using('gin', self.embeddingMetadata),
	]
); 

export type AssessmentTask = typeof assessmentTask.$inferSelect;

export const curriculumSubjectExtraContent = pgTable('crclm_sub_cont', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	curriculumSubjectId: integer('cur_sub_id')
		.notNull()
		.references(() => curriculumSubject.id, { onDelete: 'cascade' }),
	content: text('content').notNull(),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps,
	...embeddings
},
	(self) => [
		index('crclm_sub_cont_embedding_idx').using('hnsw', self.embedding.op('vector_cosine_ops')),
		index('crclm_sub_cont_metadata_idx').using('gin', self.embeddingMetadata),
	]
);

export type CurriculumSubjectExtraContent = typeof curriculumSubjectExtraContent.$inferSelect;
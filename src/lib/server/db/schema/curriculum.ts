import {
	boolean,
	doublePrecision,
	index,
	integer,
	pgSchema,
	text,
	unique,
	varchar
} from 'drizzle-orm/pg-core';
import { gradeScaleEnum } from '../../../enums';
import { school } from './schools';
import { embeddings, publish, timestamps, yearLevelEnumPg } from './utils';

export const curriculumSchema = pgSchema('curriculum');

export const curriculum = curriculumSchema.table('crclm', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	name: text('name').notNull(),
	version: text('version').notNull(),
	schoolId: integer('school_id').references(() => school.id, { onDelete: 'cascade' }),
	countryCode: varchar('country_code', { length: 2 }).notNull(),
	stateCode: varchar('state_code', { length: 3 }).notNull(),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps,
	...publish
});

export type Curriculum = typeof curriculum.$inferSelect;

export const curriculumSubject = curriculumSchema.table('crclm_sub', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	name: text('name').notNull(),
	curriculumId: integer('cur_id')
		.notNull()
		.references(() => curriculum.id, { onDelete: 'cascade' }),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type CurriculumSubject = typeof curriculumSubject.$inferSelect;

export const learningArea = curriculumSchema.table(
	'crclm_sub_la',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		curriculumSubjectId: integer('cur_sub_id')
			.notNull()
			.references(() => curriculumSubject.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		isArchived: boolean('is_archived').notNull().default(false),
		...timestamps,
		...embeddings
	},
	(self) => [
		index('crclm_sub_la_embedding_idx').using('hnsw', self.embedding.op('vector_cosine_ops')),
		index('crclm_sub_la_metadata_idx').using('gin', self.embeddingMetadata)
	]
);

export type LearningArea = typeof learningArea.$inferSelect;

export const learningAreaContent = curriculumSchema.table(
	'lrn_a_cont',
	{
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
		index('lrn_a_cont_metadata_idx').using('gin', self.embeddingMetadata)
	]
);

export type LearningAreaContent = typeof learningAreaContent.$inferSelect;

export const learningAreaTopic = curriculumSchema.table(
	'lrn_a_topic',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		learningAreaId: integer('lrn_a_id')
			.notNull()
			.references(() => learningArea.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		isArchived: boolean('is_archived').notNull().default(false),
		...timestamps,
		...embeddings
	},
	(self) => [unique().on(self.learningAreaId, self.name)]
);

export type LearningAreaTopic = typeof learningAreaTopic.$inferSelect;

export const learningAreaStandard = curriculumSchema.table(
	'lrn_a_std',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		learningAreaId: integer('lrn_a_id')
			.notNull()
			.references(() => learningArea.id, { onDelete: 'cascade' }),
		learningAreaTopicId: integer('lrn_a_topic_id').references(() => learningAreaTopic.id, {
			onDelete: 'cascade'
		}),
		code: varchar('code', { length: 20 }).notNull(),
		description: text('description'),
		yearLevel: yearLevelEnumPg().notNull(),
		isArchived: boolean('is_archived').notNull().default(false),
		...timestamps,
		...embeddings
	},
	(self) => [
		index('lrn_a_std_embedding_idx').using('hnsw', self.embedding.op('vector_cosine_ops')),
		index('lrn_a_std_metadata_idx').using('gin', self.embeddingMetadata)
	]
);

export type LearningAreaStandard = typeof learningAreaStandard.$inferSelect;

export const standardElaboration = curriculumSchema.table(
	'lrn_a_std_elab',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		learningAreaStandardId: integer('lrn_a_std_id')
			.notNull()
			.references(() => learningAreaStandard.id, { onDelete: 'cascade' }),
		standardElaboration: text('std_elab').notNull(),
		isArchived: boolean('is_archived').notNull().default(false),
		...timestamps,
		...embeddings
	},
	(self) => [
		index('lrn_a_std_elab_embedding_idx').using('hnsw', self.embedding.op('vector_cosine_ops')),
		index('lrn_a_std_elab_metadata_idx').using('gin', self.embeddingMetadata)
	]
);

export type StandardElaboration = typeof standardElaboration.$inferSelect;

export const outcome = curriculumSchema.table(
	'outcome',
	{
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
		index('outcome_metadata_idx').using('gin', self.embeddingMetadata)
	]
);

export type Outcome = typeof outcome.$inferSelect;

export const learningAreaOutcome = curriculumSchema.table('lrn_a_outcome', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	learningAreaId: integer('lrn_a_id')
		.notNull()
		.references(() => learningArea.id, { onDelete: 'cascade' }),
	outcomeId: integer('out_id')
		.notNull()
		.references(() => outcome.id, { onDelete: 'cascade' }),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type LearningAreaOutcome = typeof learningAreaOutcome.$inferSelect;

export const keySkill = curriculumSchema.table(
	'key_skill',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		description: text('description').notNull(),
		outcomeId: integer('out_id').references(() => outcome.id, { onDelete: 'cascade' }),
		curriculumSubjectId: integer('cur_sub_id').references(() => curriculumSubject.id, {
			onDelete: 'cascade'
		}),
		number: integer('number').notNull(), // e.g. 1/2/3
		topicName: text('topic_name'),
		isArchived: boolean('is_archived').notNull().default(false),
		...timestamps,
		...embeddings
	},
	(self) => [
		index('key_skill_embedding_idx').using('hnsw', self.embedding.op('vector_cosine_ops')),
		index('key_skill_metadata_idx').using('gin', self.embeddingMetadata)
	]
);

export type KeySkill = typeof keySkill.$inferSelect;

export const keyKnowledge = curriculumSchema.table(
	'key_knowledge',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		description: text('description').notNull(),
		outcomeId: integer('out_id').references(() => outcome.id, { onDelete: 'cascade' }),
		topicName: text('topic_name'),
		curriculumSubjectId: integer('cur_sub_id').references(() => curriculumSubject.id, {
			onDelete: 'cascade'
		}),
		number: integer('number').notNull(),
		isArchived: boolean('is_archived').notNull().default(false),
		...timestamps,
		...embeddings
	},
	(self) => [
		index('key_knowledge_embedding_idx').using('hnsw', self.embedding.op('vector_cosine_ops')),
		index('key_knowledge_metadata_idx').using('gin', self.embeddingMetadata)
	]
);

export type KeyKnowledge = typeof keyKnowledge.$inferSelect;

export const examQuestion = curriculumSchema.table(
	'exam_question',
	{
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
		index('exam_question_metadata_idx').using('gin', self.embeddingMetadata)
	]
);

export type ExamQuestion = typeof examQuestion.$inferSelect;

export const learningActivity = curriculumSchema.table(
	'lrn_activity',
	{
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
		index('learning_activity_metadata_idx').using('gin', self.embeddingMetadata)
	]
);

export type LearningActivity = typeof learningActivity.$inferSelect;

export const assessmentTask = curriculumSchema.table(
	'assess_task',
	{
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
		index('assessment_task_metadata_idx').using('gin', self.embeddingMetadata)
	]
);

export type AssessmentTask = typeof assessmentTask.$inferSelect;

export const curriculumSubjectExtraContent = curriculumSchema.table(
	'crclm_sub_cont',
	{
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
		index('crclm_sub_cont_metadata_idx').using('gin', self.embeddingMetadata)
	]
);

export type CurriculumSubjectExtraContent = typeof curriculumSubjectExtraContent.$inferSelect;

export const gradeScaleEnumPg = curriculumSchema.enum('enum_grade_scale', [
	gradeScaleEnum.IB_CP,
	gradeScaleEnum.IB_DP,
	gradeScaleEnum.IB_MYP,
	gradeScaleEnum.IB_PYP,
	gradeScaleEnum.GPA,
	gradeScaleEnum.percentage,
	gradeScaleEnum.custom
]);

export const gradeScale = curriculumSchema.table('grade_scale', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	name: text('name').notNull(),
	gradeScaleType: gradeScaleEnumPg().notNull(),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type GradeScale = typeof gradeScale.$inferSelect;

export const gradeScaleLevel = curriculumSchema.table('grade_scale_level', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	gradeScaleId: integer('grade_scale_id')
		.notNull()
		.references(() => gradeScale.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	color: text('color').notNull(),
	minimumScore: doublePrecision('minimum_score').notNull(),
	maximumScore: doublePrecision('maximum_score').notNull(),
	gradeValue: doublePrecision('grade_value'),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type GradeScaleLevel = typeof gradeScaleLevel.$inferSelect;

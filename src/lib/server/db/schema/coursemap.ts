import { boolean, foreignKey, index, integer, pgTable, text, unique } from 'drizzle-orm/pg-core';
import { learningArea, learningAreaStandard } from './curriculum';
import { resource } from './resource';
import { subjectOffering } from './subjects';
import { rubric, task } from './task';
import { embeddings, timestamps } from './utils';

export const courseMapItem = pgTable(
	'cm_itm',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		subjectOfferingId: integer('sub_off_id')
			.notNull()
			.references(() => subjectOffering.id, { onDelete: 'cascade' }),
		topic: text('topic').notNull(),
		description: text('description'),
		startWeek: integer('start_week'),
		duration: integer('duration'),
		semester: integer('semester'),
		color: text('color').default('#3B82F6'),
		imageBase64: text('image_base64'),
		originalId: integer('original_id'),
		version: integer('version').notNull().default(1),
		isArchived: boolean('is_archived').notNull().default(false),
		...timestamps
	},
	(self) => [
		foreignKey({
			columns: [self.originalId],
			foreignColumns: [self.id]
		}).onDelete('cascade'),
		unique().on(self.originalId, self.version)
	]
);

export type CourseMapItem = typeof courseMapItem.$inferSelect;

export const courseMapItemLearningArea = pgTable(
	'cm_itm_la',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		courseMapItemId: integer('cm_itm_id')
			.notNull()
			.references(() => courseMapItem.id, { onDelete: 'cascade' }),
		learningAreaId: integer('lrn_a_id')
			.notNull()
			.references(() => learningArea.id, { onDelete: 'cascade' }),
		originalId: integer('original_id'),
		version: integer('version').notNull().default(1),
		isArchived: boolean('is_archived').notNull().default(false),
		...timestamps
	},
	(self) => [
		foreignKey({
			columns: [self.originalId],
			foreignColumns: [self.id]
		}).onDelete('cascade'),
		unique().on(self.originalId, self.version)
	]
);

export type CourseMapItemLearningArea = typeof courseMapItemLearningArea.$inferSelect;

// if we want to check across the area of study standards,
export const courseMapItemAssessmentPlan = pgTable(
	'cm_itm_ass_pln',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		courseMapItemId: integer('cm_itm_id')
			.notNull()
			.references(() => courseMapItem.id, { onDelete: 'cascade' }),
		taskId: integer('task_id')
			.references(() => task.id, { onDelete: 'set null' }),
		name: text('name').notNull(),
		scope: text('scope').array(),
		description: text('description'),
		rubricId: integer('rubric_id').references(() => rubric.id, { onDelete: 'set null' }),
		imageBase64: text('image_base64'),
		originalId: integer('original_id'),
		version: integer('version').notNull().default(1),
		isArchived: boolean('is_archived').notNull().default(false),
		...timestamps,
		...embeddings
	},
	(self) => [
		foreignKey({
			columns: [self.originalId],
			foreignColumns: [self.id]
		}).onDelete('cascade'),
		unique().on(self.originalId, self.version),
		index('cm_ass_pln_embedding_idx').using('hnsw', self.embedding.op('vector_cosine_ops')),
		index('cm_ass_pln_metadata_idx').using('gin', self.embeddingMetadata),
	]
);

export type CourseMapItemAssessmentPlan = typeof courseMapItemAssessmentPlan.$inferSelect;

export const assessmentPlanResource = pgTable('cm_ass_pln_res', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	courseMapItemAssessmentPlanId: integer('cm_itm_ass_pln_id')
		.notNull()
		.references(() => courseMapItemAssessmentPlan.id, { onDelete: 'cascade' }),
	resourceId: integer('res_id')
		.notNull()
		.references(() => resource.id, { onDelete: 'cascade' })
});

export const courseMapItemLessonPlan = pgTable(
	'cm_itm_les_pln',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		courseMapItemId: integer('cm_itm_id')
			.notNull()
			.references(() => courseMapItem.id, { onDelete: 'cascade' }),
		taskId: integer('task_id')
			.references(() => task.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		scope: text('scope').array(),
		description: text('description'),
		imageBase64: text('image_base64'),
		originalId: integer('original_id'),
		version: integer('version').notNull().default(1),
		isArchived: boolean('is_archived').notNull().default(false),
		...timestamps,
		...embeddings
	},
	(self) => [
		foreignKey({
			columns: [self.originalId],
			foreignColumns: [self.id]
		}).onDelete('cascade'),
		unique().on(self.originalId, self.version),
		index('cm_les_pln_embedding_idx').using('hnsw', self.embedding.op('vector_cosine_ops')),
		index('cm_les_pln_metadata_idx').using('gin', self.embeddingMetadata),
	]
);

export type CourseMapItemLessonPlan = typeof courseMapItemLessonPlan.$inferSelect;

export const lessonPlanResource = pgTable('cm_les_pln_res', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	courseMapItemLessonPlanId: integer('cm_itm_les_pln_id')
		.notNull()
		.references(() => courseMapItemLessonPlan.id, { onDelete: 'cascade' }),
	resourceId: integer('res_id')
		.notNull()
		.references(() => resource.id, { onDelete: 'cascade' })
});

export type LessonPlanResource = typeof lessonPlanResource.$inferSelect;

export const lessonPlanLearningAreaStandard = pgTable('cm_les_pln_la_std', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	courseMapItemLessonPlanId: integer('cm_itm_les_pln_id')
		.notNull()
		.references(() => courseMapItemLessonPlan.id, { onDelete: 'cascade' }),
	learningAreaStandardId: integer('la_std_id')
		.notNull()
		.references(() => learningAreaStandard.id, { onDelete: 'cascade' }),

	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});
export type LessonPlanLearningAreaStandard = typeof lessonPlanLearningAreaStandard.$inferSelect;

export const assessmentPlanLearningAreaStandard = pgTable('cm_ass_pln_la_std', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	courseMapItemAssessmentPlanId: integer('cm_itm_ass_pln_id')
		.notNull()
		.references(() => courseMapItemAssessmentPlan.id, { onDelete: 'cascade' }),
	learningAreaStandardId: integer('la_std_id')
		.notNull()
		.references(() => learningAreaStandard.id, { onDelete: 'cascade' }),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type AssessmentPlanLearningAreaStandard =
	typeof assessmentPlanLearningAreaStandard.$inferSelect;

export const courseMapItemResource = pgTable(
	'cm_itm_res',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		courseMapItemId: integer('cm_itm_id')
			.notNull()
			.references(() => courseMapItem.id, { onDelete: 'cascade' }),
		resourceId: integer('resource_id')
			.notNull()
			.references(() => resource.id, { onDelete: 'cascade' }),
		originalId: integer('original_id'),
		version: integer('version').notNull().default(1),
		isArchived: boolean('is_archived').notNull().default(false),
		...timestamps
	},
	(self) => [
		foreignKey({
			columns: [self.originalId],
			foreignColumns: [self.id]
		}).onDelete('cascade'),
		unique().on(self.originalId, self.version)
	]
);

export type CourseMapItemResource = typeof courseMapItemResource.$inferSelect;

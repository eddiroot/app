import {
	index,
	integer,
	pgSchema,
	primaryKey,
	text,
} from 'drizzle-orm/pg-core';
import {
	curriculumSubjectLearningArea,
	curriculumSubjectLearningAreaStandard,
} from './curriculum';
import { resource } from './resource';
import { subjectOffering } from './subject';
import { rubric, task } from './task';
import { essentials, hexColor } from './utils';

export const courseMapSchema = pgSchema('coursemap');

export const courseMapItem = courseMapSchema.table(
	'cm_itm',
	{
		...essentials,
		topic: text().notNull(),
		description: text(),
		startWeek: integer(),
		duration: integer(),
		hexColor,
		subjectOfferingId: integer('sub_off_id')
			.notNull()
			.references(() => subjectOffering.id, { onDelete: 'cascade' }),
	},
	(self) => [index().on(self.subjectOfferingId)],
);

export type CourseMapItem = typeof courseMapItem.$inferSelect;

export const courseMapItemLearningArea = courseMapSchema.table(
	'cm_itm_la',
	{
		...essentials,
		courseMapItemId: integer('cm_itm_id')
			.notNull()
			.references(() => courseMapItem.id, { onDelete: 'cascade' }),
		curriculumSubjectLearningAreaId: integer('crclm_sub_la_id')
			.notNull()
			.references(() => curriculumSubjectLearningArea.id, {
				onDelete: 'cascade',
			}),
	},
	(self) => [
		index().on(self.courseMapItemId),
		index().on(self.curriculumSubjectLearningAreaId),
	],
);

export type CourseMapItemLearningArea =
	typeof courseMapItemLearningArea.$inferSelect;

export const courseMapItemResource = courseMapSchema.table(
	'cm_itm_res',
	{
		courseMapItemId: integer('cm_itm_id')
			.notNull()
			.references(() => courseMapItem.id, { onDelete: 'cascade' }),
		resourceId: integer('res_id')
			.notNull()
			.references(() => resource.id, { onDelete: 'cascade' }),
	},
	(self) => [
		primaryKey({ columns: [self.courseMapItemId, self.resourceId] }),
		index().on(self.courseMapItemId),
		index().on(self.resourceId),
	],
);

export type CourseMapItemResource = typeof courseMapItemResource.$inferSelect;

// Course Map Item Plans

// Assessment Plans
export const courseMapItemAssessmentPlan = courseMapSchema.table(
	'cm_itm_ap',
	{
		...essentials,
		courseMapItemId: integer('cm_itm_id')
			.notNull()
			.references(() => courseMapItem.id, { onDelete: 'cascade' }),
		taskId: integer().references(() => task.id, { onDelete: 'set null' }),
		name: text().notNull(),
		scope: text().array(),
		description: text(),
		rubricId: integer().references(() => rubric.id, { onDelete: 'set null' }),
	},
	(self) => [
		index().on(self.courseMapItemId),
		index().on(self.taskId),
		index().on(self.rubricId),
	],
);

export type CourseMapItemAssessmentPlan =
	typeof courseMapItemAssessmentPlan.$inferSelect;

export const courseMapItemAssessmentPlanResource = courseMapSchema.table(
	'cm_itm_ap_res',
	{
		courseMapItemAssessmentPlanId: integer('cm_itm_ap_id')
			.notNull()
			.references(() => courseMapItemAssessmentPlan.id, {
				onDelete: 'cascade',
			}),
		resourceId: integer('res_id')
			.notNull()
			.references(() => resource.id, { onDelete: 'cascade' }),
	},
	(self) => [
		primaryKey({
			columns: [self.courseMapItemAssessmentPlanId, self.resourceId],
		}),
		index().on(self.courseMapItemAssessmentPlanId),
		index().on(self.resourceId),
	],
);

export type CourseMapItemAssessmentPlanResource =
	typeof courseMapItemAssessmentPlanResource.$inferInsert;

export const courseMapItemAssessmentPlanLearningAreaStandard =
	courseMapSchema.table(
		'cm_itm_ap_las',
		{
			courseMapItemAssessmentPlanId: integer('cm_itm_ap_id')
				.notNull()
				.references(() => courseMapItemAssessmentPlan.id, {
					onDelete: 'cascade',
				}),
			curriculumSubjectLearningAreaStandardId: integer('crclm_sub_las_id')
				.notNull()
				.references(() => curriculumSubjectLearningAreaStandard.id, {
					onDelete: 'cascade',
				}),
		},
		(self) => [
			primaryKey({
				columns: [
					self.courseMapItemAssessmentPlanId,
					self.curriculumSubjectLearningAreaStandardId,
				],
			}),
			index().on(self.courseMapItemAssessmentPlanId),
			index().on(self.curriculumSubjectLearningAreaStandardId),
		],
	);

export type CourseMapItemAssessmentPlanLearningAreaStandard =
	typeof courseMapItemAssessmentPlanLearningAreaStandard.$inferSelect;

// Lesson Plans
export const courseMapItemLessonPlan = courseMapSchema.table(
	'cm_itm_lp',
	{
		...essentials,
		courseMapItemId: integer('cm_itm_id')
			.notNull()
			.references(() => courseMapItem.id, { onDelete: 'cascade' }),
		taskId: integer().references(() => task.id, { onDelete: 'cascade' }),
		name: text().notNull(),
		scope: text().array(),
		description: text(),
	},
	(self) => [index().on(self.courseMapItemId), index().on(self.taskId)],
);

export type CourseMapItemLessonPlan =
	typeof courseMapItemLessonPlan.$inferSelect;

export const courseMapItemLessonPlanResource = courseMapSchema.table(
	'cm_itm_lp_res',
	{
		courseMapItemLessonPlanId: integer('cm_itm_lp_id')
			.notNull()
			.references(() => courseMapItemLessonPlan.id, { onDelete: 'cascade' }),
		resourceId: integer('res_id')
			.notNull()
			.references(() => resource.id, { onDelete: 'cascade' }),
	},
	(self) => [
		primaryKey({ columns: [self.courseMapItemLessonPlanId, self.resourceId] }),
		index().on(self.courseMapItemLessonPlanId),
		index().on(self.resourceId),
	],
);

export type CourseMapItemLessonPlanResource =
	typeof courseMapItemLessonPlanResource.$inferSelect;

export const courseMapItemLessonPlanLearningAreaStandard =
	courseMapSchema.table(
		'cm_itm_lp_las',
		{
			courseMapItemLessonPlanId: integer('cm_itm_lp_id')
				.notNull()
				.references(() => courseMapItemLessonPlan.id, { onDelete: 'cascade' }),
			curriculumSubjectLearningAreaStandardId: integer('crclm_sub_la_std_id')
				.notNull()
				.references(() => curriculumSubjectLearningAreaStandard.id, {
					onDelete: 'cascade',
				}),
		},
		(self) => [
			primaryKey({
				columns: [
					self.courseMapItemLessonPlanId,
					self.curriculumSubjectLearningAreaStandardId,
				],
			}),
			index().on(self.courseMapItemLessonPlanId),
			index().on(self.curriculumSubjectLearningAreaStandardId),
		],
	);

export type CourseMapItemLessonPlanLearningAreaStandard =
	typeof courseMapItemLessonPlanLearningAreaStandard.$inferSelect;

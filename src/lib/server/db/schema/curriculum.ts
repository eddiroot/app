import {
	doublePrecision,
	index,
	integer,
	pgSchema,
	text,
	unique,
	varchar,
} from 'drizzle-orm/pg-core';
import { gradeScaleEnum } from '../../../enums';
import { school, schoolYearLevel } from './school';
import { enumToPgEnum, essentials } from './utils';

export const curriculumSchema = pgSchema('curriculum');

export const curriculum = curriculumSchema.table(
	'crclm',
	{
		...essentials,
		name: text().notNull(),
		schoolId: integer().references(() => school.id, { onDelete: 'cascade' }),
		// eddi school will have curriculums from multiple countries and states
		// so we need to define at this level too
		// Optional: if not provided, assume the school's country and state
		countryCode: varchar({ length: 2 }),
		stateCode: varchar({ length: 3 }),
	},
	(self) => [index().on(self.schoolId)],
);

export type Curriculum = typeof curriculum.$inferSelect;

export const curriculumSubject = curriculumSchema.table(
	'crclm_sub',
	{
		...essentials,
		name: text().notNull(),
		curriculumId: integer('crclm_id')
			.notNull()
			.references(() => curriculum.id, { onDelete: 'cascade' }),
	},
	(self) => [index().on(self.curriculumId)],
);

export type CurriculumSubject = typeof curriculumSubject.$inferSelect;

export const curriculumSubjectLearningArea = curriculumSchema.table(
	'crclm_sub_la',
	{
		...essentials,
		curriculumSubjectId: integer('crclm_sub_id')
			.notNull()
			.references(() => curriculumSubject.id, { onDelete: 'cascade' }),
		name: text().notNull(),
	},
	(self) => [index().on(self.curriculumSubjectId)],
);

export type CurriculumSubjectLearningArea =
	typeof curriculumSubjectLearningArea.$inferSelect;

export const curriculumSubjectLearningAreaContent = curriculumSchema.table(
	'crclm_sub_la_cnt',
	{
		...essentials,
		curriculumSubjectLearningAreaId: integer('crclm_sub_la_id')
			.notNull()
			.references(() => curriculumSubjectLearningArea.id, {
				onDelete: 'cascade',
			}),
		description: text().notNull(),
		number: integer().notNull(),
	},
	(self) => [index().on(self.curriculumSubjectLearningAreaId)],
);

export type CurriculumSubjectLearningAreaContent =
	typeof curriculumSubjectLearningAreaContent.$inferSelect;

export const curriculumSubjectLearningAreaTopic = curriculumSchema.table(
	'crclm_sub_la_tpc',
	{
		...essentials,
		curriculumSubjectLearningAreaId: integer('crclm_sub_la_id')
			.notNull()
			.references(() => curriculumSubjectLearningArea.id, {
				onDelete: 'cascade',
			}),
		name: text().notNull(),
	},
	(self) => [
		unique().on(self.curriculumSubjectLearningAreaId, self.name),
		index().on(self.curriculumSubjectLearningAreaId),
	],
);

export type CurriculumSubjectLearningAreaTopic =
	typeof curriculumSubjectLearningAreaTopic.$inferSelect;

export const curriculumSubjectLearningAreaStandard = curriculumSchema.table(
	'crclm_sub_la_std',
	{
		...essentials,
		curriculumSubjectLearningAreaId: integer('crclm_sub_la_id')
			.notNull()
			.references(() => curriculumSubjectLearningArea.id, {
				onDelete: 'cascade',
			}),
		curriculumSubjectLearningAreaTopicId: integer(
			'crclm_sub_la_tpc_id',
		).references(() => curriculumSubjectLearningAreaTopic.id, {
			onDelete: 'cascade',
		}),
		code: varchar({ length: 20 }).notNull(),
		description: text(),
		yearLevel: integer()
			.notNull()
			.references(() => schoolYearLevel.id, { onDelete: 'cascade' }),
	},
	(self) => [
		index().on(self.curriculumSubjectLearningAreaId),
		index().on(self.curriculumSubjectLearningAreaTopicId),
		index().on(self.yearLevel),
	],
);

export type LearningAreaStandard =
	typeof curriculumSubjectLearningAreaStandard.$inferSelect;

export const curriculumSubjectLearningAreaStandardElaboration =
	curriculumSchema.table(
		'crclm_sub_la_std_elab',
		{
			...essentials,
			curriculumSubjectLearningAreaStandardId: integer('crclm_sub_la_std_id')
				.notNull()
				.references(() => curriculumSubjectLearningAreaStandard.id, {
					onDelete: 'cascade',
				}),
			standardElaboration: text().notNull(),
		},
		(self) => [index().on(self.curriculumSubjectLearningAreaStandardId)],
	);

export type CurriculumSubjectLearningAreaStandardElaboration =
	typeof curriculumSubjectLearningAreaStandardElaboration.$inferSelect;

export const curriculumSubjectOutcome = curriculumSchema.table(
	'crclm_sub_out',
	{
		...essentials,
		curriculumSubjectId: integer('crclm_sub_id')
			.notNull()
			.references(() => curriculumSubject.id, { onDelete: 'cascade' }),
		number: integer().notNull(),
		description: text().notNull(),
	},
	(self) => [index().on(self.curriculumSubjectId)],
);

export type CurriculumSubjectOutcome =
	typeof curriculumSubjectOutcome.$inferSelect;

export const curriculumSubjectLearningAreaOutcome = curriculumSchema.table(
	'crclm_sub_la_out',
	{
		curriculumSubjectLearningAreaId: integer('crclm_sub_la_id')
			.notNull()
			.references(() => curriculumSubjectLearningArea.id, {
				onDelete: 'cascade',
			}),
		curriculumSubjectOutcomeId: integer('crclm_sub_out_id')
			.notNull()
			.references(() => curriculumSubjectOutcome.id, { onDelete: 'cascade' }),
	},
	(self) => [
		index().on(self.curriculumSubjectLearningAreaId),
		index().on(self.curriculumSubjectOutcomeId),
	],
);

export type CurriculumSubjectLearningAreaOutcome =
	typeof curriculumSubjectLearningAreaOutcome.$inferSelect;

export const curriculumSubjectKeySkill = curriculumSchema.table(
	'crclm_sub_key_skl',
	{
		...essentials,
		description: text().notNull(),
		curriculumSubjectOutcomeId: integer('crclm_sub_out_id').references(
			() => curriculumSubjectOutcome.id,
			{ onDelete: 'cascade' },
		),
		curriculumSubjectId: integer('crclm_sub_id').references(
			() => curriculumSubject.id,
			{ onDelete: 'cascade' },
		),
		number: integer().notNull(),
		topicName: text(),
	},
	(self) => [
		index().on(self.curriculumSubjectOutcomeId),
		index().on(self.curriculumSubjectId),
	],
);

export type CurriculumSubjectKeySkill =
	typeof curriculumSubjectKeySkill.$inferSelect;

export const curriculumSubjectKeyKnowledge = curriculumSchema.table(
	'crclm_sub_key_know',
	{
		...essentials,
		description: text().notNull(),
		curriculumSubjectOutcomeId: integer('crclm_sub_out_id').references(
			() => curriculumSubjectOutcome.id,
			{ onDelete: 'cascade' },
		),
		topicName: text(),
		curriculumSubjectId: integer('crclm_sub_id').references(
			() => curriculumSubject.id,
			{ onDelete: 'cascade' },
		),
		number: integer().notNull(),
	},
	(self) => [
		index().on(self.curriculumSubjectOutcomeId),
		index().on(self.curriculumSubjectId),
	],
);

export type CurriculumSubjectKeyKnowledge =
	typeof curriculumSubjectKeyKnowledge.$inferSelect;

export const curriculumSubjectExamQuestion = curriculumSchema.table(
	'crclm_sub_exam_q',
	{
		...essentials,
		question: text().notNull(),
		answer: text().notNull(),
		curriculumSubjectId: integer('crclm_sub_id')
			.notNull()
			.references(() => curriculumSubject.id, { onDelete: 'cascade' }),
	},
	(self) => [index().on(self.curriculumSubjectId)],
);

export type CurriculumSubjectExamQuestion =
	typeof curriculumSubjectExamQuestion.$inferSelect;

export const curriculumSubjectLearningActivity = curriculumSchema.table(
	'crclm_sub_lrn_act',
	{
		...essentials,
		content: text().notNull(),
		curriculumSubjectId: integer('crclm_sub_id')
			.notNull()
			.references(() => curriculumSubject.id, { onDelete: 'cascade' }),
	},
	(self) => [index().on(self.curriculumSubjectId)],
);

export type CurriculumSubjectLearningActivity =
	typeof curriculumSubjectLearningActivity.$inferSelect;

export const curriculumSubjectAssessmentTask = curriculumSchema.table(
	'crclm_sub_ass_task',
	{
		...essentials,
		content: text().notNull(),
		curriculumSubjectId: integer('crclm_sub_id')
			.notNull()
			.references(() => curriculumSubject.id, { onDelete: 'cascade' }),
	},
	(self) => [index().on(self.curriculumSubjectId)],
);

export type CurriculumSubjectAssessmentTask =
	typeof curriculumSubjectAssessmentTask.$inferSelect;

export const curriculumSubjectExtraContent = curriculumSchema.table(
	'crclm_sub_extra_cont',
	{
		...essentials,
		curriculumSubjectId: integer('crclm_sub_id')
			.notNull()
			.references(() => curriculumSubject.id, { onDelete: 'cascade' }),
		content: text().notNull(),
	},
	(self) => [index().on(self.curriculumSubjectId)],
);

export type CurriculumSubjectExtraContent =
	typeof curriculumSubjectExtraContent.$inferSelect;

export const gradeScaleEnumPg = curriculumSchema.enum(
	'enum_grade_scale',
	enumToPgEnum(gradeScaleEnum),
);

export const gradeScale = curriculumSchema.table('grade_scale', {
	...essentials,
	name: text().notNull(),
	gradeScaleType: gradeScaleEnumPg().notNull(),
});

export type GradeScale = typeof gradeScale.$inferSelect;

export const gradeScaleLevel = curriculumSchema.table(
	'grade_scale_level',
	{
		...essentials,
		gradeScaleId: integer('grade_scale_id')
			.notNull()
			.references(() => gradeScale.id, { onDelete: 'cascade' }),
		name: text().notNull(),
		color: text().notNull(),
		minimumScore: doublePrecision().notNull(),
		maximumScore: doublePrecision().notNull(),
		gradeValue: doublePrecision(),
	},
	(self) => [index().on(self.gradeScaleId)],
);

export type GradeScaleLevel = typeof gradeScaleLevel.$inferSelect;

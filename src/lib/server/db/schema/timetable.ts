import { SQL, sql } from 'drizzle-orm';
import {
	boolean,
	index,
	integer,
	jsonb,
	pgSchema,
	text,
	unique,
	uuid,
} from 'drizzle-orm/pg-core';
import { constraintTypeEnum, queueStatusEnum } from '../../../enums';
import { school, schoolSemester, schoolSpace, schoolYearLevel } from './school';
import { subjectOffering } from './subject';
import { user } from './user';
import { enumToPgEnum, essentials, standardTime } from './utils';

export const timetableSchema = pgSchema('timetable');

export const timetable = timetableSchema.table(
	'tt',
	{
		...essentials,
		name: text().notNull(),
		year: integer().notNull(),
		schoolId: integer('sch_id')
			.notNull()
			.references(() => school.id, { onDelete: 'cascade' }),
		schoolSemesterId: integer('sch_sem_id').references(
			() => schoolSemester.id,
			{ onDelete: 'set null' },
		),
	},
	(self) => [
		unique().on(self.schoolId, self.name),
		index().on(self.schoolId),
		index().on(self.schoolSemesterId),
	],
);

export type Timetable = typeof timetable.$inferSelect;

export const timetableDraft = timetableSchema.table(
	'tt_draft',
	{
		...essentials,
		name: text().notNull(),
		cycleWeekRepeats: integer('cycle_week_repeats').notNull().default(1),
		timetableId: integer('tt_id')
			.notNull()
			.references(() => timetable.id, { onDelete: 'cascade' }),
	},
	(self) => [index().on(self.timetableId)],
);

export type TimetableDraft = typeof timetableDraft.$inferSelect;

export const timetableQueueStatusEnumPg = timetableSchema.enum(
	'enum_tt_queue_status',
	enumToPgEnum(queueStatusEnum),
);

export const timetableQueue = timetableSchema.table(
	'tt_queue',
	{
		...essentials,
		fileName: text('file_name').notNull(),
		status: timetableQueueStatusEnumPg()
			.notNull()
			.default(queueStatusEnum.queued),
		timetableId: integer('tt_id')
			.notNull()
			.references(() => timetable.id, { onDelete: 'cascade' }),
		timetableDraftId: integer('tt_draft_id')
			.notNull()
			.references(() => timetableDraft.id, { onDelete: 'cascade' }),
		userId: uuid()
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
	},
	(self) => [
		index().on(self.timetableId),
		index().on(self.timetableDraftId),
		index().on(self.userId),
	],
);

export type TimetableQueue = typeof timetableQueue.$inferSelect;

export const timetableDay = timetableSchema.table(
	'tt_day',
	{
		...essentials,
		timetableDraftId: integer('tt_draft_id')
			.notNull()
			.references(() => timetableDraft.id, { onDelete: 'cascade' }),
		day: integer().notNull(), // numbers align with $lib/utils
	},
	(self) => [
		unique().on(self.timetableDraftId, self.day),
		index().on(self.timetableDraftId),
	],
);

export type TimetableDay = typeof timetableDay.$inferSelect;

export const timetablePeriod = timetableSchema.table(
	'tt_period',
	{
		...essentials,
		start: standardTime('start').notNull(),
		end: standardTime('end').notNull(),
		duration: integer('duration').generatedAlwaysAs(
			(): SQL => sql`EXTRACT(EPOCH FROM ("end" - "start")) / 60`,
		),
		timetableDraftId: integer('tt_draft_id')
			.notNull()
			.references(() => timetableDraft.id, { onDelete: 'cascade' }),
	},
	(self) => [
		unique().on(self.timetableDraftId, self.start),
		index().on(self.timetableDraftId),
	],
);

export type TimetablePeriod = typeof timetablePeriod.$inferSelect;

export const timetableGroup = timetableSchema.table(
	'tt_group',
	{
		...essentials,
		name: text('name').notNull(),
		yearLevel: integer()
			.notNull()
			.references(() => schoolYearLevel.id, { onDelete: 'cascade' }),
		timetableDraftId: integer('tt_draft_id')
			.notNull()
			.references(() => timetableDraft.id, { onDelete: 'cascade' }),
	},
	(self) => [
		unique().on(self.timetableDraftId, self.name),
		index().on(self.timetableDraftId),
	],
);

export type TimetableGroup = typeof timetableGroup.$inferSelect;

export const timetableGroupMember = timetableSchema.table(
	'tt_group_member',
	{
		...essentials,
		groupId: integer('tt_group_id')
			.notNull()
			.references(() => timetableGroup.id, { onDelete: 'cascade' }),
		userId: uuid()
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
	},
	(self) => [unique().on(self.groupId, self.userId)],
);

export type TimetableGroupMember = typeof timetableGroupMember.$inferSelect;

export const timetableActivity = timetableSchema.table(
	'tt_activity',
	{
		...essentials,
		periodsPerInstance: integer('periods_per_instance').notNull().default(1),
		totalPeriods: integer('total_periods').notNull(),
		timetableDraftId: integer('tt_draft_id')
			.notNull()
			.references(() => timetableDraft.id, { onDelete: 'cascade' }),
		subjectOfferingId: integer('sub_off_id')
			.notNull()
			.references(() => subjectOffering.id, { onDelete: 'cascade' }),
	},
	(self) => [
		index().on(self.timetableDraftId),
		index().on(self.subjectOfferingId),
	],
);

export type TimetableActivity = typeof timetableActivity.$inferSelect;

export const timetableActivityTeacherPreference = timetableSchema.table(
	'tt_activity_teacher_pref',
	{
		...essentials,
		timetableActivityId: integer('tt_activity_id')
			.references(() => timetableActivity.id, { onDelete: 'cascade' })
			.notNull(),
		teacherId: uuid('teacher_id')
			.references(() => user.id, { onDelete: 'cascade' })
			.notNull(),
	},
);

export type TimetableActivityTeacherPreferences =
	typeof timetableActivityTeacherPreference.$inferSelect;

export const timetableActivityPreferredSpace = timetableSchema.table(
	'tt_activity_preferred_space',
	{
		...essentials,
		timetableActivityId: integer('tt_activity_id')
			.references(() => timetableActivity.id, { onDelete: 'cascade' })
			.notNull(),
		schoolSpaceId: integer('sch_space_id')
			.references(() => schoolSpace.id, { onDelete: 'cascade' })
			.notNull(),
	},
);

export type TimetableActivityPreferredSpaces =
	typeof timetableActivityPreferredSpace.$inferSelect;

export const timetableActivityAssignedStudent = timetableSchema.table(
	'tt_activity_assign_stu',
	{
		...essentials,
		timetableActivityId: integer('tt_activity_id')
			.references(() => timetableActivity.id, { onDelete: 'cascade' })
			.notNull(),
		userId: uuid()
			.references(() => user.id, { onDelete: 'cascade' })
			.notNull(),
	},
);

export type TimetableActivityAssignedStudents =
	typeof timetableActivityAssignedStudent.$inferSelect;

export const timetableActivityAssignedGroup = timetableSchema.table(
	'tt_activity_assign_grp',
	{
		...essentials,
		timetableActivityId: integer('tt_activity_id')
			.references(() => timetableActivity.id, { onDelete: 'cascade' })
			.notNull(),
		timetableGroupId: integer('tt_group_id')
			.references(() => timetableGroup.id, { onDelete: 'cascade' })
			.notNull(),
	},
);

export type TimetableActivityAssignedGroup =
	typeof timetableActivityAssignedGroup.$inferSelect;

export const timetableActivityAssignedYear = timetableSchema.table(
	'tt_activity_assign_yr',
	{
		...essentials,
		timetableActivityId: integer('tt_activity_id')
			.references(() => timetableActivity.id, { onDelete: 'cascade' })
			.notNull(),
		yearlevel: integer()
			.notNull()
			.references(() => schoolYearLevel.id, { onDelete: 'cascade' }),
	},
);

export type TimetableActivityAssignedYear =
	typeof timetableActivityAssignedYear.$inferSelect;

export const timetableDraftConstraint = timetableSchema.table('tt_draft_con', {
	...essentials,
	timetableDraftId: integer('tt_draft_id')
		.notNull()
		.references(() => timetableDraft.id, { onDelete: 'cascade' }),
	constraintId: integer('con_id')
		.notNull() // unique identifier for the constraint
		.references(() => constraint.id, { onDelete: 'cascade' }),
	active: boolean().notNull().default(true),
	// JSON schema to define the structure of parameters for this constraint
	parameters: jsonb().notNull(),
});

export type TimetableDraftConstraint =
	typeof timetableDraftConstraint.$inferSelect;

export const constraintTypeEnumPg = timetableSchema.enum(
	'enum_constraint_type',
	enumToPgEnum(constraintTypeEnum),
);

export const constraint = timetableSchema.table('con', {
	...essentials,
	fetName: text().notNull(),
	friendlyName: text().notNull(),
	description: text().notNull(),
	type: constraintTypeEnumPg().notNull(), // e.g., 'time', 'space'
	optional: boolean().notNull(), // whether this constraint is optional or mandatory
	repeatable: boolean().notNull(), // whether this constraint can be added multiple times
});

export type Constraint = typeof constraint.$inferSelect;

export const fetSubjectOfferingClass = timetableSchema.table(
	'fet_sub_off_cls',
	{
		...essentials,
		timetableDraftId: integer('tt_draft_id')
			.notNull()
			.references(() => timetableDraft.id, { onDelete: 'cascade' }),
		subjectOfferingId: integer('sub_off_id')
			.notNull()
			.references(() => subjectOffering.id, { onDelete: 'cascade' }),
	},
);

export type FetSubjectOfferingClass =
	typeof fetSubjectOfferingClass.$inferSelect;

export const fetSubjectClassAllocation = timetableSchema.table(
	'fet_sub_off_cls_allo',
	{
		...essentials,
		fetSubjectOfferingClassId: integer('fet_sub_off_cls_id')
			.notNull()
			.references(() => fetSubjectOfferingClass.id, { onDelete: 'cascade' }),
		schoolSpaceId: integer('sch_space_id')
			.notNull()
			.references(() => schoolSpace.id, { onDelete: 'set null' }),
		dayId: integer()
			.notNull()
			.references(() => timetableDay.id, { onDelete: 'set null' }),
		startPeriodId: integer('start_period_id')
			.notNull()
			.references(() => timetablePeriod.id, { onDelete: 'set null' }),
		endPeriodId: integer('end_period_id')
			.notNull()
			.references(() => timetablePeriod.id, { onDelete: 'set null' }),
	},
	(self) => [
		index().on(self.fetSubjectOfferingClassId),
		index().on(self.schoolSpaceId),
	],
);

export type FetSubjectClassAllocation =
	typeof fetSubjectClassAllocation.$inferSelect;

export const fetSubjectOfferingClassUser = timetableSchema.table(
	'fet_sub_off_cls_user',
	{
		...essentials,
		userId: uuid()
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		fetSubOffClassId: integer('fet_sub_off_class_id')
			.notNull()
			.references(() => fetSubjectOfferingClass.id, { onDelete: 'cascade' }),
	},
	(self) => [unique().on(self.userId, self.fetSubOffClassId)],
);

export type FetUserSubjectOfferingClass =
	typeof fetSubjectOfferingClassUser.$inferSelect;

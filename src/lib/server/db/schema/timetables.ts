import { SQL, sql } from 'drizzle-orm';
import {
	boolean,
	foreignKey,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	time,
	unique,
	uuid
} from 'drizzle-orm/pg-core';
import { constraintTypeEnum, queueStatusEnum } from '../../../enums';
import { yearLevelEnumPg } from './curriculum';
import { school, schoolSemester, schoolSpace } from './schools';
import { subjectOffering } from './subjects';
import { user } from './user';
import { timestamps } from './utils';

export const timetable = pgTable(
	'tt',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		schoolId: integer('sch_id')
			.notNull()
			.references(() => school.id, { onDelete: 'cascade' }),
		schoolYear: integer('sch_year').notNull(),
		schoolSemesterId: integer('sch_semester_id').references(() => schoolSemester.id, {
			onDelete: 'set null'
		}),
		name: text('name').notNull(),
		isArchived: boolean('is_archived').notNull().default(false),
		...timestamps
	},
	(self) => [unique().on(self.schoolId, self.name)]
);

export type Timetable = typeof timetable.$inferSelect;

export const timetableDraft = pgTable('tt_draft', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	name: text('name').notNull(),
	timetableId: integer('tt_id')
		.notNull()
		.references(() => timetable.id, { onDelete: 'cascade' }),
	cycleWeekRepeats: integer('cycle_week_repeats').notNull().default(1),
	fetResponse: text('fet_response'),
	errorMessage: text('error_message'), // null if successful, stores raw error
	translatedErrorMessage: text('translated_error_message'), // null if successful or not yet translated
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type TimetableDraft = typeof timetableDraft.$inferSelect;

export const timetableQueueStatusEnumPg = pgEnum('enum_tt_queue_status', [
	queueStatusEnum.queued,
	queueStatusEnum.inProgress,
	queueStatusEnum.completed,
	queueStatusEnum.failed
]);

export const timetableQueue = pgTable('tt_queue', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	timetableId: integer('tt_id')
		.notNull()
		.references(() => timetable.id, { onDelete: 'cascade' }),
	timetableDraftId: integer('tt_draft_id')
		.notNull()
		.references(() => timetableDraft.id, { onDelete: 'cascade' }),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	fileName: text('file_name').notNull(),
	status: timetableQueueStatusEnumPg().notNull().default(queueStatusEnum.queued),
	...timestamps
});

export type TimetableQueue = typeof timetableQueue.$inferSelect;

export const timetableDay = pgTable('tt_day', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	timetableDraftId: integer('tt_draft_id')
		.notNull()
		.references(() => timetableDraft.id, { onDelete: 'cascade' }),
	day: integer('day').notNull(), // numbers align with $lib/utils
	...timestamps
});

export type TimetableDay = typeof timetableDay.$inferSelect;

export const timetablePeriod = pgTable(
	'tt_period',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		timetableDraftId: integer('tt_draft_id')
			.notNull()
			.references(() => timetableDraft.id, { onDelete: 'cascade' }),
		startTime: time('start_time').notNull(),
		endTime: time('end_time').notNull(),
		duration: integer('duration').generatedAlwaysAs(
			(): SQL => sql`EXTRACT(EPOCH FROM (end_time - start_time)) / 60`
		),
		nextPeriodId: integer('next_period_id'),
		...timestamps
	},
	(table) => ({
		nextPeriodFk: foreignKey({
			columns: [table.nextPeriodId],
			foreignColumns: [table.id],
			name: 'tt_period_next_period_fk'
		}).onDelete('set null')
	})
);

export type TimetablePeriod = typeof timetablePeriod.$inferSelect;

export const timetableGroup = pgTable('tt_group', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	timetableDraftId: integer('tt_draft_id')
		.notNull()
		.references(() => timetableDraft.id, { onDelete: 'cascade' }),
	yearLevel: yearLevelEnumPg().notNull(),
	name: text('name').notNull(),
	...timestamps
});

export type TimetableGroup = typeof timetableGroup.$inferSelect;

export const timetableGroupMember = pgTable(
	'tt_group_member',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		groupId: integer('tt_group_id')
			.notNull()
			.references(() => timetableGroup.id, { onDelete: 'cascade' }),
		userId: uuid('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		...timestamps
	},
	(self) => [unique().on(self.groupId, self.userId)]
);

export type TimetableGroupMember = typeof timetableGroupMember.$inferSelect;

export const timetableActivity = pgTable('tt_activity', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	timetableDraftId: integer('tt_draft_id')
		.notNull()
		.references(() => timetableDraft.id, { onDelete: 'cascade' }),
	subjectOfferingId: integer('sub_off_id')
		.notNull()
		.references(() => subjectOffering.id, { onDelete: 'cascade' }),
	periodsPerInstance: integer('periods_per_instance').notNull().default(1),
	totalPeriods: integer('total_periods').notNull(),
	...timestamps
});

export type TimetableActivity = typeof timetableActivity.$inferSelect;

export const timetableActivityTeacherPreference = pgTable(
	'tt_activity_teacher_pref',
	{
		timetableActivityId: integer('tt_activity_id')
			.references(() => timetableActivity.id, { onDelete: 'cascade' })
			.notNull(),
		teacherId: uuid('teacher_id')
			.references(() => user.id, { onDelete: 'cascade' })
			.notNull(),
		...timestamps
	},
	(table) => {
		return {
			pk: primaryKey({
				name: 'tt_activity_teacher_pref_pkey',
				columns: [table.timetableActivityId, table.teacherId]
			})
		};
	}
);

export type TimetableActivityTeacherPreferences =
	typeof timetableActivityTeacherPreference.$inferSelect;

export const timetableActivityPreferredSpace = pgTable(
	'tt_activity_preferred_space',
	{
		timetableActivityId: integer('tt_activity_id')
			.references(() => timetableActivity.id, { onDelete: 'cascade' })
			.notNull(),
		schoolSpaceId: integer('sch_space_id')
			.references(() => schoolSpace.id, { onDelete: 'cascade' })
			.notNull(),
		...timestamps
	},
	(table) => {
		return {
			pk: primaryKey({
				name: 'tt_activity_preferred_space_pkey',
				columns: [table.timetableActivityId, table.schoolSpaceId]
			})
		};
	}
);

export type TimetableActivityPreferredSpaces = typeof timetableActivityPreferredSpace.$inferSelect;

export const timetableActivityAssignedStudent = pgTable(
	'tt_activity_assign_stu',
	{
		timetableActivityId: integer('tt_activity_id')
			.references(() => timetableActivity.id, { onDelete: 'cascade' })
			.notNull(),
		userId: uuid('user_id')
			.references(() => user.id, { onDelete: 'cascade' })
			.notNull(),
		...timestamps
	},
	(table) => {
		return {
			pk: primaryKey({
				name: 'tt_activity_assign_stu_pkey',
				columns: [table.timetableActivityId, table.userId]
			})
		};
	}
);

export type TimetableActivityAssignedStudents =
	typeof timetableActivityAssignedStudent.$inferSelect;

export const timetableActivityAssignedGroup = pgTable(
	'tt_activity_assign_grp',
	{
		timetableActivityId: integer('tt_activity_id')
			.references(() => timetableActivity.id, { onDelete: 'cascade' })
			.notNull(),
		timetableGroupId: integer('tt_group_id')
			.references(() => timetableGroup.id, { onDelete: 'cascade' })
			.notNull(),
		...timestamps
	},
	(table) => {
		return {
			pk: primaryKey({
				name: 'tt_activity_assign_grp_pkey',
				columns: [table.timetableActivityId, table.timetableGroupId]
			})
		};
	}
);

export type TimetableActivityAssignedGroup = typeof timetableActivityAssignedGroup.$inferSelect;

export const timetableActivityAssignedYear = pgTable(
	'tt_activity_assign_yr',
	{
		timetableActivityId: integer('tt_activity_id')
			.references(() => timetableActivity.id, { onDelete: 'cascade' })
			.notNull(),
		yearlevel: yearLevelEnumPg().notNull(),
		...timestamps
	},
	(table) => {
		return {
			pk: primaryKey({
				name: 'tt_activity_assign_yr_pkey',
				columns: [table.timetableActivityId, table.yearlevel]
			})
		};
	}
);

export type TimetableActivityAssignedYear = typeof timetableActivityAssignedYear.$inferSelect;

export const timetableDraftConstraint = pgTable('tt_draft_con', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	timetableDraftId: integer('tt_draft_id')
		.notNull()
		.references(() => timetableDraft.id, { onDelete: 'cascade' }),
	constraintId: integer('con_id')
		.notNull() // unique identifier for the constraint
		.references(() => constraint.id, { onDelete: 'cascade' }),
	active: boolean('active').notNull().default(true),
	// JSON schema to define the structure of parameters for this constraint
	parameters: jsonb('parameters').notNull(),
	...timestamps
});

export type TimetableDraftConstraint = typeof timetableDraftConstraint.$inferSelect;

export const constraintTypeEnumPg = pgEnum('enum_constraint_type', [
	constraintTypeEnum.time,
	constraintTypeEnum.space
]);

export const constraint = pgTable('con', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }), // unique identifier for the constraint
	FETName: text('fet_name').notNull(),
	friendlyName: text('friendly_name').notNull(),
	description: text('description').notNull(),
	type: constraintTypeEnumPg().notNull(), // e.g., 'time', 'space'
	optional: boolean('optional').notNull(), // whether this constraint is optional or mandatory
	repeatable: boolean('repeatable').notNull(), // whether this constraint can be added multiple times
	...timestamps
});

export type Constraint = typeof constraint.$inferSelect;

export const fetSubjectOfferingClass = pgTable('fet_sub_off_cls', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	timetableDraftId: integer('tt_draft_id')
		.notNull()
		.references(() => timetableDraft.id, { onDelete: 'cascade' }),
	subjectOfferingId: integer('sub_off_id')
		.notNull()
		.references(() => subjectOffering.id, { onDelete: 'cascade' }),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type FetSubjectOfferingClass = typeof fetSubjectOfferingClass.$inferSelect;

export const fetSubjectClassAllocation = pgTable('fet_sub_off_cls_allo', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	fetSubjectOfferingClassId: integer('fet_sub_off_cls_id')
		.notNull()
		.references(() => fetSubjectOfferingClass.id, { onDelete: 'cascade' }),
	schoolSpaceId: integer('sch_space_id')
		.notNull()
		.references(() => schoolSpace.id, { onDelete: 'set null' }),
	dayId: integer('day_id')
		.notNull()
		.references(() => timetableDay.id, { onDelete: 'set null' }),
	startPeriodId: integer('start_period_id')
		.notNull()
		.references(() => timetablePeriod.id, { onDelete: 'set null' }),
	endPeriodId: integer('end_period_id')
		.notNull()
		.references(() => timetablePeriod.id, { onDelete: 'set null' }),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type FetSubjectClassAllocation = typeof fetSubjectClassAllocation.$inferSelect;

export const fetSubjectOfferingClassUser = pgTable(
	'fet_sub_off_cls_user',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		userId: uuid('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		fetSubOffClassId: integer('fet_sub_off_class_id')
			.notNull()
			.references(() => fetSubjectOfferingClass.id, { onDelete: 'cascade' }),
		isArchived: boolean('is_archived').notNull().default(false),
		...timestamps
	},
	(self) => [unique().on(self.userId, self.fetSubOffClassId)]
);

export type FetUserSubjectOfferingClass = typeof fetSubjectOfferingClassUser.$inferSelect;

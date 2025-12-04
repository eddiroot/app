import {
	boolean,
	check,
	foreignKey,
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
	unique,
	uuid,
	type AnyPgColumn
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm/sql';
import {
	subjectClassAllocationAttendanceStatus,
	subjectThreadResponseTypeEnum,
	subjectThreadTypeEnum
} from '../../../enums';
import { courseMapItem } from './coursemap';
import { curriculumSubject, yearLevelEnumPg } from './curriculum';
import { resource } from './resource';
import { campus, school, schoolSpace } from './schools';
import { user } from './user';
import { timestamps } from './utils';

export const coreSubject = pgTable('sub_core', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	name: text('name').notNull(),
	description: text('description'),
	curriculumSubjectId: integer('cur_sub_id')
		.notNull()
		.references(() => curriculumSubject.id, { onDelete: 'cascade' }),
	schoolId: integer('sch_id')
		.notNull()
		.references(() => school.id, { onDelete: 'cascade' }),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type CoreSubject = typeof coreSubject.$inferSelect;

export const electiveSubject = pgTable('sub_elec', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	name: text('name').notNull(),
	description: text('description'),
	schoolId: integer('sch_id')
		.notNull()
		.references(() => school.id, { onDelete: 'cascade' }),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export const subject = pgTable(
	'sub',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		name: text('name').notNull(),
		schoolId: integer('sch_id')
			.notNull()
			.references(() => school.id, { onDelete: 'cascade' }),
		coreSubjectId: integer('sub_core_id').references(() => coreSubject.id, {
			onDelete: 'set null'
		}),
		electiveSubjectId: integer('sub_elec_id').references(() => electiveSubject.id, {
			onDelete: 'set null'
		}),
		yearLevel: yearLevelEnumPg().notNull(),
		isArchived: boolean('is_archived').notNull().default(false),
		...timestamps
	},
	(subject) => [
		unique().on(subject.schoolId, subject.name),
		check(
			'either_core_or_elective',
			sql`(sub_core_id IS NOT NULL AND sub_elec_id IS NULL) OR (sub_core_id IS NULL AND sub_elec_id IS NOT NULL)`
		)
	]
);

export type Subject = typeof subject.$inferSelect;

export const subjectOffering = pgTable('sub_off', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	subjectId: integer('sub_id')
		.notNull()
		.references(() => subject.id, { onDelete: 'cascade' }),
	year: integer('year').notNull(),
	semester: integer('semester').notNull(),
	campusId: integer('campus_id')
		.notNull()
		.references(() => campus.id, { onDelete: 'cascade' }),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type SubjectOffering = typeof subjectOffering.$inferSelect;

export const subjectOfferingClass = pgTable(
	'sub_off_cls',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		name: text('name').notNull(),
		subOfferingId: integer('sub_off_id')
			.notNull()
			.references(() => subjectOffering.id, { onDelete: 'cascade' }),
		isArchived: boolean('is_archived').notNull().default(false),
		...timestamps
	},
	(self) => [unique().on(self.subOfferingId, self.name)]
);

export type SubjectOfferingClass = typeof subjectOfferingClass.$inferSelect;

export const subjectClassAllocation = pgTable('sub_off_cls_allo', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	subjectOfferingClassId: integer('sub_off_cls_id')
		.notNull()
		.references(() => subjectOfferingClass.id, { onDelete: 'cascade' }),
	schoolSpaceId: integer('sch_spa_id')
		.notNull()
		.references(() => schoolSpace.id, { onDelete: 'set null' }),
	startTimestamp: timestamp('start_ts').notNull(),
	endTimestamp: timestamp('end_ts').notNull(),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type SubjectClassAllocation = typeof subjectClassAllocation.$inferSelect;

export const subjectClassAllocationAttendanceStatusEnumPg = pgEnum('enum_sub_cls_allo_att_stat', [
	subjectClassAllocationAttendanceStatus.present,
	subjectClassAllocationAttendanceStatus.absent
]);

export const subjectClassAllocationAttendance = pgTable(
	'sub_off_cls_allo_att',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		subjectClassAllocationId: integer('sub_class_allo_id')
			.notNull()
			.references(() => subjectClassAllocation.id, { onDelete: 'cascade' }),
		userId: uuid('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		status: subjectClassAllocationAttendanceStatusEnumPg().notNull(),
		noteGuardian: text('note_guardian'),
		noteTeacher: text('note_teacher'),
		isArchived: boolean('is_archived').notNull().default(false),
		...timestamps
	},
	(self) => [unique().on(self.subjectClassAllocationId, self.userId)]
);

export type SubjectClassAllocationAttendance = typeof subjectClassAllocationAttendance.$inferSelect;

export const behaviourQuickAction = pgTable(
	'behaviour_quick_action',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		schoolId: integer('sch_id')
			.notNull()
			.references(() => school.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		description: text('description'),
		isArchived: boolean('is_archived').notNull().default(false),
		...timestamps
	},
	(self) => [unique().on(self.schoolId, self.name)]
);

export type BehaviourQuickAction = typeof behaviourQuickAction.$inferSelect;

export const attendanceBehaviourQuickAction = pgTable(
	'att_behaviour_quick_action',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		attendanceId: integer('att_id')
			.notNull()
			.references(() => subjectClassAllocationAttendance.id, { onDelete: 'cascade' }),
		behaviourQuickActionId: integer('behaviour_quick_action_id')
			.notNull()
			.references(() => behaviourQuickAction.id, { onDelete: 'cascade' }),
		...timestamps
	},
	(self) => [unique().on(self.attendanceId, self.behaviourQuickActionId)]
);

export type AttendanceBehaviourQuickAction = typeof attendanceBehaviourQuickAction.$inferSelect;

export const subjectThreadTypeEnumPg = pgEnum('enum_sub_thread_type', [
	subjectThreadTypeEnum.discussion,
	subjectThreadTypeEnum.question,
	subjectThreadTypeEnum.announcement,
	subjectThreadTypeEnum.qanda
]);

export const subjectThread = pgTable('sub_thread', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	type: subjectThreadTypeEnumPg().notNull(),
	subjectOfferingId: integer('sub_off_id')
		.notNull()
		.references(() => subjectOffering.id, { onDelete: 'cascade' }),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	title: text('title').notNull(),
	content: text('content').notNull(),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type SubjectThread = typeof subjectThread.$inferSelect;

export const subjectThreadResponseTypeEnumPg = pgEnum('enum_sub_thread_res_type', [
	subjectThreadResponseTypeEnum.comment,
	subjectThreadResponseTypeEnum.answer
]);

export const subjectThreadResponse = pgTable(
	'sub_thread_resp',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		type: subjectThreadResponseTypeEnumPg().notNull(),
		subjectThreadId: integer('sub_thread_id')
			.notNull()
			.references(() => subjectThread.id, { onDelete: 'cascade' }),
		userId: uuid('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		content: text('content').notNull(),
		parentResponseId: integer('parent_id').references((): AnyPgColumn => subjectThreadResponse.id),
		isArchived: boolean('is_archived').notNull().default(false),
		...timestamps
	},
	(self) => [
		foreignKey({
			columns: [self.parentResponseId],
			foreignColumns: [self.id]
		}).onDelete('cascade')
	]
);

export type SubjectThreadResponse = typeof subjectThreadResponse.$inferSelect;

export const subjectOfferingClassResource = pgTable('sub_off_cls_res', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	title: text('title'),
	description: text('description'),
	subjectOfferingClassId: integer('sub_off_cls_id')
		.notNull()
		.references(() => subjectOfferingClass.id, { onDelete: 'cascade' }),
	resourceId: integer('res_id')
		.notNull()
		.references(() => resource.id, { onDelete: 'cascade' }),
	coursemapItemId: integer('cm_item_id').references(() => courseMapItem.id, {
		onDelete: 'cascade'
	}),
	authorId: uuid('author_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type SubjectOfferingClassResource = typeof subjectOfferingClassResource.$inferSelect;

export const subjectSelectionConstraint = pgTable('sub_sel_constraint', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	schoolId: integer('school_id')
		.notNull()
		.references(() => school.id, { onDelete: 'cascade' }),
	yearLevel: yearLevelEnumPg().notNull(),
	year: integer('year').notNull(),
	name: text('name').notNull(), // e.g., "Language requirement", "Science elective"
	description: text('description'),
	min: integer('min').notNull().default(0),
	max: integer('max'),
	...timestamps
});

export type SubjectSelectionConstraint = typeof subjectSelectionConstraint.$inferSelect;

export const subjectSelectionConstraintSubject = pgTable('constraint_subject', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	constraintId: integer('constraint_id')
		.notNull()
		.references(() => subjectSelectionConstraint.id, { onDelete: 'cascade' }),
	subjectId: integer('subject_id')
		.notNull()
		.references(() => subject.id, { onDelete: 'cascade' }),
	// Optional: add a tag field for grouping on-the-fly
	//tag: text('tag'), // e.g., "language", "science", null
	...timestamps
});

export type SubjectSelectionConstraintSubject =
	typeof subjectSelectionConstraintSubject.$inferSelect;

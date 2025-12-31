import { sql } from 'drizzle-orm';
import { check } from 'drizzle-orm/gel-core';
import {
	boolean,
	date,
	foreignKey,
	index,
	integer,
	pgSchema,
	text,
	time,
	unique,
	uuid,
	type AnyPgColumn
} from 'drizzle-orm/pg-core';
import {
	subjectClassAllocationAttendanceComponentType,
	subjectClassAllocationAttendanceStatus,
	subjectGroupEnum,
	subjectThreadResponseTypeEnum,
	subjectThreadTypeEnum
} from '../../../enums';
import { courseMapItem } from './coursemap';
import { curriculumSubject, gradeScale } from './curriculum';
import { resource } from './resource';
import { campus, school, schoolSpace, yearLevel } from './schools';
import { timetableDraft } from './timetables';
import { user } from './user';
import { embeddings, flags, timestamps, yearLevelEnumPg } from './utils';

export const subjectSchema = pgSchema('subject');

export const subjectGroupEnumPg = subjectSchema.enum('enum_sub_group', [
	subjectGroupEnum.english,
	subjectGroupEnum.mathematics,
	subjectGroupEnum.science
]);

export const coreSubject = subjectSchema.table('sub_core', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	name: text('name').notNull(),
	description: text('description'),
	schoolId: integer('sch_id')
		.notNull()
		.references(() => school.id, { onDelete: 'cascade' }),
	subjectGroup: subjectGroupEnumPg().notNull(),
	...flags,
	...timestamps
});

export type CoreSubject = typeof coreSubject.$inferSelect;

export const subject = subjectSchema.table('sub', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	name: text('name').notNull(),
	schoolId: integer('sch_id')
		.notNull()
		.references(() => school.id, { onDelete: 'cascade' }),
	coreSubjectId: integer('core_sub_id').references(() => coreSubject.id, { onDelete: 'cascade' }), // If its part of a multi-year subject
	yearLevelId: integer('yr_lvl_id')
		.notNull()
		.references(() => yearLevel.id, { onDelete: 'cascade' }),
	description: text('description'),
	...flags,
	...timestamps
});

export type Subject = typeof subject.$inferSelect;

export const subjectOffering = subjectSchema.table('sub_off', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	subjectId: integer('sub_id')
		.notNull()
		.references(() => subject.id, { onDelete: 'cascade' }),
	year: integer('year').notNull(),
	semester: integer('semester').notNull(),
	campusId: integer('campus_id')
		.notNull()
		.references(() => campus.id, { onDelete: 'cascade' }),
	curriculumSubjectId: integer('cur_sub_id').references(() => curriculumSubject.id, {onDelete: 'set null'}),
	gradeScaleId: integer('grade_scale_id').references(() => gradeScale.id, { onDelete: 'set null' }),
	...flags,
	...timestamps
});

export type SubjectOffering = typeof subjectOffering.$inferSelect;

export const subjectOfferingClass = subjectSchema.table(
	'sub_off_cls',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		name: text('name').notNull(),
		timetableDraftId: integer('tt_draft_id').references(() => timetableDraft.id, {
			onDelete: 'cascade'
		}),
		subOfferingId: integer('sub_off_id')
			.notNull()
			.references(() => subjectOffering.id, { onDelete: 'cascade' }),
		...flags,
		...timestamps
	},
	(self) => [unique().on(self.subOfferingId, self.name)]
);

export type SubjectOfferingClass = typeof subjectOfferingClass.$inferSelect;

export const subjectClassAllocation = subjectSchema.table('sub_off_cls_allo', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	subjectOfferingClassId: integer('sub_off_cls_id')
		.notNull()
		.references(() => subjectOfferingClass.id, { onDelete: 'cascade' }),
	schoolSpaceId: integer('sch_spa_id')
		.notNull()
		.references(() => schoolSpace.id, { onDelete: 'set null' }),
	date: date('date').notNull(),
	startTime: time('start_time').notNull(),
	endTime: time('end_time').notNull(),
	...flags,
	...timestamps
});

export type SubjectClassAllocation = typeof subjectClassAllocation.$inferSelect;

export const subjectClassAllocationAttendanceStatusEnumPg = subjectSchema.enum(
	'enum_sub_cls_allo_att_stat',
	[subjectClassAllocationAttendanceStatus.present, subjectClassAllocationAttendanceStatus.absent]
);

export const subjectClassAllocationAttendance = subjectSchema.table(
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
		...flags,
		...timestamps
	},
	(self) => [unique().on(self.subjectClassAllocationId, self.userId)]
);

export type SubjectClassAllocationAttendance = typeof subjectClassAllocationAttendance.$inferSelect;

export const subjectClassAllocationAttendanceComponentTypeEnumPg = subjectSchema.enum(
	'sub_off_cls_allo_att_comp_type',
	[
		subjectClassAllocationAttendanceComponentType.present,
		subjectClassAllocationAttendanceComponentType.absent,
		subjectClassAllocationAttendanceComponentType.classPass
	]
);

export const subjectClassAllocationAttendanceComponent = subjectSchema.table(
	'sub_off_cls_allo_att_comp',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		attendanceId: integer('att_id')
			.notNull()
			.references(() => subjectClassAllocationAttendance.id, { onDelete: 'cascade' }),
		type: subjectClassAllocationAttendanceComponentTypeEnumPg().notNull(),
		startTime: time('start_time').notNull(),
		endTime: time('end_time').notNull(),
		...timestamps
	},
	(self) => [check('valid_time_range', sql`${self.endTime} > ${self.startTime}`)]
);

export type SubjectClassAllocationAttendanceComponent =
	typeof subjectClassAllocationAttendanceComponent.$inferSelect;

export const behaviourQuickAction = subjectSchema.table(
	'behaviour_quick_action',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		schoolId: integer('sch_id')
			.notNull()
			.references(() => school.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		description: text('description'),
		...flags,
		...timestamps
	},
	(self) => [unique().on(self.schoolId, self.name)]
);

export type BehaviourQuickAction = typeof behaviourQuickAction.$inferSelect;

export const attendanceBehaviourQuickAction = subjectSchema.table(
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

export const subjectThreadTypeEnumPg = subjectSchema.enum('enum_sub_thread_type', [
	subjectThreadTypeEnum.discussion,
	subjectThreadTypeEnum.question,
	subjectThreadTypeEnum.announcement,
	subjectThreadTypeEnum.qanda
]);

export const subjectThread = subjectSchema.table(
	'sub_thread',
	{
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
		isAnonymous: boolean('is_anonymous').notNull(),
		...flags,
		...timestamps,
		...embeddings
	},
	(self) => [
		index('sub_thread_embedding_idx').using('hnsw', self.embedding.op('vector_cosine_ops')),
		index('sub_thread_metadata_idx').using('gin', self.embeddingMetadata)
	]
);

export type SubjectThread = typeof subjectThread.$inferSelect;

export const subjectThreadResponseTypeEnumPg = subjectSchema.enum('enum_sub_thread_res_type', [
	subjectThreadResponseTypeEnum.comment,
	subjectThreadResponseTypeEnum.answer
]);

export const subjectThreadResponse = subjectSchema.table(
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
		isAnonymous: boolean('is_anonymous').notNull().default(false),
		...flags,
		...timestamps,
		...embeddings
	},
	(self) => [
		foreignKey({
			columns: [self.parentResponseId],
			foreignColumns: [self.id]
		}).onDelete('cascade'),
		index('sub_thread_resp_embedding_idx').using('hnsw', self.embedding.op('vector_cosine_ops')),
		index('sub_thread_resp_metadata_idx').using('gin', self.embeddingMetadata)
	]
);

export type SubjectThreadResponse = typeof subjectThreadResponse.$inferSelect;

export const subjectThreadLike = subjectSchema.table(
	'sub_thread_like',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		subjectThreadId: integer('sub_thread_id')
			.notNull()
			.references(() => subjectThread.id, { onDelete: 'cascade' }),
		userId: uuid('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		...timestamps
	},
	(self) => [unique().on(self.subjectThreadId, self.userId)]
);

export type SubjectThreadLike = typeof subjectThreadLike.$inferSelect;

export const subjectThreadResponseLike = subjectSchema.table(
	'sub_thread_resp_like',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		subjectThreadResponseId: integer('sub_thread_resp_id')
			.notNull()
			.references(() => subjectThreadResponse.id, { onDelete: 'cascade' }),
		userId: uuid('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		...timestamps
	},
	(self) => [unique().on(self.subjectThreadResponseId, self.userId)]
);

export type SubjectThreadResponseLike = typeof subjectThreadResponseLike.$inferSelect;

export const subjectOfferingClassResource = subjectSchema.table('sub_off_cls_res', {
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
	...flags,
	...timestamps
});

export type SubjectOfferingClassResource = typeof subjectOfferingClassResource.$inferSelect;

export const subjectSelectionConstraint = subjectSchema.table('sub_sel_constraint', {
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

export const subjectSelectionConstraintSubject = subjectSchema.table('constraint_subject', {
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

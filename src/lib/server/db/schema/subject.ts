import { sql } from 'drizzle-orm'
import { check } from 'drizzle-orm/gel-core'
import {
	boolean,
	index,
	integer,
	pgSchema,
	primaryKey,
	text,
	unique,
	uuid,
	type AnyPgColumn,
} from 'drizzle-orm/pg-core'
import {
	subjectClassAllocationAttendanceComponentType,
	subjectClassAllocationAttendanceStatus,
	subjectThreadResponseTypeEnum,
	subjectThreadTypeEnum,
} from '../../../enums'
import { curriculumItem } from './curriculum'
import { resource } from './resource'
import {
	gradeScale,
	school,
	schoolBehaviour,
	schoolCampus,
	schoolSpace,
	schoolYearLevel,
} from './school'
import { timetableDraft } from './timetable'
import { user } from './user'
import { enumToPgEnum, essentials, standardTimestamp } from './utils'

export const subjectSchema = pgSchema('subject')

// e.g. Mathematicss, Science, History
export const subjectGroup = subjectSchema.table(
	'sub_grp',
	{
		...essentials,
		name: text().notNull(),
		description: text(),
		schoolId: integer('sch_id')
			.notNull()
			.references(() => school.id, { onDelete: 'cascade' }),
	},
	(self) => [index().on(self.schoolId)],
)

export type SubjectGroup = typeof subjectGroup.$inferSelect

// e.g. Year 9 Maths, Year 10 Science
export const subject = subjectSchema.table(
	'sub',
	{
		...essentials,
		name: text().notNull(),
		schoolId: integer('sch_id')
			.notNull()
			.references(() => school.id, { onDelete: 'cascade' }),
		subjectGroupId: integer('sub_grp_id').references(() => subjectGroup.id, {
			onDelete: 'cascade',
		}),
		schoolYearLevelId: integer('sch_yl_id')
			.notNull()
			.references(() => schoolYearLevel.id, { onDelete: 'cascade' }),
		description: text(),
	},
	(self) => [
		index().on(self.schoolId),
		index().on(self.subjectGroupId),
		index().on(self.schoolYearLevelId),
	],
)

export type Subject = typeof subject.$inferSelect

// e.g. Year 9 Maths 2025, Year 10 Science 2026
export const subjectOffering = subjectSchema.table(
	'sub_off',
	{
		...essentials,
		subjectId: integer('sub_id')
			.notNull()
			.references(() => subject.id, { onDelete: 'cascade' }),
		year: integer().notNull(),
		schoolCampusId: integer('sch_cmps_id')
			.notNull()
			.references(() => schoolCampus.id, { onDelete: 'cascade' }),
		gradeScaleId: integer('grade_scale_id').references(() => gradeScale.id, {
			onDelete: 'set null',
		}),
	},
	(self) => [
		index().on(self.subjectId),
		index().on(self.schoolCampusId),
		index().on(self.gradeScaleId),
	],
)

export type SubjectOffering = typeof subjectOffering.$inferSelect

export const subjectOfferingClass = subjectSchema.table(
	'sub_off_cls',
	{
		...essentials,
		name: text().notNull(),
		// Which timetable it originated from (if any)
		timetableDraftId: integer('tt_draft_id').references(
			() => timetableDraft.id,
			{ onDelete: 'cascade' },
		),
		subOfferingId: integer('sub_off_id')
			.notNull()
			.references(() => subjectOffering.id, { onDelete: 'cascade' }),
	},
	(self) => [
		unique().on(self.subOfferingId, self.name),
		index().on(self.timetableDraftId),
		index().on(self.subOfferingId),
	],
)

export type SubjectOfferingClass = typeof subjectOfferingClass.$inferSelect

export const subjectClassAllocation = subjectSchema.table(
	'sub_off_cls_allo',
	{
		...essentials,
		subjectOfferingClassId: integer('sub_off_cls_id')
			.notNull()
			.references(() => subjectOfferingClass.id, { onDelete: 'cascade' }),
		schoolSpaceId: integer('sch_spa_id')
			.notNull()
			.references(() => schoolSpace.id, { onDelete: 'set null' }),
		start: standardTimestamp('start').notNull(),
		end: standardTimestamp('end').notNull(),
	},
	(self) => [
		check('valid_time_range', sql`${self.end} > ${self.start}`),
		index().on(self.subjectOfferingClassId),
		index().on(self.schoolSpaceId),
	],
)

export type SubjectClassAllocation = typeof subjectClassAllocation.$inferSelect

export const subjectClassAllocationAttendanceStatusEnumPg = subjectSchema.enum(
	'enum_sub_cls_allo_att_stat',
	enumToPgEnum(subjectClassAllocationAttendanceStatus),
)

export const subjectClassAllocationAttendance = subjectSchema.table(
	'sub_off_cls_allo_att',
	{
		...essentials,
		subjectClassAllocationId: integer('sub_class_allo_id')
			.notNull()
			.references(() => subjectClassAllocation.id, { onDelete: 'cascade' }),
		userId: uuid()
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		status: subjectClassAllocationAttendanceStatusEnumPg().notNull(),
		noteGuardian: text(),
		noteTeacher: text(),
	},
	(self) => [
		unique().on(self.subjectClassAllocationId, self.userId),
		index().on(self.subjectClassAllocationId),
		index().on(self.userId),
	],
)

export type SubjectClassAllocationAttendance =
	typeof subjectClassAllocationAttendance.$inferSelect

export const subjectClassAllocationAttendanceComponentTypeEnumPg =
	subjectSchema.enum(
		'enum_sub_off_cls_allo_att_comp_type',
		enumToPgEnum(subjectClassAllocationAttendanceComponentType),
	)

export const subjectClassAllocationAttendanceComponent = subjectSchema.table(
	'sub_off_cls_allo_att_comp',
	{
		...essentials,
		attendanceId: integer('att_id')
			.notNull()
			.references(() => subjectClassAllocationAttendance.id, {
				onDelete: 'cascade',
			}),
		type: subjectClassAllocationAttendanceComponentTypeEnumPg().notNull(),
		start: standardTimestamp('start').notNull(),
		end: standardTimestamp('end').notNull(),
	},
	(self) => [
		check('valid_time_range', sql`${self.end} > ${self.start}`),
		index().on(self.attendanceId),
	],
)

export type SubjectClassAllocationAttendanceComponent =
	typeof subjectClassAllocationAttendanceComponent.$inferSelect

export const attendanceBehaviour = subjectSchema.table(
	'att_behaviour',
	{
		attendanceId: integer('att_id')
			.notNull()
			.references(() => subjectClassAllocationAttendance.id, {
				onDelete: 'cascade',
			}),
		behaviourId: integer('behaviour_id')
			.notNull()
			.references(() => schoolBehaviour.id, { onDelete: 'cascade' }),
	},
	(self) => [
		primaryKey({ columns: [self.attendanceId, self.behaviourId] }),
		index().on(self.attendanceId),
		index().on(self.behaviourId),
	],
)

export type AttendanceBehaviour = typeof attendanceBehaviour.$inferSelect

export const subjectThreadTypeEnumPg = subjectSchema.enum(
	'enum_sub_thread_type',
	enumToPgEnum(subjectThreadTypeEnum),
)

export const subjectThread = subjectSchema.table(
	'sub_thread',
	{
		...essentials,
		type: subjectThreadTypeEnumPg().notNull(),
		subjectOfferingId: integer('sub_off_id')
			.notNull()
			.references(() => subjectOffering.id, { onDelete: 'cascade' }),
		userId: uuid()
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		title: text().notNull(),
		content: text().notNull(),
		isAnonymous: boolean().notNull(),
		isArchived: boolean().notNull().default(false),
	},
	(self) => [index().on(self.subjectOfferingId), index().on(self.userId)],
)

export type SubjectThread = typeof subjectThread.$inferSelect

export const subjectThreadResponseTypeEnumPg = subjectSchema.enum(
	'enum_sub_thread_res_type',
	enumToPgEnum(subjectThreadResponseTypeEnum),
)

export const subjectThreadResponse = subjectSchema.table(
	'sub_thread_resp',
	{
		...essentials,
		type: subjectThreadResponseTypeEnumPg().notNull(),
		subjectThreadId: integer('sub_thread_id')
			.notNull()
			.references(() => subjectThread.id, { onDelete: 'cascade' }),
		userId: uuid()
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		content: text().notNull(),
		parentResponseId: integer('parent_id').references(
			(): AnyPgColumn => subjectThreadResponse.id,
			{ onDelete: 'cascade' },
		),
		isAnonymous: boolean().notNull().default(false),
	},
	(self) => [
		index().on(self.subjectThreadId),
		index().on(self.userId),
		index().on(self.parentResponseId),
	],
)

export type SubjectThreadResponse = typeof subjectThreadResponse.$inferSelect

export const subjectThreadLike = subjectSchema.table(
	'sub_thread_like',
	{
		subjectThreadId: integer('sub_thread_id')
			.notNull()
			.references(() => subjectThread.id, { onDelete: 'cascade' }),
		userId: uuid()
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
	},
	(self) => [
		primaryKey({ columns: [self.subjectThreadId, self.userId] }),
		index().on(self.subjectThreadId),
		index().on(self.userId),
	],
)

export type SubjectThreadLike = typeof subjectThreadLike.$inferSelect

export const subjectThreadResponseLike = subjectSchema.table(
	'sub_thread_resp_like',
	{
		subjectThreadResponseId: integer('sub_thread_resp_id')
			.notNull()
			.references(() => subjectThreadResponse.id, { onDelete: 'cascade' }),
		userId: uuid()
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
	},
	(self) => [
		primaryKey({ columns: [self.subjectThreadResponseId, self.userId] }),
		index().on(self.subjectThreadResponseId),
		index().on(self.userId),
	],
)

export type SubjectThreadResponseLike =
	typeof subjectThreadResponseLike.$inferSelect

export const subjectOfferingClassResource = subjectSchema.table(
	'sub_off_cls_res',
	{
		...essentials,
		title: text(),
		description: text(),
		subjectOfferingClassId: integer('sub_off_cls_id')
			.notNull()
			.references(() => subjectOfferingClass.id, { onDelete: 'cascade' }),
		resourceId: integer('res_id')
			.notNull()
			.references(() => resource.id, { onDelete: 'cascade' }),
		curriculumItemId: integer('crclm_item_id').references(
			() => curriculumItem.id,
			{ onDelete: 'cascade' },
		),
		authorId: uuid('author_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
	},
	(self) => [
		index().on(self.subjectOfferingClassId),
		index().on(self.resourceId),
		index().on(self.curriculumItemId),
		index().on(self.authorId),
	],
)

export type SubjectOfferingClassResource =
	typeof subjectOfferingClassResource.$inferSelect

export const subjectSelectionConstraint = subjectSchema.table(
	'sub_sel_constraint',
	{
		...essentials,
		schoolId: integer()
			.notNull()
			.references(() => school.id, { onDelete: 'cascade' }),
		yearLevel: integer()
			.notNull()
			.references(() => schoolYearLevel.id, { onDelete: 'cascade' }),
		name: text().notNull(), // e.g., "Language requirement", "Science elective"
		description: text(),
		min: integer().notNull().default(0),
		max: integer(),
	},
	(self) => [index().on(self.schoolId), index().on(self.yearLevel)],
)

export type SubjectSelectionConstraint =
	typeof subjectSelectionConstraint.$inferSelect

export const subjectSelectionConstraintSubject = subjectSchema.table(
	'constraint_subject',
	{
		constraintId: integer('constraint_id')
			.notNull()
			.references(() => subjectSelectionConstraint.id, { onDelete: 'cascade' }),
		subjectId: integer('sub_id')
			.notNull()
			.references(() => subject.id, { onDelete: 'cascade' }),
	},
	(self) => [
		primaryKey({ columns: [self.constraintId, self.subjectId] }),
		index().on(self.constraintId),
		index().on(self.subjectId),
	],
)

export type SubjectSelectionConstraintSubject =
	typeof subjectSelectionConstraintSubject.$inferSelect

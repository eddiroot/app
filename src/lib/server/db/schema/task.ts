import {
	boolean,
	doublePrecision,
	integer,
	jsonb,
	pgSchema,
	text,
	unique,
	uuid,
} from 'drizzle-orm/pg-core'
import {
	gradeReleaseEnum,
	quizModeEnum,
	rubricLevelEnum,
	taskBlockTypeEnum,
	taskStatusEnum,
	taskTypeEnum,
} from '../../../enums'
import { curriculumItem } from './curriculum'
import { resource } from './resource'
import { subjectOffering, subjectOfferingClass } from './subject'
import { user } from './user'
import {
	enumToPgEnum,
	essentials,
	standardTimestamp,
	timestamps,
} from './utils'

export const taskSchema = pgSchema('task')

export const taskTypeEnumPg = taskSchema.enum(
	'enum_task_type',
	enumToPgEnum(taskTypeEnum),
)
export const quizModeEnumPg = taskSchema.enum(
	'enum_quiz_mode',
	enumToPgEnum(quizModeEnum),
)
export const gradeReleaseEnumPg = taskSchema.enum(
	'enum_grade_release',
	enumToPgEnum(gradeReleaseEnum),
)

export const task = taskSchema.table('task', {
	...essentials,
	title: text().notNull(),
	type: taskTypeEnumPg().notNull(),
	description: text().notNull(),
	rubricId: integer().references(() => rubric.id, { onDelete: 'set null' }),
	subjectOfferingId: integer('sub_off_id')
		.notNull()
		.references(() => subjectOffering.id, { onDelete: 'cascade' }),
})

export type Task = typeof task.$inferSelect

export const taskBlockTypeEnumPg = taskSchema.enum(
	'enum_task_block_type',
	enumToPgEnum(taskBlockTypeEnum),
)

export const taskBlock = taskSchema.table('task_block', {
	...essentials,
	taskId: integer()
		.notNull()
		.references(() => task.id, { onDelete: 'cascade' }),
	type: taskBlockTypeEnumPg().notNull(),
	config: jsonb().notNull(),
	index: integer().default(0).notNull(),
	availableMarks: integer(),
})

export type TaskBlock = typeof taskBlock.$inferSelect

export const taskStatusEnumPg = taskSchema.enum(
	'enum_task_status',
	enumToPgEnum(taskStatusEnum),
)

export const subjectOfferingClassTask = taskSchema.table(
	'sub_off_cls_task',
	{
		...essentials,
		index: integer().notNull(),
		status: taskStatusEnumPg().notNull().default(taskStatusEnum.draft),
		subjectOfferingClassId: integer('sub_off_cls_id')
			.notNull()
			.references(() => subjectOfferingClass.id, { onDelete: 'cascade' }),
		taskId: integer()
			.notNull()
			.references(() => task.id, { onDelete: 'cascade' }),
		authorId: uuid()
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		curriculumItemId: integer('crclm_item_id').references(
			() => curriculumItem.id,
			{ onDelete: 'cascade' },
		),
		week: integer(),
		due: standardTimestamp('due'),
		rubricId: integer().references(() => rubric.id, { onDelete: 'set null' }),
		quizMode: quizModeEnumPg().notNull().default(quizModeEnum.none),
		quizStart: standardTimestamp('quiz_start'),
		quizDurationMinutes: integer(),
		gradeRelease: gradeReleaseEnumPg()
			.notNull()
			.default(gradeReleaseEnum.instant),
		gradeReleaseTime: standardTimestamp('grade_release_time'),
	},
	(self) => [unique().on(self.subjectOfferingClassId, self.taskId)],
)

export type SubjectOfferingClassTask =
	typeof subjectOfferingClassTask.$inferSelect

export const classTaskBlockResponse = taskSchema.table(
	'cls_task_block_res',
	{
		...essentials,
		taskBlockId: integer()
			.notNull()
			.references(() => taskBlock.id, { onDelete: 'cascade' }),
		authorId: uuid()
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		classTaskId: integer('cls_task_id')
			.notNull()
			.references(() => subjectOfferingClassTask.id, { onDelete: 'cascade' }),
		response: jsonb(), // This is what the student submitted for this task block
		feedback: text(), // Teacher feedback on the block response
		marks: doublePrecision(), // Marks awarded for this task block response
	},
	(self) => [unique().on(self.taskBlockId, self.authorId, self.classTaskId)],
)

export type ClassTaskBlockResponse = typeof classTaskBlockResponse.$inferSelect

export const classTaskResponse = taskSchema.table(
	'cls_task_res',
	{
		...essentials,
		classTaskId: integer('cls_task_id')
			.notNull()
			.references(() => subjectOfferingClassTask.id, { onDelete: 'cascade' }),
		comment: text(), // Optional comment from the student about their submission
		feedback: text(), // Optional feedback from the teacher
		authorId: uuid()
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		teacherId: uuid().references(() => user.id, { onDelete: 'cascade' }), // Teacher who graded the task response
		quizStartedAt: standardTimestamp('quiz_started_at'),
		quizSubmittedAt: standardTimestamp('quiz_submitted_at'),
	},
	(self) => [unique().on(self.classTaskId, self.authorId)],
)

export type ClassTaskResponse = typeof classTaskResponse.$inferSelect

export const classTaskResponseResource = taskSchema.table(
	'cls_task_res_resource',
	{
		...essentials,
		classTaskResponseId: integer('cls_task_res_id')
			.notNull()
			.references(() => classTaskResponse.id, { onDelete: 'cascade' }),
		resourceId: integer('res_id')
			.notNull()
			.references(() => resource.id, { onDelete: 'cascade' }),
		authorId: uuid()
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
	},
)

export type ClassTaskResponseResource =
	typeof classTaskResponseResource.$inferSelect

export const rubric = taskSchema.table('rubric', {
	...essentials,
	title: text().notNull(),
})

export type Rubric = typeof rubric.$inferSelect

export const rubricLevelEnumPg = taskSchema.enum(
	'enum_rubric_level',
	enumToPgEnum(rubricLevelEnum),
)

export const rubricRow = taskSchema.table('rubric_row', {
	...essentials,
	rubricId: integer()
		.notNull()
		.references(() => rubric.id, { onDelete: 'cascade' }),
	title: text().notNull(),
})

export type RubricRow = typeof rubricRow.$inferSelect

export const rubricCell = taskSchema.table('rubric_cell', {
	...essentials,
	rowId: integer()
		.notNull()
		.references(() => rubricRow.id, { onDelete: 'cascade' }),
	level: rubricLevelEnumPg().notNull(),
	description: text().notNull(),
	marks: doublePrecision().notNull(),
})

export type RubricCell = typeof rubricCell.$inferSelect

// Tracks which rubric cell (performance level) a student achieved for each rubric row
export const rubricCellFeedback = taskSchema.table('rubric_cell_feedback', {
	...essentials,
	feedback: text(),
	classTaskResponseId: integer('cls_task_res_id')
		.notNull()
		.references(() => classTaskResponse.id, { onDelete: 'cascade' }),
	rubricRowId: integer()
		.notNull()
		.references(() => rubricRow.id, { onDelete: 'cascade' }),
	rubricCellId: integer()
		.notNull()
		.references(() => rubricCell.id, { onDelete: 'cascade' }),
})

export type RubricCellFeedback = typeof rubricCellFeedback.$inferSelect

export const whiteboard = taskSchema.table('whiteboard', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	taskBlockId: integer('task_block_id')
		.notNull()
		.unique()
		.references(() => taskBlock.id, { onDelete: 'cascade' }),
	title: text('title'),
	isLocked: boolean('is_locked').notNull().default(false),
	...timestamps,
})

export type Whiteboard = typeof whiteboard.$inferSelect

export const whiteboardObject = taskSchema.table('whiteboard_object', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	whiteboardId: integer('whiteboard_id')
		.notNull()
		.references(() => whiteboard.id, { onDelete: 'cascade' }),
	objectId: text('object_id').notNull().unique(),
	objectData: jsonb('object_data').notNull(),
	...timestamps,
})

export type WhiteboardObject = typeof whiteboardObject.$inferSelect

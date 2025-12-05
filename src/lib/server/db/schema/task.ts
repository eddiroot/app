import {
	boolean,
	doublePrecision,
	foreignKey,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	unique,
	uuid
} from 'drizzle-orm/pg-core';
import {
	gradeReleaseEnum,
	quizModeEnum,
	taskBlockTypeEnum,
	taskStatusEnum,
	taskTypeEnum,
	whiteboardObjectTypeEnum
} from '../../../enums';
import { courseMapItem } from './coursemap';
import { learningAreaStandard } from './curriculum';
import { resource } from './resource';
import { subjectOffering, subjectOfferingClass } from './subjects';
import { user } from './user';
import { timestamps } from './utils';

export const taskTypeEnumPg = pgEnum('enum_task_type', [
	taskTypeEnum.lesson,
	taskTypeEnum.homework,
	taskTypeEnum.test,
	taskTypeEnum.assignment,
	taskTypeEnum.module
]);

export const quizModeEnumPg = pgEnum('enum_quiz_mode', [
	quizModeEnum.none,
	quizModeEnum.scheduled,
	quizModeEnum.manual
]);

export const gradeReleaseEnumPg = pgEnum('enum_grade_release', [
	gradeReleaseEnum.instant,
	gradeReleaseEnum.manual,
	gradeReleaseEnum.scheduled
]);

export const task = pgTable(
	'task',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		title: text('title').notNull(),
		type: taskTypeEnumPg().notNull(),
		description: text('description').notNull(),
		rubricId: integer('rubric_id').references(() => rubric.id, { onDelete: 'set null' }),
		originalId: integer('original_id'),
		version: integer('version').notNull().default(1),
		subjectOfferingId: integer('sub_off_id')
			.notNull()
			.references(() => subjectOffering.id, { onDelete: 'cascade' }),
		aiTutorEnabled: boolean('ai_tutor_enabled').notNull().default(true),
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

export type Task = typeof task.$inferSelect;

export const taskStandard = pgTable('task_std', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	taskId: integer('task_id')
		.notNull()
		.references(() => task.id, { onDelete: 'cascade' }),
	learningAreaStandardId: integer('lrn_a_std_id')
		.notNull()
		.references(() => learningAreaStandard.id, { onDelete: 'cascade' })
});

export type TaskStandard = typeof taskStandard.$inferSelect;

export const taskBlockTypeEnumPg = pgEnum('enum_task_block_type', [
	taskBlockTypeEnum.heading,
	taskBlockTypeEnum.richText,
	taskBlockTypeEnum.mathInput,
	taskBlockTypeEnum.image,
	taskBlockTypeEnum.video,
	taskBlockTypeEnum.audio,
	taskBlockTypeEnum.fillBlank,
	taskBlockTypeEnum.choice,
	taskBlockTypeEnum.whiteboard,
	taskBlockTypeEnum.matching,
	taskBlockTypeEnum.shortAnswer,
	taskBlockTypeEnum.close,
	taskBlockTypeEnum.highlightText,
	taskBlockTypeEnum.table,
	taskBlockTypeEnum.graph,
	taskBlockTypeEnum.balancingEquations
]);

export const taskBlock = pgTable('task_block', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	taskId: integer('task_id')
		.notNull()
		.references(() => task.id, { onDelete: 'cascade' }),
	type: taskBlockTypeEnumPg().notNull(),
	config: jsonb('config').notNull(),
	index: integer('index').notNull().default(0),
	availableMarks: integer('available_marks'),
	...timestamps
});

export type TaskBlock = typeof taskBlock.$inferSelect;

export const taskStatusEnumPg = pgEnum('enum_task_status', [
	taskStatusEnum.draft,
	taskStatusEnum.inProgress,
	taskStatusEnum.published,
	taskStatusEnum.completed,
	taskStatusEnum.locked,
	taskStatusEnum.graded
]);

export const subjectOfferingClassTask = pgTable('sub_off_class_task', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	index: integer('index').notNull(),
	status: taskStatusEnumPg().notNull().default(taskStatusEnum.draft),
	subjectOfferingClassId: integer('sub_off_class_id')
		.notNull()
		.references(() => subjectOfferingClass.id, { onDelete: 'cascade' }),
	taskId: integer('task_id')
		.notNull()
		.references(() => task.id, { onDelete: 'cascade' }),
	authorId: uuid('author_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	courseMapItemId: integer('cm_item_id').references(() => courseMapItem.id, {
		onDelete: 'cascade'
	}),
	week: integer('week'),
	dueDate: timestamp({ mode: 'date' }),
	isArchived: boolean('is_archived').notNull().default(false),
	rubricId: integer('rubric_id').references(() => rubric.id, { onDelete: 'set null' }),
	quizMode: quizModeEnumPg().notNull().default(quizModeEnum.none),
	quizStartTime: timestamp({ mode: 'date' }),
	quizDurationMinutes: integer('quiz_duration_minutes'),
	gradeRelease: gradeReleaseEnumPg().notNull().default(gradeReleaseEnum.instant),
	gradeReleaseTime: timestamp({ mode: 'date' }),
	...timestamps
});

export type SubjectOfferingClassTask = typeof subjectOfferingClassTask.$inferSelect;

export const classTaskBlockResponse = pgTable(
	'cls_task_block_res',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		taskBlockId: integer('task_block_id')
			.notNull()
			.references(() => taskBlock.id, { onDelete: 'cascade' }),
		authorId: uuid('author_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		classTaskId: integer('class_task_id')
			.notNull()
			.references(() => subjectOfferingClassTask.id, { onDelete: 'cascade' }),
		response: jsonb('response'), // This is what the student submitted for this task block
		feedback: text('feedback'), // Teacher feedback on the block response
		marks: doublePrecision('marks'), // Marks awarded for this task block response
		...timestamps
	},
	(self) => [unique().on(self.taskBlockId, self.authorId, self.classTaskId)]
);

export type ClassTaskBlockResponse = typeof classTaskBlockResponse.$inferSelect;

export const classTaskResponse = pgTable(
	'cls_task_res',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		classTaskId: integer('cls_task_id')
			.notNull()
			.references(() => subjectOfferingClassTask.id, { onDelete: 'cascade' }),
		comment: text('comment'), // Optional comment from the student about their submission
		feedback: text('feedback'), // Optional feedback from the teacher
		authorId: uuid('author_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		teacherId: uuid('teacher_id').references(() => user.id, { onDelete: 'cascade' }), // Teacher who graded the task response
		isArchived: boolean('is_archived').notNull().default(false),
		// Quiz session fields (moved from studentQuizSession)
		quizStartedAt: timestamp({ mode: 'date' }), // When student started the quiz
		quizEndedAt: timestamp({ mode: 'date' }), // When student ended/submitted the quiz
		quizTimeRemainingMinutes: integer('quiz_time_remaining_minutes'), // For pausing/resuming
		isQuizSubmitted: boolean('is_quiz_submitted').notNull().default(false),
		autoSubmitted: boolean('auto_submitted').notNull().default(false), // True if submitted due to timer
		...timestamps
	},
	(self) => [unique().on(self.classTaskId, self.authorId)]
);

export type ClassTaskResponse = typeof classTaskResponse.$inferSelect;

export const classTaskResponseResource = pgTable('task_response_resource', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	classTaskResponseId: integer('cls_task_res_id')
		.notNull()
		.references(() => classTaskResponse.id, { onDelete: 'cascade' }),
	resourceId: integer('res_id')
		.notNull()
		.references(() => resource.id, { onDelete: 'cascade' }),
	authorId: uuid('author_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type ClassTaskResponseResource = typeof classTaskResponseResource.$inferSelect;

export const rubric = pgTable('rubric', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	title: text('title').notNull(),
	...timestamps
});

export type Rubric = typeof rubric.$inferSelect;

export const rubricLevelEnum = pgEnum('enum_rubric_level', [
	'exemplary',
	'accomplished',
	'developing',
	'beginning'
]);

export const rubricRow = pgTable('rubric_row', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 2000 }),
	rubricId: integer('rubric_id')
		.notNull()
		.references(() => rubric.id, { onDelete: 'cascade' }),
	title: text('title').notNull(),
	...timestamps
});

export type RubricRow = typeof rubricRow.$inferSelect;

export const rubricCell = pgTable('rubric_cell', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 3000 }),
	rowId: integer('row_id')
		.notNull()
		.references(() => rubricRow.id, { onDelete: 'cascade' }),
	level: rubricLevelEnum().notNull(),
	description: text('description').notNull(),
	marks: doublePrecision('marks').notNull(),
	...timestamps
});

export type RubricCell = typeof rubricCell.$inferSelect;

// Tracks which rubric cell (performance level) a student achieved for each rubric row
export const rubricCellFeedback = pgTable('rubric_feedback', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 4000 }),
	classTaskResponseId: integer('class_task_response_id')
		.notNull()
		.references(() => classTaskResponse.id, { onDelete: 'cascade' }),
	rubricRowId: integer('rubric_row_id')
		.notNull()
		.references(() => rubricRow.id, { onDelete: 'cascade' }),
	rubricCellId: integer('rubric_cell_id')
		.notNull()
		.references(() => rubricCell.id, { onDelete: 'cascade' }),
	feedback: text('feedback'), // Teacher feedback on the rubric cell
	...timestamps
});

export type RubricCellFeedback = typeof rubricCellFeedback.$inferSelect;

export const whiteboard = pgTable('whiteboard', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	taskId: integer('task_id')
		.notNull()
		.references(() => task.id, { onDelete: 'cascade' }),
	title: text('title'),
	...timestamps
});

export type Whiteboard = typeof whiteboard.$inferSelect;

export const whiteboardObjectTypeEnumPg = pgEnum('enum_whiteboard_object_type', [
	whiteboardObjectTypeEnum.rect,
	whiteboardObjectTypeEnum.circle,
	whiteboardObjectTypeEnum.path,
	whiteboardObjectTypeEnum.textbox,
	whiteboardObjectTypeEnum.image
]);

export const whiteboardObject = pgTable('whiteboard_object', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	whiteboardId: integer('whiteboard_id')
		.notNull()
		.references(() => whiteboard.id, { onDelete: 'cascade' }),
	objectId: text('object_id').notNull().unique(),
	objectType: whiteboardObjectTypeEnumPg().notNull(),
	objectData: jsonb('object_data').notNull(),
	...timestamps
});

export type WhiteboardObject = typeof whiteboardObject.$inferSelect;

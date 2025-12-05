import {
	gradeReleaseEnum,
	quizModeEnum,
	taskBlockTypeEnum,
	taskStatusEnum,
	taskTypeEnum,
	userTypeEnum
} from '$lib/enums.js';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { and, asc, desc, eq, gte, inArray, or, sql } from 'drizzle-orm';
import { verifyUserAccessToClass } from './user';

export async function addTasksToClass(
	taskIds: number[],
	subjectOfferingClassId: number,
	userId: string,
	week: number | null = null
) {
	if (taskIds.length === 0) {
		return [];
	}

	// get the next available index for the class tasks
	const maxIndexResult = await db
		.select({ maxIndex: table.subjectOfferingClassTask.index })
		.from(table.subjectOfferingClassTask)
		.where(eq(table.subjectOfferingClassTask.subjectOfferingClassId, subjectOfferingClassId))
		.orderBy(desc(table.subjectOfferingClassTask.index))
		.limit(1);
	let nextIndex = (maxIndexResult[0]?.maxIndex ?? -1) + 1;

	const classTasks = await db
		.insert(table.subjectOfferingClassTask)
		.values(
			taskIds.map((taskId) => ({
				taskId: taskId,
				subjectOfferingClassId: subjectOfferingClassId,
				authorId: userId,
				index: nextIndex++,
				week: week
			}))
		)
		.onConflictDoNothing()
		.returning();

	return classTasks;
}

// Remove a task from a class
export async function removeTaskFromClass(taskId: number, subjectOfferingClassId: number) {
	const deletedClassTask = await db
		.delete(table.subjectOfferingClassTask)
		.where(
			and(
				eq(table.subjectOfferingClassTask.taskId, taskId),
				eq(table.subjectOfferingClassTask.subjectOfferingClassId, subjectOfferingClassId)
			)
		)
		.returning();

	return deletedClassTask;
}

// Get all tasks assigned to a specific class
export async function getTasksBySubjectOfferingClassId(
	userId: string,
	subjectOfferingClassId: number
) {
	const userAccess = await verifyUserAccessToClass(userId, subjectOfferingClassId);

	if (!userAccess) {
		return [];
	}

	const classTasks = await db
		.select({
			task: table.task,
			subjectOfferingClassTask: table.subjectOfferingClassTask,
			courseMapItem: table.courseMapItem
		})
		.from(table.subjectOfferingClassTask)
		.innerJoin(table.task, eq(table.subjectOfferingClassTask.taskId, table.task.id))
		.innerJoin(
			table.courseMapItem,
			eq(table.subjectOfferingClassTask.courseMapItemId, table.courseMapItem.id)
		)
		.where(eq(table.subjectOfferingClassTask.subjectOfferingClassId, subjectOfferingClassId))
		.orderBy(asc(table.task.id));

	return classTasks?.length == 0 ? [] : classTasks;
}

export async function getLessonsAndHomeworkBySubjectOfferingClassId(
	userId: string,
	subjectOfferingClassId: number
) {
	const userAccess = await verifyUserAccessToClass(userId, subjectOfferingClassId);

	if (!userAccess) {
		return [];
	}

	const lessonsAndHomework = await db
		.select({
			task: table.task,
			subjectOfferingClassTask: table.subjectOfferingClassTask,
			courseMapItem: table.courseMapItem
		})
		.from(table.subjectOfferingClassTask)
		.innerJoin(table.task, eq(table.subjectOfferingClassTask.taskId, table.task.id))
		.leftJoin(
			table.courseMapItem,
			eq(table.subjectOfferingClassTask.courseMapItemId, table.courseMapItem.id)
		)
		.where(
			and(
				eq(table.subjectOfferingClassTask.subjectOfferingClassId, subjectOfferingClassId),
				or(eq(table.task.type, taskTypeEnum.lesson), eq(table.task.type, taskTypeEnum.homework))
			)
		)
		.orderBy(asc(table.task.createdAt));

	return lessonsAndHomework?.length == 0 ? [] : lessonsAndHomework;
}

export async function getTopics(subjectOfferingId: number) {
	const topics = await db
		.select({
			id: table.courseMapItem.id,
			name: table.courseMapItem.topic
		})
		.from(table.courseMapItem)
		.innerJoin(
			table.subjectOffering,
			eq(table.courseMapItem.subjectOfferingId, table.subjectOffering.id)
		)
		.where(eq(table.subjectOffering.id, subjectOfferingId))
		.orderBy(asc(table.courseMapItem.startWeek));

	return topics;
}

export async function getClassTasksByTopicId(subjectOfferingClassId: number, topicId: number) {
	const tasks = await db
		.select({
			task: table.task
		})
		.from(table.subjectOfferingClassTask)
		.innerJoin(
			table.courseMapItem,
			eq(table.subjectOfferingClassTask.courseMapItemId, table.courseMapItem.id)
		)
		.where(
			and(
				eq(table.subjectOfferingClassTask.subjectOfferingClassId, subjectOfferingClassId),
				eq(table.courseMapItem.id, topicId)
			)
		)
		.orderBy(asc(table.subjectOfferingClassTask.index));

	return tasks.map((row) => row.task);
}

export async function getTaskById(taskId: number) {
	const task = await db
		.select({
			task: table.task
		})
		.from(table.task)
		.where(eq(table.task.id, taskId))
		.limit(1);

	return task?.length ? task[0].task : null;
}

export async function getTaskBlocksByTaskId(taskId: number) {
	const taskBlocks = await db
		.select({
			block: table.taskBlock
		})
		.from(table.taskBlock)
		.where(eq(table.taskBlock.taskId, taskId))
		.orderBy(table.taskBlock.index);

	return taskBlocks.map((row) => row.block);
}

export async function createTask(
	title: string,
	description: string,
	version: number,
	type: taskTypeEnum,
	subjectOfferingId: number,
	aiTutorEnabled: boolean = true,
	isArchived: boolean = false
) {
	const [task] = await db
		.insert(table.task)
		.values({
			title,
			type,
			description,
			originalId: null,
			version,
			subjectOfferingId,
			aiTutorEnabled,
			isArchived
		})
		.returning();

	// Update the task to set originalId to its own ID
	const [updatedTask] = await db
		.update(table.task)
		.set({ originalId: task.id })
		.where(eq(table.task.id, task.id))
		.returning();

	return updatedTask;
}

export async function createSubjectOfferingClassTask(
	taskId: number,
	subjectOfferingClassId: number,
	authorId: string,
	courseMapItemId: number | null = null,
	week: number | null = null,
	dueDate: Date | null = null
) {
	const maxIndexResult = await db
		.select({ maxIndex: table.subjectOfferingClassTask.index })
		.from(table.subjectOfferingClassTask)
		.where(eq(table.subjectOfferingClassTask.subjectOfferingClassId, subjectOfferingClassId))
		.orderBy(desc(table.subjectOfferingClassTask.index))
		.limit(1);
	const nextIndex = (maxIndexResult[0]?.maxIndex ?? -1) + 1;

	const [subjectOfferingClassTask] = await db
		.insert(table.subjectOfferingClassTask)
		.values({
			taskId,
			index: nextIndex,
			subjectOfferingClassId,
			authorId,
			courseMapItemId,
			week,
			dueDate
		})
		.returning();

	return subjectOfferingClassTask;
}

export async function updateTaskTitle(taskId: number, title: string) {
	const [task] = await db
		.update(table.task)
		.set({ title })
		.where(eq(table.task.id, taskId))
		.returning();

	return task;
}

export async function createTaskBlock(
	taskId: number,
	type: taskBlockTypeEnum,
	config: Record<string, unknown>,
	index: number | undefined = undefined
) {
	// If index is not provided, calculate the next available index used for LLM
	if (index === undefined) {
		const maxIndexResult = await db
			.select({ maxIndex: table.taskBlock.index })
			.from(table.taskBlock)
			.where(eq(table.taskBlock.taskId, taskId))
			.orderBy(desc(table.taskBlock.index))
			.limit(1);

		index = (maxIndexResult[0]?.maxIndex ?? -1) + 1;
	}

	await db
		.update(table.taskBlock)
		.set({
			index: sql`${table.taskBlock.index} + 1`
		})
		.where(and(eq(table.taskBlock.taskId, taskId), gte(table.taskBlock.index, index)));

	const [lessonBlock] = await db
		.insert(table.taskBlock)
		.values({
			taskId,
			type,
			config,
			index
		})
		.returning();

	return lessonBlock;
}

export async function updateTaskBlock(
	blockId: number,
	updates: {
		config?: Record<string, unknown>;
		type?: taskBlockTypeEnum;
	}
) {
	const [taskBlock] = await db
		.update(table.taskBlock)
		.set({ ...updates })
		.where(eq(table.taskBlock.id, blockId))
		.returning();

	return taskBlock;
}

export async function deleteTaskBlock(blockId: number) {
	await db.delete(table.taskBlock).where(eq(table.taskBlock.id, blockId));
}

// Whiteboard functions
export async function createWhiteboard(taskId: number, title?: string | null) {
	const [newWhiteboard] = await db
		.insert(table.whiteboard)
		.values({
			taskId,
			title: title && title.trim() ? title.trim() : null
		})
		.returning();

	return newWhiteboard;
}

export async function getWhiteboardById(whiteboardId: number) {
	const whiteboards = await db
		.select()
		.from(table.whiteboard)
		.where(eq(table.whiteboard.id, whiteboardId))
		.limit(1);

	return whiteboards[0] || null;
}

export async function getWhiteboardWithTask(whiteboardId: number, taskId: number) {
	const whiteboardData = await db
		.select({
			whiteboard: table.whiteboard,
			task: {
				id: table.task.id,
				title: table.task.title
			}
		})
		.from(table.whiteboard)
		.innerJoin(table.task, eq(table.whiteboard.taskId, table.task.id))
		.where(eq(table.whiteboard.id, whiteboardId))
		.limit(1);

	if (!whiteboardData.length || whiteboardData[0].task.id !== taskId) {
		return null;
	}

	return {
		whiteboard: whiteboardData[0].whiteboard,
		task: whiteboardData[0].task
	};
}

export async function getWhiteboardObjects(whiteboardId: number = 1) {
	const objects = await db
		.select()
		.from(table.whiteboardObject)
		.where(eq(table.whiteboardObject.whiteboardId, whiteboardId))
		.orderBy(table.whiteboardObject.createdAt);

	return objects;
}

export async function saveWhiteboardObject(data: {
	objectId: string;
	objectData: Record<string, unknown>;
	whiteboardId?: number;
}) {
	const [savedObject] = await db
		.insert(table.whiteboardObject)
		.values({
			...data,
			whiteboardId: data.whiteboardId ?? 1 // Default to whiteboard ID 1
		})
		.returning();

	return savedObject;
}

export async function updateWhiteboardObject(
	objectId: string,
	objectData: Record<string, unknown>,
	whiteboardId: number = 1
) {
	const [updatedObject] = await db
		.update(table.whiteboardObject)
		.set({ objectData })
		.where(
			and(
				eq(table.whiteboardObject.objectId, objectId),
				eq(table.whiteboardObject.whiteboardId, whiteboardId)
			)
		)
		.returning();

	return updatedObject;
}

export async function deleteWhiteboardObject(objectId: string, whiteboardId: number = 1) {
	await db
		.delete(table.whiteboardObject)
		.where(
			and(
				eq(table.whiteboardObject.objectId, objectId),
				eq(table.whiteboardObject.whiteboardId, whiteboardId)
			)
		);
}

export async function deleteWhiteboardObjects(objectIds: string[], whiteboardId: number = 1) {
	if (objectIds.length === 0) return;

	await db
		.delete(table.whiteboardObject)
		.where(
			and(
				eq(table.whiteboardObject.whiteboardId, whiteboardId),
				inArray(table.whiteboardObject.objectId, objectIds)
			)
		);
}

export async function clearWhiteboard(whiteboardId: number = 1) {
	await db
		.delete(table.whiteboardObject)
		.where(eq(table.whiteboardObject.whiteboardId, whiteboardId));
}

export async function updateTaskBlocksOrder(blockUpdates: Array<{ id: number; index: number }>) {
	await db.transaction(async (tx) => {
		for (const update of blockUpdates) {
			await tx
				.update(table.taskBlock)
				.set({ index: update.index })
				.where(eq(table.taskBlock.id, update.id));
		}
	});
}

export async function updateTaskOrder(
	taskOrder: Array<{ id: number; index: number }>
): Promise<void> {
	await db.transaction(async (tx) => {
		for (const task of taskOrder) {
			await tx
				.update(table.subjectOfferingClassTask)
				.set({ index: task.index })
				.where(eq(table.task.id, task.id));
		}
	});
}

export async function getLearningAreaStandardByCourseMapItemId(
	courseMapItemId: number
): Promise<curriculumLearningAreaStandard[]> {
	const rows = await db
		.select({
			learningArea: table.learningArea,
			learningAreaStandard: table.learningAreaStandard
		})
		.from(table.learningAreaStandard)
		.innerJoin(
			table.courseMapItemLearningArea,
			eq(table.learningAreaStandard.learningAreaId, table.courseMapItemLearningArea.learningAreaId)
		)
		.innerJoin(
			table.courseMapItem,
			eq(table.courseMapItemLearningArea.courseMapItemId, table.courseMapItem.id)
		)
		.innerJoin(
			table.subjectOffering,
			eq(table.courseMapItem.subjectOfferingId, table.subjectOffering.id)
		)
		.innerJoin(table.subject, eq(table.subjectOffering.subjectId, table.subject.id))
		.innerJoin(
			table.learningArea,
			eq(table.learningArea.id, table.learningAreaStandard.learningAreaId)
		)
		.where(
			and(
				eq(table.courseMapItemLearningArea.courseMapItemId, courseMapItemId),
				eq(table.learningAreaStandard.yearLevel, table.subject.yearLevel)
			)
		)
		.orderBy(asc(table.learningAreaStandard.id));

	// Group by learningArea.id using a Map for type safety
	const map = new Map<number, curriculumLearningAreaStandard>();
	for (const row of rows) {
		const laId = row.learningArea.id;
		if (!map.has(laId)) {
			map.set(laId, {
				learningArea: row.learningArea,
				contents: []
			});
		}
		map.get(laId)!.contents.push(row.learningAreaStandard);
	}
	return Array.from(map.values());
}

export async function getLearningAreasBySubjectOfferingId(subjectOfferingId: number) {
	const learningAreas = await db
		.select({
			learningArea: table.learningArea
		})
		.from(table.subjectOffering)
		.innerJoin(table.subject, eq(table.subjectOffering.subjectId, table.subject.id))
		.innerJoin(table.coreSubject, eq(table.subject.coreSubjectId, table.coreSubject.id))
		.innerJoin(
			table.curriculumSubject,
			eq(table.coreSubject.curriculumSubjectId, table.curriculumSubject.id)
		)
		.innerJoin(
			table.learningArea,
			eq(table.learningArea.curriculumSubjectId, table.curriculumSubject.id)
		)
		.where(eq(table.subjectOffering.id, subjectOfferingId))
		.orderBy(asc(table.learningArea.id));
	return learningAreas.map((row) => row.learningArea);
}

// Select the learningAreaStandards and add this to the gemini service, use coursemap.ts funtion to get the learning area content
export async function getStandardElaborationsByLearningAreaStandardIds(
	learningAreaStandardIds: number[]
) {
	if (learningAreaStandardIds.length === 0) return [];

	const elaborations = await db
		.select({
			id: table.standardElaboration.id,
			learningAreaStandardId: table.standardElaboration.learningAreaStandardId,
			name: table.standardElaboration.name,
			standardElaboration: table.standardElaboration.standardElaboration
		})
		.from(table.standardElaboration)
		.where(inArray(table.standardElaboration.learningAreaStandardId, learningAreaStandardIds))
		.orderBy(asc(table.standardElaboration.id));

	return elaborations;
}

export interface CurriculumStandardWithElaborations {
	learningAreaStandard: table.LearningAreaStandard;
	elaborations: table.StandardElaboration[];
}

export async function getLearningAreaStandardWithElaborationsByIds(
	learningAreaStandardIds: number[]
): Promise<CurriculumStandardWithElaborations[]> {
	if (learningAreaStandardIds.length === 0) return [];

	// Get the learning area content and their elaborations (joined)
	const rows = await db
		.select({
			learningAreaStandard: table.learningAreaStandard,
			standardElaboration: table.standardElaboration
		})
		.from(table.learningAreaStandard)
		.leftJoin(
			table.standardElaboration,
			eq(table.standardElaboration.learningAreaStandardId, table.learningAreaStandard.id)
		)
		.where(inArray(table.learningAreaStandard.id, learningAreaStandardIds))
		.orderBy(asc(table.learningAreaStandard.id));

	// Group by learningAreaStandard.id
	const map = new Map<number, CurriculumStandardWithElaborations>();
	for (const row of rows) {
		const lac = row.learningAreaStandard;
		if (!map.has(lac.id)) {
			map.set(lac.id, {
				learningAreaStandard: lac,
				elaborations: []
			});
		}
		if (row.standardElaboration && row.standardElaboration.id) {
			map.get(lac.id)!.elaborations.push(row.standardElaboration);
		}
	}
	return Array.from(map.values());
}

export interface curriculumLearningAreaStandard {
	learningArea: table.LearningArea;
	contents: table.LearningAreaStandard[];
}

export async function getCurriculumLearningAreaWithStandards(subjectOfferingId: number) {
	const rows = await db
		.select({
			learningArea: table.learningArea,
			learningAreaStandard: table.learningAreaStandard
		})
		.from(table.subjectOffering)
		.innerJoin(table.subject, eq(table.subject.id, table.subjectOffering.subjectId))
		.innerJoin(table.coreSubject, eq(table.coreSubject.id, table.subject.coreSubjectId))
		.innerJoin(
			table.curriculumSubject,
			eq(table.curriculumSubject.id, table.coreSubject.curriculumSubjectId)
		)
		.innerJoin(
			table.learningArea,
			eq(table.learningArea.curriculumSubjectId, table.curriculumSubject.id)
		)
		.innerJoin(
			table.learningAreaStandard,
			and(
				eq(table.learningAreaStandard.learningAreaId, table.learningArea.id),
				eq(table.learningAreaStandard.yearLevel, table.subject.yearLevel)
			)
		)
		.where(eq(table.subjectOffering.id, subjectOfferingId))
		.orderBy(asc(table.learningArea.name));

	// Group by learningArea.id using a Map for type safety
	const map = new Map<number, curriculumLearningAreaStandard>();
	for (const row of rows) {
		const laId = row.learningArea.id;
		if (!map.has(laId)) {
			map.set(laId, {
				learningArea: row.learningArea,
				contents: []
			});
		}
		map.get(laId)!.contents.push(row.learningAreaStandard);
	}
	return Array.from(map.values());
}

export async function createRubric(title: string) {
	const [rubric] = await db
		.insert(table.rubric)
		.values({
			title
		})
		.returning();

	return rubric;
}

export async function updateRubric(rubricId: number, updates: { title?: string }) {
	const [rubric] = await db
		.update(table.rubric)
		.set({ ...updates })
		.where(eq(table.rubric.id, rubricId))
		.returning();

	return rubric;
}

export async function getAssessmenPlanRubric(assessmentPlanId: number) {
	const rubric = await db
		.select({
			rubric: table.rubric
		})
		.from(table.courseMapItemAssessmentPlan)
		.innerJoin(table.rubric, eq(table.courseMapItemAssessmentPlan.rubricId, table.rubric.id))
		.where(eq(table.courseMapItemAssessmentPlan.id, assessmentPlanId))
		.limit(1);

	return rubric.length > 0 ? rubric[0].rubric : null;
}

export async function createRubricRow(rubricId: number, title: string) {
	const [row] = await db
		.insert(table.rubricRow)
		.values({
			rubricId,
			title
		})
		.returning();

	return row;
}

export async function updateRubricRow(rowId: number, updates: { title?: string }) {
	const [row] = await db
		.update(table.rubricRow)
		.set({ ...updates })
		.where(eq(table.rubricRow.id, rowId))
		.returning();

	return row;
}

export async function deleteRubricRow(rowId: number) {
	await db.delete(table.rubricRow).where(eq(table.rubricRow.id, rowId));
}

export async function createRubricCell(
	rowId: number,
	level: table.RubricCell['level'],
	description: string,
	marks: number
) {
	const [cell] = await db
		.insert(table.rubricCell)
		.values({
			rowId,
			level,
			description,
			marks
		})
		.returning();

	return cell;
}

export async function updateRubricCell(
	cellId: number,
	updates: {
		level?: table.RubricCell['level'];
		description?: string;
		marks?: number;
	}
) {
	const [cell] = await db
		.update(table.rubricCell)
		.set({ ...updates })
		.where(eq(table.rubricCell.id, cellId))
		.returning();

	return cell;
}

export async function deleteRubricCell(cellId: number) {
	await db.delete(table.rubricCell).where(eq(table.rubricCell.id, cellId));
}

export async function getRubricById(rubricId: number) {
	const rubrics = await db
		.select()
		.from(table.rubric)
		.where(eq(table.rubric.id, rubricId))
		.limit(1);

	return rubrics[0] || null;
}

export async function getRubricWithRowsAndCells(rubricId: number) {
	const rows = await db
		.select({
			rubric: table.rubric,
			rubricRow: table.rubricRow,
			rubricCell: table.rubricCell
		})
		.from(table.rubric)
		.leftJoin(table.rubricRow, eq(table.rubric.id, table.rubricRow.rubricId))
		.leftJoin(table.rubricCell, eq(table.rubricRow.id, table.rubricCell.rowId))
		.where(eq(table.rubric.id, rubricId))
		.orderBy(asc(table.rubricRow.id), asc(table.rubricCell.level));

	if (rows.length === 0) {
		return null;
	}

	const rubric = rows[0].rubric;
	const rowsMap = new Map<
		number,
		{
			row: table.RubricRow;
			cells: table.RubricCell[];
		}
	>();

	for (const row of rows) {
		if (row.rubricRow) {
			if (!rowsMap.has(row.rubricRow.id)) {
				rowsMap.set(row.rubricRow.id, {
					row: row.rubricRow,
					cells: []
				});
			}
			if (row.rubricCell) {
				rowsMap.get(row.rubricRow.id)!.cells.push(row.rubricCell);
			}
		}
	}

	return {
		rubric,
		rows: Array.from(rowsMap.values())
	};
}

export async function getRubricRowsByRubricId(rubricId: number) {
	const rows = await db
		.select()
		.from(table.rubricRow)
		.where(eq(table.rubricRow.rubricId, rubricId))
		.orderBy(asc(table.rubricRow.id));

	return rows;
}

export async function getRubricCellsByRowId(rowId: number) {
	const cells = await db
		.select()
		.from(table.rubricCell)
		.where(eq(table.rubricCell.rowId, rowId))
		.orderBy(asc(table.rubricCell.level));

	return cells;
}

export async function deleteRubric(rubricId: number) {
	// Cascade delete will handle rubricRow and rubricCell deletion
	await db.delete(table.rubric).where(eq(table.rubric.id, rubricId));
}

export async function createCompleteRubric(
	title: string,
	rows: Array<{
		title: string;
		cells: Array<{
			level: table.RubricCell['level'];
			description: string;
			marks: number;
		}>;
	}>
) {
	return await db.transaction(async (tx) => {
		// Create the rubric
		const [rubric] = await tx.insert(table.rubric).values({ title }).returning();

		// Create rows and cells
		const createdRows = [];
		for (const rowData of rows) {
			const [row] = await tx
				.insert(table.rubricRow)
				.values({
					rubricId: rubric.id,
					title: rowData.title
				})
				.returning();

			const cells = [];
			for (const cellData of rowData.cells) {
				const [cell] = await tx
					.insert(table.rubricCell)
					.values({
						rowId: row.id,
						level: cellData.level,
						description: cellData.description,
						marks: cellData.marks
					})
					.returning();
				cells.push(cell);
			}

			createdRows.push({ row, cells });
		}

		return { rubric, rows: createdRows };
	});
}

export async function duplicateRubric(rubricId: number, newTitle?: string) {
	const existingRubric = await getRubricWithRowsAndCells(rubricId);
	if (!existingRubric) {
		throw new Error('Rubric not found');
	}

	const title = newTitle || `${existingRubric.rubric.title} (Copy)`;
	const rows = existingRubric.rows.map(({ row, cells }) => ({
		title: row.title,
		cells: cells.map((cell) => ({
			level: cell.level,
			description: cell.description,
			marks: cell.marks
		}))
	}));

	return await createCompleteRubric(title, rows);
}

export async function getSubjectOfferingClassTaskByTaskId(
	taskId: number,
	subjectOfferingClassId: number
) {
	const [classTask] = await db
		.select()
		.from(table.subjectOfferingClassTask)
		.where(
			and(
				eq(table.subjectOfferingClassTask.taskId, taskId),
				eq(table.subjectOfferingClassTask.subjectOfferingClassId, subjectOfferingClassId)
			)
		)
		.limit(1);

	return classTask || null;
}

export async function updateSubjectOfferingClassTaskStatus(
	taskId: number,
	subjectOfferingClassId: number,
	status: taskStatusEnum
) {
	await db
		.update(table.subjectOfferingClassTask)
		.set({ status })
		.where(
			and(
				eq(table.subjectOfferingClassTask.taskId, taskId),
				eq(table.subjectOfferingClassTask.subjectOfferingClassId, subjectOfferingClassId)
			)
		);
}

export async function updateSubjectOfferingClassTaskQuizSettings(
	taskId: number,
	subjectOfferingClassId: number,
	quizSettings: {
		quizMode?: quizModeEnum;
		quizStartTime?: Date | null;
		quizDurationMinutes?: number | null;
		gradeRelease?: gradeReleaseEnum;
		gradeReleaseTime?: Date | null;
	}
) {
	await db
		.update(table.subjectOfferingClassTask)
		.set(quizSettings)
		.where(
			and(
				eq(table.subjectOfferingClassTask.taskId, taskId),
				eq(table.subjectOfferingClassTask.subjectOfferingClassId, subjectOfferingClassId)
			)
		);
}

export async function startQuizSession(classTaskId: number) {
	await db
		.update(table.subjectOfferingClassTask)
		.set({
			quizStartTime: new Date()
		})
		.where(eq(table.subjectOfferingClassTask.id, classTaskId));
}

// Task Block Response functions

export async function upsertClassTaskBlockResponse(
	taskBlockId: number,
	authorId: string,
	classTaskId: number,
	response: unknown
) {
	const [upsertedResponse] = await db
		.insert(table.classTaskBlockResponse)
		.values({
			taskBlockId,
			authorId,
			classTaskId,
			response
		})
		.onConflictDoUpdate({
			target: [
				table.classTaskBlockResponse.taskBlockId,
				table.classTaskBlockResponse.authorId,
				table.classTaskBlockResponse.classTaskId
			],
			set: {
				response
			}
		})
		.returning();

	return upsertedResponse;
}

export async function getClassTaskBlockResponsesByClassTaskId(classTaskId: number) {
	const responses = await db
		.select({
			response: table.classTaskBlockResponse,
			block: table.taskBlock
		})
		.from(table.classTaskBlockResponse)
		.innerJoin(table.taskBlock, eq(table.classTaskBlockResponse.taskBlockId, table.taskBlock.id))
		.where(eq(table.classTaskBlockResponse.classTaskId, classTaskId))
		.orderBy(asc(table.classTaskBlockResponse.authorId), asc(table.taskBlock.index));

	const groupedResponses: {
		[authorId: string]: {
			[blockId: number]: table.ClassTaskBlockResponse;
		};
	} = {};
	for (const item of responses) {
		const authorId = item.response.authorId;
		if (!groupedResponses[authorId]) {
			groupedResponses[authorId] = {};
		}
		groupedResponses[authorId][item.block.id] = item.response;
	}

	return groupedResponses;
}

export async function getClassTaskBlockResponsesByAuthorId(classTaskId: number, authorId: string) {
	const responses = await db
		.select({
			response: table.classTaskBlockResponse,
			block: table.taskBlock
		})
		.from(table.classTaskBlockResponse)
		.innerJoin(table.taskBlock, eq(table.classTaskBlockResponse.taskBlockId, table.taskBlock.id))
		.where(
			and(
				eq(table.classTaskBlockResponse.authorId, authorId),
				eq(table.classTaskBlockResponse.classTaskId, classTaskId)
			)
		);

	return responses.reduce(
		(acc, curr) => {
			acc[curr.block.id] = curr.response;
			return acc;
		},
		{} as { [blockId: number]: table.ClassTaskBlockResponse }
	);
}

// Helper function to get teacher from class
export async function getClassTeacher(subjectOfferingClassId: number) {
	const teacher = await db
		.select({
			userId: table.userSubjectOfferingClass.userId
		})
		.from(table.userSubjectOfferingClass)
		.innerJoin(table.user, eq(table.userSubjectOfferingClass.userId, table.user.id))
		.where(
			and(
				eq(table.userSubjectOfferingClass.subOffClassId, subjectOfferingClassId),
				eq(table.user.type, userTypeEnum.teacher),
				eq(table.userSubjectOfferingClass.isArchived, false)
			)
		)
		.limit(1);

	return teacher[0]?.userId || null;
}

// Class Task Response functions
export async function createClassTaskResponse(
	classTaskId: number,
	authorId: string,
	comment?: string
) {
	const [response] = await db
		.insert(table.classTaskResponse)
		.values({
			classTaskId,
			authorId,
			comment
		})
		.returning();

	return response;
}

export async function upsertClassTaskResponse(classTaskId: number, authorId: string) {
	const [response] = await db
		.insert(table.classTaskResponse)
		.values({
			classTaskId,
			authorId
		})
		.onConflictDoNothing({
			target: [table.classTaskResponse.classTaskId, table.classTaskResponse.authorId]
		})
		.returning();

	return response;
}

export async function getClassTaskResponse(classTaskId: number, authorId: string) {
	const response = await db
		.select()
		.from(table.classTaskResponse)
		.where(
			and(
				eq(table.classTaskResponse.classTaskId, classTaskId),
				eq(table.classTaskResponse.authorId, authorId)
			)
		)
		.limit(1);

	return response[0] || null;
}

export async function getClassTaskResponseResources(classTaskResponseId: number) {
	const resources = await db
		.select({
			responseResource: table.classTaskResponseResource,
			resource: table.resource
		})
		.from(table.classTaskResponseResource)
		.innerJoin(table.resource, eq(table.classTaskResponseResource.resourceId, table.resource.id))
		.where(
			and(
				eq(table.classTaskResponseResource.classTaskResponseId, classTaskResponseId),
				eq(table.classTaskResponseResource.isArchived, false),
				eq(table.resource.isArchived, false)
			)
		);

	return resources;
}

export async function getClassTaskResponsesWithStudents(classTaskId: number) {
	const responses = await db
		.select({
			classTaskResponse: table.classTaskResponse,
			student: {
				id: table.user.id,
				firstName: table.user.firstName,
				lastName: table.user.lastName,
				email: table.user.email
			}
		})
		.from(table.classTaskResponse)
		.innerJoin(table.user, eq(table.classTaskResponse.authorId, table.user.id))
		.where(
			and(
				eq(table.classTaskResponse.classTaskId, classTaskId),
				eq(table.classTaskResponse.isArchived, false)
			)
		)
		.orderBy(asc(table.user.lastName), asc(table.user.firstName));

	return responses;
}

export async function updateClassTaskResponseComment(
	classTaskResponseId: number,
	comment: string | null
) {
	const [response] = await db
		.update(table.classTaskResponse)
		.set({
			comment
		})
		.where(eq(table.classTaskResponse.id, classTaskResponseId))
		.returning();

	return response;
}

export async function archiveAllResourcesFromClassTaskResponse(classTaskResponseId: number) {
	await db
		.update(table.classTaskResponseResource)
		.set({
			isArchived: true
		})
		.where(eq(table.classTaskResponseResource.classTaskResponseId, classTaskResponseId));
}

export async function deleteResourcesFromClassTaskResponse(classTaskResponseId: number) {
	const resources = await db
		.select({
			resource: table.resource
		})
		.from(table.classTaskResponseResource)
		.innerJoin(table.resource, eq(table.classTaskResponseResource.resourceId, table.resource.id))
		.where(
			and(
				eq(table.classTaskResponseResource.classTaskResponseId, classTaskResponseId),
				eq(table.classTaskResponseResource.isArchived, false),
				eq(table.resource.isArchived, false)
			)
		);

	await db
		.delete(table.classTaskResponseResource)
		.where(eq(table.classTaskResponseResource.classTaskResponseId, classTaskResponseId));

	return resources.map((r) => r.resource);
}

export async function deleteResourceFromClassTaskResponse(
	classTaskResponseId: number,
	resourceId: number,
	userId: string
) {
	const [resourceData] = await db
		.select({
			resource: table.resource,
			response: table.classTaskResponse
		})
		.from(table.classTaskResponseResource)
		.innerJoin(table.resource, eq(table.classTaskResponseResource.resourceId, table.resource.id))
		.innerJoin(
			table.classTaskResponse,
			eq(table.classTaskResponseResource.classTaskResponseId, table.classTaskResponse.id)
		)
		.where(
			and(
				eq(table.classTaskResponseResource.classTaskResponseId, classTaskResponseId),
				eq(table.classTaskResponseResource.resourceId, resourceId),
				eq(table.classTaskResponse.authorId, userId),
				eq(table.classTaskResponseResource.isArchived, false),
				eq(table.resource.isArchived, false)
			)
		);

	if (!resourceData) {
		throw new Error('Resource not found or access denied');
	}

	await db
		.delete(table.classTaskResponseResource)
		.where(
			and(
				eq(table.classTaskResponseResource.classTaskResponseId, classTaskResponseId),
				eq(table.classTaskResponseResource.resourceId, resourceId)
			)
		);

	return resourceData.resource;
}

export async function addResourceToClassTaskResponse(
	classTaskResponseId: number,
	resourceId: number
) {
	const [relationship] = await db
		.insert(table.classTaskResponseResource)
		.values({
			classTaskResponseId,
			resourceId,
			authorId: '' // This will be set by the calling function
		})
		.returning();

	return relationship;
}

export async function addResourcesToClassTaskResponse(
	classTaskResponseId: number,
	resourceIds: number[],
	authorId: string
) {
	if (resourceIds.length === 0) {
		return [];
	}

	const newRelationships = await db
		.insert(table.classTaskResponseResource)
		.values(
			resourceIds.map((resourceId) => ({
				classTaskResponseId,
				resourceId,
				authorId
			}))
		)
		.onConflictDoNothing()
		.returning();

	return newRelationships;
}

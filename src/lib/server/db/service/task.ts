import {
	gradeReleaseEnum,
	quizModeEnum,
	taskBlockTypeEnum,
	taskStatusEnum,
	taskTypeEnum,
	userTypeEnum,
} from '$lib/enums.js';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { and, asc, desc, eq, inArray, or } from 'drizzle-orm';
import { verifyUserAccessToClass } from './user';

export async function addTasksToClass(
	taskIds: number[],
	subjectOfferingClassId: number,
	userId: string,
	week: number | null = null,
) {
	if (taskIds.length === 0) {
		return [];
	}

	// get the next available index for the class tasks
	const maxIndexResult = await db
		.select({ maxIndex: table.subjectOfferingClassTask.index })
		.from(table.subjectOfferingClassTask)
		.where(
			eq(
				table.subjectOfferingClassTask.subjectOfferingClassId,
				subjectOfferingClassId,
			),
		)
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
				week: week,
			})),
		)
		.onConflictDoNothing()
		.returning();

	return classTasks;
}

// Remove a task from a class
export async function removeTaskFromClass(
	taskId: number,
	subjectOfferingClassId: number,
) {
	const deletedClassTask = await db
		.delete(table.subjectOfferingClassTask)
		.where(
			and(
				eq(table.subjectOfferingClassTask.taskId, taskId),
				eq(
					table.subjectOfferingClassTask.subjectOfferingClassId,
					subjectOfferingClassId,
				),
			),
		)
		.returning();

	return deletedClassTask;
}

// Get all tasks assigned to a specific class
export async function getTasksBySubjectOfferingClassId(
	userId: string,
	subjectOfferingClassId: number,
) {
	const userAccess = await verifyUserAccessToClass(
		userId,
		subjectOfferingClassId,
	);

	if (!userAccess) {
		return [];
	}

	const classTasks = await db
		.select({
			task: table.task,
			subjectOfferingClassTask: table.subjectOfferingClassTask,
			curriculumItem: table.curriculumItem,
		})
		.from(table.subjectOfferingClassTask)
		.innerJoin(
			table.task,
			eq(table.subjectOfferingClassTask.taskId, table.task.id),
		)
		.innerJoin(
			table.curriculumItem,
			eq(
				table.subjectOfferingClassTask.curriculumItemId,
				table.curriculumItem.id,
			),
		)
		.where(
			eq(
				table.subjectOfferingClassTask.subjectOfferingClassId,
				subjectOfferingClassId,
			),
		)
		.orderBy(asc(table.task.id));

	return classTasks?.length == 0 ? [] : classTasks;
}

export async function getLessonsAndHomeworkBySubjectOfferingClassId(
	userId: string,
	subjectOfferingClassId: number,
) {
	const userAccess = await verifyUserAccessToClass(
		userId,
		subjectOfferingClassId,
	);

	if (!userAccess) {
		return [];
	}

	const lessonsAndHomework = await db
		.select({
			task: table.task,
			subjectOfferingClassTask: table.subjectOfferingClassTask,
		})
		.from(table.subjectOfferingClassTask)
		.innerJoin(
			table.task,
			eq(table.subjectOfferingClassTask.taskId, table.task.id),
		)
		.where(
			and(
				eq(
					table.subjectOfferingClassTask.subjectOfferingClassId,
					subjectOfferingClassId,
				),
				or(
					eq(table.task.type, taskTypeEnum.lesson),
					eq(table.task.type, taskTypeEnum.homework),
				),
			),
		)
		.orderBy(asc(table.task.createdAt));

	return lessonsAndHomework?.length == 0 ? [] : lessonsAndHomework;
}

export async function getTopics(subjectOfferingId: number) {
	const topics = await db
		.select({ id: table.curriculumItem.id, name: table.curriculumItem.topic })
		.from(table.curriculumItem)
		.innerJoin(
			table.subjectOffering,
			eq(table.curriculumItem.subjectOfferingId, table.subjectOffering.id),
		)
		.where(eq(table.subjectOffering.id, subjectOfferingId))
		.orderBy(asc(table.curriculumItem.startWeek));

	return topics;
}

export async function getClassTasksByTopicId(
	subjectOfferingClassId: number,
	topicId: number,
) {
	const tasks = await db
		.select({ task: table.task })
		.from(table.subjectOfferingClassTask)
		.where(
			and(
				eq(
					table.subjectOfferingClassTask.subjectOfferingClassId,
					subjectOfferingClassId,
				),
				eq(table.curriculumItem.id, topicId),
			),
		)
		.orderBy(asc(table.subjectOfferingClassTask.index));

	return tasks.map((row) => row.task);
}

export async function getTaskById(taskId: number) {
	const task = await db
		.select({ task: table.task })
		.from(table.task)
		.where(eq(table.task.id, taskId))
		.limit(1);

	return task?.length ? task[0].task : null;
}

export async function getTaskBlocksByTaskId(taskId: number) {
	const taskBlocks = await db
		.select({ block: table.taskBlock })
		.from(table.taskBlock)
		.where(eq(table.taskBlock.taskId, taskId))
		.orderBy(table.taskBlock.index);

	return taskBlocks.map((row) => row.block);
}

export async function updateTaskTitle(taskId: number, title: string) {
	const [task] = await db
		.update(table.task)
		.set({ title })
		.where(eq(table.task.id, taskId))
		.returning();

	return task;
}

export async function updateTaskBlock(
	blockId: number,
	updates: { config?: Record<string, unknown>; type?: taskBlockTypeEnum },
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
export async function getWhiteboardByTaskBlockId(taskBlockId: number) {
	const whiteboards = await db
		.select()
		.from(table.whiteboard)
		.where(eq(table.whiteboard.taskBlockId, taskBlockId))
		.limit(1);

	return whiteboards[0] || null;
}

export async function getWhiteboardById(whiteboardId: number) {
	const whiteboards = await db
		.select()
		.from(table.whiteboard)
		.where(eq(table.whiteboard.id, whiteboardId))
		.limit(1);

	return whiteboards[0] || null;
}

export async function getWhiteboardWithTask(
	whiteboardId: number,
	taskId: number,
) {
	const whiteboardData = await db
		.select({
			whiteboard: table.whiteboard,
			taskBlock: table.taskBlock,
			task: { id: table.task.id, title: table.task.title },
		})
		.from(table.whiteboard)
		.innerJoin(
			table.taskBlock,
			eq(table.whiteboard.taskBlockId, table.taskBlock.id),
		)
		.innerJoin(table.task, eq(table.taskBlock.taskId, table.task.id))
		.where(eq(table.whiteboard.id, whiteboardId))
		.limit(1);

	if (!whiteboardData.length || whiteboardData[0].task.id !== taskId) {
		return null;
	}

	return {
		whiteboard: whiteboardData[0].whiteboard,
		taskBlock: whiteboardData[0].taskBlock,
		task: whiteboardData[0].task,
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
			whiteboardId: data.whiteboardId ?? 1, // Default to whiteboard ID 1
		})
		.returning();

	return savedObject;
}

export async function updateWhiteboardObject(
	objectId: string,
	objectData: Record<string, unknown>,
	whiteboardId: number = 1,
) {
	const [updatedObject] = await db
		.update(table.whiteboardObject)
		.set({ objectData })
		.where(
			and(
				eq(table.whiteboardObject.objectId, objectId),
				eq(table.whiteboardObject.whiteboardId, whiteboardId),
			),
		)
		.returning();

	return updatedObject;
}

export async function deleteWhiteboardObject(
	objectId: string,
	whiteboardId: number = 1,
) {
	await db
		.delete(table.whiteboardObject)
		.where(
			and(
				eq(table.whiteboardObject.objectId, objectId),
				eq(table.whiteboardObject.whiteboardId, whiteboardId),
			),
		);
}

export async function deleteWhiteboardObjects(
	objectIds: string[],
	whiteboardId: number = 1,
) {
	if (objectIds.length === 0) return;

	await db
		.delete(table.whiteboardObject)
		.where(
			and(
				eq(table.whiteboardObject.whiteboardId, whiteboardId),
				inArray(table.whiteboardObject.objectId, objectIds),
			),
		);
}

export async function clearWhiteboard(whiteboardId: number = 1) {
	await db
		.delete(table.whiteboardObject)
		.where(eq(table.whiteboardObject.whiteboardId, whiteboardId));
}

export async function toggleWhiteboardLock(whiteboardId: number) {
	const [whiteboard] = await db
		.select()
		.from(table.whiteboard)
		.where(eq(table.whiteboard.id, whiteboardId))
		.limit(1);

	if (!whiteboard) {
		throw new Error('Whiteboard not found');
	}

	const [updated] = await db
		.update(table.whiteboard)
		.set({ isLocked: !whiteboard.isLocked })
		.where(eq(table.whiteboard.id, whiteboardId))
		.returning();

	return updated;
}

export async function getWhiteboardLockStatus(whiteboardId: number) {
	const [whiteboard] = await db
		.select({ isLocked: table.whiteboard.isLocked })
		.from(table.whiteboard)
		.where(eq(table.whiteboard.id, whiteboardId))
		.limit(1);

	return whiteboard?.isLocked ?? false;
}

export async function updateTaskBlocksOrder(
	blockUpdates: Array<{ id: number; index: number }>,
) {
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
	taskOrder: Array<{ id: number; index: number }>,
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

export async function updateRubric(
	rubricId: number,
	updates: { title?: string },
) {
	const [rubric] = await db
		.update(table.rubric)
		.set({ ...updates })
		.where(eq(table.rubric.id, rubricId))
		.returning();

	return rubric;
}

export async function getAssessmenPlanRubric(assessmentPlanId: number) {
	const rubric = await db
		.select({ rubric: table.rubric })
		.from(table.curriculumItemTask)
		.innerJoin(
			table.rubric,
			eq(table.curriculumItemTask.rubricId, table.rubric.id),
		)
		.where(eq(table.curriculumItemTask.id, assessmentPlanId))
		.limit(1);

	return rubric.length > 0 ? rubric[0].rubric : null;
}

export async function updateRubricRow(
	rowId: number,
	updates: { title?: string },
) {
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

export async function updateRubricCell(
	cellId: number,
	updates: {
		level?: table.RubricCell['level'];
		description?: string;
		marks?: number;
	},
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
			rubricCell: table.rubricCell,
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
		{ row: table.RubricRow; cells: table.RubricCell[] }
	>();

	for (const row of rows) {
		if (row.rubricRow) {
			if (!rowsMap.has(row.rubricRow.id)) {
				rowsMap.set(row.rubricRow.id, { row: row.rubricRow, cells: [] });
			}
			if (row.rubricCell) {
				rowsMap.get(row.rubricRow.id)!.cells.push(row.rubricCell);
			}
		}
	}

	return { rubric, rows: Array.from(rowsMap.values()) };
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

export async function getSubjectOfferingClassTaskByTaskId(
	taskId: number,
	subjectOfferingClassId: number,
) {
	const [classTask] = await db
		.select()
		.from(table.subjectOfferingClassTask)
		.where(
			and(
				eq(table.subjectOfferingClassTask.taskId, taskId),
				eq(
					table.subjectOfferingClassTask.subjectOfferingClassId,
					subjectOfferingClassId,
				),
			),
		)
		.limit(1);

	return classTask || null;
}

export async function updateSubjectOfferingClassTaskStatus(
	taskId: number,
	subjectOfferingClassId: number,
	status: taskStatusEnum,
) {
	await db
		.update(table.subjectOfferingClassTask)
		.set({ status })
		.where(
			and(
				eq(table.subjectOfferingClassTask.taskId, taskId),
				eq(
					table.subjectOfferingClassTask.subjectOfferingClassId,
					subjectOfferingClassId,
				),
			),
		);
}

export async function updateSubjectOfferingClassTaskQuizSettings(
	taskId: number,
	subjectOfferingClassId: number,
	quizSettings: {
		quizMode?: quizModeEnum;
		quizStart?: Date | null;
		quizDurationMinutes?: number | null;
		gradeRelease?: gradeReleaseEnum;
		gradeReleaseTime?: Date | null;
	},
) {
	await db
		.update(table.subjectOfferingClassTask)
		.set(quizSettings)
		.where(
			and(
				eq(table.subjectOfferingClassTask.taskId, taskId),
				eq(
					table.subjectOfferingClassTask.subjectOfferingClassId,
					subjectOfferingClassId,
				),
			),
		);
}

export async function startQuizSession(classTaskId: number) {
	await db
		.update(table.subjectOfferingClassTask)
		.set({ quizStart: new Date() })
		.where(eq(table.subjectOfferingClassTask.id, classTaskId));
}

// Task Block Response functions

export async function upsertClassTaskBlockResponse(
	taskBlockId: number,
	authorId: string,
	classTaskId: number,
	response: unknown,
) {
	const [upsertedResponse] = await db
		.insert(table.classTaskBlockResponse)
		.values({ taskBlockId, authorId, classTaskId, response })
		.onConflictDoUpdate({
			target: [
				table.classTaskBlockResponse.taskBlockId,
				table.classTaskBlockResponse.authorId,
				table.classTaskBlockResponse.classTaskId,
			],
			set: { response },
		})
		.returning();

	return upsertedResponse;
}

export async function getClassTaskBlockResponsesByClassTaskId(
	classTaskId: number,
) {
	const responses = await db
		.select({ response: table.classTaskBlockResponse, block: table.taskBlock })
		.from(table.classTaskBlockResponse)
		.innerJoin(
			table.taskBlock,
			eq(table.classTaskBlockResponse.taskBlockId, table.taskBlock.id),
		)
		.where(eq(table.classTaskBlockResponse.classTaskId, classTaskId))
		.orderBy(
			asc(table.classTaskBlockResponse.authorId),
			asc(table.taskBlock.index),
		);

	const groupedResponses: {
		[authorId: string]: { [blockId: number]: table.ClassTaskBlockResponse };
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

export async function getClassTaskBlockResponsesByAuthorId(
	classTaskId: number,
	authorId: string,
) {
	const responses = await db
		.select({ response: table.classTaskBlockResponse, block: table.taskBlock })
		.from(table.classTaskBlockResponse)
		.innerJoin(
			table.taskBlock,
			eq(table.classTaskBlockResponse.taskBlockId, table.taskBlock.id),
		)
		.where(
			and(
				eq(table.classTaskBlockResponse.authorId, authorId),
				eq(table.classTaskBlockResponse.classTaskId, classTaskId),
			),
		);

	return responses.reduce(
		(acc, curr) => {
			acc[curr.block.id] = curr.response;
			return acc;
		},
		{} as { [blockId: number]: table.ClassTaskBlockResponse },
	);
}

// Helper function to get teacher from class
export async function getClassTeacher(subjectOfferingClassId: number) {
	const teacher = await db
		.select({ userId: table.userSubjectOfferingClass.userId })
		.from(table.userSubjectOfferingClass)
		.innerJoin(
			table.user,
			eq(table.userSubjectOfferingClass.userId, table.user.id),
		)
		.where(
			and(
				eq(
					table.userSubjectOfferingClass.subOffClassId,
					subjectOfferingClassId,
				),
				eq(table.user.type, userTypeEnum.teacher),
				eq(table.userSubjectOfferingClass.isArchived, false),
			),
		)
		.limit(1);

	return teacher[0]?.userId || null;
}

// Class Task Response functions

export async function upsertClassTaskResponse(
	classTaskId: number,
	authorId: string,
) {
	const [response] = await db
		.insert(table.classTaskResponse)
		.values({ classTaskId, authorId })
		.onConflictDoNothing({
			target: [
				table.classTaskResponse.classTaskId,
				table.classTaskResponse.authorId,
			],
		})
		.returning();

	return response;
}

export async function getClassTaskResponse(
	classTaskId: number,
	authorId: string,
) {
	const response = await db
		.select()
		.from(table.classTaskResponse)
		.where(
			and(
				eq(table.classTaskResponse.classTaskId, classTaskId),
				eq(table.classTaskResponse.authorId, authorId),
			),
		)
		.limit(1);

	return response[0] || null;
}

export async function getClassTaskResponseResources(
	classTaskResponseId: number,
) {
	const resources = await db
		.select({
			responseResource: table.classTaskResponseResource,
			resource: table.resource,
		})
		.from(table.classTaskResponseResource)
		.innerJoin(
			table.resource,
			eq(table.classTaskResponseResource.resourceId, table.resource.id),
		)
		.where(
			and(
				eq(
					table.classTaskResponseResource.classTaskResponseId,
					classTaskResponseId,
				),
				eq(table.classTaskResponseResource.isArchived, false),
				eq(table.resource.isArchived, false),
			),
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
				email: table.user.email,
			},
		})
		.from(table.classTaskResponse)
		.innerJoin(table.user, eq(table.classTaskResponse.authorId, table.user.id))
		.where(
			and(
				eq(table.classTaskResponse.classTaskId, classTaskId),
				eq(table.classTaskResponse.isArchived, false),
			),
		)
		.orderBy(asc(table.user.lastName), asc(table.user.firstName));

	return responses;
}

export async function updateClassTaskResponseComment(
	classTaskResponseId: number,
	comment: string | null,
) {
	const [response] = await db
		.update(table.classTaskResponse)
		.set({ comment })
		.where(eq(table.classTaskResponse.id, classTaskResponseId))
		.returning();

	return response;
}

export async function archiveAllResourcesFromClassTaskResponse(
	classTaskResponseId: number,
) {
	await db
		.update(table.classTaskResponseResource)
		.set({ isArchived: true })
		.where(
			eq(
				table.classTaskResponseResource.classTaskResponseId,
				classTaskResponseId,
			),
		);
}

export async function deleteResourcesFromClassTaskResponse(
	classTaskResponseId: number,
) {
	const resources = await db
		.select({ resource: table.resource })
		.from(table.classTaskResponseResource)
		.innerJoin(
			table.resource,
			eq(table.classTaskResponseResource.resourceId, table.resource.id),
		)
		.where(
			and(
				eq(
					table.classTaskResponseResource.classTaskResponseId,
					classTaskResponseId,
				),
				eq(table.classTaskResponseResource.isArchived, false),
				eq(table.resource.isArchived, false),
			),
		);

	await db
		.delete(table.classTaskResponseResource)
		.where(
			eq(
				table.classTaskResponseResource.classTaskResponseId,
				classTaskResponseId,
			),
		);

	return resources.map((r) => r.resource);
}

export async function deleteResourceFromClassTaskResponse(
	classTaskResponseId: number,
	resourceId: number,
	userId: string,
) {
	const [resourceData] = await db
		.select({ resource: table.resource, response: table.classTaskResponse })
		.from(table.classTaskResponseResource)
		.innerJoin(
			table.resource,
			eq(table.classTaskResponseResource.resourceId, table.resource.id),
		)
		.innerJoin(
			table.classTaskResponse,
			eq(
				table.classTaskResponseResource.classTaskResponseId,
				table.classTaskResponse.id,
			),
		)
		.where(
			and(
				eq(
					table.classTaskResponseResource.classTaskResponseId,
					classTaskResponseId,
				),
				eq(table.classTaskResponseResource.resourceId, resourceId),
				eq(table.classTaskResponse.authorId, userId),
				eq(table.classTaskResponseResource.isArchived, false),
				eq(table.resource.isArchived, false),
			),
		);

	if (!resourceData) {
		throw new Error('Resource not found or access denied');
	}

	await db
		.delete(table.classTaskResponseResource)
		.where(
			and(
				eq(
					table.classTaskResponseResource.classTaskResponseId,
					classTaskResponseId,
				),
				eq(table.classTaskResponseResource.resourceId, resourceId),
			),
		);

	return resourceData.resource;
}

export async function addResourceToClassTaskResponse(
	classTaskResponseId: number,
	resourceId: number,
) {
	const [relationship] = await db
		.insert(table.classTaskResponseResource)
		.values({
			classTaskResponseId,
			resourceId,
			authorId: '', // This will be set by the calling function
		})
		.returning();

	return relationship;
}

export async function addResourcesToClassTaskResponse(
	classTaskResponseId: number,
	resourceIds: number[],
	authorId: string,
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
				authorId,
			})),
		)
		.onConflictDoNothing()
		.returning();

	return newRelationships;
}

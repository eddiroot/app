import {
	subjectClassAllocationAttendanceStatus,
	subjectThreadResponseTypeEnum,
	subjectThreadTypeEnum,
	taskTypeEnum,
	userTypeEnum,
	yearLevelEnum
} from '$lib/enums.js';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { and, asc, desc, eq, gte, inArray, lt, or } from 'drizzle-orm';
import type { EmbeddingMetadata } from '.';

export async function getSubjectsByUserId(userId: string) {
	const subjects = await db
		.select({ subject: table.subject, subjectOffering: table.subjectOffering })
		.from(table.userSubjectOffering)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectOffering.id, table.userSubjectOffering.subOfferingId)
		)
		.innerJoin(table.subject, eq(table.subjectOffering.subjectId, table.subject.id))
		.where(eq(table.userSubjectOffering.userId, userId));

	return subjects;
}

export async function getSubjectsOfferingsUserSubjectOfferingsByUserId(userId: string) {
	const subjectOfferings = await db
		.select({
			subjectOffering: table.subjectOffering,
			subject: table.subject,
			userSubjectOffering: table.userSubjectOffering
		})
		.from(table.userSubjectOffering)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectOffering.id, table.userSubjectOffering.subOfferingId)
		)
		.innerJoin(table.subject, eq(table.subject.id, table.subjectOffering.subjectId))
		.where(eq(table.userSubjectOffering.userId, userId));

	return subjectOfferings;
}

export async function getSubjectOfferingById(subjectOfferingId: number) {
	const subjectOffering = await db
		.select({
			subjectOffering: table.subjectOffering,
			subject: table.subject,
			coreSubject: table.coreSubject,
			electiveSubject: table.electiveSubject
		})
		.from(table.subjectOffering)
		.innerJoin(table.subject, eq(table.subject.id, table.subjectOffering.subjectId))
		.leftJoin(table.coreSubject, eq(table.coreSubject.id, table.subject.coreSubjectId))
		.leftJoin(table.electiveSubject, eq(table.electiveSubject.id, table.subject.electiveSubjectId))
		.where(eq(table.subjectOffering.id, subjectOfferingId))
		.limit(1);

	return subjectOffering?.length ? subjectOffering[0] : null;
}

export async function getSubjectById(subjectId: number) {
	const subject = await db
		.select({ subject: table.subject })
		.from(table.subject)
		.where(eq(table.subject.id, subjectId))
		.limit(1);

	return subject[0]?.subject;
}

export async function getSubjectBySubjectOfferingId(subjectOfferingId: number) {
	const [subject] = await db
		.select({
			subject: table.subject
		})
		.from(table.subjectOffering)
		.innerJoin(table.subject, eq(table.subject.id, table.subjectOffering.subjectId))
		.where(eq(table.subjectOffering.id, subjectOfferingId))
		.limit(1);

	return subject ? subject.subject : null;
}

export async function getSubjectBySubjectOfferingClassId(subjectOfferingClassId: number) {
	const [result] = await db
		.select({
			subject: table.subject
		})
		.from(table.subjectOfferingClass)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectOfferingClass.subOfferingId, table.subjectOffering.id)
		)
		.innerJoin(table.subject, eq(table.subjectOffering.subjectId, table.subject.id))
		.where(eq(table.subjectOfferingClass.id, subjectOfferingClassId))
		.limit(1);

	return result ? result.subject : null;
}

export async function getSubjectOfferingsBySchoolId(schoolId: number) {
	const subjectOfferings = await db
		.select({
			id: table.subjectOffering.id,
			year: table.subjectOffering.year,
			semester: table.subjectOffering.semester,
			subject: {
				id: table.subject.id,
				name: table.subject.name
			}
		})
		.from(table.subjectOffering)
		.innerJoin(table.subject, eq(table.subjectOffering.subjectId, table.subject.id))
		.where(and(eq(table.subject.schoolId, schoolId), eq(table.subjectOffering.isArchived, false)))
		.orderBy(
			asc(table.subject.name),
			asc(table.subjectOffering.year),
			asc(table.subjectOffering.semester)
		);

	return subjectOfferings;
}

export async function getSubjectOfferingsBySubjectId(subjectId: number) {
	const subjectOfferings = await db
		.select({
			subjectOffering: table.subjectOffering,
			subject: {
				id: table.subject.id,
				name: table.subject.name
			}
		})
		.from(table.subjectOffering)
		.innerJoin(table.subject, eq(table.subject.id, table.subjectOffering.subjectId))
		.where(eq(table.subjectOffering.subjectId, subjectId));

	return subjectOfferings; // Returns both subjectOffering and subject data
}

export async function getSubjectOfferingsByForTimetableByTimetableId(timetableId: number) {
	// First, get the timetable details
	const [timetableData] = await db
		.select({
			schoolId: table.timetable.schoolId,
			schoolYear: table.timetable.schoolYear,
			schoolSemesterId: table.timetable.schoolSemesterId
		})
		.from(table.timetable)
		.where(eq(table.timetable.id, timetableId))
		.limit(1);

	if (!timetableData) {
		return [];
	}

	// Get the semester number if schoolSemesterId is provided
	let semesterNumber: number | null = null;
	if (timetableData.schoolSemesterId) {
		const [semesterData] = await db
			.select({
				semNumber: table.schoolSemester.semNumber
			})
			.from(table.schoolSemester)
			.where(eq(table.schoolSemester.id, timetableData.schoolSemesterId))
			.limit(1);

		if (semesterData) {
			semesterNumber = semesterData.semNumber;
		}
	}

	// Build the query conditions
	const conditions = [
		eq(table.subject.schoolId, timetableData.schoolId),
		eq(table.subjectOffering.year, timetableData.schoolYear),
		eq(table.subjectOffering.isArchived, false),
		eq(table.subject.isArchived, false)
	];

	// Add semester condition if available
	if (semesterNumber !== null) {
		conditions.push(eq(table.subjectOffering.semester, semesterNumber));
	}

	// Get all subject offerings matching the timetable's school, year, and semester
	const subjectOfferings = await db
		.select({
			subjectOffering: table.subjectOffering,
			subject: table.subject
		})
		.from(table.subjectOffering)
		.innerJoin(table.subject, eq(table.subjectOffering.subjectId, table.subject.id))
		.where(and(...conditions))
		.orderBy(asc(table.subject.yearLevel), asc(table.subject.name));

	return subjectOfferings;
}

/**
 * Gets subject offerings for a specific year level (e.g., Year 8, Year 9) within a timetable's context.
 *
 * This function retrieves subject offerings where:
 * - The subject's yearLevel matches the specified yearLevel parameter (e.g., Year 8, Year 9)
 * - The offering's year matches the timetable's school year (e.g., 2025, 2026)
 * - The offering's semester matches the timetable's semester (if applicable)
 * - The offerings are for the timetable's school
 *
 * Note: "yearLevel" refers to the student grade level (Year 8, Year 9, etc.),
 * while the timetable's "schoolYear" refers to the calendar year (2025, 2026, etc.)
 *
 * @param timetableId - The ID of the timetable to scope the query to
 * @param yearLevel - The student year level (e.g., yearLevelEnum.year8, yearLevelEnum.year9)
 * @returns Subject offerings with their related subject data, filtered by year level
 */
export async function getSubjectOfferingsByYearLevelForTimetableByTimetableId(
	timetableId: number,
	yearLevel: yearLevelEnum
) {
	// First, get the timetable details
	const [timetableData] = await db
		.select({
			schoolId: table.timetable.schoolId,
			schoolYear: table.timetable.schoolYear,
			schoolSemesterId: table.timetable.schoolSemesterId
		})
		.from(table.timetable)
		.where(eq(table.timetable.id, timetableId))
		.limit(1);

	if (!timetableData) {
		return [];
	}

	// Get the semester number if schoolSemesterId is provided
	let semesterNumber: number | null = null;
	if (timetableData.schoolSemesterId) {
		const [semesterData] = await db
			.select({
				semNumber: table.schoolSemester.semNumber
			})
			.from(table.schoolSemester)
			.where(eq(table.schoolSemester.id, timetableData.schoolSemesterId))
			.limit(1);

		if (semesterData) {
			semesterNumber = semesterData.semNumber;
		}
	}

	// Build the query conditions
	// Note: subject.yearLevel = student grade level (Year 8, 9, etc.)
	//       subjectOffering.year = calendar year (2025, 2026, etc.)
	const conditions = [
		eq(table.subject.schoolId, timetableData.schoolId),
		eq(table.subject.yearLevel, yearLevel), // Filter by student grade level
		eq(table.subjectOffering.year, timetableData.schoolYear), // Filter by calendar year
		eq(table.subjectOffering.isArchived, false),
		eq(table.subject.isArchived, false)
	];

	// Add semester condition if available
	if (semesterNumber !== null) {
		conditions.push(eq(table.subjectOffering.semester, semesterNumber));
	}

	// Get all subject offerings matching the timetable's school, year, semester, and year level
	const subjectOfferings = await db
		.select({
			subjectOffering: table.subjectOffering,
			subject: table.subject
		})
		.from(table.subjectOffering)
		.innerJoin(table.subject, eq(table.subjectOffering.subjectId, table.subject.id))
		.where(and(...conditions))
		.orderBy(asc(table.subject.name));

	return subjectOfferings;
}

export async function getSubjectThreadsMinimalBySubjectId(subjectOfferingId: number) {
	const threads = await db
		.select({
			thread: {
				id: table.subjectThread.id,
				title: table.subjectThread.title,
				type: table.subjectThread.type,
				isAnonymous: table.subjectThread.isAnonymous,
				createdAt: table.subjectThread.createdAt
			},
			user: {
				id: table.user.id,
				firstName: table.user.firstName,
				middleName: table.user.middleName,
				lastName: table.user.lastName,
				avatarUrl: table.user.avatarUrl,
				type: table.user.type
			}
		})
		.from(table.subjectThread)
		.innerJoin(table.user, eq(table.user.id, table.subjectThread.userId))
		.where(eq(table.subjectThread.subjectOfferingId, subjectOfferingId))
		.orderBy(desc(table.subjectThread.createdAt));

	return threads;
}

export async function getSubjectThreadById(threadId: number) {
	const threads = await db
		.select({
			thread: table.subjectThread,
			user: {
				id: table.user.id,
				firstName: table.user.firstName,
				middleName: table.user.middleName,
				lastName: table.user.lastName,
				avatarUrl: table.user.avatarUrl,
				type: table.user.type
			}
		})
		.from(table.subjectThread)
		.innerJoin(table.user, eq(table.user.id, table.subjectThread.userId))
		.where(eq(table.subjectThread.id, threadId))
		.limit(1);

	if (threads.length === 0) {
		return null;
	}

	return threads[0];
}

export async function createSubjectThread(
	subjectOfferingId: number,
	userId: string,
	title: string,
	type: subjectThreadTypeEnum,
	content: string,
	isAnonymous: boolean,
	isArchived: boolean = false
) {
	const [thread] = await db
		.insert(table.subjectThread)
		.values({
			subjectOfferingId,
			userId,
			title,
			type,
			content,
			isAnonymous,
			isArchived
		})
		.returning();

	return thread;
}

export async function getSubjectThreadResponsesById(threadId: number) {
	const responses = await db
		.select({
			response: table.subjectThreadResponse,
			user: {
				id: table.user.id,
				firstName: table.user.firstName,
				middleName: table.user.middleName,
				lastName: table.user.lastName,
				avatarUrl: table.user.avatarUrl,
				type: table.user.type
			}
		})
		.from(table.subjectThreadResponse)
		.innerJoin(table.user, eq(table.user.id, table.subjectThreadResponse.userId))
		.where(eq(table.subjectThreadResponse.subjectThreadId, threadId))
		.orderBy(table.subjectThreadResponse.createdAt);

	return responses;
}

export async function createSubjectThreadResponse(
	type: subjectThreadResponseTypeEnum,
	subjectThreadId: number,
	userId: string,
	content: string,
	parentResponseId?: number | null,
	isAnonymous: boolean = false,
	isArchived: boolean = false
) {
	const [response] = await db
		.insert(table.subjectThreadResponse)
		.values({
			type,
			subjectThreadId,
			userId,
			content,
			parentResponseId: parentResponseId || null,
			isAnonymous,
			isArchived
		})
		.returning();

	return response;
}

export async function getRecentAnnouncementsByUserId(userId: string) {
	const oneWeekAgo = new Date();
	oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

	const announcements = await db
		.select({
			announcement: {
				id: table.subjectThread.id,
				title: table.subjectThread.title,
				content: table.subjectThread.content,
				createdAt: table.subjectThread.createdAt
			},
			subject: {
				id: table.subject.id,
				name: table.subject.name
			},
			subjectOffering: {
				id: table.subjectOffering.id
			}
		})
		.from(table.userSubjectOffering)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectOffering.id, table.userSubjectOffering.subOfferingId)
		)
		.innerJoin(table.subject, eq(table.subject.id, table.subjectOffering.subjectId))
		.innerJoin(
			table.subjectThread,
			and(
				eq(table.subjectThread.subjectOfferingId, table.subjectOffering.id),
				eq(table.subjectThread.type, subjectThreadTypeEnum.announcement),
				gte(table.subjectThread.createdAt, oneWeekAgo)
			)
		)
		.innerJoin(table.user, eq(table.user.id, table.subjectThread.userId))
		.where(eq(table.userSubjectOffering.userId, userId))
		.orderBy(desc(table.subjectThread.createdAt));

	return announcements;
}

export async function getAnnouncementsBySubjectOfferingClassId(subjectOfferingClassId: number) {
	const announcements = await db
		.select({
			id: table.subjectThread.id,
			title: table.subjectThread.title,
			content: table.subjectThread.content,
			createdAt: table.subjectThread.createdAt
		})
		.from(table.subjectOfferingClass)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectOfferingClass.subOfferingId, table.subjectOffering.id)
		)
		.innerJoin(
			table.subjectThread,
			and(
				eq(table.subjectThread.subjectOfferingId, table.subjectOffering.id),
				eq(table.subjectThread.type, subjectThreadTypeEnum.announcement)
			)
		)
		.where(eq(table.subjectOfferingClass.id, subjectOfferingClassId))
		.orderBy(desc(table.subjectThread.createdAt));

	return announcements;
}

export async function getTeachersForSubjectOfferingId(subjectOfferingId: number) {
	const teachers = await db
		.selectDistinct({
			teacher: table.user
		})
		.from(table.userSubjectOfferingClass)
		.innerJoin(table.user, eq(table.user.id, table.userSubjectOfferingClass.userId))
		.innerJoin(
			table.subjectOfferingClass,
			eq(table.userSubjectOfferingClass.subOffClassId, table.subjectOfferingClass.id)
		)
		.where(
			and(
				eq(table.subjectOfferingClass.subOfferingId, subjectOfferingId),
				eq(table.user.type, userTypeEnum.teacher)
			)
		)
		.orderBy(asc(table.user.lastName), asc(table.user.firstName));

	return teachers;
}

export async function getTeacherBySubjectOfferingIdForUserInClass(
	userId: string,
	subjectOfferingId: number
) {
	// First, get all subject class IDs that the user is enrolled in for this subject offering
	const userSubjectClasses = await db
		.select({
			subjectClassId: table.subjectOfferingClass.id
		})
		.from(table.userSubjectOfferingClass)
		.innerJoin(
			table.subjectOfferingClass,
			eq(table.userSubjectOfferingClass.subOffClassId, table.subjectOfferingClass.id)
		)
		.where(
			and(
				eq(table.userSubjectOfferingClass.userId, userId),
				eq(table.subjectOfferingClass.subOfferingId, subjectOfferingId),
				eq(table.userSubjectOfferingClass.isArchived, false) // Only consider non-archived records
			)
		);

	const subjectClassIds = userSubjectClasses.map((usc) => usc.subjectClassId);

	// Now get all unique teachers from those subject classes
	const teachers = await db
		.selectDistinct({
			teacher: {
				id: table.user.id,
				firstName: table.user.firstName,
				middleName: table.user.middleName,
				lastName: table.user.lastName,
				email: table.user.email,
				avatarUrl: table.user.avatarUrl
			}
		})
		.from(table.userSubjectOfferingClass)
		.innerJoin(table.user, eq(table.user.id, table.userSubjectOfferingClass.userId))
		.where(
			and(
				inArray(table.userSubjectOfferingClass.subOffClassId, subjectClassIds),
				eq(table.user.type, userTypeEnum.teacher),
				eq(table.userSubjectOfferingClass.isArchived, false) // Only consider non-archived records
			)
		);

	return teachers;
}

export async function getSubjectsBySchoolId(schoolId: number, includeArchived: boolean = false) {
	const subjects = await db
		.select({
			id: table.subject.id,
			name: table.subject.name,
			schoolId: table.subject.schoolId,
			yearLevel: table.subject.yearLevel,
			createdAt: table.subject.createdAt,
			updatedAt: table.subject.updatedAt
		})
		.from(table.subject)
		.where(
			and(
				eq(table.subject.schoolId, schoolId),
				includeArchived ? undefined : eq(table.subject.isArchived, false)
			)
		)
		.orderBy(asc(table.subject.yearLevel), asc(table.subject.name));

	return subjects;
}

export async function getSubjectsByYearLevel(
	schoolId: number,
	yearLevel: yearLevelEnum,
	includeArchived: boolean = false
) {
	const subjects = await db
		.select({
			id: table.subject.id,
			name: table.subject.name,
			schoolId: table.subject.schoolId,
			yearLevel: table.subject.yearLevel,
			createdAt: table.subject.createdAt,
			updatedAt: table.subject.updatedAt
		})
		.from(table.subject)
		.where(
			and(
				eq(table.subject.schoolId, schoolId),
				eq(table.subject.yearLevel, yearLevel),
				includeArchived ? undefined : eq(table.subject.isArchived, false)
			)
		)
		.orderBy(asc(table.subject.name));

	return subjects;
}

export async function getClassesByUserId(userId: string) {
	const classes = await db
		.select({
			subjectOfferingClass: table.subjectOfferingClass,
			subjectOffering: table.subjectOffering
		})
		.from(table.userSubjectOfferingClass)
		.innerJoin(
			table.subjectOfferingClass,
			eq(table.userSubjectOfferingClass.subOffClassId, table.subjectOfferingClass.id)
		)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectOfferingClass.subOfferingId, table.subjectOffering.id)
		)
		.where(eq(table.userSubjectOfferingClass.userId, userId))
		.orderBy(asc(table.subjectOfferingClass.id));

	return classes;
}

export async function getSubjectsWithClassesByUserId(userId: string) {
	// Get all subject offerings for the user
	const userSubjectOfferings = await db
		.select({
			subject: table.subject,
			subjectOffering: table.subjectOffering
		})
		.from(table.userSubjectOffering)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectOffering.id, table.userSubjectOffering.subOfferingId)
		)
		.innerJoin(table.subject, eq(table.subjectOffering.subjectId, table.subject.id))
		.where(eq(table.userSubjectOffering.userId, userId));

	// Get all classes for the user
	const userClasses = await db
		.select({
			subjectOfferingClass: table.subjectOfferingClass,
			subjectOffering: table.subjectOffering,
			subject: table.subject
		})
		.from(table.userSubjectOfferingClass)
		.innerJoin(
			table.subjectOfferingClass,
			eq(table.userSubjectOfferingClass.subOffClassId, table.subjectOfferingClass.id)
		)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectOfferingClass.subOfferingId, table.subjectOffering.id)
		)
		.innerJoin(table.subject, eq(table.subjectOffering.subjectId, table.subject.id))
		.where(eq(table.userSubjectOfferingClass.userId, userId))
		.orderBy(asc(table.subjectOfferingClass.id));

	// Group classes by subject offering
	const subjectsWithClasses = userSubjectOfferings.map((subjectOffering) => {
		const classes = userClasses.filter(
			(userClass) => userClass.subjectOffering.id === subjectOffering.subjectOffering.id
		);

		return {
			subject: subjectOffering.subject,
			subjectOffering: subjectOffering.subjectOffering,
			classes: classes.map((cls) => ({
				id: cls.subjectOfferingClass.id,
				name: cls.subjectOfferingClass.name,
				subOfferingId: cls.subjectOfferingClass.subOfferingId
			}))
		};
	});

	return subjectsWithClasses;
}

export async function getClassById(classId: number) {
	const classData = await db
		.select({
			subjectOfferingClass: table.subjectOfferingClass
		})
		.from(table.subjectOfferingClass)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectOffering.id, table.subjectOfferingClass.subOfferingId)
		)
		.innerJoin(table.subject, eq(table.subject.id, table.subjectOffering.subjectId))
		.where(eq(table.subjectOfferingClass.id, classId))
		.limit(1);

	return classData[0];
}

export async function getTeachersBySubjectOfferingClassId(subjectOfferingClassId: number) {
	const teachers = await db
		.select({
			teacher: {
				id: table.user.id,
				firstName: table.user.firstName,
				middleName: table.user.middleName,
				lastName: table.user.lastName,
				email: table.user.email,
				avatarUrl: table.user.avatarUrl
			}
		})
		.from(table.userSubjectOfferingClass)
		.innerJoin(table.user, eq(table.user.id, table.userSubjectOfferingClass.userId))
		.where(
			and(
				eq(table.userSubjectOfferingClass.subOffClassId, subjectOfferingClassId),
				eq(table.user.type, userTypeEnum.teacher)
			)
		);

	return teachers;
}

export async function getTasksBySubjectOfferingId(subjectOfferingId: number) {
	const offeringTasks = await db
		.select({
			subjectOfferingClassTask: table.subjectOfferingClassTask,
			task: table.task,
			courseMapItem: table.courseMapItem
		})
		.from(table.subjectOfferingClassTask)
		.innerJoin(table.task, eq(table.subjectOfferingClassTask.taskId, table.task.id))
		.leftJoin(
			table.courseMapItem,
			eq(table.courseMapItem.id, table.subjectOfferingClassTask.courseMapItemId)
		)
		.where(and(eq(table.courseMapItem.subjectOfferingId, subjectOfferingId)));

	return offeringTasks;
}

export async function getResourcesBySubjectOfferingClassId(subjectOfferingClassId: number) {
	const resources = await db
		.select({
			resource: table.resource,
			resourceRelation: table.subjectOfferingClassResource,
			author: table.user
		})
		.from(table.subjectOfferingClassResource)
		.innerJoin(table.resource, eq(table.resource.id, table.subjectOfferingClassResource.resourceId))
		.innerJoin(table.user, eq(table.user.id, table.subjectOfferingClassResource.authorId))
		.where(
			and(
				eq(table.subjectOfferingClassResource.subjectOfferingClassId, subjectOfferingClassId),
				eq(table.subjectOfferingClassResource.isArchived, false),
				eq(table.resource.isArchived, false)
			)
		)
		.orderBy(table.subjectOfferingClassResource.createdAt);

	return resources;
}

export async function addResourceToSubjectOfferingClass(
	subjectOfferingClassId: number,
	resourceId: number,
	authorId: string,
	title?: string,
	description?: string,
	coursemapItemId?: number
) {
	const [resourceRelation] = await db
		.insert(table.subjectOfferingClassResource)
		.values({
			resourceId,
			subjectOfferingClassId,
			authorId,
			title: title || null,
			description: description || null,
			coursemapItemId: coursemapItemId || null,
			isArchived: false
		})
		.returning();

	return resourceRelation;
}

export async function removeResourceFromSubjectOfferingClass(
	subjectOfferingClassId: number,
	resourceId: number
) {
	await db
		.update(table.subjectOfferingClassResource)
		.set({ isArchived: true })
		.where(
			and(
				eq(table.subjectOfferingClassResource.subjectOfferingClassId, subjectOfferingClassId),
				eq(table.subjectOfferingClassResource.resourceId, resourceId)
			)
		);
}

export async function getAssessmentsBySubjectOfferingClassId(subjectOfferingClassId: number) {
	const assessments = await db
		.select({
			subjectOfferingClassTask: table.subjectOfferingClassTask,
			task: table.task
		})
		.from(table.subjectOfferingClassTask)
		.innerJoin(table.task, eq(table.subjectOfferingClassTask.taskId, table.task.id))
		.where(
			and(
				eq(table.subjectOfferingClassTask.subjectOfferingClassId, subjectOfferingClassId),
				or(eq(table.task.type, taskTypeEnum.test), eq(table.task.type, taskTypeEnum.assignment))
			)
		)
		.orderBy(asc(table.subjectOfferingClassTask.index));

	return assessments;
}

export async function upsertSubjectClassAllocationAttendance(
	subjectClassAllocationId: number,
	userId: string,
	status: subjectClassAllocationAttendanceStatus,
	noteGuardian?: string | undefined | null,
	noteTeacher?: string | undefined | null,
	behaviourQuickActionIds?: number[]
) {
	return await db.transaction(async (tx) => {
		const [attendance] = await tx
			.insert(table.subjectClassAllocationAttendance)
			.values({
				subjectClassAllocationId,
				userId,
				status,
				noteGuardian,
				noteTeacher
			})
			.onConflictDoUpdate({
				target: [
					table.subjectClassAllocationAttendance.subjectClassAllocationId,
					table.subjectClassAllocationAttendance.userId
				],
				set: {
					status,
					noteGuardian,
					noteTeacher
				}
			})
			.returning();

		if (behaviourQuickActionIds !== undefined) {
			await tx
				.delete(table.attendanceBehaviourQuickAction)
				.where(eq(table.attendanceBehaviourQuickAction.attendanceId, attendance.id));

			if (behaviourQuickActionIds.length > 0) {
				await tx.insert(table.attendanceBehaviourQuickAction).values(
					behaviourQuickActionIds.map((behaviourQuickActionId) => ({
						attendanceId: attendance.id,
						behaviourQuickActionId
					}))
				);
			}
		}

		return attendance;
	});
}

export async function getSubjectYearLevelBySubjectOfferingId(subjectOfferingId: number) {
	const subject = await db
		.select({
			yearLevel: table.subject.yearLevel
		})
		.from(table.subjectOffering)
		.innerJoin(table.subject, eq(table.subject.id, table.subjectOffering.subjectId))
		.where(eq(table.subjectOffering.id, subjectOfferingId))
		.limit(1);

	return subject[0]?.yearLevel.toString() || null;
}

export async function getSubjectClassAllocationsByUserIdForDate(userId: string, date: Date) {
	// Format date as YYYY-MM-DD for comparison
	const dateStr = date.toISOString().split('T')[0];

	const classAllocations = await db
		.select({
			classAllocation: table.subjectClassAllocation,
			schoolSpace: table.schoolSpace,
			subjectOffering: {
				id: table.subjectOffering.id
			},
			subject: {
				id: table.subject.id,
				name: table.subject.name
			},
			userSubjectOffering: table.userSubjectOffering
		})
		.from(table.userSubjectOfferingClass)
		.innerJoin(
			table.subjectOfferingClass,
			eq(table.userSubjectOfferingClass.subOffClassId, table.subjectOfferingClass.id)
		)
		.innerJoin(
			table.subjectClassAllocation,
			eq(table.subjectClassAllocation.subjectOfferingClassId, table.subjectOfferingClass.id)
		)
		.innerJoin(
			table.schoolSpace,
			eq(table.subjectClassAllocation.schoolSpaceId, table.schoolSpace.id)
		)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectOfferingClass.subOfferingId, table.subjectOffering.id)
		)
		.innerJoin(table.subject, eq(table.subjectOffering.subjectId, table.subject.id))
		.innerJoin(
			table.userSubjectOffering,
			and(
				eq(table.userSubjectOffering.subOfferingId, table.subjectOffering.id),
				eq(table.userSubjectOffering.userId, userId)
			)
		)
		.where(
			and(
				eq(table.userSubjectOfferingClass.userId, userId),
				eq(table.subjectClassAllocation.date, dateStr)
			)
		)
		.orderBy(table.subjectClassAllocation.startTime);

	return classAllocations;
}

export async function getSubjectClassAllocationsByUserIdForWeek(
	userId: string,
	weekStartDate: Date
) {
	// Calculate start and end of the week (Monday to Sunday)
	const weekStart = new Date(weekStartDate);
	const dayOfWeek = weekStart.getDay();
	const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // If Sunday (0), go back 6 days; otherwise go to previous Monday
	weekStart.setDate(weekStart.getDate() + mondayOffset);
	weekStart.setHours(0, 0, 0, 0);

	const weekEnd = new Date(weekStart);
	weekEnd.setDate(weekStart.getDate() + 7); // Next Monday
	weekEnd.setHours(0, 0, 0, 0);

	// Format dates as YYYY-MM-DD for comparison
	const weekStartStr = weekStart.toISOString().split('T')[0];
	const weekEndStr = weekEnd.toISOString().split('T')[0];

	const classAllocations = await db
		.select({
			classAllocation: table.subjectClassAllocation,
			schoolSpace: table.schoolSpace,
			subjectOffering: {
				id: table.subjectOffering.id
			},
			subject: {
				id: table.subject.id,
				name: table.subject.name
			},
			userSubjectOffering: table.userSubjectOffering
		})
		.from(table.userSubjectOfferingClass)
		.innerJoin(
			table.subjectOfferingClass,
			eq(table.userSubjectOfferingClass.subOffClassId, table.subjectOfferingClass.id)
		)
		.innerJoin(
			table.subjectClassAllocation,
			eq(table.subjectClassAllocation.subjectOfferingClassId, table.subjectOfferingClass.id)
		)
		.innerJoin(
			table.schoolSpace,
			eq(table.subjectClassAllocation.schoolSpaceId, table.schoolSpace.id)
		)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectOfferingClass.subOfferingId, table.subjectOffering.id)
		)
		.innerJoin(table.subject, eq(table.subjectOffering.subjectId, table.subject.id))
		.innerJoin(
			table.userSubjectOffering,
			and(
				eq(table.userSubjectOffering.subOfferingId, table.subjectOffering.id),
				eq(table.userSubjectOffering.userId, userId)
			)
		)
		.where(
			and(
				eq(table.userSubjectOfferingClass.userId, userId),
				gte(table.subjectClassAllocation.date, weekStartStr),
				lt(table.subjectClassAllocation.date, weekEndStr)
			)
		)
		.orderBy(table.subjectClassAllocation.date, table.subjectClassAllocation.startTime);

	return classAllocations;
}

// ============================================================================
// SUBJECT SELECTION CONSTRAINT METHODS
// ============================================================================

/**
 * Get all subject selection constraints for a school and year level
 */
export async function getSubjectSelectionConstraints(
	schoolId: number,
	yearLevel: yearLevelEnum,
	year: number
) {
	const constraints = await db
		.select({
			constraint: table.subjectSelectionConstraint,
			subjects: table.subjectSelectionConstraintSubject
		})
		.from(table.subjectSelectionConstraint)
		.leftJoin(
			table.subjectSelectionConstraintSubject,
			eq(table.subjectSelectionConstraintSubject.constraintId, table.subjectSelectionConstraint.id)
		)
		.where(
			and(
				eq(table.subjectSelectionConstraint.schoolId, schoolId),
				eq(table.subjectSelectionConstraint.yearLevel, yearLevel),
				eq(table.subjectSelectionConstraint.year, year)
			)
		)
		.orderBy(asc(table.subjectSelectionConstraint.createdAt));

	// Group subjects by constraint
	const constraintMap = new Map<
		number,
		{
			constraint: typeof table.subjectSelectionConstraint.$inferSelect;
			subjects: Array<typeof table.subjectSelectionConstraintSubject.$inferSelect>;
		}
	>();

	for (const row of constraints) {
		if (!constraintMap.has(row.constraint.id)) {
			constraintMap.set(row.constraint.id, {
				constraint: row.constraint,
				subjects: []
			});
		}
		if (row.subjects) {
			constraintMap.get(row.constraint.id)!.subjects.push(row.subjects);
		}
	}

	return Array.from(constraintMap.values());
}

/**
 * Get a single subject selection constraint by ID
 */
export async function getSubjectSelectionConstraintById(constraintId: number) {
	const [constraint] = await db
		.select()
		.from(table.subjectSelectionConstraint)
		.where(eq(table.subjectSelectionConstraint.id, constraintId))
		.limit(1);

	if (!constraint) {
		return null;
	}

	const subjects = await db
		.select()
		.from(table.subjectSelectionConstraintSubject)
		.where(eq(table.subjectSelectionConstraintSubject.constraintId, constraintId));

	return {
		constraint,
		subjects
	};
}

/**
 * Create a new subject selection constraint
 */
export async function createSubjectSelectionConstraint(
	schoolId: number,
	yearLevel: yearLevelEnum,
	year: number,
	name: string,
	description: string | null,
	min: number,
	max: number | null,
	subjectIds: number[]
) {
	const [constraint] = await db
		.insert(table.subjectSelectionConstraint)
		.values({
			schoolId,
			yearLevel,
			year,
			name,
			description,
			min,
			max
		})
		.returning();

	if (subjectIds.length > 0) {
		await db.insert(table.subjectSelectionConstraintSubject).values(
			subjectIds.map((subjectId) => ({
				constraintId: constraint.id,
				subjectId
			}))
		);
	}

	return constraint;
}

/**
 * Update a subject selection constraint
 */
export async function updateSubjectSelectionConstraint(
	constraintId: number,
	name: string,
	description: string | null,
	min: number,
	max: number | null,
	subjectIds: number[]
) {
	// Update the constraint
	const [constraint] = await db
		.update(table.subjectSelectionConstraint)
		.set({
			name,
			description,
			min,
			max,
			updatedAt: new Date()
		})
		.where(eq(table.subjectSelectionConstraint.id, constraintId))
		.returning();

	// Delete existing subject associations
	await db
		.delete(table.subjectSelectionConstraintSubject)
		.where(eq(table.subjectSelectionConstraintSubject.constraintId, constraintId));

	// Insert new subject associations
	if (subjectIds.length > 0) {
		await db.insert(table.subjectSelectionConstraintSubject).values(
			subjectIds.map((subjectId) => ({
				constraintId: constraint.id,
				subjectId
			}))
		);
	}

	return constraint;
}

/**
 * Delete a subject selection constraint
 */
export async function deleteSubjectSelectionConstraint(constraintId: number) {
	await db
		.delete(table.subjectSelectionConstraint)
		.where(eq(table.subjectSelectionConstraint.id, constraintId));
}

/**
 * Get all behaviour quick actions for a school
 */
export async function getBehaviourQuickActionsBySchoolId(schoolId: number) {
	const behaviourQuickActions = await db
		.select()
		.from(table.behaviourQuickAction)
		.where(
			and(
				eq(table.behaviourQuickAction.schoolId, schoolId),
				eq(table.behaviourQuickAction.isArchived, false)
			)
		)
		.orderBy(asc(table.behaviourQuickAction.name));

	return behaviourQuickActions;
}

/**
 * Create a new behaviour quick action
 */
export async function createBehaviourQuickAction(
	schoolId: number,
	name: string,
	description?: string | null
) {
	const [behaviourQuickAction] = await db
		.insert(table.behaviourQuickAction)
		.values({
			schoolId,
			name,
			description: description || null
		})
		.returning();

	return behaviourQuickAction;
}

/**
 * Update a behaviour quick action
 */
export async function updateBehaviourQuickAction(
	id: number,
	name: string,
	description?: string | null
) {
	const [behaviourQuickAction] = await db
		.update(table.behaviourQuickAction)
		.set({
			name,
			description: description || null,
			updatedAt: new Date()
		})
		.where(eq(table.behaviourQuickAction.id, id))
		.returning();

	return behaviourQuickAction;
}

/**
 * Delete (archive) a behaviour quick action
 */
export async function deleteBehaviourQuickAction(id: number) {
	await db
		.update(table.behaviourQuickAction)
		.set({
			isArchived: true,
			updatedAt: new Date()
		})
		.where(eq(table.behaviourQuickAction.id, id));
}

/**
 * Get behaviour quick actions for an attendance record
 */
export async function getBehaviourQuickActionsByAttendanceId(attendanceId: number) {
	const behaviourQuickActions = await db
		.select({
			behaviourQuickAction: table.behaviourQuickAction
		})
		.from(table.attendanceBehaviourQuickAction)
		.innerJoin(
			table.behaviourQuickAction,
			eq(table.attendanceBehaviourQuickAction.behaviourQuickActionId, table.behaviourQuickAction.id)
		)
		.where(eq(table.attendanceBehaviourQuickAction.attendanceId, attendanceId));

	return behaviourQuickActions.map((row) => row.behaviourQuickAction);

}
export async function getSubjectOfferingMetadataByOfferingId(
	subjectOfferingId: number
): Promise<{
	curriculumSubjectId: number | undefined;
	yearLevel: yearLevelEnum ;
}> {
	const result = await db
		.select({
			curriculumSubjectId: table.coreSubject.curriculumSubjectId,
			yearLevel: table.subject.yearLevel
		})
		.from(table.subjectOffering)
		.innerJoin(table.subject, eq(table.subjectOffering.subjectId, table.subject.id))
		.leftJoin(table.coreSubject, eq(table.subject.coreSubjectId, table.coreSubject.id))
		.where(eq(table.subjectOffering.id, subjectOfferingId))
		.limit(1);

	if (result.length === 0) {
		return { curriculumSubjectId: undefined, yearLevel: yearLevelEnum.none };
	}
	
	return {
		curriculumSubjectId: result[0].curriculumSubjectId ?? undefined	,
		yearLevel: result[0].yearLevel
	};
}

export async function getSubjectThreadEmbeddingMetadata(record: Record<string, unknown>): Promise<EmbeddingMetadata> {
	const [result] = await db
		.select({
			subjectOfferingId: table.subjectThread.subjectOfferingId,
			subjectId: table.subject.id,
			yearLevel: table.subject.yearLevel
		})
		.from(table.subjectThread)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectThread.subjectOfferingId, table.subjectOffering.id)
		)
		.innerJoin(table.subject, eq(table.subjectOffering.subjectId, table.subject.id))
		.where(eq(table.subjectThread.id, record.id as number))
		.limit(1);

	return {
		subjectOfferingId: result.subjectOfferingId,
		subjectId: result.subjectId,
		yearLevel: result.yearLevel
	};
}

export async function getSubjectThreadResponseEmbeddingMetadata(record: Record<string, unknown>): Promise<EmbeddingMetadata> {
	const [result] = await db
		.select({
			subjectOfferingId: table.subjectThread.subjectOfferingId,
			subjectId: table.subject.id,
			yearLevel: table.subject.yearLevel
		})
		.from(table.subjectThreadResponse)
		.innerJoin(
			table.subjectThread,
			eq(table.subjectThreadResponse.subjectThreadId, table.subjectThread.id)
		)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectThread.subjectOfferingId, table.subjectOffering.id)
		)
		.innerJoin(table.subject, eq(table.subjectOffering.subjectId, table.subject.id))
		.where(eq(table.subjectThreadResponse.id, record.id as number))
		.limit(1);
		
	return {
		subjectOfferingId: result.subjectOfferingId,
		subjectId: result.subjectId,
		yearLevel: result.yearLevel
	};
}


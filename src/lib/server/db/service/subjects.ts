import {
	subjectClassAllocationAttendanceComponentType,
	subjectClassAllocationAttendanceStatus,
	subjectThreadTypeEnum,
	taskTypeEnum,
	userTypeEnum,
	yearLevelEnum,
} from '$lib/enums.js';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { and, asc, desc, eq, gte, inArray, lt, lte, or } from 'drizzle-orm';

export async function getSubjectsByUserId(userId: string) {
	const subjects = await db
		.select({ subject: table.subject, subjectOffering: table.subjectOffering })
		.from(table.userSubjectOffering)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectOffering.id, table.userSubjectOffering.subOfferingId),
		)
		.innerJoin(
			table.subject,
			eq(table.subjectOffering.subjectId, table.subject.id),
		)
		.where(eq(table.userSubjectOffering.userId, userId));

	return subjects;
}

export async function getSubjectsOfferingsUserSubjectOfferingsByUserId(
	userId: string,
) {
	const subjectOfferings = await db
		.select({
			subjectOffering: table.subjectOffering,
			subject: table.subject,
			userSubjectOffering: table.userSubjectOffering,
		})
		.from(table.userSubjectOffering)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectOffering.id, table.userSubjectOffering.subOfferingId),
		)
		.innerJoin(
			table.subject,
			eq(table.subject.id, table.subjectOffering.subjectId),
		)
		.where(eq(table.userSubjectOffering.userId, userId));

	return subjectOfferings;
}

export async function getSubjectOfferingById(subjectOfferingId: number) {
	const subjectOffering = await db
		.select({
			subjectOffering: table.subjectOffering,
			subject: table.subject,
			subjectGroup: table.subjectGroup,
		})
		.from(table.subjectOffering)
		.innerJoin(
			table.subject,
			eq(table.subject.id, table.subjectOffering.subjectId),
		)
		.leftJoin(
			table.subjectGroup,
			eq(table.subjectGroup.id, table.subject.subjectGroupId),
		)
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
		.select({ subject: table.subject })
		.from(table.subjectOffering)
		.innerJoin(
			table.subject,
			eq(table.subject.id, table.subjectOffering.subjectId),
		)
		.where(eq(table.subjectOffering.id, subjectOfferingId))
		.limit(1);

	return subject ? subject.subject : null;
}

export async function getSubjectBySubjectOfferingClassId(
	subjectOfferingClassId: number,
) {
	const [result] = await db
		.select({ subject: table.subject })
		.from(table.subjectOfferingClass)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectOfferingClass.subOfferingId, table.subjectOffering.id),
		)
		.innerJoin(
			table.subject,
			eq(table.subjectOffering.subjectId, table.subject.id),
		)
		.where(eq(table.subjectOfferingClass.id, subjectOfferingClassId))
		.limit(1);

	return result ? result.subject : null;
}

export async function getSubjectOfferingsBySchoolId(schoolId: number) {
	const subjectOfferings = await db
		.select({
			id: table.subjectOffering.id,
			year: table.subjectOffering.year,
			subject: { id: table.subject.id, name: table.subject.name },
		})
		.from(table.subjectOffering)
		.innerJoin(
			table.subject,
			eq(table.subjectOffering.subjectId, table.subject.id),
		)
		.where(
			and(
				eq(table.subject.schoolId, schoolId),
				eq(table.subjectOffering.isArchived, false),
			),
		)
		.orderBy(asc(table.subject.name), asc(table.subjectOffering.year));

	return subjectOfferings;
}

export async function getSubjectOfferingsBySubjectId(subjectId: number) {
	const subjectOfferings = await db
		.select({
			subjectOffering: table.subjectOffering,
			subject: { id: table.subject.id, name: table.subject.name },
		})
		.from(table.subjectOffering)
		.innerJoin(
			table.subject,
			eq(table.subject.id, table.subjectOffering.subjectId),
		)
		.where(eq(table.subjectOffering.subjectId, subjectId));

	return subjectOfferings; // Returns both subjectOffering and subject data
}

export async function getSubjectOfferingsByForTimetableByTimetableId(
	timetableId: number,
) {
	// First, get the timetable details
	const [timetableData] = await db
		.select({
			schoolId: table.timetable.schoolId,
			year: table.timetable.year,
			schoolSemesterId: table.timetable.schoolSemesterId,
		})
		.from(table.timetable)
		.where(eq(table.timetable.id, timetableId))
		.limit(1);

	if (!timetableData) {
		return [];
	}

	// Build the query conditions
	const conditions = [
		eq(table.subject.schoolId, timetableData.schoolId),
		eq(table.subjectOffering.year, timetableData.year),
		eq(table.subjectOffering.isArchived, false),
		eq(table.subject.isArchived, false),
	];

	// Get all subject offerings matching the timetable's school, year, and semester
	const subjectOfferings = await db
		.select({ subjectOffering: table.subjectOffering, subject: table.subject })
		.from(table.subjectOffering)
		.innerJoin(
			table.subject,
			eq(table.subjectOffering.subjectId, table.subject.id),
		)
		.innerJoin(
			table.schoolYearLevel,
			eq(table.subject.schoolYearLevelId, table.schoolYearLevel.id),
		)
		.where(and(...conditions))
		.orderBy(asc(table.schoolYearLevel.code), asc(table.subject.name));

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
	yearLevel: yearLevelEnum,
) {
	// First, get the timetable details
	const [timetableData] = await db
		.select({
			schoolId: table.timetable.schoolId,
			year: table.timetable.year,
			schoolSemesterId: table.timetable.schoolSemesterId,
		})
		.from(table.timetable)
		.where(eq(table.timetable.id, timetableId))
		.limit(1);

	if (!timetableData) {
		return [];
	}

	// Build the query conditions
	// Note: subject.schoolYearLevel = student grade level (Year 8, 9, etc.)
	//       subjectOffering.year = calendar year (2025, 2026, etc.)
	const conditions = [
		eq(table.subject.schoolId, timetableData.schoolId),
		eq(table.schoolYearLevel.code, yearLevel), // Filter by student grade level
		eq(table.subjectOffering.year, timetableData.year), // Filter by calendar year
		eq(table.subjectOffering.isArchived, false),
		eq(table.subject.isArchived, false),
	];

	// Get all subject offerings matching the timetable's school, year, semester, and year level
	const subjectOfferings = await db
		.select({ subjectOffering: table.subjectOffering, subject: table.subject })
		.from(table.subjectOffering)
		.innerJoin(
			table.subject,
			eq(table.subjectOffering.subjectId, table.subject.id),
		)
		.innerJoin(
			table.schoolYearLevel,
			eq(table.subject.schoolYearLevelId, table.schoolYearLevel.id),
		)
		.where(and(...conditions))
		.orderBy(asc(table.subject.name));

	return subjectOfferings;
}

export async function getSubjectThreadsMinimalBySubjectId(
	subjectOfferingId: number,
) {
	const threads = await db
		.select({
			thread: {
				id: table.subjectThread.id,
				title: table.subjectThread.title,
				type: table.subjectThread.type,
				isAnonymous: table.subjectThread.isAnonymous,
				createdAt: table.subjectThread.createdAt,
			},
			user: {
				id: table.user.id,
				firstName: table.user.firstName,
				middleName: table.user.middleName,
				lastName: table.user.lastName,
				avatarPath: table.user.avatarPath,
				type: table.user.type,
			},
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
				avatarPath: table.user.avatarPath,
				type: table.user.type,
			},
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

export async function getSubjectThreadResponsesById(threadId: number) {
	const responses = await db
		.select({
			response: table.subjectThreadResponse,
			user: {
				id: table.user.id,
				firstName: table.user.firstName,
				middleName: table.user.middleName,
				lastName: table.user.lastName,
				avatarPath: table.user.avatarPath,
				type: table.user.type,
			},
		})
		.from(table.subjectThreadResponse)
		.innerJoin(
			table.user,
			eq(table.user.id, table.subjectThreadResponse.userId),
		)
		.where(eq(table.subjectThreadResponse.subjectThreadId, threadId))
		.orderBy(table.subjectThreadResponse.createdAt);

	return responses;
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
				createdAt: table.subjectThread.createdAt,
			},
			subject: { id: table.subject.id, name: table.subject.name },
			subjectOffering: { id: table.subjectOffering.id },
		})
		.from(table.userSubjectOffering)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectOffering.id, table.userSubjectOffering.subOfferingId),
		)
		.innerJoin(
			table.subject,
			eq(table.subject.id, table.subjectOffering.subjectId),
		)
		.innerJoin(
			table.subjectThread,
			and(
				eq(table.subjectThread.subjectOfferingId, table.subjectOffering.id),
				eq(table.subjectThread.type, subjectThreadTypeEnum.announcement),
				gte(table.subjectThread.createdAt, oneWeekAgo),
			),
		)
		.innerJoin(table.user, eq(table.user.id, table.subjectThread.userId))
		.where(eq(table.userSubjectOffering.userId, userId))
		.orderBy(desc(table.subjectThread.createdAt));

	return announcements;
}

export async function getAnnouncementsBySubjectOfferingClassId(
	subjectOfferingClassId: number,
) {
	const announcements = await db
		.select({
			id: table.subjectThread.id,
			title: table.subjectThread.title,
			content: table.subjectThread.content,
			createdAt: table.subjectThread.createdAt,
		})
		.from(table.subjectOfferingClass)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectOfferingClass.subOfferingId, table.subjectOffering.id),
		)
		.innerJoin(
			table.subjectThread,
			and(
				eq(table.subjectThread.subjectOfferingId, table.subjectOffering.id),
				eq(table.subjectThread.type, subjectThreadTypeEnum.announcement),
			),
		)
		.where(eq(table.subjectOfferingClass.id, subjectOfferingClassId))
		.orderBy(desc(table.subjectThread.createdAt));

	return announcements;
}

export async function getTeachersForSubjectOfferingId(
	subjectOfferingId: number,
) {
	const teachers = await db
		.selectDistinct({ teacher: table.user })
		.from(table.userSubjectOfferingClass)
		.innerJoin(
			table.user,
			eq(table.user.id, table.userSubjectOfferingClass.userId),
		)
		.innerJoin(
			table.subjectOfferingClass,
			eq(
				table.userSubjectOfferingClass.subOffClassId,
				table.subjectOfferingClass.id,
			),
		)
		.where(
			and(
				eq(table.subjectOfferingClass.subOfferingId, subjectOfferingId),
				eq(table.user.type, userTypeEnum.teacher),
			),
		)
		.orderBy(asc(table.user.lastName), asc(table.user.firstName));

	return teachers;
}

export async function getTeacherBySubjectOfferingIdForUserInClass(
	userId: string,
	subjectOfferingId: number,
) {
	// First, get all subject class IDs that the user is enrolled in for this subject offering
	const userSubjectClasses = await db
		.select({ subjectClassId: table.subjectOfferingClass.id })
		.from(table.userSubjectOfferingClass)
		.innerJoin(
			table.subjectOfferingClass,
			eq(
				table.userSubjectOfferingClass.subOffClassId,
				table.subjectOfferingClass.id,
			),
		)
		.where(
			and(
				eq(table.userSubjectOfferingClass.userId, userId),
				eq(table.subjectOfferingClass.subOfferingId, subjectOfferingId),
				eq(table.userSubjectOfferingClass.isArchived, false),
			),
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
				avatarPath: table.user.avatarPath,
			},
		})
		.from(table.userSubjectOfferingClass)
		.innerJoin(
			table.user,
			eq(table.user.id, table.userSubjectOfferingClass.userId),
		)
		.where(
			and(
				inArray(table.userSubjectOfferingClass.subOffClassId, subjectClassIds),
				eq(table.user.type, userTypeEnum.teacher),
				eq(table.userSubjectOfferingClass.isArchived, false),
			),
		);

	return teachers;
}

export async function getSubjectsBySchoolId(
	schoolId: number,
	includeArchived: boolean = false,
) {
	const subjects = await db
		.select({
			id: table.subject.id,
			name: table.subject.name,
			yearLevel: table.schoolYearLevel.code,
			schoolId: table.subject.schoolId,
			createdAt: table.subject.createdAt,
			updatedAt: table.subject.updatedAt,
		})
		.from(table.subject)
		.innerJoin(
			table.schoolYearLevel,
			eq(table.subject.schoolYearLevelId, table.schoolYearLevel.id),
		)
		.where(
			and(
				eq(table.subject.schoolId, schoolId),
				includeArchived ? undefined : eq(table.subject.isArchived, false),
			),
		)
		.orderBy(asc(table.schoolYearLevel.code), asc(table.subject.name));

	return subjects;
}

export async function getClassesByUserId(userId: string) {
	const classes = await db
		.select({
			subjectOfferingClass: table.subjectOfferingClass,
			subjectOffering: table.subjectOffering,
		})
		.from(table.userSubjectOfferingClass)
		.innerJoin(
			table.subjectOfferingClass,
			eq(
				table.userSubjectOfferingClass.subOffClassId,
				table.subjectOfferingClass.id,
			),
		)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectOfferingClass.subOfferingId, table.subjectOffering.id),
		)
		.where(eq(table.userSubjectOfferingClass.userId, userId))
		.orderBy(asc(table.subjectOfferingClass.id));

	return classes;
}

export async function getSubjectsWithClassesByUserId(userId: string) {
	// Get all subject offerings for the user
	const userSubjectOfferings = await db
		.select({ subject: table.subject, subjectOffering: table.subjectOffering })
		.from(table.userSubjectOffering)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectOffering.id, table.userSubjectOffering.subOfferingId),
		)
		.innerJoin(
			table.subject,
			eq(table.subjectOffering.subjectId, table.subject.id),
		)
		.where(eq(table.userSubjectOffering.userId, userId));

	// Get all classes for the user
	const userClasses = await db
		.select({
			subjectOfferingClass: table.subjectOfferingClass,
			subjectOffering: table.subjectOffering,
			subject: table.subject,
		})
		.from(table.userSubjectOfferingClass)
		.innerJoin(
			table.subjectOfferingClass,
			eq(
				table.userSubjectOfferingClass.subOffClassId,
				table.subjectOfferingClass.id,
			),
		)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectOfferingClass.subOfferingId, table.subjectOffering.id),
		)
		.innerJoin(
			table.subject,
			eq(table.subjectOffering.subjectId, table.subject.id),
		)
		.where(eq(table.userSubjectOfferingClass.userId, userId))
		.orderBy(asc(table.subjectOfferingClass.id));

	// Group classes by subject offering
	const subjectsWithClasses = userSubjectOfferings.map((subjectOffering) => {
		const classes = userClasses.filter(
			(userClass) =>
				userClass.subjectOffering.id === subjectOffering.subjectOffering.id,
		);

		return {
			subject: subjectOffering.subject,
			subjectOffering: subjectOffering.subjectOffering,
			classes: classes.map((cls) => ({
				id: cls.subjectOfferingClass.id,
				name: cls.subjectOfferingClass.name,
				subOfferingId: cls.subjectOfferingClass.subOfferingId,
			})),
		};
	});

	return subjectsWithClasses;
}

export async function getClassById(classId: number) {
	const classData = await db
		.select({ subjectOfferingClass: table.subjectOfferingClass })
		.from(table.subjectOfferingClass)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectOffering.id, table.subjectOfferingClass.subOfferingId),
		)
		.innerJoin(
			table.subject,
			eq(table.subject.id, table.subjectOffering.subjectId),
		)
		.where(eq(table.subjectOfferingClass.id, classId))
		.limit(1);

	return classData[0];
}

export async function getTeachersBySubjectOfferingClassId(
	subjectOfferingClassId: number,
) {
	const teachers = await db
		.select({
			teacher: {
				id: table.user.id,
				firstName: table.user.firstName,
				middleName: table.user.middleName,
				lastName: table.user.lastName,
				email: table.user.email,
				avatarPath: table.user.avatarPath,
			},
		})
		.from(table.userSubjectOfferingClass)
		.innerJoin(
			table.user,
			eq(table.user.id, table.userSubjectOfferingClass.userId),
		)
		.where(
			and(
				eq(
					table.userSubjectOfferingClass.subOffClassId,
					subjectOfferingClassId,
				),
				eq(table.user.type, userTypeEnum.teacher),
			),
		);

	return teachers;
}

export async function getTasksBySubjectOfferingId(subjectOfferingId: number) {
	const offeringTasks = await db
		.select({
			subjectOfferingClassTask: table.subjectOfferingClassTask,
			task: table.task,
			courseMapItem: table.courseMapItem,
		})
		.from(table.subjectOfferingClassTask)
		.innerJoin(
			table.task,
			eq(table.subjectOfferingClassTask.taskId, table.task.id),
		)
		.leftJoin(
			table.courseMapItem,
			eq(
				table.courseMapItem.id,
				table.subjectOfferingClassTask.courseMapItemId,
			),
		)
		.where(and(eq(table.courseMapItem.subjectOfferingId, subjectOfferingId)));

	return offeringTasks;
}

export async function getResourcesBySubjectOfferingClassId(
	subjectOfferingClassId: number,
) {
	const resources = await db
		.select({
			resource: table.resource,
			resourceRelation: table.subjectOfferingClassResource,
			author: table.user,
		})
		.from(table.subjectOfferingClassResource)
		.innerJoin(
			table.resource,
			eq(table.resource.id, table.subjectOfferingClassResource.resourceId),
		)
		.innerJoin(
			table.user,
			eq(table.user.id, table.subjectOfferingClassResource.authorId),
		)
		.where(
			and(
				eq(
					table.subjectOfferingClassResource.subjectOfferingClassId,
					subjectOfferingClassId,
				),
				eq(table.subjectOfferingClassResource.isArchived, false),
				eq(table.resource.isArchived, false),
			),
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
	coursemapItemId?: number,
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
		})
		.returning();

	return resourceRelation;
}

export async function removeResourceFromSubjectOfferingClass(
	subjectOfferingClassId: number,
	resourceId: number,
) {
	await db
		.update(table.subjectOfferingClassResource)
		.set({ isArchived: true })
		.where(
			and(
				eq(
					table.subjectOfferingClassResource.subjectOfferingClassId,
					subjectOfferingClassId,
				),
				eq(table.subjectOfferingClassResource.resourceId, resourceId),
			),
		);
}

export async function getAssessmentsBySubjectOfferingClassId(
	subjectOfferingClassId: number,
) {
	const assessments = await db
		.select({
			subjectOfferingClassTask: table.subjectOfferingClassTask,
			task: table.task,
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
					eq(table.task.type, taskTypeEnum.test),
					eq(table.task.type, taskTypeEnum.assignment),
				),
			),
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
	behaviourIds?: number[],
) {
	return await db.transaction(async (tx) => {
		// Get class allocation details for time calculation
		const [classAllocation] = await tx
			.select({
				start: table.subjectClassAllocation.start,
				end: table.subjectClassAllocation.end,
			})
			.from(table.subjectClassAllocation)
			.where(eq(table.subjectClassAllocation.id, subjectClassAllocationId))
			.limit(1);

		// Check if attendance already exists
		const [existingAttendance] = await tx
			.select()
			.from(table.subjectClassAllocationAttendance)
			.where(
				and(
					eq(
						table.subjectClassAllocationAttendance.subjectClassAllocationId,
						subjectClassAllocationId,
					),
					eq(table.subjectClassAllocationAttendance.userId, userId),
				),
			)
			.limit(1);

		const isNewAttendance = !existingAttendance;

		const [attendance] = await tx
			.insert(table.subjectClassAllocationAttendance)
			.values({
				subjectClassAllocationId,
				userId,
				status,
				noteGuardian,
				noteTeacher,
			})
			.onConflictDoUpdate({
				target: [
					table.subjectClassAllocationAttendance.subjectClassAllocationId,
					table.subjectClassAllocationAttendance.userId,
				],
				set: { status, noteGuardian, noteTeacher },
			})
			.returning();

		// Handle attendance components
		if (classAllocation) {
			// Get current time as HH:MM:SS
			const now = new Date();

			// Determine component type based on status
			const componentType =
				status === subjectClassAllocationAttendanceStatus.present
					? subjectClassAllocationAttendanceComponentType.present
					: subjectClassAllocationAttendanceComponentType.absent;

			if (isNewAttendance) {
				// Create initial component for entire class duration
				await tx
					.insert(table.subjectClassAllocationAttendanceComponent)
					.values({
						attendanceId: attendance.id,
						type: componentType,
						start: classAllocation.start,
						end: classAllocation.end,
					});
			} else {
				// Get existing components to check if we need to update them
				const existingComponents = await tx
					.select()
					.from(table.subjectClassAllocationAttendanceComponent)
					.where(
						eq(
							table.subjectClassAllocationAttendanceComponent.attendanceId,
							attendance.id,
						),
					)
					.orderBy(table.subjectClassAllocationAttendanceComponent.start);

				// Check if the last component has a different type than the new status
				const lastComponent = existingComponents[existingComponents.length - 1];

				if (lastComponent && lastComponent.type !== componentType) {
					// Adjust the last component's end time to current time
					await tx
						.update(table.subjectClassAllocationAttendanceComponent)
						.set({ end: now })
						.where(
							eq(
								table.subjectClassAllocationAttendanceComponent.id,
								lastComponent.id,
							),
						);

					// Create a new component with the new status from current time to end of class
					await tx
						.insert(table.subjectClassAllocationAttendanceComponent)
						.values({
							attendanceId: attendance.id,
							type: componentType,
							start: now,
							end: classAllocation.end,
						});
				}
				// If type is the same, leave components as-is
			}
		}

		if (behaviourIds !== undefined) {
			await tx
				.delete(table.attendanceBehaviour)
				.where(eq(table.attendanceBehaviour.attendanceId, attendance.id));

			if (behaviourIds.length > 0) {
				await tx
					.insert(table.attendanceBehaviour)
					.values(
						behaviourIds.map((behaviourId) => ({
							attendanceId: attendance.id,
							behaviourId,
						})),
					);
			}
		}

		return attendance;
	});
}

export async function startClassPass(
	subjectClassAllocationId: number,
	userId: string,
) {
	return await db.transaction(async (tx) => {
		// Get class allocation details for time calculation
		const [classAllocation] = await tx
			.select({
				start: table.subjectClassAllocation.start,
				end: table.subjectClassAllocation.end,
			})
			.from(table.subjectClassAllocation)
			.where(eq(table.subjectClassAllocation.id, subjectClassAllocationId))
			.limit(1);

		if (!classAllocation) {
			throw new Error('Class allocation not found');
		}

		// Get or create attendance record
		const [existingAttendance] = await tx
			.select()
			.from(table.subjectClassAllocationAttendance)
			.where(
				and(
					eq(
						table.subjectClassAllocationAttendance.subjectClassAllocationId,
						subjectClassAllocationId,
					),
					eq(table.subjectClassAllocationAttendance.userId, userId),
				),
			)
			.limit(1);

		let attendanceId: number;

		if (!existingAttendance) {
			// Create new attendance record with present status
			const [attendance] = await tx
				.insert(table.subjectClassAllocationAttendance)
				.values({
					subjectClassAllocationId,
					userId,
					status: subjectClassAllocationAttendanceStatus.present,
				})
				.returning();

			attendanceId = attendance.id;

			// Create initial present component for entire duration
			await tx
				.insert(table.subjectClassAllocationAttendanceComponent)
				.values({
					attendanceId,
					type: subjectClassAllocationAttendanceComponentType.present,
					start: classAllocation.start,
					end: classAllocation.end,
				});
		} else {
			attendanceId = existingAttendance.id;
		}

		// Get current time
		const now = new Date();

		// Get existing components
		const existingComponents = await tx
			.select()
			.from(table.subjectClassAllocationAttendanceComponent)
			.where(
				eq(
					table.subjectClassAllocationAttendanceComponent.attendanceId,
					attendanceId,
				),
			)
			.orderBy(table.subjectClassAllocationAttendanceComponent.start);

		if (existingComponents.length > 0) {
			const lastComponent = existingComponents[existingComponents.length - 1];

			// Update the last component's end time to current time
			await tx
				.update(table.subjectClassAllocationAttendanceComponent)
				.set({ end: now })
				.where(
					eq(
						table.subjectClassAllocationAttendanceComponent.id,
						lastComponent.id,
					),
				);

			// Create a new classPass component from current time to end of class
			await tx
				.insert(table.subjectClassAllocationAttendanceComponent)
				.values({
					attendanceId,
					type: subjectClassAllocationAttendanceComponentType.classPass,
					start: now,
					end: classAllocation.end,
				});
		}

		return { success: true };
	});
}

export async function endClassPass(
	subjectClassAllocationId: number,
	userId: string,
) {
	return await db.transaction(async (tx) => {
		const [classAllocation] = await tx
			.select({
				start: table.subjectClassAllocation.start,
				end: table.subjectClassAllocation.end,
			})
			.from(table.subjectClassAllocation)
			.where(eq(table.subjectClassAllocation.id, subjectClassAllocationId))
			.limit(1);

		if (!classAllocation) {
			throw new Error('Class allocation not found');
		}

		const [existingAttendance] = await tx
			.select()
			.from(table.subjectClassAllocationAttendance)
			.where(
				and(
					eq(
						table.subjectClassAllocationAttendance.subjectClassAllocationId,
						subjectClassAllocationId,
					),
					eq(table.subjectClassAllocationAttendance.userId, userId),
				),
			)
			.limit(1);

		if (!existingAttendance) {
			throw new Error('Attendance record not found');
		}

		const attendanceId = existingAttendance.id;
		const now = new Date();

		// Get existing components
		const existingComponents = await tx
			.select()
			.from(table.subjectClassAllocationAttendanceComponent)
			.where(
				eq(
					table.subjectClassAllocationAttendanceComponent.attendanceId,
					attendanceId,
				),
			)
			.orderBy(table.subjectClassAllocationAttendanceComponent.start);

		if (existingComponents.length > 0) {
			const lastComponent = existingComponents[existingComponents.length - 1];

			// Only proceed if the last component is a class pass
			if (
				lastComponent.type ===
				subjectClassAllocationAttendanceComponentType.classPass
			) {
				// Update the last component's end time to current time
				await tx
					.update(table.subjectClassAllocationAttendanceComponent)
					.set({ end: now })
					.where(
						eq(
							table.subjectClassAllocationAttendanceComponent.id,
							lastComponent.id,
						),
					);

				// Create a new present component from current time to end of class
				await tx
					.insert(table.subjectClassAllocationAttendanceComponent)
					.values({
						attendanceId,
						type: subjectClassAllocationAttendanceComponentType.present,
						start: now,
						end: classAllocation.end,
					});
			}
		}

		return { success: true };
	});
}

export async function getSubjectYearLevelBySubjectOfferingId(
	subjectOfferingId: number,
) {
	const subjects = await db
		.select({ yearLevel: table.schoolYearLevel.code })
		.from(table.subjectOffering)
		.innerJoin(
			table.subject,
			eq(table.subject.id, table.subjectOffering.subjectId),
		)
		.innerJoin(
			table.schoolYearLevel,
			eq(table.subject.schoolYearLevelId, table.schoolYearLevel.id),
		)
		.where(eq(table.subjectOffering.id, subjectOfferingId))
		.limit(1);

	return subjects?.length > 0 ? subjects[0].yearLevel : null;
}

export async function getSubjectClassAllocationsByUserIdForDate(
	userId: string,
	date: Date,
) {
	const startOfDay = new Date(date);
	startOfDay.setHours(0, 0, 0, 0);

	const endOfDay = new Date(date);
	endOfDay.setHours(23, 59, 59, 999);

	const classAllocations = await db
		.select({
			classAllocation: table.subjectClassAllocation,
			schoolSpace: table.schoolSpace,
			subjectOffering: { id: table.subjectOffering.id },
			subject: { id: table.subject.id, name: table.subject.name },
			userSubjectOffering: table.userSubjectOffering,
		})
		.from(table.userSubjectOfferingClass)
		.innerJoin(
			table.subjectOfferingClass,
			eq(
				table.userSubjectOfferingClass.subOffClassId,
				table.subjectOfferingClass.id,
			),
		)
		.innerJoin(
			table.subjectClassAllocation,
			eq(
				table.subjectClassAllocation.subjectOfferingClassId,
				table.subjectOfferingClass.id,
			),
		)
		.innerJoin(
			table.schoolSpace,
			eq(table.subjectClassAllocation.schoolSpaceId, table.schoolSpace.id),
		)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectOfferingClass.subOfferingId, table.subjectOffering.id),
		)
		.innerJoin(
			table.subject,
			eq(table.subjectOffering.subjectId, table.subject.id),
		)
		.innerJoin(
			table.userSubjectOffering,
			and(
				eq(table.userSubjectOffering.subOfferingId, table.subjectOffering.id),
				eq(table.userSubjectOffering.userId, userId),
			),
		)
		.where(
			and(
				eq(table.userSubjectOfferingClass.userId, userId),
				gte(table.subjectClassAllocation.start, startOfDay),
				lte(table.subjectClassAllocation.end, endOfDay),
			),
		)
		.orderBy(table.subjectClassAllocation.start);

	return classAllocations;
}

export async function getSubjectClassAllocationsByUserIdForWeek(
	userId: string,
	weekStartDate: Date,
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

	const classAllocations = await db
		.select({
			classAllocation: table.subjectClassAllocation,
			schoolSpace: table.schoolSpace,
			subjectOffering: { id: table.subjectOffering.id },
			subject: { id: table.subject.id, name: table.subject.name },
			userSubjectOffering: table.userSubjectOffering,
		})
		.from(table.userSubjectOfferingClass)
		.innerJoin(
			table.subjectOfferingClass,
			eq(
				table.userSubjectOfferingClass.subOffClassId,
				table.subjectOfferingClass.id,
			),
		)
		.innerJoin(
			table.subjectClassAllocation,
			eq(
				table.subjectClassAllocation.subjectOfferingClassId,
				table.subjectOfferingClass.id,
			),
		)
		.innerJoin(
			table.schoolSpace,
			eq(table.subjectClassAllocation.schoolSpaceId, table.schoolSpace.id),
		)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectOfferingClass.subOfferingId, table.subjectOffering.id),
		)
		.innerJoin(
			table.subject,
			eq(table.subjectOffering.subjectId, table.subject.id),
		)
		.innerJoin(
			table.userSubjectOffering,
			and(
				eq(table.userSubjectOffering.subOfferingId, table.subjectOffering.id),
				eq(table.userSubjectOffering.userId, userId),
			),
		)
		.where(
			and(
				eq(table.userSubjectOfferingClass.userId, userId),
				gte(table.subjectClassAllocation.start, weekStart),
				lt(table.subjectClassAllocation.end, weekEnd),
			),
		)
		.orderBy(table.subjectClassAllocation.start);

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
	yearLevelId: number,
) {
	const constraints = await db
		.select({
			constraint: table.subjectSelectionConstraint,
			subjects: table.subjectSelectionConstraintSubject,
		})
		.from(table.subjectSelectionConstraint)
		.leftJoin(
			table.subjectSelectionConstraintSubject,
			eq(
				table.subjectSelectionConstraintSubject.constraintId,
				table.subjectSelectionConstraint.id,
			),
		)
		.where(
			and(
				eq(table.subjectSelectionConstraint.schoolId, schoolId),
				eq(table.subjectSelectionConstraint.yearLevel, yearLevelId),
			),
		)
		.orderBy(asc(table.subjectSelectionConstraint.createdAt));

	// Group subjects by constraint
	const constraintMap = new Map<
		number,
		{
			constraint: typeof table.subjectSelectionConstraint.$inferSelect;
			subjects: Array<
				typeof table.subjectSelectionConstraintSubject.$inferSelect
			>;
		}
	>();

	for (const row of constraints) {
		if (!constraintMap.has(row.constraint.id)) {
			constraintMap.set(row.constraint.id, {
				constraint: row.constraint,
				subjects: [],
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
		.where(
			eq(table.subjectSelectionConstraintSubject.constraintId, constraintId),
		);

	return { constraint, subjects };
}

/**
 * Create a new subject selection constraint
 */

/**
 * Update a subject selection constraint
 */
export async function updateSubjectSelectionConstraint(
	constraintId: number,
	name: string,
	description: string | null,
	min: number,
	max: number | null,
	subjectIds: number[],
) {
	// Update the constraint
	const [constraint] = await db
		.update(table.subjectSelectionConstraint)
		.set({ name, description, min, max, updatedAt: new Date() })
		.where(eq(table.subjectSelectionConstraint.id, constraintId))
		.returning();

	// Delete existing subject associations
	await db
		.delete(table.subjectSelectionConstraintSubject)
		.where(
			eq(table.subjectSelectionConstraintSubject.constraintId, constraintId),
		);

	// Insert new subject associations
	if (subjectIds.length > 0) {
		await db
			.insert(table.subjectSelectionConstraintSubject)
			.values(
				subjectIds.map((subjectId) => ({
					constraintId: constraint.id,
					subjectId,
				})),
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
 * Get all behaviours for a school
 */
export async function getBehavioursBySchoolId(schoolId: number) {
	const results = await db
		.select({
			behaviour: table.behaviour,
			behaviourLevel: table.behaviourLevel,
		})
		.from(table.behaviour)
		.leftJoin(
			table.behaviourLevel,
			eq(table.behaviour.levelId, table.behaviourLevel.id),
		)
		.where(
			and(
				eq(table.behaviour.schoolId, schoolId),
				eq(table.behaviour.isArchived, false),
			),
		)
		.orderBy(asc(table.behaviourLevel.level), asc(table.behaviour.name));

	return results.map((row) => ({
		...row.behaviour,
		level: row.behaviourLevel,
	}));
}

/**
 * Get all behaviour levels for a school
 */
export async function getBehaviourLevelsBySchoolId(schoolId: number) {
	const levels = await db
		.select()
		.from(table.behaviourLevel)
		.where(eq(table.behaviourLevel.schoolId, schoolId))
		.orderBy(asc(table.behaviourLevel.level));

	return levels;
}

/**
 * Get all behaviour levels with their nested behaviours for a school
 */
export async function getLevelsWithBehaviours(schoolId: number) {
	const results = await db
		.select({ level: table.behaviourLevel, behaviour: table.behaviour })
		.from(table.behaviourLevel)
		.leftJoin(
			table.behaviour,
			and(
				eq(table.behaviour.levelId, table.behaviourLevel.id),
				eq(table.behaviour.isArchived, false),
			),
		)
		.where(eq(table.behaviourLevel.schoolId, schoolId))
		.orderBy(asc(table.behaviourLevel.level), asc(table.behaviour.name));

	const levelMap = new Map<
		number,
		{
			levelId: number;
			levelName: string;
			levelNumber: number;
			behaviours: Array<{ value: string; label: string }>;
		}
	>();

	for (const row of results) {
		if (!levelMap.has(row.level.id)) {
			levelMap.set(row.level.id, {
				levelId: row.level.id,
				levelName: row.level.name,
				levelNumber: row.level.level,
				behaviours: [],
			});
		}

		if (row.behaviour) {
			levelMap
				.get(row.level.id)!
				.behaviours.push({
					value: row.behaviour.id.toString(),
					label: row.behaviour.name,
				});
		}
	}

	return Array.from(levelMap.values());
}

/**
 * Create a new behaviour level
 */

/**
 * Update a behaviour level
 */
export async function updateBehaviourLevel(id: number, name: string) {
	const [behaviourLevel] = await db
		.update(table.behaviourLevel)
		.set({ name, updatedAt: new Date() })
		.where(eq(table.behaviourLevel.id, id))
		.returning();

	return behaviourLevel;
}

/**
 * Delete a behaviour level
 */
export async function deleteBehaviourLevel(id: number) {
	await db.delete(table.behaviourLevel).where(eq(table.behaviourLevel.id, id));
}

/**
 * Create a new behaviour
 */

/**
 * Update a behaviour
 */
export async function updateBehaviour(
	id: number,
	name: string,
	levelId?: number | undefined,
	description?: string | null,
) {
	const [behaviour] = await db
		.update(table.behaviour)
		.set({
			name,
			description: description || null,
			levelId,
			updatedAt: new Date(),
		})
		.where(eq(table.behaviour.id, id))
		.returning();

	return behaviour;
}

/**
 * Delete (archive) a behaviour
 */
export async function deleteBehaviour(id: number) {
	await db
		.update(table.behaviour)
		.set({ isArchived: true, updatedAt: new Date() })
		.where(eq(table.behaviour.id, id));
}

/**
 * Get behaviours for an attendance record
 */
export async function getBehavioursByAttendanceId(attendanceId: number) {
	const behaviours = await db
		.select({ behaviour: table.behaviour })
		.from(table.attendanceBehaviour)
		.innerJoin(
			table.behaviour,
			eq(table.attendanceBehaviour.behaviourId, table.behaviour.id),
		)
		.where(eq(table.attendanceBehaviour.attendanceId, attendanceId));

	return behaviours.map((row) => row.behaviour);
}

export async function toggleSubjectThreadLike(
	threadId: number,
	userId: string,
) {
	const [existingLike] = await db
		.select()
		.from(table.subjectThreadLike)
		.where(
			and(
				eq(table.subjectThreadLike.subjectThreadId, threadId),
				eq(table.subjectThreadLike.userId, userId),
			),
		)
		.limit(1);

	if (existingLike) {
		// Unlike - remove the like
		await db
			.delete(table.subjectThreadLike)
			.where(
				and(
					eq(table.subjectThreadLike.subjectThreadId, threadId),
					eq(table.subjectThreadLike.userId, userId),
				),
			);
		return { liked: false };
	} else {
		// Like - add the like
		await db
			.insert(table.subjectThreadLike)
			.values({ subjectThreadId: threadId, userId });
		return { liked: true };
	}
}

export async function getSubjectThreadLikeInfo(
	threadId: number,
	userId: string,
) {
	const likes = await db
		.select()
		.from(table.subjectThreadLike)
		.where(eq(table.subjectThreadLike.subjectThreadId, threadId));

	const userLiked = likes.some((like) => like.userId === userId);

	return { count: likes.length, userLiked };
}

export async function getSubjectThreadLikeCounts(
	threadIds: number[],
	userId: string,
) {
	if (threadIds.length === 0) return [];

	const likes = await db
		.select()
		.from(table.subjectThreadLike)
		.where(inArray(table.subjectThreadLike.subjectThreadId, threadIds));

	// Group by thread ID
	const likesMap = new Map<number, { count: number; userLiked: boolean }>();

	for (const threadId of threadIds) {
		likesMap.set(threadId, { count: 0, userLiked: false });
	}

	for (const like of likes) {
		const current = likesMap.get(like.subjectThreadId)!;
		current.count++;
		if (like.userId === userId) {
			current.userLiked = true;
		}
	}

	return Array.from(likesMap.entries()).map(([threadId, info]) => ({
		threadId,
		...info,
	}));
}

export async function toggleSubjectThreadResponseLike(
	responseId: number,
	userId: string,
) {
	const [existingLike] = await db
		.select()
		.from(table.subjectThreadResponseLike)
		.where(
			and(
				eq(table.subjectThreadResponseLike.subjectThreadResponseId, responseId),
				eq(table.subjectThreadResponseLike.userId, userId),
			),
		)
		.limit(1);

	if (existingLike) {
		// Unlike - remove the like
		await db
			.delete(table.subjectThreadResponseLike)
			.where(
				and(
					eq(
						table.subjectThreadResponseLike.subjectThreadResponseId,
						responseId,
					),
					eq(table.subjectThreadResponseLike.userId, userId),
				),
			);
		return { liked: false };
	} else {
		// Like - add the like
		await db
			.insert(table.subjectThreadResponseLike)
			.values({ subjectThreadResponseId: responseId, userId });
		return { liked: true };
	}
}

export async function getSubjectThreadResponseLikeInfo(
	responseId: number,
	userId: string,
) {
	const likes = await db
		.select()
		.from(table.subjectThreadResponseLike)
		.where(
			eq(table.subjectThreadResponseLike.subjectThreadResponseId, responseId),
		);

	const userLiked = likes.some((like) => like.userId === userId);

	return { count: likes.length, userLiked };
}

export async function getSubjectThreadResponseLikeCounts(
	responseIds: number[],
	userId: string,
) {
	if (responseIds.length === 0) return [];

	const likes = await db
		.select()
		.from(table.subjectThreadResponseLike)
		.where(
			inArray(
				table.subjectThreadResponseLike.subjectThreadResponseId,
				responseIds,
			),
		);

	// Group by response ID
	const likesMap = new Map<number, { count: number; userLiked: boolean }>();

	for (const responseId of responseIds) {
		likesMap.set(responseId, { count: 0, userLiked: false });
	}

	for (const like of likes) {
		const current = likesMap.get(like.subjectThreadResponseId)!;
		current.count++;
		if (like.userId === userId) {
			current.userLiked = true;
		}
	}

	return Array.from(likesMap.entries()).map(([responseId, info]) => ({
		responseId,
		...info,
	}));
}

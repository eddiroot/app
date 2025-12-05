import { userTypeEnum } from '$lib/enums';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { and, asc, desc, eq, lte } from 'drizzle-orm';

export async function getSubjectOfferingClassDetailsById(subjectOfferingClassId: number) {
	const subjectOfferingClass = await db
		.select({
			subjectOfferingClass: table.subjectOfferingClass,
			subjectOffering: table.subjectOffering,
			subject: table.subject,
			coreSubject: table.coreSubject,
			electiveSubject: table.electiveSubject
		})
		.from(table.subjectOfferingClass)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectOffering.id, table.subjectOfferingClass.subOfferingId)
		)
		.innerJoin(table.subject, eq(table.subject.id, table.subjectOffering.subjectId))
		.leftJoin(table.coreSubject, eq(table.coreSubject.id, table.subject.coreSubjectId))
		.leftJoin(table.electiveSubject, eq(table.electiveSubject.id, table.subject.electiveSubjectId))
		.where(eq(table.subjectOfferingClass.id, subjectOfferingClassId))
		.limit(1);

	return subjectOfferingClass?.length ? subjectOfferingClass[0] : null;
}

export async function getSubjectClassAllocationsByUserId(userId: string) {
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
		.where(eq(table.userSubjectOfferingClass.userId, userId))
		.orderBy(desc(table.subjectClassAllocation.date), asc(table.subjectClassAllocation.startTime));

	return classAllocations;
}

export async function getSubjectClassAllocationsByUserIdForToday(userId: string) {
	const today = new Date();
	const todayStr = today.toISOString().split('T')[0];
	const classAllocation = await db
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
				eq(table.subjectClassAllocation.date, todayStr)
			)
		)
		.orderBy(table.subjectClassAllocation.startTime); // Order by start time (earliest first) for today's schedule

	return classAllocation;
}

export async function getSubjectClassAllocationAndStudentAttendancesByClassIdForToday(
	subjectOfferingClassId: number
) {
	const today = new Date();
	const todayStr = today.toISOString().split('T')[0];

	const attendances = await db
		.select({
			attendance: table.subjectClassAllocationAttendance,
			user: {
				id: table.user.id,
				firstName: table.user.firstName,
				middleName: table.user.middleName,
				lastName: table.user.lastName,
				avatarUrl: table.user.avatarUrl
			},
			subjectClassAllocation: {
				id: table.subjectClassAllocation.id
			}
		})
		.from(table.userSubjectOfferingClass)
		.innerJoin(table.user, eq(table.user.id, table.userSubjectOfferingClass.userId))
		.innerJoin(
			table.subjectClassAllocation,
			eq(
				table.subjectClassAllocation.subjectOfferingClassId,
				table.userSubjectOfferingClass.subOffClassId
			)
		)
		.leftJoin(
			table.subjectClassAllocationAttendance,
			and(
				eq(
					table.subjectClassAllocationAttendance.subjectClassAllocationId,
					table.subjectClassAllocation.id
				),
				eq(table.subjectClassAllocationAttendance.userId, table.user.id)
			)
		)
		.where(
			and(
				eq(table.userSubjectOfferingClass.subOffClassId, subjectOfferingClassId),
				eq(table.subjectClassAllocation.date, todayStr),
				eq(table.user.type, userTypeEnum.student)
			)
		)
		.orderBy(table.user.lastName, table.user.firstName);

	return attendances;
}

export async function getClassesForUserInSubjectOffering(
	userId: string,
	subjectOfferingId: number
) {
	const classes = await db
		.select({
			classAllocation: table.subjectClassAllocation,
			schoolSpace: table.schoolSpace
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
		.where(
			and(
				eq(table.userSubjectOfferingClass.userId, userId),
				eq(table.subjectOfferingClass.subOfferingId, subjectOfferingId)
			)
		)
		.orderBy(desc(table.subjectClassAllocation.date), desc(table.subjectClassAllocation.startTime));

	return classes;
}

export async function getGuardiansChildrensScheduleWithAttendanceByUserId(userId: string) {
	const scheduleWithAttendance = await db
		.select({
			user: {
				id: table.user.id,
				firstName: table.user.firstName,
				middleName: table.user.middleName,
				lastName: table.user.lastName,
				avatarUrl: table.user.avatarUrl
			},
			subjectClassAllocation: {
				id: table.subjectClassAllocation.id,
				date: table.subjectClassAllocation.date,
				startTime: table.subjectClassAllocation.startTime,
				endTime: table.subjectClassAllocation.endTime
			},
			subjectOfferingClass: {
				id: table.subjectOfferingClass.id,
				name: table.subjectOfferingClass.name
			},
			subject: {
				name: table.subject.name
			},
			attendance: table.subjectClassAllocationAttendance
		})
		.from(table.userRelationship)
		.innerJoin(table.user, eq(table.user.id, table.userRelationship.userId))
		.innerJoin(
			table.userSubjectOfferingClass,
			eq(table.userSubjectOfferingClass.userId, table.user.id)
		)
		.innerJoin(
			table.subjectOfferingClass,
			eq(table.userSubjectOfferingClass.subOffClassId, table.subjectOfferingClass.id)
		)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectOfferingClass.subOfferingId, table.subjectOffering.id)
		)
		.innerJoin(table.subject, eq(table.subjectOffering.subjectId, table.subject.id))
		.innerJoin(
			table.subjectClassAllocation,
			eq(
				table.subjectClassAllocation.subjectOfferingClassId,
				table.userSubjectOfferingClass.subOffClassId
			)
		)
		.leftJoin(
			table.subjectClassAllocationAttendance,
			and(
				eq(
					table.subjectClassAllocationAttendance.subjectClassAllocationId,
					table.subjectClassAllocation.id
				),
				eq(table.subjectClassAllocationAttendance.userId, table.user.id)
			)
		)
		.where(eq(table.userRelationship.relatedUserId, userId))
		.orderBy(table.subjectClassAllocation.date, table.subjectClassAllocation.startTime);

	return scheduleWithAttendance;
}

export async function getSubjectOfferingClassByAllocationId(allocationId: number) {
	const result = await db
		.select({
			subjectOfferingClass: table.subjectOfferingClass,
			subjectOffering: table.subjectOffering,
			subject: table.subject
		})
		.from(table.subjectClassAllocation)
		.innerJoin(
			table.subjectOfferingClass,
			eq(table.subjectClassAllocation.subjectOfferingClassId, table.subjectOfferingClass.id)
		)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectOfferingClass.subOfferingId, table.subjectOffering.id)
		)
		.innerJoin(table.subject, eq(table.subjectOffering.subjectId, table.subject.id))
		.where(eq(table.subjectClassAllocation.id, allocationId))
		.limit(1);

	return result?.length ? result[0] : null;
}

export async function getSubjectOfferingClassesBySchoolId(schoolId: number) {
	const classes = await db
		.select({
			id: table.subjectOfferingClass.id,
			name: table.subjectOfferingClass.name,
			subjectName: table.subject.name,
			subjectOffering: {
				id: table.subjectOffering.id,
				year: table.subjectOffering.year,
				semester: table.subjectOffering.semester
			}
		})
		.from(table.subjectOfferingClass)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectOfferingClass.subOfferingId, table.subjectOffering.id)
		)
		.innerJoin(table.subject, eq(table.subjectOffering.subjectId, table.subject.id))
		.where(
			and(
				eq(table.subject.schoolId, schoolId),
				eq(table.subjectOfferingClass.isArchived, false),
				eq(table.subjectOffering.isArchived, false)
			)
		)
		.orderBy(
			asc(table.subject.name),
			asc(table.subjectOfferingClass.name),
			asc(table.subjectOffering.year),
			asc(table.subjectOffering.semester)
		);

	return classes;
}

export async function getAllocationsBySchoolId(schoolId: number) {
	const allocations = await db
		.select({
			user: {
				id: table.user.id,
				firstName: table.user.firstName,
				middleName: table.user.middleName,
				lastName: table.user.lastName,
				email: table.user.email,
				type: table.user.type
			},
			userSubjectOfferingClass: table.userSubjectOfferingClass,
			subjectOfferingClass: table.subjectOfferingClass,
			subjectOffering: {
				id: table.subjectOffering.id,
				year: table.subjectOffering.year,
				semester: table.subjectOffering.semester
			},
			subject: {
				id: table.subject.id,
				name: table.subject.name,
				yearLevel: table.subject.yearLevel
			}
		})
		.from(table.userSubjectOfferingClass)
		.innerJoin(table.user, eq(table.user.id, table.userSubjectOfferingClass.userId))
		.innerJoin(
			table.subjectOfferingClass,
			eq(table.userSubjectOfferingClass.subOffClassId, table.subjectOfferingClass.id)
		)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectOfferingClass.subOfferingId, table.subjectOffering.id)
		)
		.innerJoin(table.subject, eq(table.subjectOffering.subjectId, table.subject.id))
		.where(
			and(
				eq(table.userSubjectOfferingClass.isArchived, false),
				eq(table.subject.schoolId, schoolId)
			)
		)
		.orderBy(
			asc(table.subject.name),
			asc(table.subjectOfferingClass.name),
			asc(table.user.lastName),
			asc(table.user.firstName)
		);

	return allocations;
}

export async function createUserSubjectOfferingClass(
	userId: string,
	subjectOfferingClassId: number
) {
	const [allocation] = await db
		.insert(table.userSubjectOfferingClass)
		.values({
			userId,
			subOffClassId: subjectOfferingClassId,
			isArchived: false
		})
		.returning();

	return allocation;
}

export async function deleteUserSubjectOfferingClass(allocationId: number) {
	await db
		.update(table.userSubjectOfferingClass)
		.set({ isArchived: true })
		.where(eq(table.userSubjectOfferingClass.id, allocationId));
}

export async function getStudentAttendanceHistoryForClass(
	studentId: string,
	subjectOfferingClassId: number
) {
	const today = new Date();
	const todayStr = today.toISOString().split('T')[0];

	const attendanceHistory = await db
		.select({
			attendance: table.subjectClassAllocationAttendance,
			subjectClassAllocation: {
				id: table.subjectClassAllocation.id,
				date: table.subjectClassAllocation.date,
				startTime: table.subjectClassAllocation.startTime,
				endTime: table.subjectClassAllocation.endTime
			},
			schoolSpace: {
				name: table.schoolSpace.name
			}
		})
		.from(table.subjectClassAllocation)
		.leftJoin(
			table.subjectClassAllocationAttendance,
			and(
				eq(
					table.subjectClassAllocationAttendance.subjectClassAllocationId,
					table.subjectClassAllocation.id
				),
				eq(table.subjectClassAllocationAttendance.userId, studentId)
			)
		)
		.leftJoin(
			table.schoolSpace,
			eq(table.subjectClassAllocation.schoolSpaceId, table.schoolSpace.id)
		)
		.where(
			and(
				eq(table.subjectClassAllocation.subjectOfferingClassId, subjectOfferingClassId),
				lte(table.subjectClassAllocation.date, todayStr)
			)
		)
		.orderBy(desc(table.subjectClassAllocation.date), desc(table.subjectClassAllocation.startTime));

	return attendanceHistory;
}

export async function getStudentsBySubjectOfferingClassId(subjectOfferingClassId: number) {
	const students = await db
		.select({
			id: table.user.id,
			firstName: table.user.firstName,
			lastName: table.user.lastName,
			email: table.user.email,
			avatarUrl: table.user.avatarUrl
		})
		.from(table.userSubjectOfferingClass)
		.innerJoin(table.user, eq(table.user.id, table.userSubjectOfferingClass.userId))
		.where(
			and(
				eq(table.userSubjectOfferingClass.subOffClassId, subjectOfferingClassId),
				eq(table.user.type, userTypeEnum.student),
				eq(table.userSubjectOfferingClass.isArchived, false)
			)
		)
		.orderBy(asc(table.user.lastName), asc(table.user.firstName));

	return students;
}

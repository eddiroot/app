import { userTypeEnum, yearLevelEnum } from '$lib/enums.js';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { hash } from '@node-rs/argon2';
import { and, eq } from 'drizzle-orm';

export async function updateUserVerificationCode(
	userId: string,
	verificationCode: string,
) {
	await db
		.update(table.user)
		.set({ verificationCode })
		.where(eq(table.user.id, userId));
}

export async function updateUserPassword(userId: string, newPassword: string) {
	const passwordHash = await hash(newPassword);
	await db
		.update(table.user)
		.set({ passwordHash })
		.where(eq(table.user.id, userId));
}

export async function getUserById(userId: string) {
	const users = await db
		.select()
		.from(table.user)
		.where(eq(table.user.id, userId))
		.limit(1);
	return users.length > 0 ? users[0] : null;
}

export async function getUserByGoogleId(googleId: string) {
	const users = await db
		.select()
		.from(table.user)
		.where(eq(table.user.googleId, googleId))
		.limit(1);
	return users.length > 0 ? users[0] : null;
}

export async function getUserByMicrosoftId(microsoftId: string) {
	const users = await db
		.select()
		.from(table.user)
		.where(eq(table.user.microsoftId, microsoftId))
		.limit(1);
	return users.length > 0 ? users[0] : null;
}

export async function setUserVerified(userId: string) {
	await db
		.update(table.user)
		.set({ emailVerified: true, verificationCode: null })
		.where(eq(table.user.id, userId));
}

export async function checkUserExistence(email: string): Promise<boolean> {
	const users = await db
		.select()
		.from(table.user)
		.where(eq(table.user.email, email))
		.limit(1);
	return users.length > 0;
}

export async function verifyUserAccessToClass(
	userId: string,
	subjectOfferingClassId: number,
): Promise<boolean> {
	const userAccess = await db
		.select()
		.from(table.userSubjectOfferingClass)
		.where(
			and(
				eq(table.userSubjectOfferingClass.userId, userId),
				eq(
					table.userSubjectOfferingClass.subOffClassId,
					subjectOfferingClassId,
				),
				eq(table.userSubjectOfferingClass.isArchived, false),
			),
		)
		.limit(1);
	return userAccess.length > 0;
}

export async function verifyUserAccessToSubjectOffering(
	userId: string,
	subjectOfferingId: number,
): Promise<boolean> {
	const userAccess = await db
		.select()
		.from(table.userSubjectOffering)
		.where(
			and(
				eq(table.userSubjectOffering.userId, userId),
				eq(table.userSubjectOffering.subOfferingId, subjectOfferingId),
				eq(table.userSubjectOffering.isArchived, false),
			),
		)
		.limit(1);
	return userAccess.length > 0;
}

export async function getGuardiansForStudent(studentUserId: string) {
	const guardians = await db
		.select({
			guardian: {
				id: table.user.id,
				email: table.user.email,
				firstName: table.user.firstName,
				middleName: table.user.middleName,
				lastName: table.user.lastName,
			},
			relationshipType: table.userRelationship.relationshipType,
		})
		.from(table.userRelationship)
		.innerJoin(
			table.user,
			eq(table.user.id, table.userRelationship.relatedUserId),
		)
		.where(
			and(
				eq(table.userRelationship.userId, studentUserId),
				eq(table.user.type, userTypeEnum.guardian),
			),
		);

	return guardians;
}

export async function getUserProfileById(userId: string) {
	const user = await db
		.select({
			id: table.user.id,
			email: table.user.email,
			firstName: table.user.firstName,
			middleName: table.user.middleName,
			lastName: table.user.lastName,
			avatarPath: table.user.avatarPath,
			dateOfBirth: table.user.dateOfBirth,
			gender: table.user.gender,
			honorific: table.user.honorific,
			yearLevel: table.schoolYearLevel.code,
			type: table.user.type,
			schoolId: table.user.schoolId,
			emailVerified: table.user.emailVerified,
			createdAt: table.user.createdAt,
		})
		.from(table.user)
		.innerJoin(
			table.schoolYearLevel,
			eq(table.schoolYearLevel.id, table.user.schoolYearLevelId),
		)
		.where(eq(table.user.id, userId))
		.limit(1);
	return user.length > 0 ? user[0] : null;
}

export async function getUserSpecialisationsByUserId(userId: string) {
	const specializations = await db
		.select({
			subjectId: table.userSpecialisation.subjectId,
			subjectName: table.subject.name,
		})
		.from(table.userSpecialisation)
		.innerJoin(
			table.subject,
			eq(table.subject.id, table.userSpecialisation.subjectId),
		)
		.where(eq(table.userSpecialisation.userId, userId));

	return specializations;
}

export async function getAllStudentsBySchoolId(schoolId: number) {
	const students = await db
		.select({
			id: table.user.id,
			email: table.user.email,
			firstName: table.user.firstName,
			middleName: table.user.middleName,
			lastName: table.user.lastName,
			yearLevel: table.schoolYearLevel.code,
		})
		.from(table.user)
		.innerJoin(
			table.schoolYearLevel,
			eq(table.schoolYearLevel.id, table.user.schoolYearLevelId),
		)
		.where(
			and(
				eq(table.user.schoolId, schoolId),
				eq(table.user.type, userTypeEnum.student),
			),
		);

	return students;
}

// Group students by year level
export async function getAllStudentsGroupedByYearLevelsBySchoolId(
	schoolId: number,
) {
	const students = await getAllStudentsBySchoolId(schoolId);

	type StudentInfo = Pick<
		Awaited<ReturnType<typeof getAllStudentsBySchoolId>>[0],
		'id' | 'email' | 'firstName' | 'middleName' | 'lastName' | 'yearLevel'
	>;

	// Group students by year level
	const studentsByYearLevel: Record<yearLevelEnum, StudentInfo[]> =
		{} as Record<yearLevelEnum, StudentInfo[]>;

	for (const student of students) {
		if (!studentsByYearLevel[student.yearLevel]) {
			studentsByYearLevel[student.yearLevel] = [];
		}
		studentsByYearLevel[student.yearLevel].push(student);
	}

	return studentsByYearLevel;
}

import { RecordFlagEnum, schoolSpaceTypeEnum, userTypeEnum, yearLevelEnum } from '$lib/enums.js';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { and, asc, count, eq, inArray } from 'drizzle-orm';
import { clearFlagExpr, notArchived, setFlagExpr } from './utils';

export async function getUsersBySchoolId(schoolId: number, includeArchived: boolean = false) {
	const users = await db
		// Selecting specific user fields to avoid returning sensitive data
		.select({
			id: table.user.id,
			email: table.user.email,
			type: table.user.type,
			firstName: table.user.firstName,
			middleName: table.user.middleName,
			lastName: table.user.lastName,
			yearLevel: table.user.yearLevel,
			avatarUrl: table.user.avatarUrl
		})
		.from(table.user)
		.where(
			and(
				eq(table.user.schoolId, schoolId),
				includeArchived ? undefined : notArchived(table.user.flags)
			)
		)
		.orderBy(asc(table.user.type), asc(table.user.lastName), asc(table.user.firstName));

	return users;
}

export async function getUsersBySchoolIdAndTypes(
	schoolId: number,
	types: userTypeEnum[],
	includeArchived: boolean = false
) {
	const users = await db
		.select({
			id: table.user.id,
			email: table.user.email,
			type: table.user.type,
			firstName: table.user.firstName,
			middleName: table.user.middleName,
			lastName: table.user.lastName,
			yearLevel: table.user.yearLevel,
			avatarUrl: table.user.avatarUrl
		})
		.from(table.user)
		.where(
			and(
				eq(table.user.schoolId, schoolId),
				inArray(table.user.type, types),
				includeArchived ? undefined : notArchived(table.user.flags)
			)
		)
		.orderBy(asc(table.user.type), asc(table.user.lastName), asc(table.user.firstName));

	return users;
}

export async function getUsersBySchoolIdAndType(
	schoolId: number,
	type: userTypeEnum,
	includeArchived: boolean = false
) {
	const users = await db
		.select({
			id: table.user.id,
			email: table.user.email,
			firstName: table.user.firstName,
			middleName: table.user.middleName,
			lastName: table.user.lastName,
			yearLevel: table.user.yearLevel,
			avatarUrl: table.user.avatarUrl
		})
		.from(table.user)
		.where(
			and(
				eq(table.user.schoolId, schoolId),
				eq(table.user.type, type),
				includeArchived ? undefined : notArchived(table.user.flags)
			)
		)
		.orderBy(asc(table.user.lastName), asc(table.user.firstName));

	return users;
}

export async function checkSchoolExistence(name: string): Promise<boolean> {
	const schools = await db.select().from(table.school).where(eq(table.school.name, name)).limit(1);
	return schools.length > 0;
}

export async function getSchoolById(schoolId: number) {
	const schools = await db
		.select()
		.from(table.school)
		.where(eq(table.school.id, schoolId))
		.limit(1);

	return schools.length > 0 ? schools[0] : null;
}

export async function getCampusesByUserId(userId: string) {
	const campuses = await db
		.select({
			campus: table.campus
		})
		.from(table.userCampus)
		.innerJoin(table.campus, eq(table.userCampus.campusId, table.campus.id))
		.where(eq(table.userCampus.userId, userId));

	return campuses.map((row) => row.campus);
}

export async function getSchoolStatsById(schoolId: number) {
	const totalStudents = await db
		.select({ count: count() })
		.from(table.user)
		.where(and(eq(table.user.schoolId, schoolId), eq(table.user.type, userTypeEnum.student)))
		.limit(1);

	const totalTeachers = await db
		.select({ count: count() })
		.from(table.user)
		.where(and(eq(table.user.schoolId, schoolId), eq(table.user.type, userTypeEnum.teacher)))
		.limit(1);

	const totalAdmins = await db
		.select({ count: count() })
		.from(table.user)
		.where(and(eq(table.user.schoolId, schoolId), eq(table.user.type, userTypeEnum.schoolAdmin)))
		.limit(1);

	const totalSubjects = await db
		.select({ count: count() })
		.from(table.subject)
		.where(eq(table.subject.schoolId, schoolId))
		.groupBy(table.subject.schoolId)
		.limit(1);

	return {
		totalStudents: totalStudents[0]?.count || 0,
		totalTeachers: totalTeachers[0]?.count || 0,
		totalAdmins: totalAdmins[0]?.count || 0,
		totalSubjects: totalSubjects[0]?.count || 0
	};
}

export async function createSchool(name: string, countryCode: string, stateCode: string) {
	const [newSchool] = await db
		.insert(table.school)
		.values({
			name,
			countryCode,
			stateCode
		})
		.returning();

	return newSchool;
}

export async function updateSchool(schoolId: number, name: string, logoUrl?: string) {
	const [updatedSchool] = await db
		.update(table.school)
		.set({
			name,
			// drizzle ignores undefined values
			logoUrl: logoUrl || undefined
		})
		.where(eq(table.school.id, schoolId))
		.returning();

	return updatedSchool;
}

export async function getCampusesBySchoolId(schoolId: number, includeArchived: boolean = false) {
	const campuses = await db
		.select()
		.from(table.campus)
		.where(
			and(
				eq(table.campus.schoolId, schoolId),
				includeArchived ? undefined : notArchived(table.campus.flags)
			)
		)
		.orderBy(asc(table.campus.flags), asc(table.campus.name));

	return campuses;
}

export async function createCampus(
	schoolId: number,
	name: string,
	address: string,
	description?: string
) {
	const [newCampus] = await db
		.insert(table.campus)
		.values({
			schoolId,
			name,
			address,
			description: description || undefined
		})
		.returning();

	return newCampus;
}

export async function updateCampus(
	campusId: number,
	name: string,
	address: string,
	description?: string
) {
	const [updatedCampus] = await db
		.update(table.campus)
		.set({
			name,
			address,
			description: description || undefined
		})
		.where(eq(table.campus.id, campusId))
		.returning();

	return updatedCampus;
}

export async function archiveCampus(campusId: number) {
	const [archivedCampus] = await db
		.update(table.campus)
		.set({ flags: setFlagExpr(table.campus.flags, RecordFlagEnum.archived) })
		.where(eq(table.campus.id, campusId))
		.returning();

	return archivedCampus;
}

export async function unarchiveCampus(campusId: number) {
	const [unarchivedCampus] = await db
		.update(table.campus)
		.set({ flags: clearFlagExpr(table.campus.flags, RecordFlagEnum.archived) })
		.where(eq(table.campus.id, campusId))
		.returning();

	return unarchivedCampus;
}

export async function createBuilding(
	campusId: number,
	name: string,
	description?: string | null,
	flags: number = RecordFlagEnum.none
) {
	const [building] = await db
		.insert(table.schoolBuilding)
		.values({
			campusId,
			name,
			description: description || null,
			flags
		})
		.returning();

	return building;
}

export async function getBuildingsByCampusId(campusId: number, includeArchived: boolean = false) {
	const buildings = await db
		.select()
		.from(table.schoolBuilding)
		.where(
			and(
				eq(table.schoolBuilding.campusId, campusId),
				includeArchived ? undefined : notArchived(table.schoolBuilding.flags)
			)
		)
		.orderBy(asc(table.schoolBuilding.name));

	return buildings;
}

export async function getBuildingsBySchoolId(schoolId: number, includeArchived: boolean = false) {
	const buildings = await db
		.select({
			building: table.schoolBuilding,
			campus: {
				id: table.campus.id,
				name: table.campus.name
			}
		})
		.from(table.campus)
		.innerJoin(table.schoolBuilding, eq(table.schoolBuilding.campusId, table.campus.id))
		.where(
			and(
				eq(table.campus.schoolId, schoolId),
				includeArchived ? undefined : notArchived(table.schoolBuilding.flags)
			)
		)
		.orderBy(asc(table.campus.name), asc(table.schoolBuilding.name));

	return buildings.map((row) => ({
		...row.building,
		campusName: row.campus.name
	}));
}

export async function createSpace(
	buildingId: number,
	name: string,
	type: schoolSpaceTypeEnum,
	capacity?: number | null,
	description?: string | null,
	flags: number = RecordFlagEnum.none
) {
	const [space] = await db
		.insert(table.schoolSpace)
		.values({
			buildingId,
			name,
			type,
			capacity: capacity || null,
			description: description || null,
			flags
		})
		.returning();

	return space;
}

export async function getSpacesBySchoolId(schoolId: number, includeArchived: boolean = false) {
	const spaces = await db
		.select({
			id: table.schoolSpace.id,
			buildingId: table.schoolSpace.buildingId,
			buildingName: table.schoolBuilding.name,
			campusId: table.schoolBuilding.campusId,
			campusName: table.campus.name,
			name: table.schoolSpace.name,
			type: table.schoolSpace.type,
			capacity: table.schoolSpace.capacity,
			description: table.schoolSpace.description,
			flags: table.schoolSpace.flags,
			createdAt: table.schoolSpace.createdAt,
			updatedAt: table.schoolSpace.updatedAt
		})
		.from(table.campus)
		.innerJoin(table.schoolBuilding, eq(table.schoolBuilding.campusId, table.campus.id))
		.innerJoin(table.schoolSpace, eq(table.schoolSpace.buildingId, table.schoolBuilding.id))
		.where(
			and(
				eq(table.campus.schoolId, schoolId),
				includeArchived ? undefined : notArchived(table.schoolSpace.flags)
			)
		)
		.orderBy(table.schoolSpace.name);

	return spaces;
}

export async function createYearLevelsForSchool(schoolId: number, yearLevels: yearLevelEnum[]) {
	const insertedYearLevels = [];

	for (const yl of yearLevels) {
		const [yearLevel] = await db
			.insert(table.yearLevel)
			.values({
				schoolId,
				yearLevel: yl,
				flags: RecordFlagEnum.none
			})
			.returning();

		insertedYearLevels.push(yearLevel);
	}

	return insertedYearLevels;
}

export async function setYearLevelGradeScale(yearLevelId: number, gradeScaleId: number) {
	const [updatedYearLevel] = await db
		.update(table.yearLevel)
		.set({
			gradeScaleId
		})
		.where(eq(table.yearLevel.id, yearLevelId))
		.returning();

	return updatedYearLevel;
}

export async function getSpacesByCampusId(campusId: number, includeArchived: boolean = false) {
	const spaces = await db
		.select({
			space: table.schoolSpace
		})
		.from(table.schoolBuilding)
		.innerJoin(table.schoolSpace, eq(table.schoolSpace.buildingId, table.schoolBuilding.id))
		.where(
			and(
				eq(table.schoolBuilding.campusId, campusId),
				includeArchived ? undefined : notArchived(table.schoolSpace.flags)
			)
		)
		.orderBy(table.schoolSpace.name);

	return spaces.map((row) => row.space);
}

export async function getSpaceById(spaceId: number, includeArchived: boolean = false) {
	const spaces = await db
		.select()
		.from(table.schoolSpace)
		.where(
			and(
				eq(table.schoolSpace.id, spaceId),
				includeArchived ? undefined : notArchived(table.schoolSpace.flags)
			)
		)
		.limit(1);

	return spaces.length > 0 ? spaces[0] : null;
}

export async function updateSpace(
	spaceId: number,
	updates: {
		name?: string;
		type?: schoolSpaceTypeEnum;
		capacity?: number | null;
		description?: string | null;
		flags?: number;
	}
) {
	const [space] = await db
		.update(table.schoolSpace)
		.set(updates)
		.where(eq(table.schoolSpace.id, spaceId))
		.returning();

	return space;
}

export async function archiveSpace(spaceId: number) {
	const [space] = await db
		.update(table.schoolSpace)
		.set({ flags: setFlagExpr(table.schoolSpace.flags, RecordFlagEnum.archived) })
		.where(eq(table.schoolSpace.id, spaceId))
		.returning();

	return space;
}

export async function getSubjectsBySchoolIdAndYearLevel(
	schoolId: number,
	yearLevel: yearLevelEnum
) {
	const subjects = await db
		.select()
		.from(table.subject)
		.innerJoin(table.yearLevel, eq(table.subject.yearLevelId, table.yearLevel.id))
		.where(
			and(
				eq(table.subject.schoolId, schoolId),
				eq(table.yearLevel.yearLevel, yearLevel),
				notArchived(table.subject.flags)
			)
		)
		.orderBy(asc(table.subject.name));

	return subjects;
}

export async function getSemestersBySchoolId(schoolId: number, includeArchived: boolean = false) {
	const semesters = await db
		.select()
		.from(table.schoolSemester)
		.where(
			and(
				eq(table.schoolSemester.schoolId, schoolId),
				includeArchived ? undefined : notArchived(table.schoolSemester.flags)
			)
		)
		.orderBy(asc(table.schoolSemester.schoolYear), asc(table.schoolSemester.semNumber));

	return semesters;
}

export async function getSemestersWithTermsBySchoolIdForYear(
	schoolId: number,
	year: number,
	includeArchived: boolean = false
) {
	const semesters = await db
		.select()
		.from(table.schoolSemester)
		.where(
			and(
				eq(table.schoolSemester.schoolId, schoolId),
				eq(table.schoolSemester.schoolYear, year),
				includeArchived ? undefined : notArchived(table.schoolSemester.flags)
			)
		)
		.orderBy(asc(table.schoolSemester.schoolYear), asc(table.schoolSemester.semNumber));

	const semesterIds = semesters.map((semester) => semester.id);

	if (semesterIds.length === 0) {
		return [];
	}

	const terms = await db
		.select()
		.from(table.schoolTerm)
		.where(
			and(
				inArray(table.schoolTerm.schoolSemesterId, semesterIds),
				includeArchived ? undefined : notArchived(table.schoolTerm.flags)
			)
		)
		.orderBy(asc(table.schoolTerm.startDate));

	return semesters.map((semester) => ({
		...semester,
		terms: terms.filter((term) => term.schoolSemesterId === semester.id)
	}));
}

export async function createSchoolTerm(
	semesterId: number,
	termNumber: number,
	startDate: Date,
	endDate: Date
) {
	const [term] = await db
		.insert(table.schoolTerm)
		.values({
			schoolSemesterId: semesterId,
			termNumber: termNumber,
			startDate,
			endDate,
			flags: RecordFlagEnum.none
		})
		.returning();

	return term;
}

export async function updateSchoolTerm(
	termId: number,
	updates: {
		startDate?: Date;
		endDate?: Date;
	}
) {
	const [term] = await db
		.update(table.schoolTerm)
		.set(updates)
		.where(eq(table.schoolTerm.id, termId))
		.returning();

	return term;
}

export async function deleteSchoolTerm(termId: number) {
	const [term] = await db
		.delete(table.schoolTerm)
		.where(eq(table.schoolTerm.id, termId))
		.returning();

	return term;
}

export async function getSchoolTermById(termId: number) {
	const terms = await db
		.select()
		.from(table.schoolTerm)
		.where(eq(table.schoolTerm.id, termId))
		.limit(1);

	return terms.length > 0 ? terms[0] : null;
}

export async function getSchoolSemesterById(semesterId: number) {
	const semesters = await db
		.select()
		.from(table.schoolSemester)
		.where(eq(table.schoolSemester.id, semesterId))
		.limit(1);

	return semesters.length > 0 ? semesters[0] : null;
}

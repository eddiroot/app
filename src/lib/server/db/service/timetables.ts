import { constraintTypeEnum, queueStatusEnum, userTypeEnum, yearLevelEnum } from '$lib/enums.js';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { and, asc, count, eq, ilike, inArray, or } from 'drizzle-orm';

// ============================================================================
// TIMETABLE - Core Operations
// ============================================================================
export async function getTimetableByTimetableId(timetableId: number) {
	const [timetable] = await db

		.select()
		.from(table.timetable)
		.where(eq(table.timetable.id, timetableId))
		.limit(1);

	return timetable;
}

export async function getSchoolTimetablesBySchoolId(
	schoolId: number,
	includeArchived: boolean = false
) {
	const timetablesAndSemesters = await db
		.select()
		.from(table.timetable)
		.innerJoin(table.schoolSemester, eq(table.timetable.schoolSemesterId, table.schoolSemester.id))
		.where(
			and(
				eq(table.timetable.schoolId, schoolId),
				includeArchived ? undefined : eq(table.timetable.isArchived, false)
			)
		)
		.orderBy(asc(table.timetable.name));

	return timetablesAndSemesters;
}

export async function getTimetableAndSchoolByTimetableId(timetableId: number) {
	const [result] = await db
		.select({
			timetable: table.timetable,
			school: table.school
		})
		.from(table.timetable)
		.innerJoin(table.school, eq(table.timetable.schoolId, table.school.id))
		.where(eq(table.timetable.id, timetableId))
		.limit(1);

	return result;
}

export async function createSchoolTimetable(data: {
	schoolId: number;
	name: string;
	schoolYear: number;
	schoolSemesterId: number;
}) {
	const [timetable] = await db
		.insert(table.timetable)
		.values({
			schoolId: data.schoolId,
			name: data.name,
			schoolYear: data.schoolYear,
			schoolSemesterId: data.schoolSemesterId,
			isArchived: false
		})
		.returning();

	return timetable;
}

// ============================================================================
// TIMETABLE DAYS - Operations
// ============================================================================

export async function getTimetableDraftDaysByTimetableDraftId(timetableDraftId: number) {
	const days = await db
		.select()
		.from(table.timetableDay)
		.where(eq(table.timetableDay.timetableDraftId, timetableDraftId))
		.orderBy(asc(table.timetableDay.day));

	return days;
}

export async function updateTimetableDraftDaysByTimetableDraftId(
	timetableDraftId: number,
	days: number[]
) {
	if (days.length === 0) {
		throw new Error('At least one day must be selected');
	}

	await db
		.delete(table.timetableDay)
		.where(eq(table.timetableDay.timetableDraftId, timetableDraftId));

	// Insert new days
	if (days.length > 0) {
		await db.insert(table.timetableDay).values(
			days.map((day) => ({
				timetableDraftId,
				day
			}))
		);
	}

	return await getTimetableDraftDaysByTimetableDraftId(timetableDraftId);
}

// ============================================================================
// TIMETABLE PERIODS - Operations
// ============================================================================

export async function getTimetableDraftPeriodsByTimetableDraftId(timetableDraftId: number) {
	const periods = await db
		.select()
		.from(table.timetablePeriod)
		.where(eq(table.timetablePeriod.timetableDraftId, timetableDraftId))
		.orderBy(asc(table.timetablePeriod.startTime));

	return periods;
}

export async function getTimetableDraftCycleWeekRepeatsByTimetableDraftId(
	timetableDraftId: number
) {
	const cycle = await db
		.select({ cycleWeekRepeats: table.timetableDraft.cycleWeekRepeats })
		.from(table.timetableDraft)
		.where(eq(table.timetableDraft.id, timetableDraftId))
		.limit(1);
	return cycle.length > 0 ? cycle[0].cycleWeekRepeats : 1;
}

export async function updateTimetableDraftCycleWeekRepeatsByTimetableDraftId(
	timetableDraftId: number,
	cycleWeekRepeats: number
) {
	if (cycleWeekRepeats < 1 || cycleWeekRepeats > 52) {
		throw new Error('Cycle week repeats must be between 1 and 52');
	}

	await db
		.update(table.timetableDraft)
		.set({ cycleWeekRepeats })
		.where(eq(table.timetableDraft.id, timetableDraftId));
}

export async function addTimetableDraftPeriod(
	timetableDraftId: number,
	startTime: string,
	endTime: string
) {
	// Insert the new period
	const [newPeriod] = await db
		.insert(table.timetablePeriod)
		.values({
			timetableDraftId,
			startTime,
			endTime
		})
		.returning();

	// Get all periods ordered by start time
	const allPeriods = await getTimetableDraftPeriodsByTimetableDraftId(timetableDraftId);

	// Update the nextPeriodId chain for all periods
	for (let i = 0; i < allPeriods.length; i++) {
		const currentPeriod = allPeriods[i];
		const nextPeriod = allPeriods[i + 1];

		await db
			.update(table.timetablePeriod)
			.set({
				nextPeriodId: nextPeriod ? nextPeriod.id : null
			})
			.where(eq(table.timetablePeriod.id, currentPeriod.id));
	}

	return newPeriod;
}

export async function deleteTimetableDraftPeriodByPeriodId(periodId: number, timetableId: number) {
	// Check if this is the last period
	const periods = await getTimetableDraftPeriodsByTimetableDraftId(timetableId);
	if (periods.length <= 1) {
		throw new Error('At least one period must exist');
	}

	// Delete the period
	await db.delete(table.timetablePeriod).where(eq(table.timetablePeriod.id, periodId));

	// Get remaining periods ordered by start time
	const remainingPeriods = await getTimetableDraftPeriodsByTimetableDraftId(timetableId);

	// Rebuild the nextPeriodId chain for remaining periods
	for (let i = 0; i < remainingPeriods.length; i++) {
		const currentPeriod = remainingPeriods[i];
		const nextPeriod = remainingPeriods[i + 1];

		await db
			.update(table.timetablePeriod)
			.set({
				nextPeriodId: nextPeriod ? nextPeriod.id : null
			})
			.where(eq(table.timetablePeriod.id, currentPeriod.id));
	}

	return remainingPeriods;
}

// ============================================================================
// TIMETABLE DRAFT - Core Operations
// ============================================================================

export async function getTimetableDraftById(timetableDraftId: number) {
	const [timetableDraft] = await db
		.select()
		.from(table.timetableDraft)
		.where(eq(table.timetableDraft.id, timetableDraftId))
		.limit(1);
	return timetableDraft;
}

export async function getTimetableDraftsByTimetableId(timetableId: number) {
	const timetableDrafts = await db
		.select()
		.from(table.timetableDraft)
		.where(eq(table.timetableDraft.timetableId, timetableId))
		.orderBy(asc(table.timetableDraft.createdAt));

	return timetableDrafts;
}

export async function createTimetableDraft(data: { timetableId: number; name: string }) {
	const [draft] = await db
		.insert(table.timetableDraft)
		.values({
			name: data.name,
			timetableId: data.timetableId,
			cycleWeekRepeats: 1
		})
		.returning();

	const defaultDays = [0, 1, 2, 3, 4]; // Monday to Friday
	await updateTimetableDraftDaysByTimetableDraftId(draft.id, defaultDays);

	return draft;
}

export async function deleteTimetableDraft(timetableDraftId: number) {
	await db.delete(table.timetableDraft).where(eq(table.timetableDraft.id, timetableDraftId));
}

export async function updateTimetableDraftError(timetableDraftId: number, errorMessage: string) {
	await db
		.update(table.timetableDraft)
		.set({
			errorMessage
		})
		.where(eq(table.timetableDraft.id, timetableDraftId));
}

export async function updateTimetableDraftTranslatedError(
	timetableDraftId: number,
	translatedErrorMessage: string
) {
	const [entry] = await db
		.update(table.timetableDraft)
		.set({ translatedErrorMessage })
		.where(eq(table.timetableDraft.id, timetableDraftId))
		.returning();

	return entry;
}

export async function updateTimetableDraftFetResponse(
	timetableDraftId: number,
	fetResponse: string
) {
	await db
		.update(table.timetableDraft)
		.set({
			fetResponse
		})
		.where(eq(table.timetableDraft.id, timetableDraftId));
}

export async function deleteTimetableDraftActivityData(timetableDraftId: number) {
	// Remove all existing FET class data for this timetable draft
	const existingClasses = await db
		.select({ id: table.fetSubjectOfferingClass.id })
		.from(table.fetSubjectOfferingClass)
		.where(eq(table.fetSubjectOfferingClass.timetableDraftId, timetableDraftId));

	for (const existingClass of existingClasses) {
		// Delete associated allocations
		await db
			.delete(table.fetSubjectClassAllocation)
			.where(eq(table.fetSubjectClassAllocation.fetSubjectOfferingClassId, existingClass.id));
		// Delete associated user-class links
		await db
			.delete(table.fetSubjectOfferingClassUser)
			.where(eq(table.fetSubjectOfferingClassUser.fetSubOffClassId, existingClass.id));
	}

	// Delete the classes themselves
	await db
		.delete(table.fetSubjectOfferingClass)
		.where(eq(table.fetSubjectOfferingClass.timetableDraftId, timetableDraftId));
}

// ============================================================================
// STUDENT GROUPS - Core Operations
// ============================================================================

export async function getTimetableDraftGroupsByTimetableDraftId(timetableDraftId: number) {
	const groups = await db
		.select()
		.from(table.timetableGroup)
		.where(eq(table.timetableGroup.timetableDraftId, timetableDraftId))
		.orderBy(asc(table.timetableGroup.name));

	return groups;
}

export async function getTimetableDraftStudentGroupsWithCountsByTimetableDraftId(
	timetableDraftId: number
) {
	const groups = await db
		.select({
			id: table.timetableGroup.id,
			name: table.timetableGroup.name,
			yearLevel: table.timetableGroup.yearLevel,
			count: count(table.timetableGroupMember.userId)
		})
		.from(table.timetableGroup)
		.leftJoin(
			table.timetableGroupMember,
			eq(table.timetableGroup.id, table.timetableGroupMember.groupId)
		)
		.where(eq(table.timetableGroup.timetableDraftId, timetableDraftId))
		.groupBy(table.timetableGroup.id, table.timetableGroup.name, table.timetableGroup.yearLevel)
		.orderBy(asc(table.timetableGroup.yearLevel), asc(table.timetableGroup.name));
	return groups;
}

/**
 * Get all student groups with their members by timetable draft ID
 */
export async function getAllStudentGroupsByTimetableDraftId(timetableDraftId: number) {
	const groupsWithMembers = await db
		.select({
			groupId: table.timetableGroup.id,
			groupName: table.timetableGroup.name,
			yearLevel: table.timetableGroup.yearLevel,
			userId: table.timetableGroupMember.userId,
			userFirstName: table.user.firstName,
			userLastName: table.user.lastName
		})
		.from(table.timetableGroup)
		.leftJoin(
			table.timetableGroupMember,
			eq(table.timetableGroup.id, table.timetableGroupMember.groupId)
		)
		.leftJoin(table.user, eq(table.timetableGroupMember.userId, table.user.id))
		.where(eq(table.timetableGroup.timetableDraftId, timetableDraftId))
		.orderBy(
			asc(table.timetableGroup.yearLevel),
			asc(table.timetableGroup.name),
			asc(table.user.firstName)
		);

	return groupsWithMembers;
}

export async function createTimetableDraftStudentGroup(
	timetableDraftId: number,
	yearLevel: yearLevelEnum,
	name: string
) {
	const [group] = await db
		.insert(table.timetableGroup)
		.values({
			timetableDraftId,
			yearLevel,
			name
		})
		.returning();

	return group;
}

export async function deleteTimetableDraftStudentGroup(groupId: number) {
	// First, delete all group members
	await db
		.delete(table.timetableGroupMember)
		.where(eq(table.timetableGroupMember.groupId, groupId));

	// Then delete the group itself
	await db.delete(table.timetableGroup).where(eq(table.timetableGroup.id, groupId));
}

// ============================================================================
// STUDENT GROUP MEMBERSHIP - Operations
// ============================================================================

export async function addStudentToTimetableDraftGroup(groupId: number, userId: string) {
	const [member] = await db
		.insert(table.timetableGroupMember)
		.values({
			groupId,
			userId
		})
		.onConflictDoNothing()
		.returning();

	return member;
}

export async function removeStudentFromTimetableDraftGroup(groupId: number, userId: string) {
	await db
		.delete(table.timetableGroupMember)
		.where(
			and(
				eq(table.timetableGroupMember.groupId, groupId),
				eq(table.timetableGroupMember.userId, userId)
			)
		);
}

export async function assignStudentsToGroupsRandomly(
	timetableDraftId: number,
	yearLevel: yearLevelEnum,
	schoolId: number
) {
	// Get all students for this year level
	const students = await db
		.select({
			id: table.user.id
		})
		.from(table.user)
		.where(
			and(
				eq(table.user.schoolId, schoolId),
				eq(table.user.type, userTypeEnum.student),
				eq(table.user.yearLevel, yearLevel),
				eq(table.user.isArchived, false)
			)
		);

	// Get all groups for this year level and timetable
	const groups = await db
		.select()
		.from(table.timetableGroup)
		.where(
			and(
				eq(table.timetableGroup.timetableDraftId, timetableDraftId),
				eq(table.timetableGroup.yearLevel, yearLevel)
			)
		);

	if (groups.length === 0) {
		throw new Error('No groups found for this year level');
	}

	// Remove existing assignments for these students
	const studentIds = students.map((s) => s.id);
	if (studentIds.length > 0) {
		const existingGroupIds = await db
			.select({ id: table.timetableGroup.id })
			.from(table.timetableGroup)
			.where(eq(table.timetableGroup.timetableDraftId, timetableDraftId));

		if (existingGroupIds.length > 0) {
			await db.delete(table.timetableGroupMember).where(
				and(
					inArray(table.timetableGroupMember.userId, studentIds),
					inArray(
						table.timetableGroupMember.groupId,
						existingGroupIds.map((g) => g.id)
					)
				)
			);
		}
	}

	// Shuffle students array
	const shuffledStudents = [...students].sort(() => Math.random() - 0.5);

	// Assign students to groups in round-robin fashion
	const assignments = shuffledStudents.map((student, index) => ({
		userId: student.id,
		groupId: groups[index % groups.length].id
	}));

	// Insert new assignments
	if (assignments.length > 0) {
		await db.insert(table.timetableGroupMember).values(assignments);
	}

	return assignments.length;
}

// ============================================================================
// STUDENTS - Retrieval Operations
// ============================================================================

export async function getStudentsWithGroupsByTimetableDraftId(
	timetableDraftId: number,
	schoolId: number
) {
	const timetable = await db
		.select()
		.from(table.timetable)
		.where(and(eq(table.timetable.id, timetableDraftId), eq(table.timetable.schoolId, schoolId)))
		.limit(1);

	if (timetable.length === 0) {
		throw new Error(
			`Timetable Draft with ID ${timetableDraftId} does not belong to school with ID ${schoolId}`
		);
	}

	const students = await db
		.select({
			id: table.user.id,
			email: table.user.email,
			firstName: table.user.firstName,
			middleName: table.user.middleName,
			lastName: table.user.lastName,
			avatarUrl: table.user.avatarUrl,
			yearLevel: table.user.yearLevel,
			groupId: table.timetableGroup.id,
			groupName: table.timetableGroup.name
		})
		.from(table.user)
		.leftJoin(table.timetableGroupMember, eq(table.user.id, table.timetableGroupMember.userId))
		.leftJoin(
			table.timetableGroup,
			and(
				eq(table.timetableGroupMember.groupId, table.timetableGroup.id),
				eq(table.timetableGroup.timetableDraftId, timetableDraftId)
			)
		)
		.where(
			and(
				eq(table.user.schoolId, schoolId),
				eq(table.user.type, userTypeEnum.student),
				eq(table.user.isArchived, false)
			)
		)
		.orderBy(
			asc(table.timetableGroup.name),
			asc(table.user.lastName),
			asc(table.user.middleName),
			asc(table.user.firstName)
		);

	return students;
}

export async function getStudentsByGroupId(groupId: number) {
	const students = await db
		.select({
			id: table.user.id,
			email: table.user.email,
			firstName: table.user.firstName,
			middleName: table.user.middleName,
			lastName: table.user.lastName,
			avatarUrl: table.user.avatarUrl,
			yearLevel: table.user.yearLevel
		})
		.from(table.timetableGroupMember)
		.innerJoin(table.user, eq(table.timetableGroupMember.userId, table.user.id))
		.where(eq(table.timetableGroupMember.groupId, groupId))
		.orderBy(asc(table.user.lastName), asc(table.user.firstName));

	return students;
}

export async function getStudentsForTimetable(timetableId: number, schoolId: number) {
	// Verify timetable belongs to school
	const timetable = await db
		.select()
		.from(table.timetable)
		.where(and(eq(table.timetable.id, timetableId), eq(table.timetable.schoolId, schoolId)))
		.limit(1);

	if (timetable.length === 0) {
		throw new Error(
			`Timetable with ID ${timetableId} does not belong to school with ID ${schoolId}`
		);
	}

	// Get all students for the school
	const students = await db
		.select({
			id: table.user.id,
			email: table.user.email,
			firstName: table.user.firstName,
			middleName: table.user.middleName,
			lastName: table.user.lastName,
			avatarUrl: table.user.avatarUrl,
			yearLevel: table.user.yearLevel
		})
		.from(table.user)
		.where(
			and(
				eq(table.user.schoolId, schoolId),
				eq(table.user.type, userTypeEnum.student),
				eq(table.user.isArchived, false)
			)
		)
		.orderBy(asc(table.user.yearLevel), asc(table.user.lastName), asc(table.user.firstName));

	return students;
}

// ============================================================================
// TIMETABLE DRAFT ACTIVITIES - Core Operations
// ============================================================================

export async function getTimetableDraftActivitiesByTimetableDraftId(timetableDraftId: number) {
	const activities = await db
		.select()
		.from(table.timetableActivity)
		.where(eq(table.timetableActivity.timetableDraftId, timetableDraftId))
		.orderBy(asc(table.timetableActivity.subjectOfferingId));

	return activities;
}

export async function getEnhancedTimetableDraftActivitiesByTimetableDraftId(timetableId: number) {
	const baseActivities = await getTimetableDraftActivitiesByTimetableDraftId(timetableId);

	const activities = await Promise.all(
		baseActivities.map(async (activity) => {
			const [teachers, locations, students, groups, years] = await Promise.all([
				getActivityTeachersByActivityId(activity.id),
				getActivityLocationsByActivityId(activity.id),
				getActivityStudentsByActivityId(activity.id),
				getActivityGroupsByActivityId(activity.id),
				getActivityYearsByActivityId(activity.id)
			]);

			return {
				...activity,
				teacherIds: teachers.map((t) => t.id),
				locationIds: locations.map((l) => l.id),
				studentIds: students.map((s) => s.id),
				groupIds: groups.map((g) => g.id),
				yearLevels: years.map((y) => y.yearLevel)
			};
		})
	);

	return activities;
}

export async function createTimetableDraftActivity(data: {
	timetableDraftId: number;
	subjectOfferingId: number;
	teacherId: string;
	groupId: number;
	periodsPerInstance: number;
	totalPeriods: number;
}) {
	await db.insert(table.timetableActivity).values(data).returning();
}

export async function createTimetableDraftActivityWithRelations(data: {
	timetableDraftId: number;
	subjectOfferingId: number;
	teacherIds: string[];
	yearLevels: string[];
	groupIds: number[];
	studentIds: string[];
	preferredSpaceIds: number[];
	periodsPerInstance: number;
	instancesPerWeek: number;
}) {
	const {
		timetableDraftId,
		subjectOfferingId,
		teacherIds,
		yearLevels,
		groupIds,
		studentIds,
		preferredSpaceIds,
		periodsPerInstance,
		instancesPerWeek
	} = data;

	// Calculate total periods (instances per week * periods per instance)
	const totalPeriods = instancesPerWeek * periodsPerInstance;

	// If no group is specified, we need to create activities for each assignment level
	// For now, we'll require at least one group to create the base activity
	// If year levels or students are specified without groups, we'll handle them separately

	// Create base activities for each group
	const activityIds: number[] = [];

	const [activity] = await db
		.insert(table.timetableActivity)
		.values({
			timetableDraftId,
			subjectOfferingId,
			periodsPerInstance,
			totalPeriods
		})
		.returning();

	activityIds.push(activity.id);

	// Add additional teachers as preferences
	const otherTeacherIds = teacherIds.slice(1);
	if (otherTeacherIds.length > 0) {
		await db.insert(table.timetableActivityTeacherPreference).values(
			otherTeacherIds.map((teacherId) => ({
				timetableActivityId: activity.id,
				teacherId
			}))
		);
	}

	// Add preferred spaces (if none specified, get all spaces for the school)
	let spaceIds = preferredSpaceIds;
	if (spaceIds.length === 0) {
		// Get school ID from timetable

		const [timetableData] = await db
			.select({ schoolId: table.timetable.schoolId })
			.from(table.timetableDraft)
			.innerJoin(table.timetable, eq(table.timetable.id, table.timetableDraft.timetableId))
			.where(eq(table.timetable.id, timetableDraftId));

		// Get all spaces for this school by joining through campus and building
		const allSpaces = await db
			.select({ id: table.schoolSpace.id })
			.from(table.campus)
			.innerJoin(table.schoolBuilding, eq(table.schoolBuilding.campusId, table.campus.id))
			.innerJoin(table.schoolSpace, eq(table.schoolSpace.buildingId, table.schoolBuilding.id))
			.where(eq(table.campus.schoolId, timetableData.schoolId));

		spaceIds = allSpaces.map((space) => space.id);
	}

	if (spaceIds.length > 0) {
		await db.insert(table.timetableActivityPreferredSpace).values(
			spaceIds.map((spaceId) => ({
				timetableActivityId: activity.id,
				schoolSpaceId: spaceId
			}))
		);
	}

	if (groupIds.length > 0) {
		await db.insert(table.timetableActivityAssignedGroup).values(
			groupIds.map((timetableGroupId) => ({
				timetableActivityId: activity.id,
				timetableGroupId
			}))
		);
	}

	// Add assigned students if specified
	if (studentIds.length > 0) {
		await db.insert(table.timetableActivityAssignedStudent).values(
			studentIds.map((userId) => ({
				timetableActivityId: activity.id,
				userId
			}))
		);
	}

	// Add assigned year levels if specified
	if (yearLevels.length > 0) {
		await db.insert(table.timetableActivityAssignedYear).values(
			yearLevels.map((yearlevel) => ({
				timetableActivityId: activity.id,
				yearlevel: yearlevel as yearLevelEnum
			}))
		);
	}

	return activityIds;
}

export async function deleteTimetableDraftActivity(activityId: number) {
	await db.delete(table.timetableActivity).where(eq(table.timetableActivity.id, activityId));
}

export async function updateTimetableDraftActivity(
	activityId: number,
	data: {
		subjectOfferingId?: number;
		periodsPerInstance?: number;
		totalPeriods?: number;
		teacherIds?: string[];
		yearLevels?: string[];
		groupIds?: number[];
		studentIds?: string[];
		preferredSpaceIds?: number[];
	}
) {
	const {
		subjectOfferingId,
		periodsPerInstance,
		totalPeriods,
		teacherIds,
		yearLevels,
		groupIds,
		studentIds,
		preferredSpaceIds
	} = data;

	// Update the base activity fields
	const activityUpdateData: {
		subjectOfferingId?: number;
		periodsPerInstance?: number;
		totalPeriods?: number;
	} = {};

	if (subjectOfferingId !== undefined) activityUpdateData.subjectOfferingId = subjectOfferingId;
	if (periodsPerInstance !== undefined) activityUpdateData.periodsPerInstance = periodsPerInstance;
	if (totalPeriods !== undefined) activityUpdateData.totalPeriods = totalPeriods;

	if (Object.keys(activityUpdateData).length > 0) {
		await db
			.update(table.timetableActivity)
			.set(activityUpdateData)
			.where(eq(table.timetableActivity.id, activityId));
	}

	// Update teachers
	if (teacherIds !== undefined) {
		await db
			.delete(table.timetableActivityTeacherPreference)
			.where(eq(table.timetableActivityTeacherPreference.timetableActivityId, activityId));

		if (teacherIds.length > 0) {
			await db.insert(table.timetableActivityTeacherPreference).values(
				teacherIds.map((teacherId) => ({
					timetableActivityId: activityId,
					teacherId
				}))
			);
		}
	}

	// Update preferred spaces
	if (preferredSpaceIds !== undefined) {
		await db
			.delete(table.timetableActivityPreferredSpace)
			.where(eq(table.timetableActivityPreferredSpace.timetableActivityId, activityId));

		if (preferredSpaceIds.length > 0) {
			await db.insert(table.timetableActivityPreferredSpace).values(
				preferredSpaceIds.map((spaceId) => ({
					timetableActivityId: activityId,
					schoolSpaceId: spaceId
				}))
			);
		}
	}

	// Update groups
	if (groupIds !== undefined) {
		await db
			.delete(table.timetableActivityAssignedGroup)
			.where(eq(table.timetableActivityAssignedGroup.timetableActivityId, activityId));

		if (groupIds.length > 0) {
			await db.insert(table.timetableActivityAssignedGroup).values(
				groupIds.map((timetableGroupId) => ({
					timetableActivityId: activityId,
					timetableGroupId: timetableGroupId
				}))
			);
		}
	}

	// Update students
	if (studentIds !== undefined) {
		await db
			.delete(table.timetableActivityAssignedStudent)
			.where(eq(table.timetableActivityAssignedStudent.timetableActivityId, activityId));

		if (studentIds.length > 0) {
			await db.insert(table.timetableActivityAssignedStudent).values(
				studentIds.map((userId) => ({
					timetableActivityId: activityId,
					userId
				}))
			);
		}
	}

	// Update year levels
	if (yearLevels !== undefined) {
		await db
			.delete(table.timetableActivityAssignedYear)
			.where(eq(table.timetableActivityAssignedYear.timetableActivityId, activityId));

		if (yearLevels.length > 0) {
			await db.insert(table.timetableActivityAssignedYear).values(
				yearLevels.map((yearlevel) => ({
					timetableActivityId: activityId,
					yearlevel: yearlevel as yearLevelEnum
				}))
			);
		}
	}

	// Return the updated activity
	const [activity] = await db
		.select()
		.from(table.timetableActivity)
		.where(eq(table.timetableActivity.id, activityId))
		.limit(1);

	return activity;
}

// ============================================================================
// ACTIVITY RELATIONS - Retrieval Operations
// ============================================================================

export async function getActivityTeachersByActivityId(activityId: number) {
	const teachers = await db
		.select({
			id: table.user.id,
			email: table.user.email,
			firstName: table.user.firstName,
			middleName: table.user.middleName,
			lastName: table.user.lastName,
			avatarUrl: table.user.avatarUrl
		})
		.from(table.timetableActivityTeacherPreference)
		.innerJoin(table.user, eq(table.timetableActivityTeacherPreference.teacherId, table.user.id))
		.where(eq(table.timetableActivityTeacherPreference.timetableActivityId, activityId))
		.orderBy(asc(table.user.lastName), asc(table.user.firstName));

	return teachers;
}

export async function getActivityLocationsByActivityId(activityId: number) {
	const locations = await db
		.select({
			id: table.schoolSpace.id,
			buildingId: table.schoolSpace.buildingId,
			name: table.schoolSpace.name,
			type: table.schoolSpace.type,
			capacity: table.schoolSpace.capacity,
			description: table.schoolSpace.description
		})
		.from(table.timetableActivityPreferredSpace)
		.innerJoin(
			table.schoolSpace,
			eq(table.timetableActivityPreferredSpace.schoolSpaceId, table.schoolSpace.id)
		)
		.where(eq(table.timetableActivityPreferredSpace.timetableActivityId, activityId))
		.orderBy(asc(table.schoolSpace.name));

	return locations;
}

export async function getActivityStudentsByActivityId(activityId: number) {
	const students = await db
		.select({
			id: table.user.id,
			email: table.user.email,
			firstName: table.user.firstName,
			middleName: table.user.middleName,
			lastName: table.user.lastName,
			avatarUrl: table.user.avatarUrl,
			yearLevel: table.user.yearLevel
		})
		.from(table.timetableActivityAssignedStudent)
		.innerJoin(table.user, eq(table.timetableActivityAssignedStudent.userId, table.user.id))
		.where(eq(table.timetableActivityAssignedStudent.timetableActivityId, activityId))
		.orderBy(asc(table.user.lastName), asc(table.user.firstName));

	return students;
}

export async function getActivityGroupsByActivityId(activityId: number) {
	const groups = await db
		.select({
			id: table.timetableGroup.id,
			timetableDraftId: table.timetableGroup.timetableDraftId,
			yearLevel: table.timetableGroup.yearLevel,
			name: table.timetableGroup.name
		})
		.from(table.timetableActivityAssignedGroup)
		.innerJoin(
			table.timetableGroup,
			eq(table.timetableActivityAssignedGroup.timetableGroupId, table.timetableGroup.id)
		)
		.where(eq(table.timetableActivityAssignedGroup.timetableActivityId, activityId))
		.orderBy(asc(table.timetableGroup.yearLevel), asc(table.timetableGroup.name));

	return groups;
}

export async function getActivityYearsByActivityId(activityId: number) {
	const years = await db
		.select({
			yearLevel: table.timetableActivityAssignedYear.yearlevel
		})
		.from(table.timetableActivityAssignedYear)
		.where(eq(table.timetableActivityAssignedYear.timetableActivityId, activityId))
		.orderBy(asc(table.timetableActivityAssignedYear.yearlevel));

	return years;
}

// ============================================================================
// TIMETABLE QUEUE - Operations
// ============================================================================

export async function createTimetableQueueEntry(
	timetableId: number,
	timetableDraftId: number,
	userId: string,
	fileName: string
) {
	const [entry] = await db
		.insert(table.timetableQueue)
		.values({
			timetableId,
			userId,
			fileName,
			timetableDraftId,
			status: queueStatusEnum.queued
		})
		.returning();

	return entry;
}

export async function getInProgressTimetableQueues() {
	const entries = await db
		.select()
		.from(table.timetableQueue)
		.where(eq(table.timetableQueue.status, queueStatusEnum.inProgress));

	return entries;
}

export async function getTimetableQueueByTimetableId(timetableId: number) {
	const entries = await db
		.select({
			id: table.timetableQueue.id,
			timetableId: table.timetableQueue.timetableId,
			timetableDraftId: table.timetableQueue.timetableDraftId,
			userId: table.timetableQueue.userId,
			fileName: table.timetableQueue.fileName,
			status: table.timetableQueue.status,
			createdAt: table.timetableQueue.createdAt,
			updatedAt: table.timetableQueue.updatedAt,
			errorMessage: table.timetableDraft.errorMessage,
			translatedErrorMessage: table.timetableDraft.translatedErrorMessage,
			fetResponse: table.timetableDraft.fetResponse
		})
		.from(table.timetableQueue)
		.innerJoin(
			table.timetableDraft,
			eq(table.timetableQueue.timetableDraftId, table.timetableDraft.id)
		)
		.where(eq(table.timetableQueue.timetableId, timetableId))
		.orderBy(asc(table.timetableQueue.createdAt));

	return entries;
}

export async function getCompletedDraftsByTimetableId(timetableId: number) {
	const entries = await db
		.select({
			id: table.timetableQueue.id,
			timetableId: table.timetableQueue.timetableId,
			timetableDraftId: table.timetableQueue.timetableDraftId,
			userId: table.timetableQueue.userId,
			fileName: table.timetableQueue.fileName,
			status: table.timetableQueue.status,
			createdAt: table.timetableQueue.createdAt,
			updatedAt: table.timetableQueue.updatedAt
		})
		.from(table.timetableQueue)
		.where(
			and(
				eq(table.timetableQueue.timetableId, timetableId),
				eq(table.timetableQueue.status, queueStatusEnum.completed)
			)
		)
		.orderBy(asc(table.timetableQueue.createdAt));

	return entries;
}

export async function getOldestQueuedTimetable() {
	const [entry] = await db
		.select({
			id: table.timetableQueue.id,
			timetableId: table.timetableQueue.timetableId,
			timetableDraftId: table.timetableQueue.timetableDraftId,
			userId: table.timetableQueue.userId,
			fileName: table.timetableQueue.fileName,
			status: table.timetableQueue.status,
			createdAt: table.timetableQueue.createdAt,
			timetable: table.timetable,
			school: table.school
		})
		.from(table.timetableQueue)
		.innerJoin(table.timetable, eq(table.timetableQueue.timetableId, table.timetable.id))
		.innerJoin(table.school, eq(table.timetable.schoolId, table.school.id))
		.where(eq(table.timetableQueue.status, queueStatusEnum.queued))
		.orderBy(asc(table.timetableQueue.createdAt))
		.limit(1);

	return entry;
}

export async function updateTimetableQueueStatus(
	queueId: number,
	status: queueStatusEnum,
	completedAt?: Date
) {
	const updateData: { status: queueStatusEnum; updatedAt?: Date } = { status };
	if (completedAt) {
		updateData.updatedAt = completedAt;
	}

	const [entry] = await db
		.update(table.timetableQueue)
		.set(updateData)
		.where(eq(table.timetableQueue.id, queueId))
		.returning();

	return entry;
}

// ============================================================================
// CONSTRAINTS - Core Operations
// ============================================================================

export async function createConstraint(data: {
	FETName: string;
	friendlyName: string;
	description: string;
	type: constraintTypeEnum;
	optional: boolean;
	repeatable: boolean;
}) {
	const [constraint] = await db
		.insert(table.constraint)
		.values({
			FETName: data.FETName,
			friendlyName: data.friendlyName,
			description: data.description,
			type: data.type,
			optional: data.optional,
			repeatable: data.repeatable
		})
		.returning();

	return constraint;
}

export async function getAllConstraints() {
	const constraints = await db
		.select()
		.from(table.constraint)
		.orderBy(asc(table.constraint.FETName));

	return constraints;
}

export async function getConstraintById(constraintId: number) {
	const [constraint] = await db
		.select()
		.from(table.constraint)
		.where(eq(table.constraint.id, constraintId))
		.limit(1);

	return constraint;
}

// ============================================================================
// TIMETABLE DRAFT CONSTRAINTS - Operations
// ============================================================================

export async function createTimetableDraftConstraint(data: {
	timetableDraftId: number;
	constraintId: number;
	active: boolean;
	parameters: Record<string, unknown>;
}) {
	const [constraint] = await db
		.insert(table.timetableDraftConstraint)
		.values({
			timetableDraftId: data.timetableDraftId,
			constraintId: data.constraintId,
			active: data.active,
			parameters: data.parameters
		})
		.returning();

	return constraint;
}

export async function getAllConstraintsByTimetableDraftId(timetableDraftId: number) {
	return db
		.select({
			id: table.timetableDraftConstraint.id,
			FETName: table.constraint.FETName,
			friendlyName: table.constraint.friendlyName,
			description: table.constraint.description,
			type: table.constraint.type,
			active: table.timetableDraftConstraint.active,
			optional: table.constraint.optional,
			repeatable: table.constraint.repeatable,
			parameters: table.timetableDraftConstraint.parameters,
			createdAt: table.timetableDraftConstraint.createdAt,
			updatedAt: table.timetableDraftConstraint.updatedAt
		})
		.from(table.timetableDraftConstraint)
		.innerJoin(
			table.constraint,
			eq(table.timetableDraftConstraint.constraintId, table.constraint.id)
		)
		.where(eq(table.timetableDraftConstraint.timetableDraftId, timetableDraftId))
		.orderBy(asc(table.constraint.FETName));
}

export async function getTimeConstraintsByTimetableDraftId(timetableDraftId: number) {
	return db
		.select({
			id: table.constraint.id,
			FETName: table.constraint.FETName,
			friendlyName: table.constraint.friendlyName,
			description: table.constraint.description,
			type: table.constraint.type,
			active: table.timetableDraftConstraint.active,
			parameters: table.timetableDraftConstraint.parameters
		})
		.from(table.timetableDraftConstraint)
		.innerJoin(
			table.constraint,
			eq(table.timetableDraftConstraint.constraintId, table.constraint.id)
		)
		.where(
			and(
				eq(table.timetableDraftConstraint.timetableDraftId, timetableDraftId),
				eq(table.constraint.type, constraintTypeEnum.time)
			)
		)
		.orderBy(asc(table.constraint.FETName));
}

export async function getSpaceConstraintsByTimetableDraftId(timetableDraftId: number) {
	return db
		.select({
			id: table.constraint.id,
			FETName: table.constraint.FETName,
			friendlyName: table.constraint.friendlyName,
			description: table.constraint.description,
			type: table.constraint.type,
			active: table.timetableDraftConstraint.active,
			parameters: table.timetableDraftConstraint.parameters
		})
		.from(table.timetableDraftConstraint)
		.innerJoin(
			table.constraint,
			eq(table.timetableDraftConstraint.constraintId, table.constraint.id)
		)
		.where(
			and(
				eq(table.timetableDraftConstraint.timetableDraftId, timetableDraftId),
				eq(table.constraint.type, constraintTypeEnum.space)
			)
		)
		.orderBy(asc(table.constraint.FETName));
}

export async function getActiveTimetableDraftConstraintsByTimetableDraftId(
	timetableDraftId: number
) {
	return db
		.select({
			id: table.constraint.id,
			FETName: table.constraint.FETName,
			friendlyName: table.constraint.friendlyName,
			description: table.constraint.description,
			type: table.constraint.type,
			active: table.timetableDraftConstraint.active,
			parameters: table.timetableDraftConstraint.parameters
		})
		.from(table.timetableDraftConstraint)
		.innerJoin(
			table.constraint,
			eq(table.timetableDraftConstraint.constraintId, table.constraint.id)
		)
		.where(
			and(
				eq(table.timetableDraftConstraint.timetableDraftId, timetableDraftId),
				eq(table.timetableDraftConstraint.active, true)
			)
		)
		.orderBy(asc(table.constraint.FETName));
}

export async function deleteTimetableDraftConstraint(ttConstraintId: number) {
	await db
		.delete(table.timetableDraftConstraint)
		.where(and(eq(table.timetableDraftConstraint.id, ttConstraintId)));
}

export async function updateTimetableDraftConstraintActiveStatus(
	ttConstraintId: number,
	active: boolean
) {
	const result = await db
		.update(table.timetableDraftConstraint)
		.set({ active })
		.where(and(eq(table.timetableDraftConstraint.id, ttConstraintId)))
		.returning();

	return result[0];
}

// ============================================================================
// UTILITY FUNCTIONS - Search & Lookup
// ============================================================================

export async function searchUsersBySchoolId(schoolId: number, searchTerm: string, limit = 20) {
	const searchPattern = `%${searchTerm}%`;

	return db
		.select({
			id: table.user.id,
			firstName: table.user.firstName,
			lastName: table.user.lastName,
			email: table.user.email,
			type: table.user.type
		})
		.from(table.user)
		.where(
			and(
				eq(table.user.schoolId, schoolId),
				eq(table.user.isArchived, false),
				or(
					ilike(table.user.firstName, searchPattern),
					ilike(table.user.lastName, searchPattern),
					ilike(table.user.email, searchPattern)
				)
			)
		)
		.limit(limit)
		.orderBy(asc(table.user.lastName), asc(table.user.firstName));
}

// ============================================================================
// PUBLISHING TIMETABLES - Operations
// ============================================================================

/*
How this function is implemented:
1. Find the semester that is related to the timetable draft's timetable
2. Find all the terms that belong to that semester and note their starting and ending dates (NOTE: the day of the start date will correspond to Day 1 in FET. If start date is a Monday, then Day 1 = Monday, Day 2 = Tuesday, etc.)
3. Find all the fet subject offering classes (fet_sub_off_cls) related to the timetable draft
4. For each class, find the corresponding create a new subject offering class (sub_off_cls)
5. For each fet subject offering class allocation that belongs to each fet subject offering class, we need to do the following:
	- For each cycle that the terms are running (there must be a valid date for this) 
	- create a new subject offering class allocation (sub_off_cls_alloc) related to that class based on its slot for the cycle (usually a week) (i.e., Day 1, Day 2, etc.) and period (Period 1, Period 2, etc.)
6. For each of the users in fet subject offering class user (fet_sub_off_cls_user), create a new subject offering class user (sub_off_cls_user) related to the new subject offering class

NOTE: For each cycle, it is a mandatory Monday to Friday cycle. Therefore the only defining factors in the cycle weeks repeat attribute as part of the timetable draft. This will determine whether there are 5,10, 15 etc days per cycle. It will always be a multiple of 5
*/
export async function publishTimetableDraft(timetableDraftId: number) {
	console.log('\n🚀 Starting publishTimetableDraft for draft ID:', timetableDraftId);

	// Step 1: Find the semester that is related to the timetable draft's timetable
	console.log('📋 Step 1: Finding timetable and semester data...');
	const [timetableData] = await db
		.select({
			timetableId: table.timetable.id,
			schoolSemesterId: table.timetable.schoolSemesterId,
			schoolId: table.timetable.schoolId,
			cycleWeekRepeats: table.timetableDraft.cycleWeekRepeats
		})
		.from(table.timetableDraft)
		.innerJoin(table.timetable, eq(table.timetableDraft.timetableId, table.timetable.id))
		.where(eq(table.timetableDraft.id, timetableDraftId))
		.limit(1);

	if (!timetableData) {
		throw new Error(`Timetable draft with ID ${timetableDraftId} not found`);
	}

	console.log('✅ Found timetable data:', {
		timetableId: timetableData.timetableId,
		schoolSemesterId: timetableData.schoolSemesterId,
		cycleWeekRepeats: timetableData.cycleWeekRepeats
	});

	if (!timetableData.schoolSemesterId) {
		throw new Error(`Timetable draft ${timetableDraftId} has no associated semester`);
	}

	const [semester] = await db
		.select()
		.from(table.schoolSemester)
		.where(eq(table.schoolSemester.id, timetableData.schoolSemesterId))
		.limit(1);

	if (!semester) {
		throw new Error(
			`Semester with ID ${timetableData.schoolSemesterId} not found for timetable draft ${timetableDraftId}`
		);
	}

	console.log('✅ Found semester:', semester.id, '-', semester.name);

	console.log('\n📅 Step 2: Finding terms for the semester...');
	const term1 = await db
		.select()
		.from(table.schoolTerm)
		.where(
			and(eq(table.schoolTerm.schoolSemesterId, semester.id), eq(table.schoolTerm.termNumber, 1))
		)
		.limit(1);

	const term2 = await db
		.select()
		.from(table.schoolTerm)
		.where(
			and(eq(table.schoolTerm.schoolSemesterId, semester.id), eq(table.schoolTerm.termNumber, 2))
		)
		.limit(1);

	if (term1.length === 0 && term2.length === 0) {
		throw new Error(`No terms found for semester ID ${semester.id}`);
	}

	const terms = [...term1, ...term2];
	console.log(`✅ Found ${terms.length} term(s):`);
	terms.forEach((term, idx) => {
		console.log(`   Term ${idx + 1}: ${term.startDate} to ${term.endDate}`);
	});

	console.log('\n📚 Step 3: Finding FET subject offering classes...');
	const fetSubOfferingClasses =
		await getFetSubjectOfferingClassesAndSubjectByTimetableDraftId(timetableDraftId);

	if (fetSubOfferingClasses.length === 0) {
		throw new Error(
			`No FET Subject Offering Classes found for timetable draft ID ${timetableDraftId}`
		);
	}

	console.log(`✅ Found ${fetSubOfferingClasses.length} FET subject offering class(es)`);

	let classCounter = 0;
	for (const fetClass of fetSubOfferingClasses) {
		classCounter++;
		console.log(
			`\n🏫 Processing class ${classCounter}/${fetSubOfferingClasses.length}: "${fetClass.subjectName}" (ID: ${fetClass.id})`
		);

		// Step 4: Create a new subject offering class (sub_off_cls)
		console.log('   Creating subject offering class...');
		const [newSubOfferingClass] = await db
			.insert(table.subjectOfferingClass)
			.values({
				name: fetClass.subjectName + ' - ' + fetClass.id,
				timetableDraftId: timetableDraftId,
				subOfferingId: fetClass.subjectOfferingId
			})
			.returning();

		console.log(`   ✅ Created subject offering class ID: ${newSubOfferingClass.id}`);

		const users = await db
			.select({ userId: table.fetSubjectOfferingClassUser.userId })
			.from(table.fetSubjectOfferingClassUser)
			.where(eq(table.fetSubjectOfferingClassUser.fetSubOffClassId, fetClass.id));

		console.log(`   👥 Adding ${users.length} user(s) to the class...`);
		for (const user of users) {
			// Step 6: For each of the users in fet subject offering class user (fet_sub_off_cls_user), create a new subject offering class user (sub_off_cls_user)
			await db.insert(table.userSubjectOfferingClass).values({
				subOffClassId: newSubOfferingClass.id,
				userId: user.userId
			});
		}
		console.log(`   ✅ Added all users`);

		// Create subject offering class users
		const allocations = await getFetSubjectOfferingClassAllocationsByFetClassId(fetClass.id);
		console.log(`   📍 Found ${allocations.length} allocation(s) to process`);

		let allocationCounter = 0;
		for (const fetAllocation of allocations) {
			allocationCounter++;
			console.log(`\n   📍 Processing allocation ${allocationCounter}/${allocations.length}...`);

			// Step 5: For each fet subject offering class allocation that belongs to each fet subject offering class
			// For each term, create allocations based on the cycle weeks repeats
			for (const term of terms) {
				const termStartDate = new Date(term.startDate);
				const termEndDate = new Date(term.endDate);

				console.log(
					`      📅 Creating allocations for term ${term.termNumber} (${term.startDate} to ${term.endDate})`
				);

				const cycleDurationDays = timetableData.cycleWeekRepeats * 7;
				let cycleStartDate = new Date(termStartDate);
				let cycleCount = 0;

				// Loop through cycles within the term
				while (cycleStartDate <= termEndDate) {
					cycleCount++;
					// Find the actual date for the allocation based on dayId and period
					const { classDate, startTime, endTime } = await findTimeAndDateForAllocation(
						cycleStartDate,
						fetAllocation.dayId,
						fetAllocation.startPeriod,
						fetAllocation.endPeriod
					);

					const allocation = await db
						.insert(table.subjectClassAllocation)
						.values({
							subjectOfferingClassId: newSubOfferingClass.id,
							schoolSpaceId: fetAllocation.schoolSpaceId,
							date: classDate.toISOString().split('T')[0],
							startTime: startTime,
							endTime: endTime
						})
						.returning();

					console.log(
						`         ✅ Cycle ${cycleCount}: Created allocation for ${allocation[0].date} at ${startTime}-${endTime}`
					);
					cycleStartDate = new Date(
						cycleStartDate.getTime() + cycleDurationDays * 24 * 60 * 60 * 1000
					);
				}
				console.log(`      ✅ Created ${cycleCount} allocation(s) for term ${term.termNumber}`);
			}
		}
	}

	console.log('\n🎉 Successfully published timetable draft!');
	console.log(`   Total classes processed: ${classCounter}`);
}

export async function findTimeAndDateForAllocation(
	cycleStartDate: Date,
	dayId: number,
	startPeriodId: number,
	endPeriodId: number
) {
	const day = await db
		.select({ day: table.timetableDay.day })
		.from(table.timetableDay)
		.where(eq(table.timetableDay.id, dayId))
		.limit(1);

	let periodTimes: { startTime: string; endTime: string };

	if (startPeriodId == endPeriodId) {
		const pts = await db
			.select({
				startTime: table.timetablePeriod.startTime,
				endTime: table.timetablePeriod.endTime
			})
			.from(table.timetablePeriod)
			.where(eq(table.timetablePeriod.id, startPeriodId))
			.limit(1);

		periodTimes = pts[0];
	} else {
		const startPeriodTime = await db
			.select({
				startTime: table.timetablePeriod.startTime
			})
			.from(table.timetablePeriod)
			.where(eq(table.timetablePeriod.id, startPeriodId))
			.limit(1);

		const endPeriodTime = await db
			.select({ endTime: table.timetablePeriod.endTime })
			.from(table.timetablePeriod)
			.where(eq(table.timetablePeriod.id, endPeriodId))
			.limit(1);

		periodTimes = {
			startTime: startPeriodTime[0].startTime,
			endTime: endPeriodTime[0].endTime
		};
	}

	return {
		classDate: new Date(cycleStartDate.getTime() + (day[0].day - 1) * 24 * 60 * 60 * 1000),
		startTime: periodTimes.startTime,
		endTime: periodTimes.endTime
	};
}

export async function getFetSubjectOfferingClassesAndSubjectByTimetableDraftId(
	timetableDraftId: number
) {
	const fetSubOfferingClasses = await db
		.select({
			id: table.fetSubjectOfferingClass.id,
			timetableDraftId: table.fetSubjectOfferingClass.timetableDraftId,
			subjectOfferingId: table.fetSubjectOfferingClass.subjectOfferingId,
			subjectId: table.subject.id,
			subjectName: table.subject.name
		})
		.from(table.fetSubjectOfferingClass)
		.innerJoin(
			table.subjectOffering,
			eq(table.fetSubjectOfferingClass.subjectOfferingId, table.subjectOffering.id)
		)
		.innerJoin(table.subject, eq(table.subjectOffering.subjectId, table.subject.id))
		.where(eq(table.fetSubjectOfferingClass.timetableDraftId, timetableDraftId));

	return fetSubOfferingClasses;
}

export async function getFetSubjectOfferingClassAllocationsByFetClassId(fetClassId: number) {
	const allocations = await db
		.select({
			id: table.fetSubjectClassAllocation.id,
			fetSubjectOfferingClassId: table.fetSubjectClassAllocation.fetSubjectOfferingClassId,
			schoolSpaceId: table.fetSubjectClassAllocation.schoolSpaceId,
			dayId: table.fetSubjectClassAllocation.dayId,
			startPeriod: table.fetSubjectClassAllocation.startPeriodId,
			endPeriod: table.fetSubjectClassAllocation.endPeriodId
		})
		.from(table.fetSubjectClassAllocation)
		.where(eq(table.fetSubjectClassAllocation.fetSubjectOfferingClassId, fetClassId));

	return allocations;
}

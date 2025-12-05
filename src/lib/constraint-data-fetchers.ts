import { userTypeEnum } from '$lib/enums';
import {
	getBuildingsBySchoolId,
	getSpacesBySchoolId,
	getSubjectsBySchoolId,
	getTimetableDraftActivitiesByTimetableDraftId,
	getTimetableDraftDaysByTimetableDraftId,
	getTimetableDraftPeriodsByTimetableDraftId,
	getTimetableDraftStudentGroupsWithCountsByTimetableDraftId,
	getUsersBySchoolIdAndType
} from '$lib/server/db/service';
import type { ConstraintFormData } from '$lib/types/constraint-form-types';

export interface AutocompleteOption {
	value: string | number;
	label: string;
}

/**
 * Fetch timetable days for autocomplete
 */
export async function getTimetableDraftDaysOptions(
	timetableId: number
): Promise<AutocompleteOption[]> {
	const days = await getTimetableDraftDaysByTimetableDraftId(timetableId);
	return days.map((day) => ({
		value: day.id,
		label: `Day ${day.day}` // Assuming day number maps to day name
	}));
}

/**
 * Fetch timetable periods for autocomplete
 */
export async function getTimetableDraftPeriodsOptions(
	timetableId: number
): Promise<AutocompleteOption[]> {
	const periods = await getTimetableDraftPeriodsByTimetableDraftId(timetableId);
	return periods.map((period) => ({
		value: period.id,
		label: `${period.startTime} - ${period.endTime}`
	}));
}

/**
 * Fetch subjects for autocomplete
 */
export async function getSubjectsOptions(schoolId: number): Promise<AutocompleteOption[]> {
	const subjects = await getSubjectsBySchoolId(schoolId);
	return subjects.map((subject) => ({
		value: subject.id,
		label: subject.name
	}));
}

/**
 * Fetch teachers for autocomplete
 */
export async function getTeachersOptions(schoolId: number): Promise<AutocompleteOption[]> {
	const teachers = await getUsersBySchoolIdAndType(schoolId, userTypeEnum.teacher);
	return teachers.map((teacher) => ({
		value: teacher.id,
		label: `${teacher.firstName} ${teacher.lastName}`
	}));
}

/**
 * Fetch students for autocomplete
 */
export async function getStudentsOptions(schoolId: number): Promise<AutocompleteOption[]> {
	const students = await getUsersBySchoolIdAndType(schoolId, userTypeEnum.student);
	return students.map((student) => ({
		value: student.id,
		label: `${student.firstName} ${student.lastName}`
	}));
}

/**
 * Fetch timetable groups for autocomplete
 */
export async function getTimetableDraftGroupsOptions(
	timetableId: number
): Promise<AutocompleteOption[]> {
	const groups = await getTimetableDraftStudentGroupsWithCountsByTimetableDraftId(timetableId);
	return groups.map((group) => ({
		value: group.id,
		label: `${group.name} (${group.yearLevel}) - ${group.count} students`
	}));
}

/**
 * Fetch buildings for autocomplete
 */
export async function getBuildingsOptions(schoolId: number): Promise<AutocompleteOption[]> {
	const buildings = await getBuildingsBySchoolId(schoolId);
	return buildings.map((building) => ({
		value: building.id,
		label: building.name
	}));
}

/**
 * Fetch spaces for autocomplete
 */
export async function getSpacesOptions(schoolId: number): Promise<AutocompleteOption[]> {
	const spaces = await getSpacesBySchoolId(schoolId);
	return spaces.map((space) => ({
		value: space.id,
		label: `${space.name} (${space.type}) - Capacity: ${space.capacity || 'N/A'}`
	}));
}

/**
 * Fetch timetable activities for autocomplete
 */
export async function getTimetableDraftActivitiesOptions(
	timetableId: number
): Promise<AutocompleteOption[]> {
	const activities = await getTimetableDraftActivitiesByTimetableDraftId(timetableId);
	return activities.map((activity) => ({
		value: activity.id,
		label: `${activity.id}`
	}));
}

/**
 * Build complete constraint form data for autocomplete components
 */
export async function buildConstraintFormData(
	timetableDraftId: number,
	schoolId: number
): Promise<ConstraintFormData> {
	// In a real implementation, these IDs would come from the current user session/context
	const [
		subjects,
		teachers,
		students,
		timetableGroups,
		buildings,
		spaces,
		timetableDays,
		timetablePeriods,
		timetableActivities
	] = await Promise.all([
		getSubjectsOptions(schoolId),
		getTeachersOptions(schoolId),
		getStudentsOptions(schoolId),
		getTimetableDraftGroupsOptions(timetableDraftId),
		getBuildingsOptions(schoolId),
		getSpacesOptions(schoolId),
		getTimetableDraftDaysOptions(timetableDraftId),
		getTimetableDraftPeriodsOptions(timetableDraftId),
		getTimetableDraftActivitiesOptions(timetableDraftId)
	]);

	return {
		subjects,
		teachers,
		students,
		timetableGroups,
		buildings,
		spaces,
		timetableDays,
		timetablePeriods,
		timetableActivities
	};
}

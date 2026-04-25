import { userTypeEnum } from '$lib/enums';
import {
	getBuildingsBySchoolId,
	getSpacesBySchoolId,
	getSubjectsBySchoolId,
	getTimetableDraftActivitiesByTimetableDraftId,
	getTimetableDraftDaysByTimetableDraftId,
	getTimetableDraftPeriodsByTimetableDraftId,
	getTimetableDraftStudentGroupsWithCountsByTimetableDraftId,
	getUsersBySchoolIdAndType,
} from '$lib/server/db/service';

import type {
	AutocompleteOption,
	ConstraintFormData,
	FormDataKey,
} from './types';

type Fetcher = (ctx: {
	timetableDraftId: number;
	schoolId: number;
}) => Promise<AutocompleteOption[]>;

const fetchers: Record<FormDataKey, Fetcher> = {
	subjects: async ({ schoolId }) => {
		const subjects = await getSubjectsBySchoolId(schoolId);
		return subjects.map((s) => ({ value: s.id, label: s.name }));
	},
	teachers: async ({ schoolId }) => {
		const teachers = await getUsersBySchoolIdAndType(
			schoolId,
			userTypeEnum.teacher,
		);
		return teachers.map((t) => ({
			value: t.id,
			label: `${t.firstName} ${t.lastName}`,
		}));
	},
	students: async ({ schoolId }) => {
		const students = await getUsersBySchoolIdAndType(
			schoolId,
			userTypeEnum.student,
		);
		return students.map((s) => ({
			value: s.id,
			label: `${s.firstName} ${s.lastName}`,
		}));
	},
	timetableGroups: async ({ timetableDraftId }) => {
		const groups =
			await getTimetableDraftStudentGroupsWithCountsByTimetableDraftId(
				timetableDraftId,
			);
		return groups.map((g) => ({
			value: g.id,
			label: `${g.name} (${g.yearLevelCode}) - ${g.count} students`,
		}));
	},
	buildings: async ({ schoolId }) => {
		const buildings = await getBuildingsBySchoolId(schoolId);
		return buildings.map((b) => ({ value: b.id, label: b.name }));
	},
	spaces: async ({ schoolId }) => {
		const spaces = await getSpacesBySchoolId(schoolId);
		return spaces.map((s) => ({
			value: s.id,
			label: `${s.name} (${s.type}) - Capacity: ${s.capacity ?? 'N/A'}`,
		}));
	},
	timetableDays: async ({ timetableDraftId }) => {
		const days = await getTimetableDraftDaysByTimetableDraftId(timetableDraftId);
		return days.map((d) => ({ value: d.id, label: `Day ${d.day}` }));
	},
	timetablePeriods: async ({ timetableDraftId }) => {
		const periods =
			await getTimetableDraftPeriodsByTimetableDraftId(timetableDraftId);
		return periods.map((p) => ({
			value: p.id,
			label: `${p.start} - ${p.end}`,
		}));
	},
	timetableActivities: async ({ timetableDraftId }) => {
		const activities =
			await getTimetableDraftActivitiesByTimetableDraftId(timetableDraftId);
		return activities.map((a) => ({ value: a.id, label: `${a.id}` }));
	},
};

const EMPTY_OPTIONS: AutocompleteOption[] = [];

/**
 * Fetches only the autocomplete option sets named in `keys`, leaving others as
 * empty arrays. Keeps the constraints page cheap when most forms don't need
 * most option sets.
 */
export async function buildConstraintFormData(
	ctx: { timetableDraftId: number; schoolId: number },
	keys: readonly FormDataKey[],
): Promise<ConstraintFormData> {
	const unique = [...new Set(keys)];
	const results = await Promise.all(unique.map((k) => fetchers[k](ctx)));

	const data: ConstraintFormData = {
		subjects: EMPTY_OPTIONS,
		teachers: EMPTY_OPTIONS,
		students: EMPTY_OPTIONS,
		timetableGroups: EMPTY_OPTIONS,
		buildings: EMPTY_OPTIONS,
		spaces: EMPTY_OPTIONS,
		timetableDays: EMPTY_OPTIONS,
		timetablePeriods: EMPTY_OPTIONS,
		timetableActivities: EMPTY_OPTIONS,
	};
	unique.forEach((key, i) => {
		data[key] = results[i];
	});
	return data;
}

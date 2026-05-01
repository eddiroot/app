import { userTypeEnum } from '$lib/enums.js';
import {
	createTimetableDraftClassWithRelations,
	deleteTimetableDraftClass,
	getClassGroupsByClassId,
	getClassSpacesByClassId,
	getClassStudentsByClassId,
	getClassTeachersByClassId,
	getClassYearLevelsByClassId,
	getSpacesBySchoolId,
	getStudentsForTimetable,
	getSubjectOfferingsForTimetableByTimetableId,
	getTimetableActivitiesByClassId,
	getTimetableDraftClassesByTimetableDraftId,
	getTimetableDraftStudentGroupsWithCountsByTimetableDraftId,
	getUsersBySchoolIdAndType,
	updateTimetableDraftClass,
} from '$lib/server/db/service';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import {
	createClassSchema,
	deleteClassSchema,
	editClassSchema,
} from './schema.js';

export const load = async ({ locals: { security }, params }) => {
	const user = security.isAuthenticated().isAdmin().getUser();
	const timetableId = parseInt(params.timetableId, 10);
	const timetableDraftId = parseInt(params.timetableDraftId, 10);

	const teachers = await getUsersBySchoolIdAndType(
		user.schoolId,
		userTypeEnum.teacher,
	);
	const baseClasses =
		await getTimetableDraftClassesByTimetableDraftId(timetableDraftId);
	const spaces = await getSpacesBySchoolId(user.schoolId);
	const students = await getStudentsForTimetable(timetableId, user.schoolId);

	const [groups, allSubjectOfferings] = await Promise.all([
		getTimetableDraftStudentGroupsWithCountsByTimetableDraftId(timetableDraftId),
		getSubjectOfferingsForTimetableByTimetableId(timetableId),
	]);

	const yearLevelMap = new Map<number, string>();
	groups.forEach((g) => yearLevelMap.set(g.yearLevelId, g.yearLevelCode));
	allSubjectOfferings.forEach((so) =>
		yearLevelMap.set(so.yearLevel.id, so.yearLevel.code),
	);

	const yearLevels = Array.from(yearLevelMap.entries())
		.map(([id, code]) => ({ id, code }))
		.sort((a, b) =>
			a.code.localeCompare(b.code, undefined, {
				numeric: true,
				sensitivity: 'base',
			}),
		);

	const subjectOfferingsByYearLevel: Record<
		string,
		typeof allSubjectOfferings
	> = {};
	for (const yearLevel of yearLevels) {
		subjectOfferingsByYearLevel[yearLevel.code] = allSubjectOfferings.filter(
			(so) => so.yearLevel.id === yearLevel.id,
		);
	}

	const classes = await Promise.all(
		baseClasses.map(async (cls) => {
			const [teachers, spaces, students, groups, yearLevels, activities] =
				await Promise.all([
					getClassTeachersByClassId(cls.id),
					getClassSpacesByClassId(cls.id),
					getClassStudentsByClassId(cls.id),
					getClassGroupsByClassId(cls.id),
					getClassYearLevelsByClassId(cls.id),
					getTimetableActivitiesByClassId(cls.id),
				]);

			return {
				...cls,
				teacherIds: teachers.map((t) => t.id),
				spaceIds: spaces.map((l) => l.id.toString()),
				studentIds: students.map((s) => s.id),
				groupIds: groups.map((g) => g.id.toString()),
				yearLevels,
				activities,
			};
		}),
	);

	const classesBySubjectOfferingId = classes.reduce(
		(acc, cls) => {
			if (!acc[cls.subjectOfferingId]) {
				acc[cls.subjectOfferingId] = [];
			}
			acc[cls.subjectOfferingId].push(cls);
			return acc;
		},
		{} as Record<number, typeof classes>,
	);

	return {
		timetableId,
		yearLevels,
		groups,
		teachers,
		students,
		spaces,
		classesBySubjectOfferingId,
		subjectOfferingsByYearLevel,
		createClassForm: await superValidate(zod4(createClassSchema)),
		editClassForm: await superValidate(zod4(editClassSchema)),
		deleteClassForm: await superValidate(zod4(deleteClassSchema)),
	};
};

export const actions = {
	createClass: async ({ request, params, locals: { security } }) => {
		security.isAuthenticated().isAdmin();

		const timetableDraftId = parseInt(params.timetableDraftId, 10);

		const form = await superValidate(request, zod4(createClassSchema));

		if (!form.valid) {
			return message(form, 'Please check your inputs and try again.', {
				status: 400,
			});
		}

		try {
			await createTimetableDraftClassWithRelations({
				timetableDraftId,
				subjectOfferingId: form.data.subjectOfferingId,
				teacherIds: form.data.teacherIds,
				yearLevelIds: (form.data.yearLevelIds ?? []).map((id) =>
					parseInt(id, 10),
				),
				groupIds: (form.data.groupIds ?? []).map((id) => parseInt(id, 10)),
				studentIds: form.data.studentIds ?? [],
				preferredSpaceIds: (form.data.spaceIds ?? []).map((id) =>
					parseInt(id, 10),
				),
			});

			return message(form, 'Class created successfully!');
		} catch (error) {
			console.error('Error creating class:', error);
			return message(form, 'Failed to create class. Please try again.', {
				status: 500,
			});
		}
	},

	editClass: async ({ request, locals: { security } }) => {
		security.isAuthenticated().isAdmin();

		const form = await superValidate(request, zod4(editClassSchema));

		if (!form.valid) {
			return message(form, 'Please check your inputs and try again.', {
				status: 400,
			});
		}

		try {
			await updateTimetableDraftClass(form.data.classId, {
				subjectOfferingId: form.data.subjectOfferingId,
				teacherIds: form.data.teacherIds,
				yearLevelIds: form.data.yearLevelIds?.map((id) => parseInt(id, 10)),
				groupIds: form.data.groupIds?.map((id) => parseInt(id, 10)),
				studentIds: form.data.studentIds,
				preferredSpaceIds: form.data.spaceIds?.map((id) => parseInt(id, 10)),
			});

			return message(form, 'Class updated successfully!');
		} catch (error) {
			console.error('Error editing class:', error);
			return message(form, 'Failed to edit class. Please try again.', {
				status: 500,
			});
		}
	},

	deleteClass: async ({ request, locals: { security } }) => {
		security.isAuthenticated().isAdmin();
		const form = await superValidate(request, zod4(deleteClassSchema));

		if (!form.valid) {
			return message(form, 'Please check your inputs and try again.', {
				status: 400,
			});
		}

		try {
			await deleteTimetableDraftClass(form.data.classId);

			return message(form, 'Class deleted successfully!');
		} catch (error) {
			console.error('Error deleting class:', error);
			return message(form, 'Failed to delete class. Please try again.', {
				status: 500,
			});
		}
	},
};

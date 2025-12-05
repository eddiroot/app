import {
	createSchoolTimetable,
	getSchoolTimetablesBySchoolId,
	getSemestersBySchoolId
} from '$lib/server/db/service';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types.js';
import { createTimetableSchema } from './schema.js';

export const load: PageServerLoad = async ({ locals: { security } }) => {
	const user = security.isAuthenticated().isSchoolAdmin().getUser();
	const timetablesAndSemesters = await getSchoolTimetablesBySchoolId(user.schoolId);
	const semesters = await getSemestersBySchoolId(user.schoolId);

	return {
		timetablesAndSemesters: timetablesAndSemesters,
		createTimetableForm: await superValidate(zod4(createTimetableSchema)),
		semesters
	};
};

export const actions: Actions = {
	createTimetable: async ({ request, locals: { security } }) => {
		const user = security.isAuthenticated().isSchoolAdmin().getUser();

		const form = await superValidate(request, zod4(createTimetableSchema));

		if (!form.valid) {
			return message(form, 'Please check your inputs and try again.', { status: 400 });
		}

		try {
			await createSchoolTimetable({
				schoolId: user.schoolId,
				name: form.data.name,
				schoolYear: form.data.schoolYear,
				schoolSemesterId: form.data.schoolSemester
			});

			return message(form, 'Timetable created successfully!');
		} catch (error) {
			console.error('Error creating timetable:', error);
			return message(form, 'Failed to create timetable. Please try again.', { status: 500 });
		}
	}
};

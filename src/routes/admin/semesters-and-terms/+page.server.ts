import {
	createSchoolSemesterWithAutoNumber,
	createSchoolTermWithRenumber,
	deleteSchoolSemester,
	deleteSchoolTerm,
	getSchoolById,
	getSemestersWithTermsBySchoolId,
	updateSchoolTerm,
} from '$lib/server/db/service';
import { fail, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import {
	createSemesterSchema,
	createTermSchema,
	deleteSemesterSchema,
	deleteTermSchema,
	updateTermSchema,
} from './schema';

export const load = async ({ locals: { security } }) => {
	const user = security.isAuthenticated().isAdmin().getUser();

	const semestersWithTerms = await getSemestersWithTermsBySchoolId(
		user.schoolId,
	);

	const school = await getSchoolById(security.getUser().schoolId);
	if (!school) {
		throw new Error('School not found');
	}

	return { semestersWithTerms };
};

export const actions = {
	createSemester: async ({ locals: { security }, request }) => {
		security.isAuthenticated().isAdmin();
		const form = await superValidate(request, zod4(createSemesterSchema));
		if (!form.valid) {
			return fail(400, { form });
		}
		const { year } = form.data;
		const user = security.getUser();
		await createSchoolSemesterWithAutoNumber(user.schoolId, year);
	},
	createTerm: async ({ locals: { security }, request }) => {
		security.isAuthenticated().isAdmin();
		const form = await superValidate(request, zod4(createTermSchema));
		if (!form.valid) {
			return fail(400, { form });
		}
		const { semesterId } = form.data;
		await createSchoolTermWithRenumber(semesterId);
	},
	deleteSemester: async ({ locals: { security }, request }) => {
		security.isAuthenticated().isAdmin();
		const form = await superValidate(request, zod4(deleteSemesterSchema));
		if (!form.valid) {
			return fail(400, { form });
		}
		const { semesterId } = form.data;
		await deleteSchoolSemester(semesterId);
	},
	deleteTerm: async ({ locals: { security }, request }) => {
		security.isAuthenticated().isAdmin();
		const form = await superValidate(request, zod4(deleteTermSchema));
		if (!form.valid) {
			return fail(400, { form });
		}
		const { termId } = form.data;
		await deleteSchoolTerm(termId);
	},
	updateTerm: async ({ locals: { security }, request }) => {
		security.isAuthenticated().isAdmin();
		const form = await superValidate(request, zod4(updateTermSchema));
		if (!form.valid) {
			return fail(400, { form });
		}
		const { termId, start, end } = form.data;
		await updateSchoolTerm(termId, { start, end });
	},
};

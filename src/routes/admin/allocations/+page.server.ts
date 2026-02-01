import { userTypeEnum } from '$lib/enums.js';
import {
	archiveUserSubjectOfferingClass,
	createUserSubjectOfferingClass,
	getAllocationsBySchoolId,
	getSubjectOfferingClassesBySchoolId,
	getUsersBySchoolIdAndTypes,
} from '$lib/server/db/service';
import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { createAllocationSchema } from './schema.js';

export const load = async ({ locals }) => {
	const user = locals.security.isAuthenticated().isAdmin().getUser();

	const [allocations, users, subjectOfferingClasses] = await Promise.all([
		getAllocationsBySchoolId(user.schoolId),
		getUsersBySchoolIdAndTypes(user.schoolId, [
			userTypeEnum.student,
			userTypeEnum.teacher,
		]),
		getSubjectOfferingClassesBySchoolId(user.schoolId),
	]);

	const createForm = await superValidate(zod4(createAllocationSchema));

	return { allocations, users, subjectOfferingClasses, createForm };
};

export const actions = {
	create: async ({ request, locals }) => {
		locals.security.isAuthenticated().isAdmin();

		const formData = await request.formData();
		const form = await superValidate(formData, zod4(createAllocationSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await createUserSubjectOfferingClass({
				userId: form.data.userId,
				subOffClassId: parseInt(form.data.subjectOfferingClassId, 10),
			});

			return { form, success: true };
		} catch (error) {
			console.error('Error creating allocation:', error);
			return fail(500, { form, error: 'Failed to create allocation' });
		}
	},
	archive: async ({ request, locals }) => {
		locals.security.isAuthenticated().isAdmin();

		const formData = await request.formData();
		const allocationId = parseInt(formData.get('id') as string, 10);

		if (!allocationId) {
			return fail(400, { error: 'Invalid allocation ID' });
		}

		try {
			await archiveUserSubjectOfferingClass(allocationId);
			return { success: true };
		} catch (error) {
			console.error('Error deleting allocation:', error);
			return fail(500, { error: 'Failed to delete allocation' });
		}
	},
};

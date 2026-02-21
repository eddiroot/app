import { eventTypeEnum } from '$lib/enums';
import {
	createEvent,
	getSubjectOfferingClassesBySchoolId,
} from '$lib/server/db/service';
import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { createSubjectOfferingClassEventSchema } from '../schemas';

export const load = async ({ locals: { security } }) => {
	const user = security.isAuthenticated().isAdmin().getUser();

	const [form, classes] = await Promise.all([
		superValidate(zod4(createSubjectOfferingClassEventSchema)),
		getSubjectOfferingClassesBySchoolId(user.schoolId),
	]);

	return { form, classes };
};

export const actions = {
	default: async ({ request, locals: { security } }) => {
		const user = security.isAuthenticated().isAdmin().getUser();

		const form = await superValidate(
			request,
			zod4(createSubjectOfferingClassEventSchema),
		);

		if (!form.valid) {
			return fail(400, { form });
		}

		await createEvent({
			schoolId: user.schoolId,
			type: eventTypeEnum.class,
			name: form.data.name,
			start: new Date(form.data.start),
			end: new Date(form.data.end),
			subjectOfferingClassId: form.data.subjectOfferingClassId,
			requiresRSVP: form.data.requiresRSVP,
		});

		redirect(302, '/admin/events?success=class-event-created');
	},
};

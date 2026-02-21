import { eventTypeEnum } from '$lib/enums';
import {
	createEvent,
	getSubjectOfferingsBySchoolId,
} from '$lib/server/db/service';
import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { createSubjectOfferingEventSchema } from '../schemas';

export const load = async ({ locals: { security } }) => {
	const user = security.isAuthenticated().isAdmin().getUser();

	const [form, subjectOfferings] = await Promise.all([
		superValidate(zod4(createSubjectOfferingEventSchema)),
		getSubjectOfferingsBySchoolId(user.schoolId),
	]);

	return { form, subjectOfferings };
};

export const actions = {
	default: async ({ request, locals: { security } }) => {
		const user = security.isAuthenticated().isAdmin().getUser();

		const form = await superValidate(
			request,
			zod4(createSubjectOfferingEventSchema),
		);

		if (!form.valid) {
			return fail(400, { form });
		}

		await createEvent({
			schoolId: user.schoolId,
			type: eventTypeEnum.subject,
			name: form.data.name,
			start: new Date(form.data.start),
			end: new Date(form.data.end),
			requiresRSVP: form.data.requiresRSVP,
			subjectOfferingId: form.data.subjectOfferingId,
		});

		redirect(302, '/admin/events?success=subject-event-created');
	},
};

import { eventTypeEnum } from '$lib/enums';
import { createEvent } from '$lib/server/db/service';
import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { createCampusEventSchema } from '../schemas';

export const load = async ({ locals: { security } }) => {
	security.isAuthenticated().isAdmin();

	const form = await superValidate(zod4(createCampusEventSchema));

	return { form };
};

export const actions = {
	default: async ({ request, locals: { security } }) => {
		const user = security.isAuthenticated().isAdmin().getUser();

		const form = await superValidate(request, zod4(createCampusEventSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		await createEvent({
			schoolId: user.schoolId,
			type: eventTypeEnum.campus,
			name: form.data.name,
			start: new Date(form.data.start),
			end: new Date(form.data.end),
			schoolCampusId: form.data.campusId,
			requiresRSVP: form.data.requiresRSVP,
		});

		redirect(302, '/admin/events?success=campus-event-created');
	},
};

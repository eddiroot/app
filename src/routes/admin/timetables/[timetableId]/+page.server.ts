import {
	createTimetableDraft,
	getTimetableByTimetableId,
	getTimetableDraftsByTimetableId,
	publishTimetableDraft
} from '$lib/server/db/service';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types.js';
import { createTimetableDraftSchema, publishTimetableDraftSchema } from './schema';

export const load: PageServerLoad = async ({ locals: { security }, params }) => {
	const user = security.isAuthenticated().isSchoolAdmin().getUser();
	if (!user) {
		throw new Error('User not found');
	}
	const timetable = await getTimetableByTimetableId(parseInt(params.timetableId));
	const timetableDrafts = await getTimetableDraftsByTimetableId(parseInt(params.timetableId));

	return {
		timetableDrafts,
		timetable,
		createTimetableForm: await superValidate(zod4(createTimetableDraftSchema)),
		publishTimetableDraftForm: await superValidate(zod4(publishTimetableDraftSchema))
	};
};

export const actions: Actions = {
	createTimetableDraft: async ({ request, locals: { security }, params }) => {
		const user = security.isAuthenticated().isSchoolAdmin().getUser();

		if (!user) {
			throw new Error('User not found');
		}

		const form = await superValidate(request, zod4(createTimetableDraftSchema));

		if (!form.valid) {
			return message(form, 'Please check your inputs and try again.', { status: 400 });
		}

		try {
			await createTimetableDraft({
				name: form.data.name,
				timetableId: parseInt(params.timetableId)
			});

			return message(form, 'Timetable created successfully!');
		} catch (error) {
			console.error('Error creating timetable:', error);
			return message(form, 'Failed to create timetable. Please try again.', { status: 500 });
		}
	},
	publishTimetableDraft: async ({ request, locals: { security } }) => {
		const user = security.isAuthenticated().isSchoolAdmin().getUser();

		if (!user) {
			throw new Error('User not found');
		}

		const form = await superValidate(request, zod4(publishTimetableDraftSchema));

		if (!form.valid) {
			return message(form, 'Please select a draft to publish.', { status: 400 });
		}

		const timetableDraftId = form.data.draftId;

		await publishTimetableDraft(timetableDraftId);

		return message(form, 'Timetable draft published successfully!');
	}
};

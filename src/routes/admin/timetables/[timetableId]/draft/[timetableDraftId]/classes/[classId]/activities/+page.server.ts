import {
	createTimetableActivity,
	deleteTimetableActivity,
	getTimetableActivitiesByClassId,
	updateTimetableActivity,
} from '$lib/server/db/service';
import { error } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import {
	createActivitySchema,
	deleteActivitySchema,
	editActivitySchema,
} from './schema.js';

export const load = async ({ locals: { security }, params }) => {
	security.isAuthenticated().isAdmin();

	const classId = parseInt(params.classId, 10);
	if (Number.isNaN(classId)) {
		throw error(400, 'Invalid class ID');
	}

	const activities = await getTimetableActivitiesByClassId(classId);

	return {
		classId,
		activities,
		createActivityForm: await superValidate(zod4(createActivitySchema)),
		editActivityForm: await superValidate(zod4(editActivitySchema)),
		deleteActivityForm: await superValidate(zod4(deleteActivitySchema)),
	};
};

export const actions = {
	createActivity: async ({ request, params, locals: { security } }) => {
		security.isAuthenticated().isAdmin();

		const classId = parseInt(params.classId, 10);
		const form = await superValidate(request, zod4(createActivitySchema));

		if (!form.valid) {
			return message(form, 'Please check your inputs and try again.', {
				status: 400,
			});
		}

		try {
			await createTimetableActivity({
				timetableClassId: classId,
				duration: form.data.duration,
				totalDuration: form.data.totalDuration,
			});

			return message(form, 'Activity created successfully!');
		} catch (err) {
			console.error('Error creating activity:', err);
			return message(form, 'Failed to create activity. Please try again.', {
				status: 500,
			});
		}
	},

	editActivity: async ({ request, locals: { security } }) => {
		security.isAuthenticated().isAdmin();

		const form = await superValidate(request, zod4(editActivitySchema));

		if (!form.valid) {
			return message(form, 'Please check your inputs and try again.', {
				status: 400,
			});
		}

		try {
			await updateTimetableActivity(form.data.activityId, {
				duration: form.data.duration,
				totalDuration: form.data.totalDuration,
			});

			return message(form, 'Activity updated successfully!');
		} catch (err) {
			console.error('Error editing activity:', err);
			return message(form, 'Failed to edit activity. Please try again.', {
				status: 500,
			});
		}
	},

	deleteActivity: async ({ request, locals: { security } }) => {
		security.isAuthenticated().isAdmin();

		const form = await superValidate(request, zod4(deleteActivitySchema));

		if (!form.valid) {
			return message(form, 'Please check your inputs and try again.', {
				status: 400,
			});
		}

		try {
			await deleteTimetableActivity(form.data.activityId);

			return message(form, 'Activity deleted successfully!');
		} catch (err) {
			console.error('Error deleting activity:', err);
			return message(form, 'Failed to delete activity. Please try again.', {
				status: 500,
			});
		}
	},
};

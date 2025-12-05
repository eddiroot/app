import {
	addTimetableDraftPeriod,
	deleteTimetableDraftPeriodByPeriodId,
	getTimetableDraftCycleWeekRepeatsByTimetableDraftId,
	getTimetableDraftDaysByTimetableDraftId,
	getTimetableDraftPeriodsByTimetableDraftId,
	updateTimetableDraftCycleWeekRepeatsByTimetableDraftId,
	updateTimetableDraftDaysByTimetableDraftId
} from '$lib/server/db/service';
import { error, fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { addPeriodSchema, updateCycleWeeksRepeatSchema, updateDaysSchema } from './schema.js';

export const load = async ({ params, locals: { security } }) => {
	security.isAuthenticated().isSchoolAdmin();

	const timetableDraftId = parseInt(params.timetableDraftId, 10);

	if (isNaN(timetableDraftId)) {
		error(400, 'Invalid timetable ID');
	}

	try {
		const [days, periods, cycle_week_repeats] = await Promise.all([
			getTimetableDraftDaysByTimetableDraftId(timetableDraftId),
			getTimetableDraftPeriodsByTimetableDraftId(timetableDraftId),
			getTimetableDraftCycleWeekRepeatsByTimetableDraftId(timetableDraftId)
		]);

		const [updateDaysForm, addPeriodForm, updateCycleWeeksRepeatForm] = await Promise.all([
			superValidate({ selectedDays: days.map((d) => d.day) }, zod4(updateDaysSchema)),
			superValidate(zod4(addPeriodSchema)),
			superValidate({ cycleWeeksRepeat: cycle_week_repeats }, zod4(updateCycleWeeksRepeatSchema))
		]);

		return {
			timetableDraftId,
			days,
			periods,
			cycle_week_repeats,
			updateDaysForm,
			addPeriodForm,
			updateCycleWeeksRepeatForm
		};
	} catch (err) {
		console.error('Error loading timetable data:', err);
		error(500, 'Failed to load timetable data');
	}
};

export const actions = {
	updateDays: async ({ request, params, locals: { security } }) => {
		security.isAuthenticated().isSchoolAdmin();

		const timetableDraftId = parseInt(params.timetableDraftId, 10);
		if (isNaN(timetableDraftId)) {
			return fail(400, { error: 'Invalid timetable ID' });
		}

		const form = await superValidate(request, zod4(updateDaysSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await updateTimetableDraftDaysByTimetableDraftId(timetableDraftId, form.data.selectedDays);
			return message(form, 'Days updated successfully');
		} catch (err) {
			console.error('Error updating days:', err);
			return message(form, err instanceof Error ? err.message : 'Failed to update days', {
				status: 400
			});
		}
	},

	updatePeriods: async ({ request, params, locals: { security } }) => {
		security.isAuthenticated().isSchoolAdmin();

		const timetableDraftId = parseInt(params.timetableDraftId, 10);
		if (isNaN(timetableDraftId)) {
			return fail(400, { error: 'Invalid timetable ID' });
		}

		const form = await superValidate(request, zod4(addPeriodSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await addTimetableDraftPeriod(timetableDraftId, form.data.startTime, form.data.endTime);
			return message(form, 'Period added successfully');
		} catch (err) {
			console.error('Error adding period:', err);
			return message(form, 'Failed to add period', { status: 500 });
		}
	},

	deletePeriod: async ({ request, params, locals: { security } }) => {
		security.isAuthenticated().isSchoolAdmin();

		const timetableDraftId = parseInt(params.timetableDraftId, 10);
		if (isNaN(timetableDraftId)) {
			return fail(400, { error: 'Invalid timetable ID' });
		}

		const formData = await request.formData();
		const periodId = parseInt(formData.get('periodId') as string, 10);
		if (isNaN(periodId)) {
			return fail(400, { error: 'Invalid period ID' });
		}

		try {
			await deleteTimetableDraftPeriodByPeriodId(periodId, timetableDraftId);
			return { success: true, message: 'Period deleted successfully' };
		} catch (err) {
			console.error('Error deleting period:', err);
			return {
				success: false,
				message: err instanceof Error ? err.message : 'Failed to delete period',
				status: 400
			};
		}
	},

	updateCycleWeeksRepeat: async ({ request, params, locals: { security } }) => {
		security.isAuthenticated().isSchoolAdmin();

		const timetableDraftId = parseInt(params.timetableDraftId, 10);
		if (isNaN(timetableDraftId)) {
			return fail(400, { error: 'Invalid timetable ID' });
		}

		const form = await superValidate(request, zod4(updateCycleWeeksRepeatSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await updateTimetableDraftCycleWeekRepeatsByTimetableDraftId(
				timetableDraftId,
				form.data.cycleWeeksRepeat
			);

			// Create array of day values from 1 to cycleWeeksRepeat * 5
			const totalDays = form.data.cycleWeeksRepeat * 5;
			const dayArray = Array.from({ length: totalDays }, (_, i) => i + 1);

			// Update the days to match the cycle weeks repeat
			await updateTimetableDraftDaysByTimetableDraftId(timetableDraftId, dayArray);

			return message(form, 'Cycle weeks repeat updated successfully');
		} catch (err) {
			console.error('Error updating cycle weeks repeat:', err);
			return message(
				form,
				err instanceof Error ? err.message : 'Failed to update cycle weeks repeat',
				{ status: 400 }
			);
		}
	}
};

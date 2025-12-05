import {
	deleteSchoolTerm,
	getSchoolById,
	getSemestersWithTermsBySchoolIdForYear,
	updateSchoolTerm
} from '$lib/server/db/service/schools';
import Holidays from 'date-holidays';
import { fail, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { changeYearSchema, deleteTermSchema, updateTermSchema } from './schema';

export const load = async ({ locals: { security } }) => {
	security.isAuthenticated().isSchoolAdmin();

	const semestersWithTerms = await getSemestersWithTermsBySchoolIdForYear(
		security.getUser().schoolId,
		new Date().getFullYear()
	);

	const school = await getSchoolById(security.getUser().schoolId);
	const hd = new Holidays(school?.countryCode || 'AU', school?.stateCode || 'VIC');
	const currentYear = new Date().getFullYear();

	// Get holidays for current year and next year to cover all potential terms
	const holidaysThisYear = hd.getHolidays(currentYear);

	// Combine and format the holidays
	const publicHolidays = [...holidaysThisYear].map((holiday) => ({
		date: holiday.date,
		name: holiday.name,
		type: holiday.type
	}));

	return {
		semestersWithTerms,
		publicHolidays,
		currentYear
	};
};

export const actions = {
	changeYear: async ({ locals: { security }, request }) => {
		security.isAuthenticated().isSchoolAdmin();

		const form = await superValidate(request, zod4(changeYearSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const { year } = form.data;

		// Get semesters and terms for the selected year
		const semestersWithTerms = await getSemestersWithTermsBySchoolIdForYear(
			security.getUser().schoolId,
			year
		);

		const school = await getSchoolById(security.getUser().schoolId);
		const hd = new Holidays(school?.countryCode || 'AU', school?.stateCode || 'VIC');
		const holidays = hd.getHolidays(year);

		const publicHolidays = holidays.map((holiday) => ({
			date: holiday.date,
			name: holiday.name,
			type: holiday.type
		}));

		return {
			success: true,
			semestersWithTerms: semestersWithTerms || [],
			publicHolidays: publicHolidays || [],
			currentYear: year
		};
	},

	updateTerm: async ({ locals: { security }, request }) => {
		security.isAuthenticated().isSchoolAdmin();

		const form = await superValidate(request, zod4(updateTermSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const { termId, startDate, endDate, currentYear } = form.data as {
			termId: number;
			name: string;
			startDate: Date;
			endDate: Date;
			currentYear: number;
		};

		try {
			await updateSchoolTerm(termId, { startDate, endDate });

			// Refetch data
			const semestersWithTerms = await getSemestersWithTermsBySchoolIdForYear(
				security.getUser().schoolId,
				currentYear
			);

			const school = await getSchoolById(security.getUser().schoolId);
			const hd = new Holidays(school?.countryCode || 'AU', school?.stateCode || 'VIC');
			const holidays = hd.getHolidays(currentYear);
			const publicHolidays = holidays.map((holiday) => ({
				date: holiday.date,
				name: holiday.name,
				type: holiday.type
			}));

			return {
				success: true,
				semestersWithTerms: semestersWithTerms || [],
				publicHolidays: publicHolidays || [],
				currentYear
			};
		} catch (error) {
			console.error('Failed to update term:', error);
			return fail(500, { error: 'Failed to update term' });
		}
	},

	deleteTerm: async ({ locals: { security }, request }) => {
		security.isAuthenticated().isSchoolAdmin();

		const form = await superValidate(request, zod4(deleteTermSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const { termId, currentYear } = form.data as {
			termId: number;
			currentYear: number;
		};

		try {
			await deleteSchoolTerm(termId);

			// Refetch data
			const semestersWithTerms = await getSemestersWithTermsBySchoolIdForYear(
				security.getUser().schoolId,
				currentYear
			);

			const school = await getSchoolById(security.getUser().schoolId);
			const hd = new Holidays(school?.countryCode || 'AU', school?.stateCode || 'VIC');
			const holidays = hd.getHolidays(currentYear);
			const publicHolidays = holidays.map((holiday) => ({
				date: holiday.date,
				name: holiday.name,
				type: holiday.type
			}));

			return {
				success: true,
				semestersWithTerms: semestersWithTerms || [],
				publicHolidays: publicHolidays || [],
				currentYear
			};
		} catch (error) {
			console.error('Failed to delete term:', error);
			return fail(500, { error: 'Failed to delete term' });
		}
	}
};

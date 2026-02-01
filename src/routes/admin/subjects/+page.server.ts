import { parseCSVData, validateCSVFile } from '$lib';
import type { yearLevelEnum } from '$lib/enums.js';
import { db } from '$lib/server/db/index.js';
import { subject } from '$lib/server/db/schema';
import { getSubjectsBySchoolId } from '$lib/server/db/service';
import { fail } from '@sveltejs/kit';
import { superValidate, withFiles } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import {
	optionalColumns,
	requiredColumns,
	subjectsImportSchema,
} from './schema.js';

export const load = async ({ locals: { security } }) => {
	const user = security.isAuthenticated().isAdmin().getUser();
	const subjects = await getSubjectsBySchoolId(user.schoolId);
	const form = await superValidate(zod4(subjectsImportSchema));
	return { subjects, form };
};

export const actions = {
	default: async ({ request, locals: { security } }) => {
		const user = security.isAuthenticated().isAdmin().getUser();

		const formData = await request.formData();
		const form = await superValidate(formData, zod4(subjectsImportSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			const file = form.data.file;

			const validationResult = await validateCSVFile(
				file,
				requiredColumns,
				optionalColumns,
			);

			if (!validationResult.isValid) {
				return fail(400, {
					form,
					error: 'CSV validation failed',
					validation: validationResult,
				});
			}

			const csvText = await file.text();
			const csvData = parseCSVData(csvText);

			if (csvData.length === 0) {
				return fail(400, {
					form,
					error: 'CSV file contains no valid data rows',
					validation: validationResult,
				});
			}

			const subjectsToInsert: Array<{
				name: string;
				yearLevel: yearLevelEnum;
				schoolId: number;
			}> = [];

			for (const rowData of csvData) {
				const name = rowData['name']?.trim();
				const yearLevel = rowData['yearlevel']?.trim() as yearLevelEnum;

				if (!name || !yearLevel) {
					continue;
				}

				subjectsToInsert.push({ name, yearLevel, schoolId: user.schoolId });
			}

			if (subjectsToInsert.length === 0) {
				return fail(400, {
					form,
					error: 'No valid subjects found in CSV file',
					validation: validationResult,
				});
			}

			await db.insert(subject).values(subjectsToInsert);

			return withFiles({ form, success: true });
		} catch (err) {
			console.error('Error importing subjects:', err);
			return fail(500, { form, error: 'Failed to import subjects' });
		}
	},
};

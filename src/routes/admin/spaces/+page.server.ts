import { schoolSpaceTypeEnum } from '$lib/enums.js';
import { schoolSpace } from '$lib/server/db/schema';
import {
	createSchoolSpaces,
	getBuildingsBySchoolId,
	getSpacesBySchoolId,
} from '$lib/server/db/service';
import { parseCSVData, validateCSVFile } from '$lib/utils';
import { fail, superValidate, withFiles } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import {
	locationsImportSchema,
	optionalColumns,
	requiredColumns,
} from './schema.js';

export const load = async ({ locals: { security } }) => {
	const user = security.isAuthenticated().isAdmin().getUser();
	const spaces = await getSpacesBySchoolId(user.schoolId);
	const form = await superValidate(zod4(locationsImportSchema));
	return { spaces, form };
};

export const actions = {
	default: async ({ request, locals: { security } }) => {
		const user = security.isAuthenticated().isAdmin().getUser();

		const formData = await request.formData();
		const form = await superValidate(formData, zod4(locationsImportSchema));

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

			const buildings = await getBuildingsBySchoolId(user.schoolId);
			const buildingMap = new Map(
				buildings.map((b) => [b.name.toLowerCase(), b.id]),
			);

			const spacesToInsert: (typeof schoolSpace.$inferInsert)[] = [];

			for (const rowData of csvData) {
				const name = rowData['name']?.trim();
				const type = rowData['type']?.trim().toLowerCase();
				const buildingName = rowData['buildingname']?.trim();
				const capacityStr = rowData['capacity']?.trim();
				const description = rowData['description']?.trim() || null;

				if (!name || !type || !buildingName) {
					continue;
				}

				const buildingId = buildingMap.get(buildingName.toLowerCase());
				if (!buildingId) {
					return fail(400, {
						form,
						error: `Building "${buildingName}" not found. Available buildings: ${buildings.map((b) => b.name).join(', ')}`,
						validation: validationResult,
					});
				}

				const validTypes = Object.values(schoolSpaceTypeEnum);
				const spaceTypeValue =
					type as (typeof schoolSpaceTypeEnum)[keyof typeof schoolSpaceTypeEnum];
				if (!validTypes.includes(spaceTypeValue)) {
					return fail(400, {
						form,
						error: `Invalid space type "${type}". Valid types: ${validTypes.join(', ')}`,
						validation: validationResult,
					});
				}

				// Parse capacity if provided
				let capacity: number | null = null;
				if (capacityStr && capacityStr !== '') {
					const parsedCapacity = parseInt(capacityStr, 10);
					if (!isNaN(parsedCapacity) && parsedCapacity > 0) {
						capacity = parsedCapacity;
					}
				}

				spacesToInsert.push({
					name,
					type: spaceTypeValue,
					schoolBuildingId: buildingId,
					capacity,
					description,
					isArchived: false,
				});
			}

			if (spacesToInsert.length === 0) {
				return fail(400, {
					form,
					error: 'No valid spaces found in CSV file',
					validation: validationResult,
				});
			}

			await createSchoolSpaces(spacesToInsert);
			return withFiles({ form, success: true });
		} catch (err) {
			console.error('Error importing locations:', err);
			return fail(500, { form, error: 'Failed to import locations' });
		}
	},
};

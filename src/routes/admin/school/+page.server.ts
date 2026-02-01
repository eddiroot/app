import { getSchoolById, updateSchool } from '$lib/server/db/service';
import {
	deleteFile,
	generateUniqueFileName,
	uploadBufferHelper,
} from '$lib/server/obj';
import { error } from '@sveltejs/kit';
import { fail, superValidate, withFiles } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { schoolFormSchema } from './schema';

export const load = async ({ locals: { security } }) => {
	const user = security.isAuthenticated().isAdmin().getUser();
	const school = await getSchoolById(user.schoolId);

	if (!school) {
		throw error(404, 'School not found');
	}

	const form = await superValidate(
		{ name: school?.name || '' },
		zod4(schoolFormSchema),
	);

	return { form, school };
};

export const actions = {
	default: async ({ request, locals: { security } }) => {
		const user = security.isAuthenticated().isAdmin().getUser();

		const formData = await request.formData();
		const form = await superValidate(formData, zod4(schoolFormSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			// Get current school to check for existing logo
			const school = await getSchoolById(user.schoolId);
			if (!school) {
				return fail(404, { form, message: 'School not found' });
			}

			let logoPath = school.logoPath || undefined;

			// Handle logo upload if provided
			if (form.data.logo && form.data.logo.size > 0) {
				// Delete existing logo if it exists
				if (school.logoPath) {
					try {
						// Extract the object name from the URL
						const urlParts = school.logoPath.split('/');
						const objectName = urlParts.slice(-1)[0];
						await deleteFile(objectName);
					} catch (deleteError) {
						console.warn('Could not delete existing logo:', deleteError);
					}
				}

				const buffer = Buffer.from(await form.data.logo.arrayBuffer());
				const uniqueFileName = generateUniqueFileName(form.data.logo.name);
				logoPath = await uploadBufferHelper(
					buffer,
					uniqueFileName,
					form.data.logo.type,
				);
			}

			// Update school with new details and logo URL
			await updateSchool(user.schoolId, form.data.name, logoPath);

			return withFiles({ form });
		} catch (error) {
			console.error('Error updating school:', error);
			return fail(500, { form, message: 'Failed to update school details' });
		}
	},
};

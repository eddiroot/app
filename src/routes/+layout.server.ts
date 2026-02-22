import {
	getCampusesByUserId,
	getSchoolById,
	getSubjectsWithClassesByUserId,
} from '$lib/server/db/service';
import { getPresignedUrl } from '$lib/server/obj.js';
import { error } from '@sveltejs/kit';

export const load = async ({ locals: { user } }) => {
	if (!user) {
		return {
			user: null,
			school: null,
			subjects: [],
			classes: [],
			hasInterviewSlots: false,
		};
	}

	const subjects = await getSubjectsWithClassesByUserId(user.id);
	const school = await getSchoolById(user.schoolId);

	if (!school) {
		throw error(404, 'School not found');
	}

	let schoolLogoUrl: string | null = null;
	if (school.logoPath) {
		schoolLogoUrl = await getPresignedUrl(school.logoPath);
	}

	const campuses = await getCampusesByUserId(user.id);

	return { user, school, campuses, subjects, schoolLogoUrl };
};

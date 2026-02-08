import {
	getCampusesByUserId,
	getSchoolById,
	getSubjectsWithClassesByUserId,
} from '$lib/server/db/service'

export const load = async ({ locals: { user } }) => {
	if (!user) {
		return {
			user: null,
			school: null,
			subjects: [],
			classes: [],
			hasInterviewSlots: false,
		}
	}

	const subjects = await getSubjectsWithClassesByUserId(user.id)
	const school = await getSchoolById(user.schoolId)
	const campuses = await getCampusesByUserId(user.id)

	return { user, school, campuses, subjects }
}

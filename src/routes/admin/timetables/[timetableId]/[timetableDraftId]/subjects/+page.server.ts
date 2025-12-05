import { getSubjectOfferingsByForTimetableByTimetableId } from '$lib/server/db/service';

export const load = async ({ params, locals: { security } }) => {
	const user = security.isAuthenticated().isSchoolAdmin().getUser();

	if (!user) {
		throw new Error('User is not associated with a school');
	}

	const subjectsAndOfferings = await getSubjectOfferingsByForTimetableByTimetableId(
		parseInt(params.timetableId, 10)
	);
	return { subjectsAndOfferings: subjectsAndOfferings };
};

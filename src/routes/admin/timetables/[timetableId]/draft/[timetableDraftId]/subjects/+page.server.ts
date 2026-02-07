import { getSubjectOfferingsForTimetableByTimetableId } from '$lib/server/db/service';

export const load = async ({ params, locals: { security } }) => {
	const user = security.isAuthenticated().isAdmin().getUser();

	if (!user) {
		throw new Error('User is not associated with a school');
	}

	const subjectsAndOfferingsWithYearLevel =
		await getSubjectOfferingsForTimetableByTimetableId(
			parseInt(params.timetableId, 10),
		);

	return { subjectsAndOfferingsWithYearLevel };
};

import { getSubjectThreadsMinimalBySubjectId } from '$lib/server/db/service';

export const load = async ({ locals: { security }, params: { subjectOfferingId } }) => {
	security.isAuthenticated();

	const subjectOfferingIdInt = parseInt(subjectOfferingId, 10);
	if (isNaN(subjectOfferingIdInt)) {
		return { subject: null };
	}

	const threads = await getSubjectThreadsMinimalBySubjectId(subjectOfferingIdInt);

	return { subjectOfferingIdInt, threads };
};

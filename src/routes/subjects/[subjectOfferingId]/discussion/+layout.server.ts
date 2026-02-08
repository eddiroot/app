import { getSubjectThreadsMinimalBySubjectId } from '$lib/server/db/service'

export const load = async ({
	locals: { security },
	params: { subjectOfferingId },
}) => {
	const currentUser = security.isAuthenticated().getUser()

	const subjectOfferingIdInt = parseInt(subjectOfferingId, 10)
	if (isNaN(subjectOfferingIdInt)) {
		return { subject: null, currentUser }
	}

	const threads =
		await getSubjectThreadsMinimalBySubjectId(subjectOfferingIdInt)

	return { subjectOfferingIdInt, threads, currentUser }
}

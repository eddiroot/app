import { getSpacesBySchoolId } from '$lib/server/db/service';

export const load = async ({ locals: { security } }) => {
	const user = security.isAuthenticated().isSchoolAdmin().getUser();
	const spaces = await getSpacesBySchoolId(user.schoolId);
	return { spaces };
};

import { getBuildingsBySchoolId } from '$lib/server/db/service';

export const load = async ({ locals: { security } }) => {
	const user = security.isAuthenticated().isSchoolAdmin().getUser();
	const buildings = await getBuildingsBySchoolId(user.schoolId);
	return { buildings };
};

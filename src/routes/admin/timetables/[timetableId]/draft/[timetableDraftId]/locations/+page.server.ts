import {
	getBuildingsBySchoolId,
	getSpacesBySchoolId,
} from '$lib/server/db/service'

export const load = async ({ locals: { security } }) => {
	const user = security.isAuthenticated().isAdmin().getUser()
	const buildings = await getBuildingsBySchoolId(user.schoolId)
	const spaces = await getSpacesBySchoolId(user.schoolId)
	return { buildings, spaces }
}

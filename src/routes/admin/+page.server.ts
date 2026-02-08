import { getSchoolStatsById } from '$lib/server/db/service'

export const load = async ({ locals: { security } }) => {
	const user = security.isAuthenticated().isAdmin().getUser()
	const stats = await getSchoolStatsById(user.schoolId)

	return { stats }
}

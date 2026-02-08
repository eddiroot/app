export const load = async ({ locals: { security } }) => {
	security.isAuthenticated().isAdmin()
}

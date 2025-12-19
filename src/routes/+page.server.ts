import * as auth from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';

export const load = async ({ locals: { user } }) => {
	if (user) redirect(302, '/dashboard');
};

export const actions = {
	logout: async (event) => {
		if (!event.locals.session) {
			return fail(401);
		}
		await auth.deleteSession(event.locals.session.id);
		auth.deleteSessionTokenCookie(event);

		return redirect(302, '/login');
	}
};

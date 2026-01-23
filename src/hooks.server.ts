import * as auth from '$lib/server/auth.js';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { Security } from '$lib/server/security';
import type { Handle, ServerInit } from '@sveltejs/kit';
// import cron from 'node-cron';
// import { processTimetableQueue } from './scripts/processTimetable';

export const init: ServerInit = async () => {
	// cron.schedule('* * * * *', () => {
	// 	processTimetableQueue();
	// });

    db.select().from(table.school).limit(1).catch(() => {
		console.error('Database appears to be offline. Exiting...');
		process.exit(1);
	});
};

const handleAuth: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get(auth.sessionCookieName);

	if (!sessionToken) {
		event.locals.user = null;
		event.locals.session = null;
		event.locals.security = new Security(event);
		return resolve(event);
	}

	const { session, user } = await auth.validateSessionToken(sessionToken);

	if (session && user) {
		auth.setSessionTokenCookie(event, sessionToken);
		event.locals.user = user;
		event.locals.session = session;
	} else {
		auth.deleteSessionTokenCookie(event);
		event.locals.user = null;
		event.locals.session = null;
	}

	event.locals.security = new Security(event);
	return resolve(event);
};

export const handle: Handle = handleAuth;

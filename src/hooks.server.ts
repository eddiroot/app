import { building, dev } from '$app/environment'
import * as auth from '$lib/server/auth'
import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import { Security } from '$lib/server/security'
import { redirect, type Handle, type ServerInit } from '@sveltejs/kit'
// import cron from 'node-cron';
// import { processTimetableQueue } from './scripts/processTimetable';

export const init: ServerInit = async () => {
	// cron.schedule('* * * * *', () => {
	// processTimetableQueue();
	// });

	db.select()
		.from(table.school)
		.limit(1)
		.catch(() => {
			console.error('Database appears to be offline. Exiting...')
			process.exit(1)
		})
}

// Initialize Socket.IO in production (dev mode is handled by Vite plugin)
if (!building && !dev) {
	// In production, we need to get the HTTP server from the adapter
	// This will be set up when the server starts
	// The adapter will need to expose the HTTP server for Socket.IO to attach
	console.log('Production mode: Socket.IO will be initialized by the adapter')
}

const handleAuth: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get(auth.sessionCookieName)

	if (!sessionToken) {
		event.locals.user = null
		event.locals.session = null
		event.locals.security = new Security(event)
		if (event.route.id !== '/' && !event.route.id?.startsWith('/(public)')) {
			return redirect(303, '/login')
		}
		return resolve(event)
	}

	const { session, user } = await auth.validateSessionToken(sessionToken)

	if (session && user) {
		auth.setSessionTokenCookie(event, sessionToken)
		event.locals.user = user
		event.locals.session = session
		event.locals.security = new Security(event)
	} else {
		auth.deleteSessionTokenCookie(event)
		event.locals.user = null
		event.locals.session = null
		event.locals.security = new Security(event)
		return redirect(303, '/login')
	}

	return resolve(event)
}

export const handle: Handle = handleAuth

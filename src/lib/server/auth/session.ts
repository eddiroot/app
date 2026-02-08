import { db } from '$lib/server/db'
import * as table from '$lib/server/db/schema'
import { type RequestEvent } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'

export const sessionCookieName = 'session_token'
const inactivityTimeoutSeconds = 60 * 60 * 24 * 1 // 1 day
const activityCheckIntervalSeconds = 60 * 60 * 1 // 1 hour

function generateSecureRandomString(): string {
	const alphabet = 'abcdefghijkmnpqrstuvwxyz23456789'

	const bytes = new Uint8Array(24)
	crypto.getRandomValues(bytes)

	let id = ''
	for (let i = 0; i < bytes.length; i++) {
		id += alphabet[bytes[i] % alphabet.length]
	}

	return id
}

async function hashSecret(secret: string): Promise<Uint8Array> {
	const secretBytes = new TextEncoder().encode(secret)
	const secretHashBuffer = await crypto.subtle.digest('SHA-256', secretBytes)
	return new Uint8Array(secretHashBuffer)
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
	if (a.byteLength !== b.byteLength) {
		return false
	}
	let c = 0
	for (let i = 0; i < a.byteLength; i++) {
		c |= a[i] ^ b[i]
	}
	return c === 0
}

export async function createSession(userId: string) {
	const now = new Date()

	const id = generateSecureRandomString()
	const secret = generateSecureRandomString()
	const secretHashBytes = await hashSecret(secret)
	const secretHash = Buffer.from(secretHashBytes).toString('hex')

	const token = id + '.' + secret

	const session = {
		id,
		secretHash,
		userId,
		token,
		createdAt: now,
		lastVerifiedAt: now,
	}

	await db
		.insert(table.session)
		.values({
			id: session.id,
			secretHash: session.secretHash,
			userId: session.userId,
			createdAt: session.createdAt,
			lastVerifiedAt: session.lastVerifiedAt,
		})

	return session
}

export async function validateSessionToken(token: string) {
	const now = new Date()

	const tokenParts = token.split('.')
	if (tokenParts.length !== 2) {
		return { session: null, user: null }
	}
	const sessionId = tokenParts[0]
	const sessionSecret = tokenParts[1]

	const result = await getSessionAndUser(sessionId)
	if (!result) {
		return { session: null, user: null }
	}

	const { session, user } = result

	const tokenSecretHash = await hashSecret(sessionSecret)
	const sessionSecretHash = Buffer.from(session.secretHash, 'hex')
	const validSecret = constantTimeEqual(tokenSecretHash, sessionSecretHash)
	if (!validSecret) {
		return { session: null, user: null }
	}

	if (
		now.getTime() - session.lastVerifiedAt.getTime() >=
		activityCheckIntervalSeconds * 1000
	) {
		session.lastVerifiedAt = now
		await db
			.update(table.session)
			.set({ lastVerifiedAt: now })
			.where(eq(table.session.id, sessionId))
	}

	return { session, user }
}

export type SessionValidationResult = Awaited<
	ReturnType<typeof validateSessionToken>
>

export async function getSessionAndUser(sessionId: string) {
	const now = new Date()

	const results = await db
		.select({
			// Adjust user table here to tweak returned data
			user: {
				id: table.user.id,
				email: table.user.email,
				schoolId: table.user.schoolId,
				type: table.user.type,
				firstName: table.user.firstName,
				middleName: table.user.middleName,
				lastName: table.user.lastName,
			},
			session: table.session,
		})
		.from(table.session)
		.innerJoin(table.user, eq(table.session.userId, table.user.id))
		.where(eq(table.session.id, sessionId))

	if (results.length !== 1) {
		return null
	}

	const session = results[0].session
	const user = results[0].user

	if (
		now.getTime() - session.lastVerifiedAt.getTime() >=
		inactivityTimeoutSeconds * 1000
	) {
		await deleteSession(sessionId)
		return null
	}

	return { session, user }
}

export async function deleteSession(sessionId: string) {
	await db.delete(table.session).where(eq(table.session.id, sessionId))
}

export function setSessionTokenCookie(event: RequestEvent, token: string) {
	event.cookies.set(sessionCookieName, token, {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
	})
}

export function deleteSessionTokenCookie(event: RequestEvent) {
	event.cookies.delete(sessionCookieName, { path: '/' })
}

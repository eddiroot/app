import { hash } from '@node-rs/argon2'

let cachedPasswordHash: string | null = null

/**
 * Get a cached password hash for seeding (avoids repeated hashing)
 */
export async function getDefaultPasswordHash(): Promise<string> {
	if (!cachedPasswordHash) {
		cachedPasswordHash = await hash('password123')
	}
	return cachedPasswordHash
}

import { env } from '$env/dynamic/private'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

if (!env.DB_HOST) throw new Error('DB_HOST is not set')
if (!env.DB_PORT) throw new Error('DB_PORT is not set')
if (!env.DB_USER) throw new Error('DB_USER is not set')
if (!env.DB_PASSWORD) throw new Error('DB_PASSWORD is not set')
if (!env.DB_NAME) throw new Error('DB_NAME is not set')

const pool = new Pool({
	host: env.DB_HOST,
	port: parseInt(env.DB_PORT, 10),
	user: env.DB_USER,
	password: env.DB_PASSWORD,
	database: env.DB_NAME,
})

export const db = drizzle(pool, { schema })

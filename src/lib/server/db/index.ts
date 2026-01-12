import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Use process.env (populated by dotenv for scripts, or by SvelteKit at runtime)
const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;

if (!DB_HOST) throw new Error('DB_HOST is not set');
if (!DB_PORT) throw new Error('DB_PORT is not set');
if (!DB_USER) throw new Error('DB_USER is not set');
if (!DB_PASSWORD) throw new Error('DB_PASSWORD is not set');
if (!DB_NAME) throw new Error('DB_NAME is not set');

const pool = new Pool({
	host: DB_HOST,
	port: parseInt(DB_PORT, 10),
	user: DB_USER,
	password: DB_PASSWORD,
	database: DB_NAME
});

export const db = drizzle(pool, { schema });

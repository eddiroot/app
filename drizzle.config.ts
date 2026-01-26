import { defineConfig } from 'drizzle-kit';

if (!process.env.DB_HOST) throw new Error('DB_HOST is not set');
if (!process.env.DB_PORT) throw new Error('DB_PORT is not set');
if (!process.env.DB_USER) throw new Error('DB_USER is not set');
if (!process.env.DB_PASSWORD) throw new Error('DB_PASSWORD is not set');
if (!process.env.DB_NAME) throw new Error('DB_NAME is not set');

export default defineConfig({
	dialect: 'postgresql',
	schema: './src/lib/server/db/schema/*.ts',
	out: './migrations',
	dbCredentials: {
		host: process.env.DB_HOST || '',
		port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
		user: process.env.DB_USER || '',
		password: process.env.DB_PASSWORD || '',
		database: process.env.DB_NAME || '',
		ssl: false,
	},
	// Required for drizzle-kit push to work with custom pgSchema
	// See: https://github.com/drizzle-team/drizzle-orm/issues/3476
	schemaFilter: [
		'public',
		'chatbot',
		'coursemap',
		'curriculum',
		'event',
		'news',
		'resource',
		'school',
		'subject',
		'task',
		'timetable',
		'user',
	],
});

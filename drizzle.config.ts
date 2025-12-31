import { defineConfig } from 'drizzle-kit';
import { Resource } from 'sst';

export default defineConfig({
	dialect: 'postgresql',
	schema: './src/lib/server/db/schema',
	out: './migrations',
	dbCredentials: {
		// @ts-expect-error - SST Resource types not available in drizzle-kit context
		host: Resource.Database.host,
		// @ts-expect-error - SST Resource types not available in drizzle-kit context
		port: Resource.Database.port,
		// @ts-expect-error - SST Resource types not available in drizzle-kit context
		user: Resource.Database.username,
		// @ts-expect-error - SST Resource types not available in drizzle-kit context
		password: Resource.Database.password,
		// @ts-expect-error - SST Resource types not available in drizzle-kit context
		database: Resource.Database.database,
		ssl: Resource.App.stage == 'production' ? true : false
	},
	// Required for drizzle-kit push to work with custom pgSchema
	// See: https://github.com/drizzle-team/drizzle-orm/issues/3476
	schemaFilter: [
		'public',
		'curriculum',
		'course_map',
		'events',
		'interviews',
		'news',
		'resource',
		'school',
		'task',
		'timetable',
		'user',
		'utils',
		'subject'
	]
});

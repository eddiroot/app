import { env } from '$env/dynamic/private';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from '../schema';
import { seedDemo } from './demo';
import { seedEddi } from './eddi';
import type { SeedContext } from './types';
import { truncateAllTables } from './utils';

const { Pool } = pg;

async function seed(): Promise<void> {
	const pool = new Pool({
		host: env.DB_HOST,
		port: parseInt(env.DB_PORT || '5432', 10),
		user: env.DB_USER,
		password: env.DB_PASSWORD,
		database: env.DB_NAME
	});

	const db = drizzle(pool, { schema });

	const context: SeedContext = { db, pool };

	try {
		await truncateAllTables(pool);
		await seedEddi(context);
		await seedDemo(context);
		console.log('\n✅ Seeding completed successfully!\n');
	} catch (error) {
		console.error('\n❌ Seeding failed:', error);
		throw error;
	} finally {
		await pool.end();
	}
}

seed()
	.then(() => {
		process.exit(0);
	})
	.catch((error) => {
		console.error('Seeding failed:', error);
		process.exit(1);
	});

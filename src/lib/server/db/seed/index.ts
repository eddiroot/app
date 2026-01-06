import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { Resource } from 'sst';
import * as schema from '../schema';
import { seedDemo } from './demo';
import { seedEddi } from './eddi';
import type { SeedContext } from './types';
import { logSection, truncateAllTables } from './utils';

const { Pool } = pg;

interface SeedOptions {
	fresh?: boolean;
	eddi?: boolean;
	demo?: boolean;
}

async function seed(options: SeedOptions = {}): Promise<void> {
	const { eddi = true, demo = true } = options;

	console.log('\n🌱 Starting database seeding...');
	console.log(`   Eddi data: ${eddi}`);
	console.log(`   Demo school: ${demo}`);

	const pool = new Pool({
		host: Resource.Database.host,
		port: Resource.Database.port,
		user: Resource.Database.username,
		password: Resource.Database.password,
		database: Resource.Database.database
	});

	const db = drizzle(pool, { schema });

	const context: SeedContext = { db, pool };

	try {
		// Truncate tables if fresh mode
		logSection('Truncating Tables');
		await truncateAllTables(pool);
		

		// Seed Eddi platform data (curriculum, etc.)
		if (eddi) {
			await seedEddi(context);
		}

		// Seed Demo school data
		if (demo) {
			await seedDemo(context);
		}

		console.log('\n✅ Seeding completed successfully!\n');
	} catch (error) {
		console.error('\n❌ Seeding failed:', error);
		throw error;
	} finally {
		await pool.end();
	}
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: SeedOptions = {
	eddi: !args.includes('--no-eddi'),
	demo: !args.includes('--no-demo')
};

seed(options)
	.then(() => {
		process.exit(0);
	})
	.catch((error) => {
		console.error('Seeding failed:', error);
		process.exit(1);
	});

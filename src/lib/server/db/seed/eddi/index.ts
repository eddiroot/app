import type { SeedContext } from '../types';
import { logSection, logSubsection } from '../utils';
import { seedCurriculum } from './curriculum';
import { seedEddiSchool } from './school';

export async function seedEddi(context: SeedContext) {
	logSection('Seeding Eddi Platform Data');

	const { db, pool } = context;

	// Create eddi school
	logSubsection('Creating eddi school');
	const eddi = await seedEddiSchool(db);

	// Seed curriculum
	logSubsection('Seeding Curriculum');
	await seedCurriculum(pool, db, eddi.id);

	return { eddi };
}

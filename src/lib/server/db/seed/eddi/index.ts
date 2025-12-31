import { eq } from 'drizzle-orm';
import * as schema from '../../schema';
import type { SeedContext } from '../types';
import { logSection, logSubsection } from '../utils';
import { seedCurriculum } from './curriculum';
import { seedEddiSchool } from './school';

export async function seedEddi(context: SeedContext) {
	logSection('Seeding Eddi Platform Data');

	const { db, pool, fresh } = context;

	// Check if Eddi data already exists (unless fresh mode)
	if (!fresh) {
		const [existingEddiSchool] = await db
			.select()
			.from(schema.school)
			.where(eq(schema.school.name, 'eddi.edu.au'))
			.limit(1);

		if (existingEddiSchool) {
			return { eddiSchool: existingEddiSchool };
		}
	}

	// Create eddi.edu.au school
	logSubsection('Creating eddi.edu.au school');
	const eddiSchool = await seedEddiSchool(db);

	// Seed curriculum
	logSubsection('Seeding Curriculum');
	await seedCurriculum(pool, db, eddiSchool.id);

	return { eddiSchool };
}

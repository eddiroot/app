import type { Database } from '../../types';
import { logSubsection } from '../../utils';
import { seedVCAACurriculum } from './VCAA';

export async function seedCurriculum(db: Database, schoolId: number) {
	logSubsection('Seeding VCAA Curriculum');
	await seedVCAACurriculum(db, schoolId);
}

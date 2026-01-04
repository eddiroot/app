import type pg from 'pg';
import type { Database } from '../../types';
import { logSubsection } from '../../utils';
import { seedVCAACurriculum } from './VCAA';

export async function seedCurriculum(pool: pg.Pool, db: Database, schoolId: number) {
	logSubsection('Seeding VCAA Curriculum');
	await seedVCAACurriculum(pool, db, schoolId);
}

import type { Database } from '../../../types';
import { logSubsection } from '../../../utils';
import { seedVC2Curriculum } from './vc2';

/**
 * Seed all VCAA curriculum data (VC2 Foundation-10 and VCE 2025)
 */
export async function seedVCAACurriculum(
	db: Database,
	schoolId: number
) {
	logSubsection('Seeding VC2 Foundation-10 Curriculum');
	await seedVC2Curriculum(db, schoolId);

    // Todo: Refactor the seeding process for VCE curriculum data.
	// logSubsection('Seeding VCE 2025 Curriculum');
	// await seedVCECurriculum(db, schoolId);

}

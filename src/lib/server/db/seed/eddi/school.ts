import * as schema from '../../schema';
import type { Database } from '../types';

export async function seedEddiSchool(db: Database) {
	const [eddiSchool] = await db
		.insert(schema.school)
		.values({ name: 'eddi', countryCode: 'AU', stateCode: 'VIC' })
		.returning();

	// Create standard behaviour levels and behaviours
	const [level1, level2, level3, level4, level5] = await db
		.insert(schema.schoolBehaviourLevel)
		.values([
			{ schoolId: eddiSchool.id, level: 1, name: 'Minor Infringement' },
			{
				schoolId: eddiSchool.id,
				level: 2,
				name: 'Repeated Minor Infringement',
			},
			{
				schoolId: eddiSchool.id,
				level: 3,
				name: 'Continual Minor Infringement',
			},
			{ schoolId: eddiSchool.id, level: 4, name: 'Serious Incident' },
			{ schoolId: eddiSchool.id, level: 5, name: 'Very Serious Incident' },
		])
		.returning();

	await db
		.insert(schema.schoolBehaviour)
		.values([
			{
				schoolId: eddiSchool.id,
				levelId: level1.id,
				name: 'Out of uniform',
				description: 'Student not wearing correct school uniform',
			},
			{
				schoolId: eddiSchool.id,
				levelId: level1.id,
				name: 'Late to class',
				description: 'Student arrived late without valid reason',
			},
			{
				schoolId: eddiSchool.id,
				levelId: level1.id,
				name: 'Forgot materials',
				description:
					'Student came to class without required materials or equipment',
			},
			{
				schoolId: eddiSchool.id,
				levelId: level1.id,
				name: 'Talking out of turn',
				description: 'Student speaking without permission during instruction',
			},
			{
				schoolId: eddiSchool.id,
				levelId: level1.id,
				name: 'Off-task behaviour',
				description: 'Student not focused on assigned work',
			},
			{
				schoolId: eddiSchool.id,
				levelId: level2.id,
				name: 'Repeated lateness',
				description: 'Student consistently arriving late to class',
			},
			{
				schoolId: eddiSchool.id,
				levelId: level2.id,
				name: 'Incomplete homework',
				description: 'Student did not complete assigned homework',
			},
			{
				schoolId: eddiSchool.id,
				levelId: level2.id,
				name: 'Minor damage to property',
				description: 'Student caused minor damage to school property',
			},
			{
				schoolId: eddiSchool.id,
				levelId: level2.id,
				name: 'Distracting other students',
				description: 'Student disrupting the learning of others',
			},
			{
				schoolId: eddiSchool.id,
				levelId: level3.id,
				name: 'Hurtful teasing',
				description: 'Student making hurtful comments to others',
			},
			{
				schoolId: eddiSchool.id,
				levelId: level3.id,
				name: 'Bullying (isolated)',
				description: 'Isolated instance of bullying behaviour',
			},
			{
				schoolId: eddiSchool.id,
				levelId: level3.id,
				name: 'Safety violation',
				description: 'Student not following safety requirements',
			},
			{
				schoolId: eddiSchool.id,
				levelId: level3.id,
				name: 'Defiance',
				description: 'Student refusing to follow reasonable instructions',
			},
			{
				schoolId: eddiSchool.id,
				levelId: level3.id,
				name: 'Creating dangerous situation',
				description:
					'Student behaviour created a potentially dangerous situation',
			},
			{
				schoolId: eddiSchool.id,
				levelId: level4.id,
				name: 'Physical violence',
				description:
					'Student engaged in physical violence towards another person',
			},
			{
				schoolId: eddiSchool.id,
				levelId: level4.id,
				name: 'Aggressive behaviour',
				description: 'Student displayed overly aggressive behaviour',
			},
			{
				schoolId: eddiSchool.id,
				levelId: level4.id,
				name: 'Theft',
				description:
					'Student stole property belonging to another person or the school',
			},
			{
				schoolId: eddiSchool.id,
				levelId: level4.id,
				name: 'Undermining authority',
				description:
					'Student behaviour undermined the authority of the teacher',
			},
			{
				schoolId: eddiSchool.id,
				levelId: level4.id,
				name: 'Offensive behaviour',
				description: 'Behaviour clearly very offensive to others',
			},
			{
				schoolId: eddiSchool.id,
				levelId: level5.id,
				name: 'Excessive violence',
				description: 'Student engaged in excessive physical violence',
			},
			{
				schoolId: eddiSchool.id,
				levelId: level5.id,
				name: 'Repeated theft',
				description: 'Student engaged in premeditated or repeated theft',
			},
			{
				schoolId: eddiSchool.id,
				levelId: level5.id,
				name: 'Contempt for wellbeing',
				description:
					'Behaviour showing contempt for the wellbeing of others or the school',
			},
		])
		.returning();

	return eddiSchool;
}

import { schoolSpaceTypeEnum, yearLevelEnum } from '$lib/enums';
import { getTermsByYear } from '$lib/server/vic-school-terms';
import * as schema from '../../schema';
import type { Database } from '../types';
import { DEMO_YEAR_LEVELS, type DemoYearLevelIds } from './consts';
import type { DemoSchoolData } from './types';

export async function seedDemoSchool(db: Database): Promise<DemoSchoolData> {
	// Create school
	const [school] = await db
		.insert(schema.school)
		.values({
			name: 'Demo School',
			countryCode: 'AU',
			stateCode: 'VIC'
		})
		.returning();

	console.log(`Created Demo School (ID: ${school.id})`);

	// Create behaviour levels for the school
	const [level1, level2, level3, level4, level5] = await db
		.insert(schema.behaviourLevel)
		.values([
			{
				schoolId: school.id,
				level: 1,
				name: 'Minor Infringement'
			},
			{
				schoolId: school.id,
				level: 2,
				name: 'Repeated Minor Infringement'
			},
			{
				schoolId: school.id,
				level: 3,
				name: 'Continual Minor Infringement'
			},
			{
				schoolId: school.id,
				level: 4,
				name: 'Serious Incident'
			},
			{
				schoolId: school.id,
				level: 5,
				name: 'Very Serious Incident'
			}
		])
		.returning();

	await db
		.insert(schema.behaviour)
		.values([
			{
				schoolId: school.id,
				levelId: level1.id,
				name: 'Out of uniform',
				description: 'Student not wearing correct school uniform'
			},
			{
				schoolId: school.id,
				levelId: level1.id,
				name: 'Late to class',
				description: 'Student arrived late without valid reason'
			},
			{
				schoolId: school.id,
				levelId: level1.id,
				name: 'Forgot materials',
				description: 'Student came to class without required materials or equipment'
			},
			{
				schoolId: school.id,
				levelId: level1.id,
				name: 'Talking out of turn',
				description: 'Student speaking without permission during instruction'
			},
			{
				schoolId: school.id,
				levelId: level1.id,
				name: 'Off-task behaviour',
				description: 'Student not focused on assigned work'
			},
			{
				schoolId: school.id,
				levelId: level2.id,
				name: 'Repeated lateness',
				description: 'Student consistently arriving late to class'
			},
			{
				schoolId: school.id,
				levelId: level2.id,
				name: 'Incomplete homework',
				description: 'Student did not complete assigned homework'
			},
			{
				schoolId: school.id,
				levelId: level2.id,
				name: 'Minor damage to property',
				description: 'Student caused minor damage to school property'
			},
			{
				schoolId: school.id,
				levelId: level2.id,
				name: 'Distracting other students',
				description: 'Student disrupting the learning of others'
			},
			{
				schoolId: school.id,
				levelId: level3.id,
				name: 'Hurtful teasing',
				description: 'Student making hurtful comments to others'
			},
			{
				schoolId: school.id,
				levelId: level3.id,
				name: 'Bullying (isolated)',
				description: 'Isolated instance of bullying behaviour'
			},
			{
				schoolId: school.id,
				levelId: level3.id,
				name: 'Safety violation',
				description: 'Student not following safety requirements'
			},
			{
				schoolId: school.id,
				levelId: level3.id,
				name: 'Defiance',
				description: 'Student refusing to follow reasonable instructions'
			},
			{
				schoolId: school.id,
				levelId: level3.id,
				name: 'Creating dangerous situation',
				description: 'Student behaviour created a potentially dangerous situation'
			},
			{
				schoolId: school.id,
				levelId: level4.id,
				name: 'Physical violence',
				description: 'Student engaged in physical violence towards another person'
			},
			{
				schoolId: school.id,
				levelId: level4.id,
				name: 'Aggressive behaviour',
				description: 'Student displayed overly aggressive behaviour'
			},
			{
				schoolId: school.id,
				levelId: level4.id,
				name: 'Theft',
				description: 'Student stole property belonging to another person or the school'
			},
			{
				schoolId: school.id,
				levelId: level4.id,
				name: 'Undermining authority',
				description: 'Student behaviour undermined the authority of the teacher'
			},
			{
				schoolId: school.id,
				levelId: level4.id,
				name: 'Offensive behaviour',
				description: 'Behaviour clearly very offensive to others'
			},
			{
				schoolId: school.id,
				levelId: level5.id,
				name: 'Excessive violence',
				description: 'Student engaged in excessive physical violence'
			},
			{
				schoolId: school.id,
				levelId: level5.id,
				name: 'Repeated theft',
				description: 'Student engaged in premeditated or repeated theft'
			},
			{
				schoolId: school.id,
				levelId: level5.id,
				name: 'Contempt for wellbeing',
				description: 'Behaviour showing contempt for the wellbeing of others or the school'
			}
		])
		.returning();

	console.log('  Created behaviours');

	// Create campus
	const [campus] = await db
		.insert(schema.campus)
		.values({
			schoolId: school.id,
			name: 'Main Campus',
			address: '123 Education Street, Melbourne VIC 3000',
			description: 'Primary campus of Demo School'
		})
		.returning();

	console.log(`  Created campus: ${campus.name}`);

	// Create buildings
	const [middleSchool, seniorSchool, gymnasium] = await db
		.insert(schema.schoolBuilding)
		.values([
			{
				campusId: campus.id,
				name: 'Middle School Building',
				description: 'All year 7-9 classrooms.'
			},
			{
				campusId: campus.id,
				name: 'Senior School Building',
				description: 'All year 10-12 classrooms.'
			},
			{ campusId: campus.id, name: 'Gymnasium', description: 'Gymnasium and sporting facilities.' }
		])
		.returning();

	console.log('  Created buildings: Middle School, Senior School, Gymnasium');

	// Create spaces
	const spaces = await db
		.insert(schema.schoolSpace)
		.values([
			// Middle School
			{
				buildingId: middleSchool.id,
				name: 'Science Lab ML.01',
				type: schoolSpaceTypeEnum.laboratory,
				capacity: 30
			},
			{
				buildingId: middleSchool.id,
				name: 'Science Lab ML.02',
				type: schoolSpaceTypeEnum.laboratory,
				capacity: 30
			},
			{
				buildingId: middleSchool.id,
				name: 'Classroom MC.01',
				type: schoolSpaceTypeEnum.classroom,
				capacity: 30
			},
			{
				buildingId: middleSchool.id,
				name: 'Classroom MC.02',
				type: schoolSpaceTypeEnum.classroom,
				capacity: 30
			},
			{
				buildingId: middleSchool.id,
				name: 'Classroom MC.03',
				type: schoolSpaceTypeEnum.classroom,
				capacity: 30
			},
			{
				buildingId: middleSchool.id,
				name: 'Classroom MC.11',
				type: schoolSpaceTypeEnum.classroom,
				capacity: 30
			},
			{
				buildingId: middleSchool.id,
				name: 'Classroom MC.12',
				type: schoolSpaceTypeEnum.classroom,
				capacity: 30
			},
			{
				buildingId: middleSchool.id,
				name: 'Classroom MC.13',
				type: schoolSpaceTypeEnum.classroom,
				capacity: 30
			},
			// Senior School
			{
				buildingId: seniorSchool.id,
				name: 'Science Lab SL.01',
				type: schoolSpaceTypeEnum.laboratory,
				capacity: 30
			},
			{
				buildingId: seniorSchool.id,
				name: 'Science Lab SL.02',
				type: schoolSpaceTypeEnum.laboratory,
				capacity: 30
			},
			{
				buildingId: seniorSchool.id,
				name: 'Classroom SC.01',
				type: schoolSpaceTypeEnum.classroom,
				capacity: 30
			},
			{
				buildingId: seniorSchool.id,
				name: 'Classroom SC.02',
				type: schoolSpaceTypeEnum.classroom,
				capacity: 30
			},
			{
				buildingId: seniorSchool.id,
				name: 'Classroom SC.03',
				type: schoolSpaceTypeEnum.classroom,
				capacity: 30
			},
			{
				buildingId: seniorSchool.id,
				name: 'Classroom SC.11',
				type: schoolSpaceTypeEnum.classroom,
				capacity: 30
			},
			{
				buildingId: seniorSchool.id,
				name: 'Classroom SC.12',
				type: schoolSpaceTypeEnum.classroom,
				capacity: 30
			},
			{
				buildingId: seniorSchool.id,
				name: 'Classroom SC.13',
				type: schoolSpaceTypeEnum.classroom,
				capacity: 30
			},
			// Gymnasium
			{
				buildingId: gymnasium.id,
				name: 'Courts',
				type: schoolSpaceTypeEnum.gymnasium,
				capacity: 120
			},
			{
				buildingId: gymnasium.id,
				name: 'Swimming Pool',
				type: schoolSpaceTypeEnum.pool,
				capacity: 40
			}
		])
		.returning();

	console.log(`  Created ${spaces.length} school spaces`);

	// Create year levels (Foundation to Year 12)
	const yearLevels = await seedYearLevels(db, school.id);
	console.log(`  Created ${Object.keys(yearLevels).length} year levels`);

	// Create semesters and terms
	await seedSchoolTerms(db, school.id);

	return {
		school,
		campus,
		buildings: { middleSchool, seniorSchool, gymnasium },
		spaces,
		yearLevels
	};
}

async function seedYearLevels(db: Database, schoolId: number): Promise<DemoYearLevelIds> {
	const yearLevels = await db
		.insert(schema.yearLevel)
		.values(
			DEMO_YEAR_LEVELS.map((level) => ({
				schoolId,
				yearLevel: level
			}))
		)
		.returning();

	// DEMO_YEAR_LEVELS order is: [year7, year8, year9, year10, none]
	const yearLevelMap = new Map(yearLevels.map((yl) => [yl.yearLevel, yl.id]));

	return {
		none: yearLevelMap.get(yearLevelEnum.none)!,
		7: yearLevelMap.get(yearLevelEnum.year7)!,
		8: yearLevelMap.get(yearLevelEnum.year8)!,
		9: yearLevelMap.get(yearLevelEnum.year9)!,
		10: yearLevelMap.get(yearLevelEnum.year10)!
	};
}

async function seedSchoolTerms(db: Database, schoolId: number) {
	const currentYear = new Date().getFullYear();
	const yearsToCreate = 5;

	for (let yearOffset = 0; yearOffset < yearsToCreate; yearOffset++) {
		const year = currentYear + yearOffset;
		const victorianTerms = getTermsByYear(year);
		if (!victorianTerms) continue;

		const semester1Terms = victorianTerms.filter((t) => t.termNumber <= 2);
		const semester2Terms = victorianTerms.filter((t) => t.termNumber > 2);

		if (semester1Terms.length > 0) {
			const [sem1] = await db
				.insert(schema.schoolSemester)
				.values({ schoolId, semNumber: 1, schoolYear: year })
				.returning();

			for (const term of semester1Terms) {
				await db.insert(schema.schoolTerm).values({
					schoolSemesterId: sem1.id,
					termNumber: term.termNumber,
					startDate: term.startDate,
					endDate: term.endDate
				});
			}
		}

		if (semester2Terms.length > 0) {
			const [sem2] = await db
				.insert(schema.schoolSemester)
				.values({ schoolId, semNumber: 2, schoolYear: year })
				.returning();

			for (const term of semester2Terms) {
				await db.insert(schema.schoolTerm).values({
					schoolSemesterId: sem2.id,
					termNumber: term.termNumber,
					startDate: term.startDate,
					endDate: term.endDate
				});
			}
		}
	}

	console.log(`  Created ${yearsToCreate} years of semesters and terms`);
}

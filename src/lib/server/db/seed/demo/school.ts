import { schoolSpaceTypeEnum, yearLevelEnum } from '$lib/enums';
import { getTermsByYear } from '$lib/server/vic-school-terms';
import { eq } from 'drizzle-orm';
import * as schema from '../../schema';
import type { Database } from '../types';
import { DEMO_YEAR_LEVELS, type DemoYearLevelIds } from './consts';
import type { DemoSchoolData } from './types';

export async function seedDemoSchool(db: Database, eddiSchool: schema.School): Promise<DemoSchoolData> {
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

	const eddiBehaviourLevels = await db.select().from(schema.behaviourLevel).where(eq(schema.behaviourLevel.schoolId, eddiSchool.id));

	for (const eddiLevel of eddiBehaviourLevels) {
		const [demoBehaviourLevel] = await db.insert(schema.behaviourLevel).values({
			schoolId: school.id,
			level: eddiLevel.level,
			name: eddiLevel.name
		}).returning();

		const eddiBehaviours = await db
			.select()
			.from(schema.behaviour)
			.where(eq(schema.behaviour.levelId, eddiLevel.id));

		for (const eddiBehaviour of eddiBehaviours) {
			await db.insert(schema.behaviour).values({
				schoolId: school.id,
				levelId: demoBehaviourLevel.id,
				name: eddiBehaviour.name,
				description: eddiBehaviour.description
			});
		}
	}

	console.log('Copied behaviour levels and behaviours from eddi school');

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

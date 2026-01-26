import { schoolSpaceTypeEnum, yearLevelEnum } from '$lib/enums';
import { eq } from 'drizzle-orm';
import * as schema from '../../schema';
import type { Database } from '../types';
import type { DemoSchoolData } from './types';

export async function seedDemoSchool(
	db: Database,
	eddiSchool: schema.School,
): Promise<DemoSchoolData> {
	// Create school
	const [school] = await db
		.insert(schema.school)
		.values({ name: 'Demo School', countryCode: 'AU', stateCode: 'VIC' })
		.returning();

	const eddiBehaviourLevels = await db
		.select()
		.from(schema.behaviourLevel)
		.where(eq(schema.behaviourLevel.schoolId, eddiSchool.id));

	for (const eddiLevel of eddiBehaviourLevels) {
		const [demoBehaviourLevel] = await db
			.insert(schema.behaviourLevel)
			.values({
				schoolId: school.id,
				level: eddiLevel.level,
				name: eddiLevel.name,
			})
			.returning();

		const eddiBehaviours = await db
			.select()
			.from(schema.behaviour)
			.where(eq(schema.behaviour.levelId, eddiLevel.id));

		for (const eddiBehaviour of eddiBehaviours) {
			await db
				.insert(schema.behaviour)
				.values({
					schoolId: school.id,
					levelId: demoBehaviourLevel.id,
					name: eddiBehaviour.name,
					description: eddiBehaviour.description,
				});
		}
	}

	console.log('Copied behaviour levels and behaviours from eddi school');

	// Create campus
	const [campus] = await db
		.insert(schema.schoolCampus)
		.values({
			schoolId: school.id,
			name: 'Main Campus',
			address: '123 Education Street, Melbourne VIC 3000',
			description: 'Primary campus of Demo School',
		})
		.returning();

	console.log(`  Created campus: ${campus.name}`);

	// Create buildings
	const [middleSchool, seniorSchool, gymnasium] = await db
		.insert(schema.schoolBuilding)
		.values([
			{
				schoolCampusId: campus.id,
				name: 'Middle School Building',
				description: 'All year 7-9 classrooms.',
			},
			{
				schoolCampusId: campus.id,
				name: 'Senior School Building',
				description: 'All year 10-12 classrooms.',
			},
			{
				schoolCampusId: campus.id,
				name: 'Gymnasium',
				description: 'Gymnasium and sporting facilities.',
			},
		])
		.returning();

	console.log('  Created buildings: Middle School, Senior School, Gymnasium');

	// Create spaces
	const spaces = await db
		.insert(schema.schoolSpace)
		.values([
			// Middle School
			{
				schoolBuildingId: middleSchool.id,
				name: 'Science Lab ML.01',
				type: schoolSpaceTypeEnum.laboratory,
				capacity: 30,
			},
			{
				schoolBuildingId: middleSchool.id,
				name: 'Science Lab ML.02',
				type: schoolSpaceTypeEnum.laboratory,
				capacity: 30,
			},
			{
				schoolBuildingId: middleSchool.id,
				name: 'Classroom MC.01',
				type: schoolSpaceTypeEnum.classroom,
				capacity: 30,
			},
			{
				schoolBuildingId: middleSchool.id,
				name: 'Classroom MC.02',
				type: schoolSpaceTypeEnum.classroom,
				capacity: 30,
			},
			{
				schoolBuildingId: middleSchool.id,
				name: 'Classroom MC.03',
				type: schoolSpaceTypeEnum.classroom,
				capacity: 30,
			},
			{
				schoolBuildingId: middleSchool.id,
				name: 'Classroom MC.11',
				type: schoolSpaceTypeEnum.classroom,
				capacity: 30,
			},
			{
				schoolBuildingId: middleSchool.id,
				name: 'Classroom MC.12',
				type: schoolSpaceTypeEnum.classroom,
				capacity: 30,
			},
			{
				schoolBuildingId: middleSchool.id,
				name: 'Classroom MC.13',
				type: schoolSpaceTypeEnum.classroom,
				capacity: 30,
			},
			// Senior School
			{
				schoolBuildingId: seniorSchool.id,
				name: 'Science Lab SL.01',
				type: schoolSpaceTypeEnum.laboratory,
				capacity: 30,
			},
			{
				schoolBuildingId: seniorSchool.id,
				name: 'Science Lab SL.02',
				type: schoolSpaceTypeEnum.laboratory,
				capacity: 30,
			},
			{
				schoolBuildingId: seniorSchool.id,
				name: 'Classroom SC.01',
				type: schoolSpaceTypeEnum.classroom,
				capacity: 30,
			},
			{
				schoolBuildingId: seniorSchool.id,
				name: 'Classroom SC.02',
				type: schoolSpaceTypeEnum.classroom,
				capacity: 30,
			},
			{
				schoolBuildingId: seniorSchool.id,
				name: 'Classroom SC.03',
				type: schoolSpaceTypeEnum.classroom,
				capacity: 30,
			},
			{
				schoolBuildingId: seniorSchool.id,
				name: 'Classroom SC.11',
				type: schoolSpaceTypeEnum.classroom,
				capacity: 30,
			},
			{
				schoolBuildingId: seniorSchool.id,
				name: 'Classroom SC.12',
				type: schoolSpaceTypeEnum.classroom,
				capacity: 30,
			},
			{
				schoolBuildingId: seniorSchool.id,
				name: 'Classroom SC.13',
				type: schoolSpaceTypeEnum.classroom,
				capacity: 30,
			},
			// Gymnasium
			{
				schoolBuildingId: gymnasium.id,
				name: 'Courts',
				type: schoolSpaceTypeEnum.gymnasium,
				capacity: 120,
			},
			{
				schoolBuildingId: gymnasium.id,
				name: 'Swimming Pool',
				type: schoolSpaceTypeEnum.pool,
				capacity: 40,
			},
		])
		.returning();

	console.log(`  Created ${spaces.length} school spaces`);

	// Create year levels (Foundation to Year 12)
	const yearLevels = await seedYearLevels(db, school.id);
	console.log(`  Created ${Object.keys(yearLevels).length} year levels`);

	// Create semesters and terms
	const semestersAndTerms = await seedSchoolSemestersAndTerms(db, school.id);

	return {
		school,
		semestersAndTerms,
		campus,
		buildings: { middleSchool, seniorSchool, gymnasium },
		spaces,
		yearLevels,
	};
}

async function seedYearLevels(db: Database, schoolId: number) {
	const yearLevels = await db
		.insert(schema.schoolYearLevel)
		.values([
			{ schoolId, code: yearLevelEnum.none },
			{ schoolId, code: yearLevelEnum.year7 },
			{ schoolId, code: yearLevelEnum.year8 },
			{ schoolId, code: yearLevelEnum.year9 },
			{ schoolId, code: yearLevelEnum.year10 },
		])
		.returning();

	return {
		none: yearLevels[0],
		year7: yearLevels[1],
		year8: yearLevels[2],
		year9: yearLevels[3],
		year10: yearLevels[4],
	};
}

async function seedSchoolSemestersAndTerms(db: Database, schoolId: number) {
	const year = new Date().getFullYear();

	const [semester1, semester2] = await db
		.insert(schema.schoolSemester)
		.values([
			{ schoolId, number: 1, year },
			{ schoolId, number: 2, year },
		])
		.returning();

	const terms = await db
		.insert(schema.schoolTerm)
		.values([
			{
				number: 1,
				start: new Date(year, 1, 1),
				end: new Date(year, 3, 30),
				schoolSemesterId: semester1.id,
			},
			{
				number: 2,
				start: new Date(year, 4, 1),
				end: new Date(year, 6, 30),
				schoolSemesterId: semester1.id,
			},
			{
				number: 3,
				start: new Date(year, 7, 1),
				end: new Date(year, 9, 30),
				schoolSemesterId: semester2.id,
			},
			{
				number: 4,
				start: new Date(year, 10, 1),
				end: new Date(year, 11, 31),
				schoolSemesterId: semester2.id,
			},
		])
		.returning();

	return { semesters: [semester1, semester2], terms };
}

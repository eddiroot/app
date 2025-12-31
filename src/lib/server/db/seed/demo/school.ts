import { schoolSpaceTypeEnum, yearLevelEnum } from '$lib/enums';
import { getTermsByYear } from '$lib/server/vic-school-terms';
import * as schema from '../../schema';
import type { Database } from '../types';
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

	// Create behaviour quick actions
	await db.insert(schema.behaviourQuickAction).values([
		{
			schoolId: school.id,
			name: 'Out of uniform',
			description: 'Student not wearing correct school uniform'
		},
		{
			schoolId: school.id,
			name: 'Distracting other students',
			description: 'Student disrupting the learning of others'
		},
		{
			schoolId: school.id,
			name: 'Late to class',
			description: 'Student arrived late without valid reason'
		},
		{
			schoolId: school.id,
			name: 'Excellent participation',
			description: 'Student showed outstanding engagement'
		},
		{
			schoolId: school.id,
			name: 'Helping others',
			description: 'Student assisted classmates with their learning'
		},
		{
			schoolId: school.id,
			name: 'Incomplete homework',
			description: 'Student did not complete assigned homework'
		},
		{
			schoolId: school.id,
			name: 'Forgot materials',
			description: 'Student came without required materials'
		},
		{
			schoolId: school.id,
			name: 'Outstanding effort',
			description: 'Student demonstrated exceptional effort'
		}
	]);

	console.log('  Created behaviour quick actions');

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
	console.log(`  Created ${yearLevels.length} year levels`);

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

async function seedYearLevels(db: Database, schoolId: number) {
	const yearLevelValues = [
		yearLevelEnum.foundation,
		yearLevelEnum.year1,
		yearLevelEnum.year2,
		yearLevelEnum.year3,
		yearLevelEnum.year4,
		yearLevelEnum.year5,
		yearLevelEnum.year6,
		yearLevelEnum.year7,
		yearLevelEnum.year8,
		yearLevelEnum.year9,
		yearLevelEnum.year10,
		yearLevelEnum.year11,
		yearLevelEnum.year12
	];

	const yearLevels = await db
		.insert(schema.yearLevel)
		.values(
			yearLevelValues.map((level) => ({
				schoolId,
				yearLevel: level
			}))
		)
		.returning();

	return yearLevels;
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

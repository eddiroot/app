import {
	relationshipTypeEnum,
	userGenderEnum,
	userHonorificEnum,
	userTypeEnum
} from '$lib/enums';
import * as schema from '../../schema';
import type { Database } from '../types';
import { getDefaultPasswordHash } from '../utils';
import { DEMO_YEAR_LEVELS, STUDENTS_PER_YEAR_LEVEL, TOTAL_TEACHERS } from './consts';
import type { DemoSchoolData, DemoUserData } from './types';


// First names for generating realistic student names (with gender)
const FIRST_NAMES: Array<{ name: string; gender: userGenderEnum }> = [
	// Male names
	{ name: 'Oliver', gender: userGenderEnum.male },
	{ name: 'Noah', gender: userGenderEnum.male },
	{ name: 'William', gender: userGenderEnum.male },
	{ name: 'James', gender: userGenderEnum.male },
	{ name: 'Lucas', gender: userGenderEnum.male },
	{ name: 'Henry', gender: userGenderEnum.male },
	{ name: 'Alexander', gender: userGenderEnum.male },
	{ name: 'Sebastian', gender: userGenderEnum.male },
	{ name: 'Jack', gender: userGenderEnum.male },
	{ name: 'Aiden', gender: userGenderEnum.male },
	{ name: 'Owen', gender: userGenderEnum.male },
	{ name: 'Samuel', gender: userGenderEnum.male },
	{ name: 'Ryan', gender: userGenderEnum.male },
	{ name: 'Leo', gender: userGenderEnum.male },
	{ name: 'Nathan', gender: userGenderEnum.male },
	{ name: 'Caleb', gender: userGenderEnum.male },
	{ name: 'Isaac', gender: userGenderEnum.male },
	{ name: 'Luke', gender: userGenderEnum.male },
	{ name: 'Daniel', gender: userGenderEnum.male },
	{ name: 'Levi', gender: userGenderEnum.male },
	{ name: 'Mason', gender: userGenderEnum.male },
	{ name: 'Ethan', gender: userGenderEnum.male },
	{ name: 'Jacob', gender: userGenderEnum.male },
	{ name: 'Logan', gender: userGenderEnum.male },
	{ name: 'Michael', gender: userGenderEnum.male },
	{ name: 'Benjamin', gender: userGenderEnum.male },
	{ name: 'Elijah', gender: userGenderEnum.male },
	{ name: 'Jackson', gender: userGenderEnum.male },
	{ name: 'Mateo', gender: userGenderEnum.male },
	{ name: 'Theodore', gender: userGenderEnum.male },
	{ name: 'Oscar', gender: userGenderEnum.male },
	{ name: 'Max', gender: userGenderEnum.male },
	{ name: 'Felix', gender: userGenderEnum.male },
	{ name: 'Thomas', gender: userGenderEnum.male },
	{ name: 'Finn', gender: userGenderEnum.male },
	{ name: 'Archie', gender: userGenderEnum.male },
	{ name: 'Jasper', gender: userGenderEnum.male },
	{ name: 'Hugo', gender: userGenderEnum.male },
	{ name: 'Harrison', gender: userGenderEnum.male },
	{ name: 'Patrick', gender: userGenderEnum.male },
	// Female names
	{ name: 'Charlotte', gender: userGenderEnum.female },
	{ name: 'Amelia', gender: userGenderEnum.female },
	{ name: 'Olivia', gender: userGenderEnum.female },
	{ name: 'Ava', gender: userGenderEnum.female },
	{ name: 'Sophia', gender: userGenderEnum.female },
	{ name: 'Mia', gender: userGenderEnum.female },
	{ name: 'Isabella', gender: userGenderEnum.female },
	{ name: 'Luna', gender: userGenderEnum.female },
	{ name: 'Harper', gender: userGenderEnum.female },
	{ name: 'Evelyn', gender: userGenderEnum.female },
	{ name: 'Aria', gender: userGenderEnum.female },
	{ name: 'Chloe', gender: userGenderEnum.female },
	{ name: 'Penelope', gender: userGenderEnum.female },
	{ name: 'Layla', gender: userGenderEnum.female },
	{ name: 'Riley', gender: userGenderEnum.female },
	{ name: 'Zoey', gender: userGenderEnum.female },
	{ name: 'Nora', gender: userGenderEnum.female },
	{ name: 'Lily', gender: userGenderEnum.female },
	{ name: 'Eleanor', gender: userGenderEnum.female },
	{ name: 'Hannah', gender: userGenderEnum.female },
	{ name: 'Lillian', gender: userGenderEnum.female },
	{ name: 'Addison', gender: userGenderEnum.female },
	{ name: 'Aubrey', gender: userGenderEnum.female },
	{ name: 'Ellie', gender: userGenderEnum.female },
	{ name: 'Stella', gender: userGenderEnum.female },
	{ name: 'Natalie', gender: userGenderEnum.female },
	{ name: 'Zoe', gender: userGenderEnum.female },
	{ name: 'Leah', gender: userGenderEnum.female },
	{ name: 'Hazel', gender: userGenderEnum.female },
	{ name: 'Violet', gender: userGenderEnum.female },
	{ name: 'Aurora', gender: userGenderEnum.female },
	{ name: 'Savannah', gender: userGenderEnum.female },
	{ name: 'Audrey', gender: userGenderEnum.female },
	{ name: 'Brooklyn', gender: userGenderEnum.female },
	{ name: 'Bella', gender: userGenderEnum.female },
	{ name: 'Claire', gender: userGenderEnum.female },
	{ name: 'Skylar', gender: userGenderEnum.female },
	{ name: 'Lucy', gender: userGenderEnum.female },
	{ name: 'Paisley', gender: userGenderEnum.female },
	{ name: 'Everly', gender: userGenderEnum.female }
];

const LAST_NAMES = [
	'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
	'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
	'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
	'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
	'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'
];

// Teacher first names (with gender)
const TEACHER_FIRST_NAMES: Array<{ name: string; gender: userGenderEnum }> = [
	{ name: 'Sarah', gender: userGenderEnum.female },
	{ name: 'Michael', gender: userGenderEnum.male },
	{ name: 'Jennifer', gender: userGenderEnum.female },
	{ name: 'David', gender: userGenderEnum.male },
	{ name: 'Emily', gender: userGenderEnum.female },
	{ name: 'Robert', gender: userGenderEnum.male },
	{ name: 'Jessica', gender: userGenderEnum.female },
	{ name: 'William', gender: userGenderEnum.male },
	{ name: 'Ashley', gender: userGenderEnum.female },
	{ name: 'James', gender: userGenderEnum.male },
	{ name: 'Amanda', gender: userGenderEnum.female },
	{ name: 'John', gender: userGenderEnum.male },
	{ name: 'Stephanie', gender: userGenderEnum.female },
	{ name: 'Christopher', gender: userGenderEnum.male },
	{ name: 'Nicole', gender: userGenderEnum.female },
	{ name: 'Matthew', gender: userGenderEnum.male },
	{ name: 'Elizabeth', gender: userGenderEnum.female },
	{ name: 'Andrew', gender: userGenderEnum.male },
	{ name: 'Megan', gender: userGenderEnum.female },
	{ name: 'Daniel', gender: userGenderEnum.male },
	{ name: 'Lauren', gender: userGenderEnum.female },
	{ name: 'Joshua', gender: userGenderEnum.male },
	{ name: 'Rachel', gender: userGenderEnum.female },
	{ name: 'Anthony', gender: userGenderEnum.male },
	{ name: 'Samantha', gender: userGenderEnum.female },
	{ name: 'Mark', gender: userGenderEnum.male },
	{ name: 'Katherine', gender: userGenderEnum.female },
	{ name: 'Steven', gender: userGenderEnum.male },
	{ name: 'Brittany', gender: userGenderEnum.female },
	{ name: 'Kevin', gender: userGenderEnum.male }
];

// Generate a random date within a year
function randomDateInYear(year: number): Date {
	const month = Math.floor(Math.random() * 12);
	const day = Math.floor(Math.random() * 28) + 1;
	return new Date(year, month, day);
}

// Seeded random number generator for consistent results
function seededRandom(seed: number): () => number {
	return function () {
		seed = (seed * 1103515245 + 12345) & 0x7fffffff;
		return seed / 0x7fffffff;
	};
}

export async function seedDemoUsers(
	db: Database,
	schoolData: DemoSchoolData
): Promise<DemoUserData> {
	const { school, campus, yearLevels } = schoolData;
	const passwordHash = await getDefaultPasswordHash();

	// Create School Admin
	const [admin] = await db
		.insert(schema.user)
		.values({
			email: 'admin@demo.edu.au',
			passwordHash,
			schoolId: school.id,
			type: userTypeEnum.schoolAdmin,
			yearLevelId: yearLevels.none,
			firstName: 'School',
			lastName: 'Admin',
			emailVerified: true
		})
		.returning();

	// Principal
	const [principal] = await db
		.insert(schema.user)
		.values({
			email: 'principal@demo.edu.au',
			passwordHash,
			schoolId: school.id,
			type: userTypeEnum.principal,
			yearLevelId: yearLevels.none,
			firstName: 'School',
			lastName: 'Principal',
			emailVerified: true
		})
		.returning();

	console.log(`  Created admin: ${admin.email}`);

	// Generate a year level coordinator for years 7-10 
	const coordinators = [];
	for (const yearLevel of DEMO_YEAR_LEVELS) {
		const [coordinator] = await db
			.insert(schema.user)
			.values({
				email: `${yearLevel}coordinator@demo.edu.au`,
				passwordHash,
				schoolId: school.id,
				type: userTypeEnum.teacher,
				yearLevelId: yearLevels[yearLevel as keyof typeof yearLevels],
				firstName: yearLevel,
				lastName: 'Coordinator',
				emailVerified: true
			})
			.returning();
		coordinators.push(coordinator);
	}

	// Generate students: 60 per year level, Year 7 - Year 10
	const random = seededRandom(12345);
	const studentValues: Array<{
		email: string;
		passwordHash: string;
		schoolId: number;
		type: userTypeEnum;
		gender: userGenderEnum;
		yearLevelId: number;
		firstName: string;
		lastName: string;
		dateOfBirth: Date;
		emailVerified: boolean;
	}> = [];

	let studentIndex = 1;
	for (const yearLevel of DEMO_YEAR_LEVELS) {
		const birthYear = new Date().getFullYear() - (parseInt(yearLevel.replace('year', '')) + 5);
		for (let i = 0; i < STUDENTS_PER_YEAR_LEVEL; i++) {
			const { name: firstName, gender } = FIRST_NAMES[Math.floor(random() * FIRST_NAMES.length)];
			const lastName = LAST_NAMES[Math.floor(random() * LAST_NAMES.length)];
			const paddedIndex = String(studentIndex).padStart(4, '0');

			studentValues.push({
				email: `student${paddedIndex}@demo.edu.au`,
				passwordHash,
				schoolId: school.id,
				type: userTypeEnum.student,
				gender,
				yearLevelId: yearLevels[yearLevel as keyof typeof yearLevels],
				firstName,
				lastName,
				dateOfBirth: randomDateInYear(birthYear),
				emailVerified: true
			});
			studentIndex++;
		}
	}

	const students = await db.insert(schema.user).values(studentValues).returning();
	console.log(`  Created ${students.length} students (${STUDENTS_PER_YEAR_LEVEL} per year level, ${DEMO_YEAR_LEVELS.length} year levels)`);

	// Create Parents (2 parents per student)
	const parentValues: Array<{
		email: string;
		passwordHash: string;
		schoolId: number;
		type: userTypeEnum;
		gender: userGenderEnum;
		honorific: userHonorificEnum;
		yearLevelId: number;
		firstName: string;
		lastName: string;
		dateOfBirth: Date;
		emailVerified: boolean;
	}> = [];

	// Filter names by gender for parents
	const femaleNames = FIRST_NAMES.filter((n) => n.gender === userGenderEnum.female);
	const maleNames = FIRST_NAMES.filter((n) => n.gender === userGenderEnum.male);

	for (let i = 0; i < students.length; i++) {
		const student = students[i];
		const paddedIndex = String(i + 1).padStart(4, '0');

		// Mother
		parentValues.push({
			email: `mother${paddedIndex}@demo.edu.au`,
			passwordHash,
			schoolId: school.id,
			type: userTypeEnum.guardian,
			gender: userGenderEnum.female,
			honorific: random() > 0.5 ? userHonorificEnum.mrs : userHonorificEnum.ms,
			yearLevelId: yearLevels.none,
			firstName: femaleNames[Math.floor(random() * femaleNames.length)].name,
			lastName: student.lastName,
			dateOfBirth: randomDateInYear(1975 + Math.floor(random() * 15)),
			emailVerified: true
		});

		// Father
		parentValues.push({
			email: `father${paddedIndex}@demo.edu.au`,
			passwordHash,
			schoolId: school.id,
			type: userTypeEnum.guardian,
			gender: userGenderEnum.male,
			honorific: userHonorificEnum.mr,
			yearLevelId: yearLevels.none,
			firstName: maleNames[Math.floor(random() * maleNames.length)].name,
			lastName: student.lastName,
			dateOfBirth: randomDateInYear(1973 + Math.floor(random() * 15)),
			emailVerified: true
		});
	}

	const parents = await db.insert(schema.user).values(parentValues).returning();
	console.log(`  Created ${parents.length} parents`);

	// Generate 30 Teachers
	const teacherValues: Array<{
		firstName: string;
		lastName: string;
		email: string;
		passwordHash: string;
		schoolId: number;
		type: userTypeEnum;
		gender: userGenderEnum;
		honorific: userHonorificEnum;
		yearLevelId: number;
		dateOfBirth: Date;
		emailVerified: boolean;
	}> = [];

	for (let i = 0; i < TOTAL_TEACHERS; i++) {
		const { name: firstName, gender } = TEACHER_FIRST_NAMES[i % TEACHER_FIRST_NAMES.length];
		const lastName = LAST_NAMES[Math.floor(random() * LAST_NAMES.length)];
		const honorific =
			gender === userGenderEnum.male
				? userHonorificEnum.mr
				: random() > 0.7
					? userHonorificEnum.dr
					: random() > 0.5
						? userHonorificEnum.mrs
						: userHonorificEnum.ms;
		const paddedIndex = String(i + 1).padStart(2, '0');

		teacherValues.push({
			firstName,
			lastName,
			email: `teacher${paddedIndex}@demo.edu.au`,
			passwordHash,
			schoolId: school.id,
			type: userTypeEnum.teacher,
			gender,
			honorific,
			yearLevelId: yearLevels.none,
			dateOfBirth: randomDateInYear(1965 + Math.floor(random() * 30)),
			emailVerified: true
		});
	}

	const teachers = await db.insert(schema.user).values(teacherValues).returning();
	console.log(`  Created ${teachers.length} teachers`);

	// Assign all users to campus
	const allUserIds = [
		admin.id,
		principal.id,
		...coordinators.map((c) => c.id),
		...students.map((s) => s.id),
		...parents.map((p) => p.id),
		...teachers.map((t) => t.id)
	];

	// Insert in batches to avoid hitting database limits
	const BATCH_SIZE = 500;
	for (let i = 0; i < allUserIds.length; i += BATCH_SIZE) {
		const batch = allUserIds.slice(i, i + BATCH_SIZE);
		await db.insert(schema.userCampus).values(
			batch.map((userId) => ({
				userId,
				campusId: campus.id
			}))
		);
	}

	console.log(`  Assigned ${allUserIds.length} users to campus`);

	// Create parent-child relationships
	// Each student gets 2 parents (mother at even index, father at odd index)
	const relationshipValues: Array<{
		userId: string;
		relatedUserId: string;
		relationshipType: relationshipTypeEnum;
	}> = [];

	for (let i = 0; i < students.length; i++) {
		const student = students[i];
		const motherIndex = i * 2;
		const fatherIndex = i * 2 + 1;

		relationshipValues.push({
			userId: student.id,
			relatedUserId: parents[motherIndex].id,
			relationshipType: relationshipTypeEnum.mother
		});
		relationshipValues.push({
			userId: student.id,
			relatedUserId: parents[fatherIndex].id,
			relationshipType: relationshipTypeEnum.father
		});
	}

	// Insert relationships in batches
	for (let i = 0; i < relationshipValues.length; i += BATCH_SIZE) {
		const batch = relationshipValues.slice(i, i + BATCH_SIZE);
		await db.insert(schema.userRelationship).values(batch);
	}

	console.log(`  Created ${relationshipValues.length} parent-child relationships`);

	return {
		admin,
		principal,
		coordinators,
		teachers,
		students,
		parents
	};
}

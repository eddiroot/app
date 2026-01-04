import {
	relationshipTypeEnum,
	userGenderEnum,
	userHonorificEnum,
	userTypeEnum,
	yearLevelEnum
} from '$lib/enums';
import * as schema from '../../schema';
import type { Database } from '../types';
import { getDefaultPasswordHash } from '../utils';
import type { DemoSchoolData, DemoUserData } from './types';

export async function seedDemoUsers(
	db: Database,
	schoolData: DemoSchoolData
): Promise<DemoUserData> {
	const { school, campus } = schoolData;
	const passwordHash = await getDefaultPasswordHash();

	// Create School Admin
	const [admin] = await db
		.insert(schema.user)
		.values({
			email: 'admin@demo.edu.au',
			passwordHash,
			schoolId: school.id,
			type: userTypeEnum.schoolAdmin,
			yearLevel: yearLevelEnum.none,
			firstName: 'School',
			lastName: 'Admin',
			emailVerified: true
		})
		.returning();

	console.log(`  Created admin: ${admin.email}`);

	// Create Students
	const students = await db
		.insert(schema.user)
		.values([
			{
				email: 'student001@demo.edu.au',
				passwordHash,
				schoolId: school.id,
				type: userTypeEnum.student,
				gender: userGenderEnum.female,
				yearLevel: yearLevelEnum.year9,
				firstName: 'Student',
				lastName: 'One',
				dateOfBirth: new Date('2009-03-15'),
				emailVerified: true
			},
			{
				email: 'student002@demo.edu.au',
				passwordHash,
				schoolId: school.id,
				type: userTypeEnum.student,
				gender: userGenderEnum.male,
				yearLevel: yearLevelEnum.year9,
				firstName: 'Student',
				lastName: 'Two',
				dateOfBirth: new Date('2009-07-22'),
				emailVerified: true
			},
			{
				email: 'student003@demo.edu.au',
				passwordHash,
				schoolId: school.id,
				type: userTypeEnum.student,
				gender: userGenderEnum.male,
				yearLevel: yearLevelEnum.year9,
				firstName: 'Student',
				lastName: 'Three',
				dateOfBirth: new Date('2009-11-08'),
				emailVerified: true
			}
		])
		.returning();

	console.log(`  Created ${students.length} students`);

	// Create Parents
	const parents = await db
		.insert(schema.user)
		.values([
			{
				email: 'mother001@demo.edu.au',
				passwordHash,
				schoolId: school.id,
				type: userTypeEnum.guardian,
				gender: userGenderEnum.female,
				honorific: userHonorificEnum.mrs,
				yearLevel: yearLevelEnum.none,
				firstName: 'Mother',
				lastName: 'One',
				dateOfBirth: new Date('1985-05-12'),
				emailVerified: true
			},
			{
				email: 'father001@demo.edu.au',
				passwordHash,
				schoolId: school.id,
				type: userTypeEnum.guardian,
				gender: userGenderEnum.male,
				honorific: userHonorificEnum.mr,
				yearLevel: yearLevelEnum.none,
				firstName: 'Father',
				lastName: 'One',
				dateOfBirth: new Date('1983-09-08'),
				emailVerified: true
			},
			{
				email: 'mother002@demo.edu.au',
				passwordHash,
				schoolId: school.id,
				type: userTypeEnum.guardian,
				gender: userGenderEnum.female,
				honorific: userHonorificEnum.ms,
				yearLevel: yearLevelEnum.none,
				firstName: 'Mother',
				lastName: 'Two',
				dateOfBirth: new Date('1987-02-20'),
				emailVerified: true
			},
			{
				email: 'father002@demo.edu.au',
				passwordHash,
				schoolId: school.id,
				type: userTypeEnum.guardian,
				gender: userGenderEnum.male,
				honorific: userHonorificEnum.mr,
				yearLevel: yearLevelEnum.none,
				firstName: 'Father',
				lastName: 'Two',
				dateOfBirth: new Date('1984-11-15'),
				emailVerified: true
			},
			{
				email: 'mother003@demo.edu.au',
				passwordHash,
				schoolId: school.id,
				type: userTypeEnum.guardian,
				gender: userGenderEnum.female,
				honorific: userHonorificEnum.mrs,
				yearLevel: yearLevelEnum.none,
				firstName: 'Mother',
				lastName: 'Three',
				dateOfBirth: new Date('1986-08-03'),
				emailVerified: true
			},
			{
				email: 'father003@demo.edu.au',
				passwordHash,
				schoolId: school.id,
				type: userTypeEnum.guardian,
				gender: userGenderEnum.male,
				honorific: userHonorificEnum.mr,
				yearLevel: yearLevelEnum.none,
				firstName: 'Father',
				lastName: 'Three',
				dateOfBirth: new Date('1985-12-18'),
				emailVerified: true
			}
		])
		.returning();

	console.log(`  Created ${parents.length} parents`);

	// Create Teachers
	const teachers = await db
		.insert(schema.user)
		.values([
			{
				firstName: 'Math',
				lastName: 'Teacher',
				email: 'm.teacher@demo.edu.au',
				passwordHash,
				schoolId: school.id,
				type: userTypeEnum.teacher,
				gender: userGenderEnum.female,
				honorific: userHonorificEnum.ms,
				yearLevel: yearLevelEnum.none,
				dateOfBirth: new Date('1982-04-10'),
				emailVerified: true
			},
			{
				firstName: 'English',
				lastName: 'Teacher',
				email: 'e.teacher@demo.edu.au',
				passwordHash,
				schoolId: school.id,
				type: userTypeEnum.teacher,
				gender: userGenderEnum.male,
				honorific: userHonorificEnum.mr,
				yearLevel: yearLevelEnum.none,
				dateOfBirth: new Date('1978-11-23'),
				emailVerified: true
			},
			{
				firstName: 'Science',
				lastName: 'Teacher',
				email: 's.teacher@demo.edu.au',
				passwordHash,
				schoolId: school.id,
				type: userTypeEnum.teacher,
				gender: userGenderEnum.female,
				honorific: userHonorificEnum.dr,
				yearLevel: yearLevelEnum.none,
				dateOfBirth: new Date('1981-09-14'),
				emailVerified: true
			},
			{
				firstName: 'PE',
				lastName: 'Teacher',
				email: 'pe.teacher@demo.edu.au',
				passwordHash,
				schoolId: school.id,
				type: userTypeEnum.teacher,
				gender: userGenderEnum.male,
				honorific: userHonorificEnum.mr,
				yearLevel: yearLevelEnum.none,
				dateOfBirth: new Date('1985-02-28'),
				emailVerified: true
			},
			{
				firstName: 'History',
				lastName: 'Teacher',
				email: 'h.teacher@demo.edu.au',
				passwordHash,
				schoolId: school.id,
				type: userTypeEnum.teacher,
				gender: userGenderEnum.female,
				honorific: userHonorificEnum.mrs,
				yearLevel: yearLevelEnum.none,
				dateOfBirth: new Date('1979-07-05'),
				emailVerified: true
			},
			{
				firstName: 'Geography',
				lastName: 'Teacher',
				email: 'g.teacher@demo.edu.au',
				passwordHash,
				schoolId: school.id,
				type: userTypeEnum.teacher,
				gender: userGenderEnum.male,
				honorific: userHonorificEnum.mr,
				yearLevel: yearLevelEnum.none,
				dateOfBirth: new Date('1983-12-12'),
				emailVerified: true
			}
		])
		.returning();

	console.log(`  Created ${teachers.length} teachers`);

	// Assign all users to campus
	const allUserIds = [
		admin.id,
		...students.map((s) => s.id),
		...parents.map((p) => p.id),
		...teachers.map((t) => t.id)
	];

	await db.insert(schema.userCampus).values(
		allUserIds.map((userId) => ({
			userId,
			campusId: campus.id
		}))
	);

	console.log(`  Assigned ${allUserIds.length} users to campus`);

	// Create parent-child relationships
	// Students 0, 1, 2 each get 2 parents (mother and father)
	await db.insert(schema.userRelationship).values([
		{
			userId: students[0].id,
			relatedUserId: parents[0].id,
			relationshipType: relationshipTypeEnum.mother
		},
		{
			userId: students[0].id,
			relatedUserId: parents[1].id,
			relationshipType: relationshipTypeEnum.father
		},
		{
			userId: students[1].id,
			relatedUserId: parents[2].id,
			relationshipType: relationshipTypeEnum.mother
		},
		{
			userId: students[1].id,
			relatedUserId: parents[3].id,
			relationshipType: relationshipTypeEnum.father
		},
		{
			userId: students[2].id,
			relatedUserId: parents[4].id,
			relationshipType: relationshipTypeEnum.mother
		},
		{
			userId: students[2].id,
			relatedUserId: parents[5].id,
			relationshipType: relationshipTypeEnum.father
		}
	]);

	console.log('  Created parent-child relationships');

	return {
		admin,
		teachers,
		students,
		parents
	};
}

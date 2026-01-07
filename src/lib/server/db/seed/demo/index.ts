import type { SeedContext } from '../types';
import { logSection, logSubsection } from '../utils';
import { seedDemoEvents } from './events';
import { seedDemoNews } from './news';
import { seedDemoSchool } from './school';
import { seedDemoSubjects } from './subjects';
import { seedDemoTimetable } from './timetable';
import { seedDemoUsers } from './users';

export async function seedDemo(context: SeedContext): Promise<void> {
	logSection('Seeding Demo School Data');

	const { db } = context;

	// 1. Create school infrastructure
	logSubsection('Creating Demo School Infrastructure');
	const schoolData = await seedDemoSchool(db);

	// 2. Create users
	logSubsection('Creating Demo Users');
	const userData = await seedDemoUsers(db, schoolData);

	// 3. Create subjects and offerings (no curriculum assignment)
	logSubsection('Creating Demo Subjects');
	const subjectData = await seedDemoSubjects(db, schoolData, userData);

	// 4. Create timetable
	logSubsection('Creating Demo Timetable');
	await seedDemoTimetable(db, schoolData, subjectData, userData);

	// 5. Create news
	logSubsection('Creating Demo News');
	await seedDemoNews(db, schoolData, userData);

	// 6. Create events
	logSubsection('Creating Demo Events');
	await seedDemoEvents(db, schoolData, userData, subjectData);

	console.log('Completed Demo school seeding.');
}

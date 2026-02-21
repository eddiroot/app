import type { School } from '../../schema';
import type { SeedContext } from '../types';
import { seedDemoThreads } from './discussion';
import { seedDemoEvents } from './event';
import { seedDemoNews } from './news';
import { seedDemoSchool } from './school';
import { seedDemoSubjects } from './subject';
import { seedDemoTasks } from './task';
import { seedDemoTimetable } from './timetable';
import { seedDemoUsers } from './user';

export async function seedDemo(
	context: SeedContext,
	eddiSchool: School,
): Promise<void> {
	const { db } = context;
	const schoolData = await seedDemoSchool(db, eddiSchool);
	const userData = await seedDemoUsers(db, schoolData);
	const subjectData = await seedDemoSubjects(db, schoolData, userData);
	await seedDemoTimetable(db, schoolData);
	await seedDemoNews(db, schoolData, userData);
	await seedDemoEvents(db, schoolData, subjectData);
	await seedDemoThreads(db, schoolData, userData, subjectData);
	await seedDemoTasks(db, schoolData, userData, subjectData);
}

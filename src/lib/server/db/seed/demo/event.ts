import { eventTypeEnum } from '../../../../enums';
import * as schema from '../../schema';
import type { Database } from '../types';
import type { DemoSchoolData, DemoSubjectData } from './types';

// Helper to get a date relative to today
function getRelativeDate(
	daysFromNow: number,
	hour: number = 9,
	minute: number = 0,
): Date {
	const date = new Date();
	date.setDate(date.getDate() + daysFromNow);
	date.setHours(hour, minute, 0, 0);
	return date;
}

// Helper to get next occurrence of a weekday with time (0 = Sunday, 1 = Monday, etc.)
function getNextWeekday(
	weekday: number,
	weeksFromNow: number,
	hour: number,
	minute: number,
): Date {
	const today = new Date();
	const currentDay = today.getDay();
	let daysUntil = weekday - currentDay;
	if (daysUntil <= 0) daysUntil += 7;
	daysUntil += weeksFromNow * 7;
	return getRelativeDate(daysUntil, hour, minute);
}

export async function seedDemoEvents(
	db: Database,
	schoolData: DemoSchoolData,
	subjectData: DemoSubjectData,
): Promise<void> {
	const { school, campus } = schoolData;

	// ============================================================================
	// SCHOOL-WIDE EVENTS
	// ============================================================================
	await db
		.insert(schema.event)
		.values([
			{
				schoolId: school.id,
				type: eventTypeEnum.school,
				name: 'Whole School Assembly',
				start: getNextWeekday(1, 0, 9, 0), // Next Monday
				end: getNextWeekday(1, 0, 9, 45),
				requiresRSVP: false,
			},
			{
				schoolId: school.id,
				type: eventTypeEnum.school,
				name: 'Parent Teacher Interviews',
				start: getRelativeDate(21, 15, 30), // in 3 weeks
				end: getRelativeDate(21, 20, 0),
				requiresRSVP: true,
			},
			{
				schoolId: school.id,
				type: eventTypeEnum.school,
				name: 'School Open Day',
				start: getRelativeDate(35, 10, 0), // in 5 weeks
				end: getRelativeDate(35, 14, 0),
				requiresRSVP: false,
			},
		])
		.returning();

	// ============================================================================
	// CAMPUS EVENTS
	// ============================================================================
	await db
		.insert(schema.event)
		.values([
			{
				schoolCampusId: campus.id,
				type: eventTypeEnum.campus,
				name: 'Athletics Carnival',
				start: getNextWeekday(5, 2, 8, 30), // Friday in 2 weeks
				end: getNextWeekday(5, 2, 15, 30),
				requiresRSVP: false,
			},
			{
				schoolCampusId: campus.id,
				type: eventTypeEnum.campus,
				name: 'Swimming Carnival',
				start: getNextWeekday(5, 4, 8, 30),
				end: getNextWeekday(5, 4, 15, 0),
				requiresRSVP: false,
			},
			{
				schoolCampusId: campus.id,
				type: eventTypeEnum.campus,
				name: 'Interschool Cricket',
				start: getNextWeekday(3, 0, 12, 45), // Next Wednesday
				end: getNextWeekday(3, 0, 13, 30),
				requiresRSVP: false,
			},
			{
				schoolCampusId: campus.id,
				type: eventTypeEnum.campus,
				name: 'Friday Sport - Regional Competition',
				start: getNextWeekday(5, 1, 15, 30),
				end: getNextWeekday(5, 1, 17, 30),
				requiresRSVP: true,
			},
			{
				schoolCampusId: campus.id,
				type: eventTypeEnum.campus,
				name: 'Family BBQ Evening',
				start: getRelativeDate(14, 17, 0),
				end: getRelativeDate(14, 19, 30),
				requiresRSVP: true,
			},
		])
		.returning();

	// ============================================================================
	// SUBJECT OFFERING EVENTS
	// ============================================================================
	await db
		.insert(schema.event)
		.values([
			{
				subjectOfferingId: subjectData.offerings[0].id,
				type: eventTypeEnum.subject,
				name: 'Excursion',
				start: getRelativeDate(18, 9, 0),
				end: getRelativeDate(18, 15, 0),
				requiresRSVP: true,
			},
		])
		.returning();

	// ============================================================================
	// CLASS-LEVEL EVENTS
	// ============================================================================
	await db
		.insert(schema.event)
		.values([
			{
				subjectOfferingClassId: subjectData.classes[0].id,
				type: eventTypeEnum.class,
				name: 'Mid-Term Assessment',
				start: getRelativeDate(14, 10, 0),
				end: getRelativeDate(14, 11, 0),
				requiresRSVP: false,
			},
			{
				subjectOfferingClassId: subjectData.classes[0].id,
				type: eventTypeEnum.class,
				name: 'Group Presentation Day',
				start: getRelativeDate(20, 9, 0),
				end: getRelativeDate(20, 12, 0),
				requiresRSVP: false,
			},
		])
		.returning();
}

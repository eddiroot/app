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
	const schoolEvents = await db
		.insert(schema.eventSchool)
		.values([
			// Weekly Assembly - every Monday at 9am
			{
				schoolId: school.id,
				name: 'Whole School Assembly',
				start: getNextWeekday(1, 0, 9, 0), // Next Monday
				end: getNextWeekday(1, 0, 9, 45),
				requiresRSVP: false,
			},
			{
				schoolId: school.id,
				name: 'Whole School Assembly',
				start: getNextWeekday(1, 1, 9, 0), // Monday in 1 week
				end: getNextWeekday(1, 1, 9, 45),
				requiresRSVP: false,
			},
			{
				schoolId: school.id,
				name: 'Whole School Assembly',
				start: getNextWeekday(1, 2, 9, 0), // Monday in 2 weeks
				end: getNextWeekday(1, 2, 9, 45),
				requiresRSVP: false,
			},
			// Parent Teacher Interviews - in 3 weeks
			{
				schoolId: school.id,
				name: 'Parent Teacher Interviews - Day 1',
				start: getRelativeDate(21, 15, 30),
				end: getRelativeDate(21, 20, 0),
				requiresRSVP: true,
			},
			{
				schoolId: school.id,
				name: 'Parent Teacher Interviews - Day 2',
				start: getRelativeDate(22, 15, 30),
				end: getRelativeDate(22, 20, 0),
				requiresRSVP: true,
			},
			// Awards Night - end of term (6 weeks away)
			{
				schoolId: school.id,
				name: 'Annual Awards Night',
				start: getRelativeDate(42, 18, 0),
				end: getRelativeDate(42, 21, 0),
				requiresRSVP: true,
			},
			// School Open Day - in 5 weeks
			{
				schoolId: school.id,
				name: 'School Open Day',
				start: getRelativeDate(35, 10, 0),
				end: getRelativeDate(35, 14, 0),
				requiresRSVP: false,
			},
			// School Photos - next week
			{
				schoolId: school.id,
				name: 'School Photo Day',
				start: getRelativeDate(8, 8, 30),
				end: getRelativeDate(8, 15, 30),
				requiresRSVP: false,
			},
		])
		.returning();

	console.log(`  Created ${schoolEvents.length} school-wide events`);

	// ============================================================================
	// CAMPUS EVENTS
	// ============================================================================
	const campusEvents = await db
		.insert(schema.eventCampus)
		.values([
			// Athletics Carnival - in 2 weeks (Friday)
			{
				schoolCampusId: campus.id,
				name: 'Athletics Carnival',
				start: getNextWeekday(5, 2, 8, 30), // Friday in 2 weeks
				end: getNextWeekday(5, 2, 15, 30),
				requiresRSVP: false,
			},
			// Swimming Carnival - in 4 weeks (Friday)
			{
				schoolCampusId: campus.id,
				name: 'Swimming Carnival',
				start: getNextWeekday(5, 4, 8, 30),
				end: getNextWeekday(5, 4, 15, 0),
				requiresRSVP: false,
			},
			// Cross Country - in 6 weeks (Friday)
			{
				schoolCampusId: campus.id,
				name: 'Cross Country Carnival',
				start: getNextWeekday(5, 6, 9, 0),
				end: getNextWeekday(5, 6, 14, 0),
				requiresRSVP: false,
			},
			// Lunchtime Sport Matches - recurring on Wednesdays
			{
				schoolCampusId: campus.id,
				name: 'Interschool Basketball - Lunchtime',
				start: getNextWeekday(3, 0, 12, 45), // Next Wednesday
				end: getNextWeekday(3, 0, 13, 30),
				requiresRSVP: false,
			},
			{
				schoolCampusId: campus.id,
				name: 'Interschool Volleyball - Lunchtime',
				start: getNextWeekday(3, 1, 12, 45), // Wednesday in 1 week
				end: getNextWeekday(3, 1, 13, 30),
				requiresRSVP: false,
			},
			{
				schoolCampusId: campus.id,
				name: 'Interschool Soccer - Lunchtime',
				start: getNextWeekday(3, 2, 12, 45), // Wednesday in 2 weeks
				end: getNextWeekday(3, 2, 13, 30),
				requiresRSVP: false,
			},
			{
				schoolCampusId: campus.id,
				name: 'Interschool Netball - Lunchtime',
				start: getNextWeekday(3, 3, 12, 45), // Wednesday in 3 weeks
				end: getNextWeekday(3, 3, 13, 30),
				requiresRSVP: false,
			},
			// Friday Sport - after school
			{
				schoolCampusId: campus.id,
				name: 'Friday Sport - Regional Competition',
				start: getNextWeekday(5, 1, 15, 30),
				end: getNextWeekday(5, 1, 17, 30),
				requiresRSVP: true,
			},
			{
				schoolCampusId: campus.id,
				name: 'Friday Sport - Home Game',
				start: getNextWeekday(5, 3, 15, 30),
				end: getNextWeekday(5, 3, 17, 30),
				requiresRSVP: true,
			},
			// Year Level Assemblies
			{
				schoolCampusId: campus.id,
				name: 'Year 7 Assembly',
				start: getNextWeekday(2, 1, 9, 0), // Tuesday in 1 week
				end: getNextWeekday(2, 1, 9, 30),
				requiresRSVP: false,
			},
			{
				schoolCampusId: campus.id,
				name: 'Year 8 Assembly',
				start: getNextWeekday(2, 1, 9, 30), // Tuesday in 1 week
				end: getNextWeekday(2, 1, 10, 0),
				requiresRSVP: false,
			},
			{
				schoolCampusId: campus.id,
				name: 'Year 9 Assembly',
				start: getNextWeekday(2, 1, 10, 30), // Tuesday in 1 week
				end: getNextWeekday(2, 1, 11, 0),
				requiresRSVP: false,
			},
			{
				schoolCampusId: campus.id,
				name: 'Year 10 Assembly',
				start: getNextWeekday(2, 1, 11, 0), // Tuesday in 1 week
				end: getNextWeekday(2, 1, 11, 30),
				requiresRSVP: false,
			},
			// Campus BBQ / Social Events
			{
				schoolCampusId: campus.id,
				name: 'Welcome BBQ - All Families',
				start: getRelativeDate(14, 17, 0),
				end: getRelativeDate(14, 19, 30),
				requiresRSVP: true,
			},
			// Book Fair
			{
				schoolCampusId: campus.id,
				name: 'Book Fair Week - Day 1',
				start: getRelativeDate(28, 8, 30),
				end: getRelativeDate(28, 15, 30),
				requiresRSVP: false,
			},
			{
				schoolCampusId: campus.id,
				name: 'Book Fair Week - Day 2',
				start: getRelativeDate(29, 8, 30),
				end: getRelativeDate(29, 15, 30),
				requiresRSVP: false,
			},
			{
				schoolCampusId: campus.id,
				name: 'Book Fair Week - Day 3',
				start: getRelativeDate(30, 8, 30),
				end: getRelativeDate(30, 15, 30),
				requiresRSVP: false,
			},
		])
		.returning();

	console.log(`  Created ${campusEvents.length} campus events`);

	// ============================================================================
	// SUBJECT OFFERING EVENTS (if we have offerings)
	// ============================================================================
	if (subjectData.offerings.length > 0) {
		const subjectOfferingEvents = await db
			.insert(schema.eventSubjectOffering)
			.values([
				// Science Fair for all Year 9 Science offerings
				{
					subjectOfferingId: subjectData.offerings[0].id,
					name: 'Science Fair Preparation Day',
					start: getRelativeDate(25, 9, 0),
					end: getRelativeDate(25, 15, 0),
					requiresRSVP: false,
				},
				// Excursion
				{
					subjectOfferingId: subjectData.offerings[0].id,
					name: 'Museum Excursion',
					start: getRelativeDate(18, 9, 0),
					end: getRelativeDate(18, 15, 0),
					requiresRSVP: true,
				},
			])
			.returning();

		console.log(
			`  Created ${subjectOfferingEvents.length} subject offering events`,
		);
	}

	// ============================================================================
	// CLASS-LEVEL EVENTS (if we have classes)
	// ============================================================================
	if (subjectData.classes.length > 0) {
		const classEvents = await db
			.insert(schema.eventSubjectOfferingClass)
			.values([
				// Class test
				{
					subjectOfferingClassId: subjectData.classes[0].id,
					name: 'Mid-Term Assessment',
					start: getRelativeDate(14, 10, 0),
					end: getRelativeDate(14, 11, 0),
					requiresRSVP: false,
				},
				// Class presentation day
				{
					subjectOfferingClassId: subjectData.classes[0].id,
					name: 'Group Presentation Day',
					start: getRelativeDate(20, 9, 0),
					end: getRelativeDate(20, 12, 0),
					requiresRSVP: false,
				},
			])
			.returning();

		console.log(`  Created ${classEvents.length} class events`);
	}
}

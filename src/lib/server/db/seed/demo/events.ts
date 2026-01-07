import * as schema from '../../schema';
import type { Database } from '../types';
import type { DemoSchoolData, DemoSubjectData, DemoUserData } from './types';

// Helper to get a date relative to today
function getRelativeDate(daysFromNow: number, hour: number = 9, minute: number = 0): Date {
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
	minute: number
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
	userData: DemoUserData,
	subjectData: DemoSubjectData
): Promise<void> {
	const { school, campus } = schoolData;

	// ============================================================================
	// SCHOOL-WIDE EVENTS
	// ============================================================================
	const schoolEvents = await db
		.insert(schema.schoolEvent)
		.values([
			// Weekly Assembly - every Monday at 9am
			{
				schoolId: school.id,
				name: 'Whole School Assembly',
				startTimestamp: getNextWeekday(1, 0, 9, 0), // Next Monday
				endTimestamp: getNextWeekday(1, 0, 9, 45),
				requiresRSVP: false
			},
			{
				schoolId: school.id,
				name: 'Whole School Assembly',
				startTimestamp: getNextWeekday(1, 1, 9, 0), // Monday in 1 week
				endTimestamp: getNextWeekday(1, 1, 9, 45),
				requiresRSVP: false
			},
			{
				schoolId: school.id,
				name: 'Whole School Assembly',
				startTimestamp: getNextWeekday(1, 2, 9, 0), // Monday in 2 weeks
				endTimestamp: getNextWeekday(1, 2, 9, 45),
				requiresRSVP: false
			},
			// Parent Teacher Interviews - in 3 weeks
			{
				schoolId: school.id,
				name: 'Parent Teacher Interviews - Day 1',
				startTimestamp: getRelativeDate(21, 15, 30),
				endTimestamp: getRelativeDate(21, 20, 0),
				requiresRSVP: true
			},
			{
				schoolId: school.id,
				name: 'Parent Teacher Interviews - Day 2',
				startTimestamp: getRelativeDate(22, 15, 30),
				endTimestamp: getRelativeDate(22, 20, 0),
				requiresRSVP: true
			},
			// Awards Night - end of term (6 weeks away)
			{
				schoolId: school.id,
				name: 'Annual Awards Night',
				startTimestamp: getRelativeDate(42, 18, 0),
				endTimestamp: getRelativeDate(42, 21, 0),
				requiresRSVP: true
			},
			// School Open Day - in 5 weeks
			{
				schoolId: school.id,
				name: 'School Open Day',
				startTimestamp: getRelativeDate(35, 10, 0),
				endTimestamp: getRelativeDate(35, 14, 0),
				requiresRSVP: false
			},
			// School Photos - next week
			{
				schoolId: school.id,
				name: 'School Photo Day',
				startTimestamp: getRelativeDate(8, 8, 30),
				endTimestamp: getRelativeDate(8, 15, 30),
				requiresRSVP: false
			}
		])
		.returning();

	console.log(`  Created ${schoolEvents.length} school-wide events`);

	// ============================================================================
	// CAMPUS EVENTS
	// ============================================================================
	const campusEvents = await db
		.insert(schema.campusEvent)
		.values([
			// Athletics Carnival - in 2 weeks (Friday)
			{
				campusId: campus.id,
				name: 'Athletics Carnival',
				startTimestamp: getNextWeekday(5, 2, 8, 30), // Friday in 2 weeks
				endTimestamp: getNextWeekday(5, 2, 15, 30),
				requiresRSVP: false
			},
			// Swimming Carnival - in 4 weeks (Friday)
			{
				campusId: campus.id,
				name: 'Swimming Carnival',
				startTimestamp: getNextWeekday(5, 4, 8, 30),
				endTimestamp: getNextWeekday(5, 4, 15, 0),
				requiresRSVP: false
			},
			// Cross Country - in 6 weeks (Friday)
			{
				campusId: campus.id,
				name: 'Cross Country Carnival',
				startTimestamp: getNextWeekday(5, 6, 9, 0),
				endTimestamp: getNextWeekday(5, 6, 14, 0),
				requiresRSVP: false
			},
			// Lunchtime Sport Matches - recurring on Wednesdays
			{
				campusId: campus.id,
				name: 'Interschool Basketball - Lunchtime',
				startTimestamp: getNextWeekday(3, 0, 12, 45), // Next Wednesday
				endTimestamp: getNextWeekday(3, 0, 13, 30),
				requiresRSVP: false
			},
			{
				campusId: campus.id,
				name: 'Interschool Volleyball - Lunchtime',
				startTimestamp: getNextWeekday(3, 1, 12, 45), // Wednesday in 1 week
				endTimestamp: getNextWeekday(3, 1, 13, 30),
				requiresRSVP: false
			},
			{
				campusId: campus.id,
				name: 'Interschool Soccer - Lunchtime',
				startTimestamp: getNextWeekday(3, 2, 12, 45), // Wednesday in 2 weeks
				endTimestamp: getNextWeekday(3, 2, 13, 30),
				requiresRSVP: false
			},
			{
				campusId: campus.id,
				name: 'Interschool Netball - Lunchtime',
				startTimestamp: getNextWeekday(3, 3, 12, 45), // Wednesday in 3 weeks
				endTimestamp: getNextWeekday(3, 3, 13, 30),
				requiresRSVP: false
			},
			// Friday Sport - after school
			{
				campusId: campus.id,
				name: 'Friday Sport - Regional Competition',
				startTimestamp: getNextWeekday(5, 1, 15, 30),
				endTimestamp: getNextWeekday(5, 1, 17, 30),
				requiresRSVP: true
			},
			{
				campusId: campus.id,
				name: 'Friday Sport - Home Game',
				startTimestamp: getNextWeekday(5, 3, 15, 30),
				endTimestamp: getNextWeekday(5, 3, 17, 30),
				requiresRSVP: true
			},
			// Year Level Assemblies
			{
				campusId: campus.id,
				name: 'Year 7 Assembly',
				startTimestamp: getNextWeekday(2, 1, 9, 0), // Tuesday in 1 week
				endTimestamp: getNextWeekday(2, 1, 9, 30),
				requiresRSVP: false
			},
			{
				campusId: campus.id,
				name: 'Year 8 Assembly',
				startTimestamp: getNextWeekday(2, 1, 9, 30), // Tuesday in 1 week
				endTimestamp: getNextWeekday(2, 1, 10, 0),
				requiresRSVP: false
			},
			{
				campusId: campus.id,
				name: 'Year 9 Assembly',
				startTimestamp: getNextWeekday(2, 1, 10, 30), // Tuesday in 1 week
				endTimestamp: getNextWeekday(2, 1, 11, 0),
				requiresRSVP: false
			},
			{
				campusId: campus.id,
				name: 'Year 10 Assembly',
				startTimestamp: getNextWeekday(2, 1, 11, 0), // Tuesday in 1 week
				endTimestamp: getNextWeekday(2, 1, 11, 30),
				requiresRSVP: false
			},
			// Campus BBQ / Social Events
			{
				campusId: campus.id,
				name: 'Welcome BBQ - All Families',
				startTimestamp: getRelativeDate(14, 17, 0),
				endTimestamp: getRelativeDate(14, 19, 30),
				requiresRSVP: true
			},
			// Book Fair
			{
				campusId: campus.id,
				name: 'Book Fair Week - Day 1',
				startTimestamp: getRelativeDate(28, 8, 30),
				endTimestamp: getRelativeDate(28, 15, 30),
				requiresRSVP: false
			},
			{
				campusId: campus.id,
				name: 'Book Fair Week - Day 2',
				startTimestamp: getRelativeDate(29, 8, 30),
				endTimestamp: getRelativeDate(29, 15, 30),
				requiresRSVP: false
			},
			{
				campusId: campus.id,
				name: 'Book Fair Week - Day 3',
				startTimestamp: getRelativeDate(30, 8, 30),
				endTimestamp: getRelativeDate(30, 15, 30),
				requiresRSVP: false
			}
		])
		.returning();

	console.log(`  Created ${campusEvents.length} campus events`);

	// ============================================================================
	// SUBJECT OFFERING EVENTS (if we have offerings)
	// ============================================================================
	if (subjectData.offerings.length > 0) {
		const subjectOfferingEvents = await db
			.insert(schema.subjectOfferingEvent)
			.values([
				// Science Fair for all Year 9 Science offerings
				{
					subjectOfferingId: subjectData.offerings[0].id,
					name: 'Science Fair Preparation Day',
					startTimestamp: getRelativeDate(25, 9, 0),
					endTimestamp: getRelativeDate(25, 15, 0),
					requiresRSVP: false
				},
				// Excursion
				{
					subjectOfferingId: subjectData.offerings[0].id,
					name: 'Museum Excursion',
					startTimestamp: getRelativeDate(18, 9, 0),
					endTimestamp: getRelativeDate(18, 15, 0),
					requiresRSVP: true
				}
			])
			.returning();

		console.log(`  Created ${subjectOfferingEvents.length} subject offering events`);
	}

	// ============================================================================
	// CLASS-LEVEL EVENTS (if we have classes)
	// ============================================================================
	if (subjectData.classes.length > 0) {
		const classEvents = await db
			.insert(schema.subjectOfferingClassEvent)
			.values([
				// Class test
				{
					subjectOfferingClassId: subjectData.classes[0].id,
					name: 'Mid-Term Assessment',
					startTimestamp: getRelativeDate(14, 10, 0),
					endTimestamp: getRelativeDate(14, 11, 0),
					requiresRSVP: false
				},
				// Class presentation day
				{
					subjectOfferingClassId: subjectData.classes[0].id,
					name: 'Group Presentation Day',
					startTimestamp: getRelativeDate(20, 9, 0),
					endTimestamp: getRelativeDate(20, 12, 0),
					requiresRSVP: false
				}
			])
			.returning();

		console.log(`  Created ${classEvents.length} class events`);
	}
}

import * as schema from '../../schema'
import type { Database } from '../types'
import type { DemoSchoolData } from './types'

export async function seedDemoTimetable(
	db: Database,
	schoolData: DemoSchoolData,
) {
	const { school, semestersAndTerms } = schoolData
	const year = new Date().getFullYear()

	// Create main timetable
	const [timetable] = await db
		.insert(schema.timetable)
		.values({
			schoolId: school.id,
			name: 'Main School Timetable',
			year,
			schoolSemesterId: semestersAndTerms.semesters[0].id,
		})
		.returning()

	// Create a draft for the timetable
	const [draft] = await db
		.insert(schema.timetableDraft)
		.values({ timetableId: timetable.id, name: `Draft 1` })
		.returning()

	// Create timetable days (Monday to Friday)
	await db
		.insert(schema.timetableDay)
		.values([
			{ timetableDraftId: draft.id, day: 1 }, // Monday
			{ timetableDraftId: draft.id, day: 2 }, // Tuesday
			{ timetableDraftId: draft.id, day: 3 }, // Wednesday
			{ timetableDraftId: draft.id, day: 4 }, // Thursday
			{ timetableDraftId: draft.id, day: 5 }, // Friday
		])
		.returning()

	// Create timetable periods (6 periods from 8:30am to 3:20pm with breaks)
	await db
		.insert(schema.timetablePeriod)
		.values([
			{ timetableDraftId: draft.id, start: '08:30:00', end: '09:20:00' }, // Period 1
			{ timetableDraftId: draft.id, start: '09:30:00', end: '10:20:00' }, // Period 2
			{ timetableDraftId: draft.id, start: '10:50:00', end: '11:40:00' }, // Period 3
			{ timetableDraftId: draft.id, start: '11:50:00', end: '12:40:00' }, // Period 4
			{ timetableDraftId: draft.id, start: '13:30:00', end: '14:20:00' }, // Period 5
			{ timetableDraftId: draft.id, start: '14:30:00', end: '15:20:00' }, // Period 6
		])
		.returning()
}

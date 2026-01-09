import { yearLevelEnum } from '$lib/enums';
import { and, eq } from 'drizzle-orm';
import * as schema from '../../schema';
import type { Database } from '../types';
import { ALL_CONSTRAINTS } from './FET-mapping/constraints';
import { DEMO_YEAR_LEVELS } from './consts';
import type { DemoSchoolData, DemoSubjectData, DemoUserData } from './types';

// Map year level enum values to display names
const YEAR_LEVEL_DISPLAY: Record<string, string> = {
	'7': 'Year 7',
	'8': 'Year 8',
	'9': 'Year 9',
	'10': 'Year 10'
};

// Map year level enum values to yearLevelEnum
const YEAR_LEVEL_ENUM_MAP: Record<string, yearLevelEnum> = {
	'7': yearLevelEnum.year7,
	'8': yearLevelEnum.year8,
	'9': yearLevelEnum.year9,
	'10': yearLevelEnum.year10
};

export async function seedDemoTimetable(
	db: Database,
	schoolData: DemoSchoolData,
	subjectData: DemoSubjectData,
	userData: DemoUserData
) {
	const { school, spaces, yearLevels } = schoolData;
	const { offerings, subjects, classes: subjectOfferingClasses } = subjectData;
	const { teachers, students } = userData;

	const currentYear = new Date().getFullYear();
	const [semester1] = await db
		.select()
		.from(schema.schoolSemester)
		.where(
			and(
				eq(schema.schoolSemester.schoolId, school.id),
				eq(schema.schoolSemester.schoolYear, currentYear),
				eq(schema.schoolSemester.semNumber, 1)
			)
		)
		.limit(1);

	// Create main timetable
	const [timetable] = await db
		.insert(schema.timetable)
		.values({
			schoolId: school.id,
			name: `Main School Timetable ${currentYear}`,
			schoolYear: currentYear,
			schoolSemesterId: semester1?.id
		})
		.returning();

	console.log(`  Created timetable: ${timetable.name}`);

	// Create a draft for the timetable
	const [draft] = await db
		.insert(schema.timetableDraft)
		.values({
			timetableId: timetable.id,
			name: `Draft for Main School Timetable ${currentYear}`
		})
		.returning();

	// Create timetable days (Monday to Friday)
	await db
		.insert(schema.timetableDay)
		.values([
			{ timetableDraftId: draft.id, day: 1 }, // Monday
			{ timetableDraftId: draft.id, day: 2 }, // Tuesday
			{ timetableDraftId: draft.id, day: 3 }, // Wednesday
			{ timetableDraftId: draft.id, day: 4 }, // Thursday
			{ timetableDraftId: draft.id, day: 5 } // Friday
		])
		.returning();

	// Create timetable periods (6 periods from 9:00 to 15:30)
	const periods = await db
		.insert(schema.timetablePeriod)
		.values([
			{ timetableDraftId: draft.id, startTime: '09:00', endTime: '09:50' },
			{ timetableDraftId: draft.id, startTime: '09:50', endTime: '10:40' },
			{ timetableDraftId: draft.id, startTime: '11:00', endTime: '11:50' }, // 20 min break after period 2
			{ timetableDraftId: draft.id, startTime: '11:50', endTime: '12:40' },
			{ timetableDraftId: draft.id, startTime: '13:40', endTime: '14:30' }, // 1 hour lunch break after period 4
			{ timetableDraftId: draft.id, startTime: '14:30', endTime: '15:20' }
		])
		.returning();

	// Update the nextPeriodId chain for all periods
	for (let i = 0; i < periods.length; i++) {
		const currentPeriod = periods[i];
		const nextPeriod = periods[i + 1];

		await db
			.update(schema.timetablePeriod)
			.set({ nextPeriodId: nextPeriod ? nextPeriod.id : null })
			.where(eq(schema.timetablePeriod.id, currentPeriod.id));
	}

	console.log('  Created timetable structure (days and periods)');

	// Get active year levels (exclude 'none')
	const activeYearLevels = DEMO_YEAR_LEVELS.filter((yl) => yl !== yearLevelEnum.none);

	// Create timetable groups and activities for ALL year levels
	const allTimetableGroups: (typeof schema.timetableGroup.$inferSelect)[] = [];
	let totalActivities = 0;

	for (const yearLevel of activeYearLevels) {
		const yearLevelKey = yearLevel as keyof typeof yearLevels;
		const yearLevelId = yearLevels[yearLevelKey];
		const yearLevelDisplay = YEAR_LEVEL_DISPLAY[yearLevel] || `Year ${yearLevel}`;
		const yearLevelEnumValue = YEAR_LEVEL_ENUM_MAP[yearLevel];

		// Get semester 1 offerings for this year level
		const yearLevelOfferings = offerings.filter((o) => {
			const subject = subjects.find((s) => s.id === o.subjectId);
			return subject && subject.yearLevelId === yearLevelId && o.semester === 1;
		});

		// Get students in this year level
		const yearLevelStudents = students.filter((s) => s.yearLevelId === yearLevelId);
		const studentIds = yearLevelStudents.map((s) => s.id);

		// Create timetable groups for this year level - one group per subject
		const yearLevelGroups = [];
		for (const offering of yearLevelOfferings) {
			const subject = subjects.find((s) => s.id === offering.subjectId);
			const subjectName = subject
				? subject.name.replace(`${yearLevelDisplay} `, '')
				: 'Unknown Subject';

			const [group] = await db
				.insert(schema.timetableGroup)
				.values({
					timetableDraftId: draft.id,
					yearLevel: yearLevelEnumValue,
					name: `${yearLevelDisplay} ${subjectName}`
				})
				.returning();

			yearLevelGroups.push({ group, offering });
			allTimetableGroups.push(group);
		}

		// Assign students to groups (batch insert)
		for (const { group } of yearLevelGroups) {
			if (studentIds.length > 0) {
				const memberValues = studentIds.map((studentId) => ({
					userId: studentId,
					groupId: group.id
				}));
				// Insert in batches to avoid hitting limits
				const BATCH_SIZE = 100;
				for (let i = 0; i < memberValues.length; i += BATCH_SIZE) {
					const batch = memberValues.slice(i, i + BATCH_SIZE);
					await db.insert(schema.timetableGroupMember).values(batch);
				}
			}
		}

		// Create activities for each group
		// Get teachers assigned to offerings for this year level
		const teacherIds = teachers.map((t) => t.id);

		for (let groupIndex = 0; groupIndex < yearLevelGroups.length; groupIndex++) {
			const { group, offering } = yearLevelGroups[groupIndex];
			// Rotate through teachers based on year level and subject index
			const yearLevelIndex = activeYearLevels.indexOf(yearLevel);
			const teacherIndex = (yearLevelIndex * 6 + groupIndex) % teacherIds.length;
			const teacherId = teacherIds[teacherIndex];

			// Activity 1: Group-based activity with preferred rooms (3 periods/week)
			const [activity1] = await db
				.insert(schema.timetableActivity)
				.values({
					timetableDraftId: draft.id,
					subjectOfferingId: offering.id,
					periodsPerInstance: 1,
					totalPeriods: 3
				})
				.returning();

			await db.insert(schema.timetableActivityTeacherPreference).values({
				timetableActivityId: activity1.id,
				teacherId: teacherId
			});

			await db.insert(schema.timetableActivityAssignedGroup).values({
				timetableActivityId: activity1.id,
				timetableGroupId: group.id
			});

			// Assign preferred rooms (rotate through available spaces)
			const spaceIndex = (yearLevelIndex * 6 + groupIndex) % spaces.length;
			await db.insert(schema.timetableActivityPreferredSpace).values({
				timetableActivityId: activity1.id,
				schoolSpaceId: spaces[spaceIndex].id
			});

			// Activity 2: Double period activity (4 periods/week = 2 x double periods)
			const [activity2] = await db
				.insert(schema.timetableActivity)
				.values({
					timetableDraftId: draft.id,
					subjectOfferingId: offering.id,
					periodsPerInstance: 2,
					totalPeriods: 4
				})
				.returning();

			await db.insert(schema.timetableActivityTeacherPreference).values({
				timetableActivityId: activity2.id,
				teacherId: teacherId
			});

			// Vary assignment type based on index
			const assignmentType = (yearLevelIndex + groupIndex) % 3;
			if (assignmentType === 0) {
				// Assign to year level
				await db.insert(schema.timetableActivityAssignedYear).values({
					timetableActivityId: activity2.id,
					yearlevel: yearLevelEnumValue
				});
			} else if (assignmentType === 1) {
				// Assign to group
				await db.insert(schema.timetableActivityAssignedGroup).values({
					timetableActivityId: activity2.id,
					timetableGroupId: group.id
				});
			} else {
				// Assign to individual students (limit to first 20 for performance)
				const limitedStudentIds = studentIds.slice(0, 20);
				for (const studentId of limitedStudentIds) {
					await db.insert(schema.timetableActivityAssignedStudent).values({
						timetableActivityId: activity2.id,
						userId: studentId
					});
				}
			}

			// Assign different preferred rooms
			const space1Index = (spaceIndex + 1) % spaces.length;
			const space2Index = (spaceIndex + 2) % spaces.length;
			await db.insert(schema.timetableActivityPreferredSpace).values([
				{ timetableActivityId: activity2.id, schoolSpaceId: spaces[space1Index].id },
				{ timetableActivityId: activity2.id, schoolSpaceId: spaces[space2Index].id }
			]);

			totalActivities += 2;
		}
	}

	console.log(
		`  Created ${allTimetableGroups.length} timetable groups with ${totalActivities} activities across ${activeYearLevels.length} year levels`
	);

	// Seed constraints
	await seedTimetableConstraints(db, draft.id);

	// Create timetable allocations for all classes
	await seedTimetableAllocations(db, subjectOfferingClasses, spaces, subjects, yearLevels);
}

async function seedTimetableConstraints(db: Database, draftId: number) {
	// Convert constraint definitions to database format
	const constraintsToSeed = ALL_CONSTRAINTS.map((constraint) => ({
		FETName: constraint.FETName,
		friendlyName: constraint.friendlyName,
		description: constraint.description,
		type: constraint.type,
		optional: constraint.optional ?? true,
		repeatable: constraint.repeatable ?? true
	}));

	// Check if constraints already exist
	const existingConstraints = await db.select().from(schema.constraint);

	let allConstraints;
	if (existingConstraints.length === 0) {
		allConstraints = await db.insert(schema.constraint).values(constraintsToSeed).returning();
	} else {
		allConstraints = existingConstraints;
	}

	// Only add the mandatory constraints to the timetable draft
	const mandatoryConstraints = allConstraints.filter(
		(c) =>
			c.FETName === 'ConstraintBasicCompulsoryTime' ||
			c.FETName === 'ConstraintBasicCompulsorySpace'
	);

	for (const con of mandatoryConstraints) {
		await db.insert(schema.timetableDraftConstraint).values({
			timetableDraftId: draftId,
			constraintId: con.id,
			active: true,
			parameters: {
				Active: true,
				Comments: 'This is a mandatory constraint added by the seeding script.',
				Weight_Percentage: 100
			}
		});
	}

	console.log('  Seeded timetable constraints');
}

async function seedTimetableAllocations(
	db: Database,
	subjectOfferingClasses: (typeof schema.subjectOfferingClass.$inferSelect)[],
	spaces: (typeof schema.schoolSpace.$inferSelect)[],
	subjects: (typeof schema.subject.$inferSelect)[],
	yearLevels: { none: number; 7: number; 8: number; 9: number; 10: number }
) {
	// Calculate the most recent Monday
	const today = new Date();
	const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
	const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
	const mostRecentMonday = new Date(today);
	mostRecentMonday.setDate(today.getDate() - daysToSubtract);
	mostRecentMonday.setHours(0, 0, 0, 0);

	const baseDate = mostRecentMonday;

	// Helper function to create a Date string for a specific day
	const createDate = (weekOffset: number, dayOffset: number) => {
		const date = new Date(baseDate);
		date.setDate(baseDate.getDate() + weekOffset * 7 + dayOffset);
		return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
	};

	// Helper function to create a time string (handles minute overflow)
	const createTime = (hour: number, minute: number = 0) => {
		const extraHours = Math.floor(minute / 60);
		const normalizedMinute = minute % 60;
		const normalizedHour = hour + extraHours;
		return `${normalizedHour.toString().padStart(2, '0')}:${normalizedMinute.toString().padStart(2, '0')}:00`;
	};

	// Period time slots
	const periodTimes = [
		{ hour: 9, minute: 0 }, // Period 1: 9:00-9:50
		{ hour: 9, minute: 50 }, // Period 2: 9:50-10:40
		{ hour: 11, minute: 0 }, // Period 3: 11:00-11:50 (after break)
		{ hour: 11, minute: 50 }, // Period 4: 11:50-12:40
		{ hour: 13, minute: 40 }, // Period 5: 13:40-14:30 (after lunch)
		{ hour: 14, minute: 30 } // Period 6: 14:30-15:20
	];

	// Define weekly patterns for 6 subjects (indices 0-5)
	const weeklyPatterns = [
		// Week 1 Pattern - Standard Schedule
		[
			[0, 1, 2, 3, 4, 5],
			[1, 2, 0, 4, 3, 5],
			[2, 0, 1, 5, 4, 3],
			[3, 4, 5, 1, 2, 0],
			[5, 3, 4, 0, 1, 2]
		],
		// Week 2 Pattern
		[
			[0, 0, 1, 2, 3, 4],
			[2, 1, 5, 0, 3, 4],
			[3, 2, 0, 1, 4, 5],
			[4, 5, 3, 2, 0, 1],
			[1, 0, 4, 5, 2, 3]
		],
		// Week 3 Pattern
		[
			[2, 2, 0, 1, 3, 5],
			[0, 1, 3, 2, 4, 5],
			[1, 3, 2, 0, 5, 4],
			[5, 0, 1, 3, 2, 4],
			[3, 4, 5, 2, 1, 0]
		],
		// Week 4 Pattern
		[
			[1, 3, 0, 2, 5, 4],
			[5, 0, 2, 1, 4, 3],
			[4, 1, 3, 5, 0, 2],
			[0, 2, 5, 4, 1, 3],
			[2, 4, 1, 3, 0, 5]
		]
	];

	const timetableEntries: Array<{
		subjectOfferingClassId: number;
		schoolSpaceId: number;
		date: string;
		startTime: string;
		endTime: string;
	}> = [];

	// Get active year level IDs (exclude 'none')
	const activeYearLevelIds = [yearLevels['7'], yearLevels['8'], yearLevels['9'], yearLevels['10']];

	// Create 4 weeks of timetable data for ALL year levels
	for (let week = 0; week < 4; week++) {
		const pattern = weeklyPatterns[week];

		// For each year level
		for (let yearLevelIdx = 0; yearLevelIdx < activeYearLevelIds.length; yearLevelIdx++) {
			// Calculate class range for this year level
			// Structure: 6 subjects * 4 year levels * 2 semesters * 3 classes = 144 total classes
			// Per year level: 6 subjects * 2 semesters * 3 classes = 36 classes
			// Semester 1 per year level: 6 subjects * 3 classes = 18 classes
			const classesPerYearLevel = 36; // 6 subjects * 2 semesters * 3 classes
			const classesPerSemester = 18; // 6 subjects * 3 classes
			const startIdx = yearLevelIdx * classesPerYearLevel;
			const endIdx = startIdx + classesPerSemester;

			// Get semester 1 classes for this year level
			const yearLevelSem1Classes = subjectOfferingClasses.slice(startIdx, endIdx);

			// Create entries for each day of the week
			for (let day = 0; day < 5; day++) {
				const dayPattern = pattern[day];

				// Create 6 periods per day
				for (let period = 0; period < 6; period++) {
					const subjectIndex = dayPattern[period];

					// Each subject has 3 classes (A, B, C), rotate through them
					const classOffset = (week + day + period) % 3;
					const classIndex = subjectIndex * 3 + classOffset;

					if (classIndex >= yearLevelSem1Classes.length) continue;

					const cls = yearLevelSem1Classes[classIndex];
					const { hour, minute } = periodTimes[period];

					// Assign spaces based on year level and subject
					const spaceIndex = (yearLevelIdx * 6 + subjectIndex) % spaces.length;

					timetableEntries.push({
						subjectOfferingClassId: cls.id,
						schoolSpaceId: spaces[spaceIndex].id,
						date: createDate(week, day),
						startTime: createTime(hour, minute),
						endTime: createTime(hour, minute + 50) // 50 minute periods
					});
				}
			}
		}
	}

	// Insert in batches
	const BATCH_SIZE = 500;
	for (let i = 0; i < timetableEntries.length; i += BATCH_SIZE) {
		const batch = timetableEntries.slice(i, i + BATCH_SIZE);
		await db.insert(schema.subjectClassAllocation).values(batch);
	}

	console.log(
		`  Created ${timetableEntries.length} class allocations (${Math.ceil(timetableEntries.length / (5 * 6 * 4))} year levels × 4 weeks)`
	);
}

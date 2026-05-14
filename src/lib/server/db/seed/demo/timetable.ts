import { inArray } from 'drizzle-orm';
import * as schema from '../../schema';
import type { Database } from '../types';
import type { DemoSchoolData, DemoSubjectData, DemoUserData } from './types';

export async function seedDemoTimetable(
	db: Database,
	schoolData: DemoSchoolData,
	userData: DemoUserData,
	subjectData: DemoSubjectData,
) {
	const { school, semestersAndTerms } = schoolData;
	const year = new Date().getFullYear();

	// Create main timetable
	const [timetable] = await db
		.insert(schema.timetable)
		.values({
			schoolId: school.id,
			name: 'Main School Timetable',
			year,
			schoolSemesterId: semestersAndTerms.semesters[0].id,
		})
		.returning();

	// Create a draft for the timetable
	const [draft] = await db
		.insert(schema.timetableDraft)
		.values({ timetableId: timetable.id, name: `Draft 1`, cycleWeekRepeats: 1 })
		.returning();

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
		.returning();

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
		.returning();

	const groups = await seedTimetableGroups(db, draft.id, schoolData, userData);
	await seedTimetableClasses(
		db,
		draft.id,
		schoolData,
		userData,
		subjectData,
		groups,
	);
	await seedTimetableConstraints(db, draft.id);
}

async function seedTimetableGroups(
	db: Database,
	timetableDraftId: number,
	schoolData: DemoSchoolData,
	userData: DemoUserData,
) {
	const yearLevels = [
		schoolData.yearLevels.year7,
		schoolData.yearLevels.year8,
		schoolData.yearLevels.year9,
		schoolData.yearLevels.year10,
	];
	const groupCodes = ['A', 'B', 'C'];

	const groups = await db
		.insert(schema.timetableGroup)
		.values(
			yearLevels.flatMap((yearLevel) =>
				groupCodes.map((groupCode) => ({
					timetableDraftId,
					yearLevelId: yearLevel.id,
					name: `${yearLevel.code}${groupCode}`,
				})),
			),
		)
		.returning();

	const memberValues = yearLevels.flatMap((yearLevel) => {
		const students = userData.students.filter(
			(student) => student.schoolYearLevelId === yearLevel.id,
		);
		const yearGroups = groups.filter(
			(group) => group.yearLevelId === yearLevel.id,
		);

		return students.map((student, index) => ({
			groupId: yearGroups[index % yearGroups.length].id,
			userId: student.id,
		}));
	});

	if (memberValues.length > 0) {
		await db.insert(schema.timetableGroupMember).values(memberValues);
	}

	return groups;
}

async function seedTimetableClasses(
	db: Database,
	timetableDraftId: number,
	schoolData: DemoSchoolData,
	userData: DemoUserData,
	subjectData: DemoSubjectData,
	groups: (typeof schema.timetableGroup.$inferSelect)[],
) {
	for (let i = 0; i < subjectData.classes.length; i++) {
		const subjectClass = subjectData.classes[i];
		const offering = subjectData.offerings.find(
			(o) => o.id === subjectClass.subOfferingId,
		);
		const subject = subjectData.subjects.find(
			(s) => s.id === offering?.subjectId,
		);

		if (!offering || !subject) continue;

		const [timetableClass] = await db
			.insert(schema.timetableClass)
			.values({ timetableDraftId, subjectOfferingId: offering.id })
			.returning();

		const teacher = userData.teachers[i % userData.teachers.length];
		await db
			.insert(schema.timetableClassTeacherPreference)
			.values({ timetableClassId: timetableClass.id, teacherId: teacher.id });

		const group = groups.find(
			(g) =>
				g.yearLevelId === subject.schoolYearLevelId &&
				g.name.endsWith(subjectClass.name),
		);
		if (group) {
			await db
				.insert(schema.timetableClassAssignedGroup)
				.values({
					timetableClassId: timetableClass.id,
					timetableGroupId: group.id,
				});
		}

		const spaces = getPreferredSpacesForSubject(
			schoolData,
			subjectData,
			subject,
		);
		if (spaces.length > 0) {
			await db
				.insert(schema.timetableClassPreferredSpace)
				.values(
					spaces.map((space) => ({
						timetableClassId: timetableClass.id,
						schoolSpaceId: space.id,
					})),
				);
		}

		await db
			.insert(schema.timetableActivity)
			.values(
				getActivityDurationsForSubject(subjectData, subject).map(
					(duration) => ({ timetableClassId: timetableClass.id, duration }),
				),
			);
	}
}

function getActivityDurationsForSubject(
	subjectData: DemoSubjectData,
	subject: typeof schema.subject.$inferSelect,
) {
	const subjectGroupName =
		subjectData.subjectGroups.find(
			(group) => group.id === subject.subjectGroupId,
		)?.name ?? '';

	const periodsPerCycle: Record<string, number> = {
		Mathematics: 5,
		English: 4,
		Science: 4,
		History: 3,
		Geography: 3,
		'Physical Education': 2,
	};

	return Array.from(
		{ length: periodsPerCycle[subjectGroupName] ?? 3 },
		() => 1,
	);
}

function getPreferredSpacesForSubject(
	schoolData: DemoSchoolData,
	subjectData: DemoSubjectData,
	subject: typeof schema.subject.$inferSelect,
) {
	const subjectGroupName =
		subjectData.subjectGroups.find(
			(group) => group.id === subject.subjectGroupId,
		)?.name ?? '';

	if (subjectGroupName === 'Science') {
		return schoolData.spaces.filter((space) =>
			space.name.includes('Science Lab'),
		);
	}

	if (subjectGroupName === 'Physical Education') {
		return schoolData.spaces.filter((space) =>
			['Courts', 'Swimming Pool'].includes(space.name),
		);
	}

	const yearLevel = Object.values(schoolData.yearLevels).find(
		(yl) => yl.id === subject.schoolYearLevelId,
	);
	const classroomPrefix =
		yearLevel?.code === '10' ? 'Classroom SC' : 'Classroom MC';

	return schoolData.spaces.filter((space) =>
		space.name.startsWith(classroomPrefix),
	);
}

async function seedTimetableConstraints(
	db: Database,
	timetableDraftId: number,
) {
	const constraints = await db
		.select()
		.from(schema.constraint)
		.where(
			inArray(schema.constraint.fetName, [
				'ConstraintBasicCompulsoryTime',
				'ConstraintBasicCompulsorySpace',
				'ConstraintTeachersMaxGapsPerWeek',
			]),
		);

	const byFetName = new Map(
		constraints.map((constraint) => [constraint.fetName, constraint]),
	);

	const values = [
		{
			constraint: byFetName.get('ConstraintBasicCompulsoryTime'),
			parameters: {
				Weight_Percentage: 100,
				Active: true,
				Comments: 'Seeded baseline time constraint.',
			},
		},
		{
			constraint: byFetName.get('ConstraintBasicCompulsorySpace'),
			parameters: {
				Weight_Percentage: 100,
				Active: true,
				Comments: 'Seeded baseline room constraint.',
			},
		},
		{
			constraint: byFetName.get('ConstraintTeachersMaxGapsPerWeek'),
			parameters: {
				Weight_Percentage: 80,
				Max_Gaps: 4,
				Active: true,
				Comments: 'Seeded workload quality constraint.',
			},
		},
	]
		.filter((entry) => entry.constraint)
		.map((entry) => ({
			timetableDraftId,
			constraintId: entry.constraint!.id,
			active: true,
			parameters: entry.parameters,
		}));

	if (values.length > 0) {
		await db.insert(schema.timetableDraftConstraint).values(values);
	}
}

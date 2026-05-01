import { userTypeEnum } from '$lib/enums';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { deleteTimetableDraftFETOutputData } from '$lib/server/db/service';
import { and, eq, inArray } from 'drizzle-orm';

/**
 * Parse CSV timetable output and populate fetSubjectOfferingClass, fetSubjectClassAllocation,
 * and fetUserSubjectOfferingClass tables.
 *
 * Each CSV row corresponds to one FET <Activity>, which is now 1:1 with a
 * `tt_activity` DB row. The Comments column carries that row's
 * `tt_activity.id`, which we resolve to its parent `tt_class.id` to group
 * allocations into one `fet_sub_off_cls` per class.
 */
export async function parseTimetableCSVAndPopulateClasses(
	csvContent: string,
	timetableId: number,
	timetableDraftId: number,
) {
	const lines = csvContent.trim().split('\n');
	if (lines.length < 2) {
		throw new Error('CSV file is empty or invalid');
	}

	const header = lines[0].split(',').map((col) => col.replace(/"/g, '').trim());
	const activityIdIdx = header.indexOf('Activity Id');
	const dayIdx = header.indexOf('Day');
	const hourIdx = header.indexOf('Hour');
	const studentsIdx = header.indexOf('Students Sets');
	const subjectIdx = header.indexOf('Subject');
	const teachersIdx = header.indexOf('Teachers');
	const roomIdx = header.indexOf('Room');
	const commentsIdx = header.indexOf('Comments');

	if (
		activityIdIdx === -1 ||
		dayIdx === -1 ||
		hourIdx === -1 ||
		studentsIdx === -1 ||
		subjectIdx === -1 ||
		teachersIdx === -1 ||
		roomIdx === -1 ||
		commentsIdx === -1
	) {
		throw new Error('CSV file is missing required columns');
	}

	interface ClassData {
		classId: number;
		subjectOfferingId: number;
		students: string;
		teachers: string[];
	}

	interface AllocationRow {
		ttActivityId: number;
		classId: number;
		roomId: number;
		dayId: number;
		periods: number[];
	}

	const allocationsByActivity = new Map<number, AllocationRow>();
	const ttActivityIdsInCsv = new Set<number>();
	const csvRowSeed: Array<{
		ttActivityId: number;
		subjectOfferingId: number;
		students: string;
		teachers: string[];
		roomId: number;
		dayId: number;
		periodId: number;
	}> = [];

	for (let i = 1; i < lines.length; i++) {
		const line = lines[i].trim();
		if (!line) continue;

		const values: string[] = [];
		let current = '';
		let inQuotes = false;

		for (let j = 0; j < line.length; j++) {
			const char = line[j];
			if (char === '"') {
				inQuotes = !inQuotes;
			} else if (char === ',' && !inQuotes) {
				values.push(current.trim());
				current = '';
			} else {
				current += char;
			}
		}
		values.push(current.trim());

		const ttActivityId = parseInt(values[commentsIdx], 10);
		const subjectOfferingId = parseInt(values[subjectIdx], 10);
		const students = values[studentsIdx];
		const teachers = values[teachersIdx]
			.split('+')
			.map((t) => t.trim())
			.filter((t) => t);
		const roomId = parseInt(values[roomIdx], 10);
		const dayId = parseInt(values[dayIdx], 10);
		const periodId = parseInt(values[hourIdx], 10);

		if (Number.isNaN(ttActivityId) || Number.isNaN(subjectOfferingId)) continue;

		ttActivityIdsInCsv.add(ttActivityId);
		csvRowSeed.push({
			ttActivityId,
			subjectOfferingId,
			students,
			teachers,
			roomId,
			dayId,
			periodId,
		});
	}

	// Resolve each tt_activity row in the CSV to its parent tt_class.
	const activityRows = ttActivityIdsInCsv.size
		? await db
				.select({
					id: table.timetableActivity.id,
					classId: table.timetableActivity.timetableClassId,
				})
				.from(table.timetableActivity)
				.where(
					inArray(table.timetableActivity.id, [...ttActivityIdsInCsv]),
				)
		: [];
	const activityIdToClassId = new Map<number, number>(
		activityRows.map((r) => [r.id, r.classId]),
	);

	const classMap = new Map<number, ClassData>();
	for (const row of csvRowSeed) {
		const classId = activityIdToClassId.get(row.ttActivityId);
		if (classId === undefined) {
			console.warn(
				`CSV row references tt_activity ${row.ttActivityId} which no longer exists in the DB; skipping.`,
			);
			continue;
		}

		if (!classMap.has(classId)) {
			classMap.set(classId, {
				classId,
				subjectOfferingId: row.subjectOfferingId,
				students: row.students,
				teachers: row.teachers,
			});
		}

		const existing = allocationsByActivity.get(row.ttActivityId);
		if (existing) {
			existing.periods.push(row.periodId);
		} else {
			allocationsByActivity.set(row.ttActivityId, {
				ttActivityId: row.ttActivityId,
				classId,
				roomId: row.roomId,
				dayId: row.dayId,
				periods: [row.periodId],
			});
		}
	}

	// Get timetable to find schoolId
	const [timetableData] = await db
		.select({ schoolId: table.timetable.schoolId })
		.from(table.timetable)
		.where(eq(table.timetable.id, timetableId))
		.limit(1);

	if (!timetableData) {
		throw new Error(`Timetable ${timetableId} not found`);
	}

	const schoolId = timetableData.schoolId;

	// Get all students from the school for year level lookups
	const allStudents = await db
		.select({ id: table.user.id, yearLevel: table.user.schoolYearLevelId })
		.from(table.user)
		.where(
			and(
				eq(table.user.schoolId, schoolId),
				eq(table.user.type, userTypeEnum.student),
				eq(table.user.isArchived, false),
			),
		);

	// Get all timetable groups with their members
	const groupMembers = await db
		.select({
			groupId: table.timetableGroupMember.groupId,
			userId: table.timetableGroupMember.userId,
		})
		.from(table.timetableGroupMember)
		.innerJoin(
			table.timetableGroup,
			eq(table.timetableGroupMember.groupId, table.timetableGroup.id),
		)
		.where(eq(table.timetableGroup.timetableDraftId, timetableDraftId));

	// Create a map of groupId -> userIds
	const groupToUsersMap = new Map<number, string[]>();
	for (const member of groupMembers) {
		if (!groupToUsersMap.has(member.groupId)) {
			groupToUsersMap.set(member.groupId, []);
		}
		groupToUsersMap.get(member.groupId)!.push(member.userId);
	}

	// Create a map of yearLevel -> userIds
	const yearToUsersMap = new Map<string, string[]>();
	for (const student of allStudents) {
		if (!yearToUsersMap.has(student.yearLevel.toString())) {
			yearToUsersMap.set(student.yearLevel.toString(), []);
		}
		yearToUsersMap.get(student.yearLevel.toString())!.push(student.id);
	}

	// Helper function to resolve user IDs from student identifiers
	function resolveUserIds(studentIdentifiers: string): Set<string> {
		const identifiers = studentIdentifiers.split('+').map((s) => s.trim());
		const userIds = new Set<string>();

		for (const identifier of identifiers) {
			if (identifier.startsWith('Y')) {
				// Year level - remove 'Y' prefix
				const yearLevel = identifier.substring(1);
				const studentsInYear = yearToUsersMap.get(yearLevel) || [];
				studentsInYear.forEach((userId) => userIds.add(userId));
			} else if (identifier.startsWith('G')) {
				// Group - remove 'G' prefix
				const groupId = parseInt(identifier.substring(1), 10);
				const studentsInGroup = groupToUsersMap.get(groupId) || [];
				studentsInGroup.forEach((userId) => userIds.add(userId));
			} else if (identifier.startsWith('S')) {
				// Individual student - remove 'S' prefix
				const studentId = identifier.substring(1);
				userIds.add(studentId);
			}
		}

		return userIds;
	}

	// Remove all existing FET output data for this timetable draft
	try {
		await deleteTimetableDraftFETOutputData(timetableDraftId);
	} catch (err) {
		console.error('Error removing existing FET data for timetable draft:', err);
		throw err;
	}

	// Step 1: Create fetSubjectOfferingClass records
	const fetSubjectOfferingClassesToInsert: Array<
		typeof table.fetSubjectOfferingClass.$inferInsert
	> = [];
	const classIdToUsersMap = new Map<number, Set<string>>();

	for (const [classId, classData] of classMap.entries()) {
		fetSubjectOfferingClassesToInsert.push({
			timetableDraftId,
			subjectOfferingId: classData.subjectOfferingId,
			isArchived: false,
		});

		// Resolve all user IDs (students + teachers) for this class
		const userIds = resolveUserIds(classData.students);
		classData.teachers.forEach((teacherId) => {
			if (teacherId) {
				userIds.add(teacherId);
			}
		});
		classIdToUsersMap.set(classId, userIds);
	}

	// Insert fetSubjectOfferingClass records
	const insertedClassIds = await db
		.insert(table.fetSubjectOfferingClass)
		.values(fetSubjectOfferingClassesToInsert)
		.returning({ id: table.fetSubjectOfferingClass.id });

	// Create mapping from original classId to new DB ID
	const classIdMapping = new Map<number, number>();
	let classIndex = 0;
	for (const [classId] of classMap.entries()) {
		classIdMapping.set(classId, insertedClassIds[classIndex].id);
		classIndex++;
	}

	// Step 2: Create fetSubjectClassAllocation records (one per tt_activity)
	const fetSubjectClassAllocationsToInsert: Array<
		typeof table.fetSubjectClassAllocation.$inferInsert
	> = [];

	for (const allocation of allocationsByActivity.values()) {
		const dbClassId = classIdMapping.get(allocation.classId);
		if (!dbClassId) continue;

		const sortedPeriods = allocation.periods.sort((a, b) => a - b);
		const startPeriodId = sortedPeriods[0];
		const endPeriodId = sortedPeriods[sortedPeriods.length - 1];

		fetSubjectClassAllocationsToInsert.push({
			fetSubjectOfferingClassId: dbClassId,
			schoolSpaceId: allocation.roomId,
			dayId: allocation.dayId,
			startPeriodId,
			endPeriodId,
			isArchived: false,
		});
	}

	// Insert fetSubjectClassAllocation records in batches
	const batchSize = 100;
	for (
		let i = 0;
		i < fetSubjectClassAllocationsToInsert.length;
		i += batchSize
	) {
		const batch = fetSubjectClassAllocationsToInsert.slice(i, i + batchSize);
		await db.insert(table.fetSubjectClassAllocation).values(batch);
	}

	// Step 3: Create fetUserSubjectOfferingClass records
	const fetUserSubjectOfferingClassesToInsert: Array<
		typeof table.fetSubjectOfferingClassUser.$inferInsert
	> = [];

	for (const [classId, userIds] of classIdToUsersMap.entries()) {
		const dbClassId = classIdMapping.get(classId);
		if (!dbClassId) continue;

		for (const userId of userIds) {
			fetUserSubjectOfferingClassesToInsert.push({
				userId,
				fetSubOffClassId: dbClassId,
				isArchived: false,
			});
		}
	}

	// Insert fetUserSubjectOfferingClass records in batches
	for (
		let i = 0;
		i < fetUserSubjectOfferingClassesToInsert.length;
		i += batchSize
	) {
		const batch = fetUserSubjectOfferingClassesToInsert.slice(i, i + batchSize);
		await db.insert(table.fetSubjectOfferingClassUser).values(batch);
	}

	console.log(
		`Successfully inserted ${insertedClassIds.length} FET subject offering classes`,
	);
	console.log(
		`Successfully inserted ${fetSubjectClassAllocationsToInsert.length} FET subject class allocations`,
	);
	console.log(
		`Successfully inserted ${fetUserSubjectOfferingClassesToInsert.length} FET user subject offering class associations`,
	);

	return {
		classesInserted: insertedClassIds.length,
		allocationsInserted: fetSubjectClassAllocationsToInsert.length,
		userClassAssociationsInserted: fetUserSubjectOfferingClassesToInsert.length,
	};
}

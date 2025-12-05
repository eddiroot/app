import { db } from '$lib/server/db/index';
import { and, eq, inArray } from 'drizzle-orm';
import { schoolSpace } from '../schema/schools';
import { subject, subjectOffering, subjectOfferingClass } from '../schema/subjects';
import * as table from '../schema/timetables';
import { user } from '../schema/user';

/**
 * Represents a single class session in the timetable
 */
export type ClassSession = {
	id: number;
	subjectName: string;
	subjectOfferingId: number;
	className: string;
	spaceName: string | null;
	startTime: string;
	endTime: string;
	durationMinutes: number;
	dayId: number;
	dayNumber: number;
	startPeriodId: number;
	endPeriodId: number;
};

/**
 * Represents a single day in the timetable with all its sessions
 */
export type DaySchedule = {
	dayNumber: number;
	dayName: string;
	sessions: ClassSession[];
	totalHours: number;
};

/**
 * Complete timetable for a user across the cycle
 */
export type UserTimetable = {
	userId: string;
	userName: string;
	userType: string;
	cycleWeekRepeats: number;
	days: DaySchedule[];
	totalHoursPerCycle: number;
	averageHoursPerDay: number;
};

/**
 * Calculate duration in minutes between two time strings
 */
function calculateDurationMinutes(startTime: string, endTime: string): number {
	const [startHour, startMin] = startTime.split(':').map(Number);
	const [endHour, endMin] = endTime.split(':').map(Number);

	const startTotalMin = startHour * 60 + startMin;
	const endTotalMin = endHour * 60 + endMin;

	return endTotalMin - startTotalMin;
}

/**
 * Get all FET classes that a user is enrolled in/teaching
 */
async function getUserFetClasses(userId: string, timetableDraftId: number) {
	const userClasses = await db
		.select({
			fetSubOffClassId: table.fetSubjectOfferingClassUser.fetSubOffClassId
		})
		.from(table.fetSubjectOfferingClassUser)
		.innerJoin(
			table.fetSubjectOfferingClass,
			eq(table.fetSubjectOfferingClassUser.fetSubOffClassId, table.fetSubjectOfferingClass.id)
		)
		.where(
			and(
				eq(table.fetSubjectOfferingClassUser.userId, userId),
				eq(table.fetSubjectOfferingClass.timetableDraftId, timetableDraftId),
				eq(table.fetSubjectOfferingClassUser.isArchived, false),
				eq(table.fetSubjectOfferingClass.isArchived, false)
			)
		);

	return userClasses.map((c) => c.fetSubOffClassId);
}

/**
 * Get all class allocations for the user's FET classes
 */
async function getClassAllocations(fetClassIds: number[]) {
	if (fetClassIds.length === 0) {
		return [];
	}

	const allocations = await db
		.select({
			allocationId: table.fetSubjectClassAllocation.id,
			fetSubOffClassId: table.fetSubjectClassAllocation.fetSubjectOfferingClassId,
			dayId: table.fetSubjectClassAllocation.dayId,
			dayNumber: table.timetableDay.day,
			startPeriodId: table.fetSubjectClassAllocation.startPeriodId,
			endPeriodId: table.fetSubjectClassAllocation.endPeriodId,
			startTime: table.timetablePeriod.startTime,
			spaceId: table.fetSubjectClassAllocation.schoolSpaceId
		})
		.from(table.fetSubjectClassAllocation)
		.innerJoin(table.timetableDay, eq(table.fetSubjectClassAllocation.dayId, table.timetableDay.id))
		.innerJoin(
			table.timetablePeriod,
			eq(table.fetSubjectClassAllocation.startPeriodId, table.timetablePeriod.id)
		)
		.where(
			and(
				inArray(table.fetSubjectClassAllocation.fetSubjectOfferingClassId, fetClassIds),
				eq(table.fetSubjectClassAllocation.isArchived, false)
			)
		);

	// Get end times for allocations
	const endPeriodIds = [...new Set(allocations.map((a) => a.endPeriodId))];
	const endPeriods = await db
		.select({
			id: table.timetablePeriod.id,
			endTime: table.timetablePeriod.endTime
		})
		.from(table.timetablePeriod)
		.where(inArray(table.timetablePeriod.id, endPeriodIds));

	const endPeriodMap = new Map(endPeriods.map((p) => [p.id, p.endTime]));

	return allocations.map((alloc) => ({
		...alloc,
		endTime: endPeriodMap.get(alloc.endPeriodId) || alloc.startTime
	}));
}

/**
 * Get subject offering details for FET classes
 */
async function getSubjectOfferingDetails(fetClassIds: number[]) {
	if (fetClassIds.length === 0) {
		return [];
	}

	const details = await db
		.select({
			fetClassId: table.fetSubjectOfferingClass.id,
			subjectOfferingId: subjectOffering.id,
			subjectName: subject.name,
			className: subjectOfferingClass.name
		})
		.from(table.fetSubjectOfferingClass)
		.innerJoin(
			subjectOffering,
			eq(table.fetSubjectOfferingClass.subjectOfferingId, subjectOffering.id)
		)
		.innerJoin(subject, eq(subjectOffering.subjectId, subject.id))
		.leftJoin(subjectOfferingClass, eq(subjectOffering.id, subjectOfferingClass.subOfferingId))
		.where(inArray(table.fetSubjectOfferingClass.id, fetClassIds));

	return details;
}

/**
 * Get space names for allocations
 */
async function getSpaceNames(spaceIds: number[]) {
	if (spaceIds.length === 0) {
		return new Map<number, string>();
	}

	const spaces = await db
		.select({
			id: schoolSpace.id,
			name: schoolSpace.name
		})
		.from(schoolSpace)
		.where(inArray(schoolSpace.id, spaceIds));

	return new Map(spaces.map((s) => [s.id, s.name]));
}

/**
 * Get all days configured for the timetable draft
 */
async function getTimetableDays(timetableDraftId: number) {
	const days = await db
		.select()
		.from(table.timetableDay)
		.where(eq(table.timetableDay.timetableDraftId, timetableDraftId))
		.orderBy(table.timetableDay.day);

	return days;
}

/**
 * Get cycle week repeats for the timetable draft
 */
async function getCycleWeekRepeats(timetableDraftId: number): Promise<number> {
	const draft = await db
		.select({ cycleWeekRepeats: table.timetableDraft.cycleWeekRepeats })
		.from(table.timetableDraft)
		.where(eq(table.timetableDraft.id, timetableDraftId))
		.limit(1);

	return draft[0]?.cycleWeekRepeats || 1;
}

/**
 * Generate a complete timetable view for a specific user
 */
export async function generateUserTimetable(
	userId: string,
	timetableDraftId: number
): Promise<UserTimetable> {
	// Get user details
	const userDetails = await db
		.select({
			firstName: user.firstName,
			lastName: user.lastName,
			type: user.type
		})
		.from(user)
		.where(eq(user.id, userId))
		.limit(1);

	if (userDetails.length === 0) {
		throw new Error(`User with ID ${userId} not found`);
	}

	const userName = `${userDetails[0].firstName} ${userDetails[0].lastName}`;
	const userType = userDetails[0].type;

	// Get cycle information and days
	const [cycleWeekRepeats, timetableDays] = await Promise.all([
		getCycleWeekRepeats(timetableDraftId),
		getTimetableDays(timetableDraftId)
	]);

	// Get user's FET classes
	const fetClassIds = await getUserFetClasses(userId, timetableDraftId);

	if (fetClassIds.length === 0) {
		// Return empty timetable with all configured days
		const emptyDays: DaySchedule[] = timetableDays.map((day) => ({
			dayNumber: day.day,
			dayName: 'Day ' + day.day,
			sessions: [],
			totalHours: 0
		}));

		return {
			userId,
			userName,
			userType,
			cycleWeekRepeats,
			days: emptyDays,
			totalHoursPerCycle: 0,
			averageHoursPerDay: 0
		};
	}

	// Get all allocations, subject details, and space information
	const [allocations, subjectDetails] = await Promise.all([
		getClassAllocations(fetClassIds),
		getSubjectOfferingDetails(fetClassIds)
	]);

	// Get space names
	const spaceIds = allocations
		.map((a) => a.spaceId)
		.filter((id): id is number => id !== null && id !== undefined);
	const spaceMap = await getSpaceNames(spaceIds);

	// Create maps for quick lookup
	const subjectMap = new Map(subjectDetails.map((s) => [s.fetClassId, s]));

	// Build sessions
	const sessions: ClassSession[] = allocations.map((alloc) => {
		const subject = subjectMap.get(alloc.fetSubOffClassId);
		const spaceName = alloc.spaceId ? spaceMap.get(alloc.spaceId) || null : null;

		return {
			id: alloc.allocationId,
			subjectName: subject?.subjectName || 'Unknown',
			subjectOfferingId: subject?.subjectOfferingId || 0,
			className: subject?.className || '',
			spaceName,
			startTime: alloc.startTime,
			endTime: alloc.endTime,
			durationMinutes: calculateDurationMinutes(alloc.startTime, alloc.endTime),
			dayId: alloc.dayId,
			dayNumber: alloc.dayNumber,
			startPeriodId: alloc.startPeriodId,
			endPeriodId: alloc.endPeriodId
		};
	});

	// Group sessions by day and create day schedules for ALL configured days
	const daySchedules: DaySchedule[] = timetableDays.map((day) => {
		const daySessions = sessions
			.filter((s) => s.dayNumber === day.day)
			.sort((a, b) => a.startTime.localeCompare(b.startTime));

		const totalMinutes = daySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
		const totalHours = totalMinutes / 60;

		return {
			dayNumber: day.day,
			dayName: 'Day ' + day.day,
			sessions: daySessions,
			totalHours
		};
	});

	// Calculate overall statistics
	const totalHoursPerCycle = daySchedules.reduce((sum, day) => sum + day.totalHours, 0);
	const daysWithClasses = daySchedules.filter((day) => day.sessions.length > 0).length;
	const averageHoursPerDay = daysWithClasses > 0 ? totalHoursPerCycle / daysWithClasses : 0;

	return {
		userId,
		userName,
		userType,
		cycleWeekRepeats,
		days: daySchedules,
		totalHoursPerCycle,
		averageHoursPerDay
	};
}

/**
 * Generate timetables for multiple users
 */
export async function generateMultipleUserTimetables(
	userIds: string[],
	timetableDraftId: number
): Promise<UserTimetable[]> {
	const timetables = await Promise.all(
		userIds.map((userId) => generateUserTimetable(userId, timetableDraftId))
	);

	return timetables;
}

/**
 * Get a summary of free periods for a user
 */
export function getFreePeriodsSummary(userTimetable: UserTimetable): {
	totalFreeDays: number;
	daysWithFreePeriods: number;
	longestFreeBlock: { dayName: string; hours: number };
} {
	const freeDays = userTimetable.days.filter((day) => day.sessions.length === 0);
	const totalFreeDays = freeDays.length;

	// Count days with gaps (free periods between classes)
	let daysWithFreePeriods = 0;
	let longestFreeBlock = { dayName: '', hours: 0 };

	for (const day of userTimetable.days) {
		if (day.sessions.length === 0) {
			// Entire day is free
			if (24 > longestFreeBlock.hours) {
				longestFreeBlock = { dayName: day.dayName, hours: 24 };
			}
		} else if (day.sessions.length > 1) {
			// Check for gaps between sessions
			const sortedSessions = [...day.sessions].sort((a, b) =>
				a.startTime.localeCompare(b.startTime)
			);

			for (let i = 0; i < sortedSessions.length - 1; i++) {
				const currentEnd = sortedSessions[i].endTime;
				const nextStart = sortedSessions[i + 1].startTime;

				const gapMinutes = calculateDurationMinutes(currentEnd, nextStart);
				if (gapMinutes > 0) {
					daysWithFreePeriods++;
					const gapHours = gapMinutes / 60;
					if (gapHours > longestFreeBlock.hours) {
						longestFreeBlock = { dayName: day.dayName, hours: gapHours };
					}
					break; // Count each day only once
				}
			}
		}
	}

	return {
		totalFreeDays,
		daysWithFreePeriods,
		longestFreeBlock
	};
}

/**
 * Format timetable for display
 */
export function formatUserTimetableForDisplay(userTimetable: UserTimetable): string {
	const lines: string[] = [];

	lines.push('='.repeat(80));
	lines.push(`TIMETABLE FOR: ${userTimetable.userName} (${userTimetable.userType})`);
	lines.push(`Cycle: ${userTimetable.cycleWeekRepeats} week(s)`);
	lines.push(`Total Hours/Cycle: ${userTimetable.totalHoursPerCycle.toFixed(2)}h`);
	lines.push(`Average Hours/Day: ${userTimetable.averageHoursPerDay.toFixed(2)}h`);
	lines.push('='.repeat(80));
	lines.push('');

	for (const day of userTimetable.days) {
		lines.push(`${day.dayName.toUpperCase()} - ${day.totalHours.toFixed(2)}h`);
		lines.push('-'.repeat(80));

		if (day.sessions.length === 0) {
			lines.push('  No classes scheduled');
		} else {
			for (const session of day.sessions) {
				const spacePart = session.spaceName ? ` @ ${session.spaceName}` : '';
				const classPart = session.className ? ` (${session.className})` : '';
				lines.push(
					`  ${session.startTime} - ${session.endTime} | ${session.subjectName}${classPart}${spacePart}`
				);
			}
		}

		lines.push('');
	}

	const freePeriods = getFreePeriodsSummary(userTimetable);
	lines.push('SUMMARY');
	lines.push('-'.repeat(80));
	lines.push(`Free Days: ${freePeriods.totalFreeDays}`);
	lines.push(`Days with Free Periods: ${freePeriods.daysWithFreePeriods}`);
	if (freePeriods.longestFreeBlock.hours > 0) {
		lines.push(
			`Longest Free Block: ${freePeriods.longestFreeBlock.hours.toFixed(2)}h on ${freePeriods.longestFreeBlock.dayName}`
		);
	}
	lines.push('='.repeat(80));

	return lines.join('\n');
}

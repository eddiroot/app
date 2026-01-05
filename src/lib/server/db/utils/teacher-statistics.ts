import { db } from '$lib/server/db/index';
import { and, eq, inArray } from 'drizzle-orm';
import * as table from '../schema/timetables';
import { user } from '../schema/user';
import type { ClassAllocation } from './student-statistics';

/**
 * Represents a teacher's class assignments with allocations
 */
export type TeacherAssignment = {
	userId: string;
	userName: string;
	userType: string;
	fetSubjectOfferingClassId: number;
	allocations: ClassAllocation[];
};

/**
 * Teacher statistics for display/analysis
 */
export type TeacherStatistic = {
	userId: string;
	userName: string;
	userType: string;
	numberOfAssignedClasses: number;
	totalHoursPerCycle: number;
	averageHoursPerDay: number;
	maxHoursPerDay: number;
	minHoursPerDay: number;
	numberOfFreeDays: number;
	dailyHours: Record<number, number>;
};

/**
 * Fetches all teachers assigned to FET classes for a given timetable draft
 */
export async function getTeacherAssignmentsWithAllocations(
	timetableDraftId: number
): Promise<TeacherAssignment[]> {
	// Get all FET classes for this timetable draft
	const fetClasses = await db
		.select()
		.from(table.fetSubjectOfferingClass)
		.where(
			and(
				eq(table.fetSubjectOfferingClass.timetableDraftId, timetableDraftId),
				eq(table.fetSubjectOfferingClass.isArchived, false)
			)
		);

	if (fetClasses.length === 0) {
		return [];
	}

	const fetClassIds = fetClasses.map((c) => c.id);

	// Get all users (teachers) assigned to these classes
	const teachersInClasses = await db
		.select({
			userId: table.fetSubjectOfferingClassUser.userId,
			fetSubOffClassId: table.fetSubjectOfferingClassUser.fetSubOffClassId,
			firstName: user.firstName,
			lastName: user.lastName,
			userType: user.type
		})
		.from(table.fetSubjectOfferingClassUser)
		.innerJoin(user, eq(table.fetSubjectOfferingClassUser.userId, user.id))
		.where(
			and(
				inArray(table.fetSubjectOfferingClassUser.fetSubOffClassId, fetClassIds),
				eq(table.fetSubjectOfferingClassUser.isArchived, false)
			)
		);

	// Get all allocations for these classes
	const allocations = await db
		.select({
			allocationId: table.fetSubjectClassAllocation.id,
			fetSubOffClassId: table.fetSubjectClassAllocation.fetSubjectOfferingClassId,
			dayId: table.fetSubjectClassAllocation.dayId,
			dayNumber: table.timetableDay.day,
			startPeriodId: table.fetSubjectClassAllocation.startPeriodId,
			endPeriodId: table.fetSubjectClassAllocation.endPeriodId,
			startTime: table.timetablePeriod.startTime,
			endTime: table.timetablePeriod.endTime
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

	// Build assignment objects
	const assignmentMap = new Map<string, TeacherAssignment>();

	for (const teacherClass of teachersInClasses) {
		const key = `${teacherClass.userId}-${teacherClass.fetSubOffClassId}`;
		const userName = `${teacherClass.firstName} ${teacherClass.lastName}`;

		if (!assignmentMap.has(key)) {
			assignmentMap.set(key, {
				userId: teacherClass.userId,
				userName,
				userType: teacherClass.userType,
				fetSubjectOfferingClassId: teacherClass.fetSubOffClassId,
				allocations: []
			});
		}

		const assignment = assignmentMap.get(key)!;

		// Add allocations for this class
		const classAllocations = allocations.filter(
			(a) => a.fetSubOffClassId === teacherClass.fetSubOffClassId
		);

		for (const alloc of classAllocations) {
			const actualEndTime = endPeriodMap.get(alloc.endPeriodId) || alloc.endTime;
			const durationMinutes = calculateDurationMinutes(alloc.startTime, actualEndTime);

			assignment.allocations.push({
				id: alloc.allocationId,
				dayId: alloc.dayId,
				dayNumber: alloc.dayNumber,
				startPeriodId: alloc.startPeriodId,
				endPeriodId: alloc.endPeriodId,
				startTime: alloc.startTime,
				endTime: actualEndTime,
				durationMinutes
			});
		}
	}

	return Array.from(assignmentMap.values());
}

/**
 * Calculates duration in minutes between two time strings (HH:MM:SS format)
 */
function calculateDurationMinutes(startTime: string, endTime: string): number {
	const [startHour, startMin] = startTime.split(':').map(Number);
	const [endHour, endMin] = endTime.split(':').map(Number);

	const startTotalMin = startHour * 60 + startMin;
	const endTotalMin = endHour * 60 + endMin;

	return endTotalMin - startTotalMin;
}

/**
 * Aggregates all assignments for each teacher across all their classes
 */
export function aggregateTeacherAssignments(
	assignments: TeacherAssignment[]
): Map<string, TeacherAssignment[]> {
	const teacherMap = new Map<string, TeacherAssignment[]>();

	for (const assignment of assignments) {
		if (!teacherMap.has(assignment.userId)) {
			teacherMap.set(assignment.userId, []);
		}
		teacherMap.get(assignment.userId)!.push(assignment);
	}

	return teacherMap;
}

/**
 * Calculates statistics for a single teacher from their assignments
 */
export function calculateTeacherStatistic(
	userId: string,
	assignments: TeacherAssignment[]
): TeacherStatistic {
	if (assignments.length === 0) {
		return {
			userId,
			userName: 'Unknown',
			userType: 'teacher',
			numberOfAssignedClasses: 0,
			totalHoursPerCycle: 0,
			averageHoursPerDay: 0,
			maxHoursPerDay: 0,
			minHoursPerDay: 0,
			numberOfFreeDays: 0,
			dailyHours: {}
		};
	}

	// Get user info from first assignment
	const userName = assignments[0].userName;
	const userType = assignments[0].userType;
	const numberOfAssignedClasses = assignments.length;

	// Collect all allocations across all classes
	const allAllocations: ClassAllocation[] = [];
	for (const assignment of assignments) {
		allAllocations.push(...assignment.allocations);
	}

	// Calculate daily hours
	const dailyHours = new Map<number, number>();
	const dailyMinutes = new Map<number, number>();

	for (const allocation of allAllocations) {
		const currentMinutes = dailyMinutes.get(allocation.dayNumber) || 0;
		dailyMinutes.set(allocation.dayNumber, currentMinutes + allocation.durationMinutes);
	}

	// Convert minutes to hours
	for (const [day, minutes] of dailyMinutes.entries()) {
		dailyHours.set(day, minutes / 60);
	}

	// Get all unique days in the cycle
	const allDays = new Set(allAllocations.map((a) => a.dayNumber));
	const uniqueDays = Array.from(allDays).sort((a, b) => a - b);

	// Calculate statistics
	const hoursPerDay = Array.from(dailyHours.values());
	const totalHoursPerCycle = hoursPerDay.reduce((sum, hours) => sum + hours, 0);

	// Calculate average only for days with classes
	const daysWithClasses = hoursPerDay.length;
	const averageHoursPerDay = daysWithClasses > 0 ? totalHoursPerCycle / daysWithClasses : 0;

	const maxHoursPerDay = hoursPerDay.length > 0 ? Math.max(...hoursPerDay) : 0;
	const minHoursPerDay = hoursPerDay.length > 0 ? Math.min(...hoursPerDay) : 0;

	// Determine the total number of days in the cycle based on the highest day number
	const maxDayInCycle = uniqueDays.length > 0 ? Math.max(...uniqueDays) : 0;
	const numberOfFreeDays = maxDayInCycle - daysWithClasses;

	return {
		userId,
		userName,
		userType,
		numberOfAssignedClasses,
		totalHoursPerCycle,
		averageHoursPerDay,
		maxHoursPerDay,
		minHoursPerDay,
		numberOfFreeDays: numberOfFreeDays > 0 ? numberOfFreeDays : 0,
		dailyHours: Object.fromEntries(dailyHours)
	};
}

/**
 * Main function to generate all teacher statistics for a timetable draft
 */
export async function generateTeacherStatistics(
	timetableDraftId: number
): Promise<TeacherStatistic[]> {
	// Fetch all assignments with allocations
	const assignments = await getTeacherAssignmentsWithAllocations(timetableDraftId);

	// Filter only teachers (exclude students)
	const teacherAssignments = assignments.filter(
		(a) => a.userType === 'teacher' || a.userType === 'admin'
	);

	// Aggregate by teacher
	const teacherMap = aggregateTeacherAssignments(teacherAssignments);

	// Calculate statistics for each teacher
	const statistics: TeacherStatistic[] = [];
	for (const [userId, userAssignments] of teacherMap.entries()) {
		const statistic = calculateTeacherStatistic(userId, userAssignments);
		statistics.push(statistic);
	}

	// Sort by teacher name
	statistics.sort((a, b) => a.userName.localeCompare(b.userName));

	return statistics;
}

/**
 * Helper function to get day name from day number (0 = Monday, 4 = Friday)
 */
export function getDayName(dayNumber: number): string {
	const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
	return days[dayNumber] || 'Unknown';
}

/**
 * Utility to get a summary of a teacher's schedule
 */
export function getTeacherScheduleSummary(statistic: TeacherStatistic): string {
	const days = Object.entries(statistic.dailyHours)
		.sort(([a], [b]) => Number(a) - Number(b))
		.map(([day, hours]) => `${getDayName(Number(day))}: ${hours.toFixed(2)}h`)
		.join(', ');

	return `${statistic.userName} (${statistic.numberOfAssignedClasses} classes): ${days}`;
}

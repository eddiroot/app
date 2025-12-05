import { db } from '$lib/server/db/index';
import { calculateDurationMinutes } from '$lib/utils';
import { and, eq, inArray } from 'drizzle-orm';
import type { StudentStatistic } from '../../../../routes/admin/timetables/[timetableId]/[timetableDraftId]/result/student-columns';
import * as table from '../schema/timetables';
import { user } from '../schema/user';

/**
 * Represents a student enrollment with their class allocations
 */
export type StudentEnrollment = {
	userId: string;
	userName: string;
	userType: string;
	fetSubjectOfferingClassId: number;
	allocations: ClassAllocation[];
};

/**
 * Represents a single class allocation with timing information
 */
export type ClassAllocation = {
	id: number;
	dayId: number;
	dayNumber: number;
	startPeriodId: number;
	endPeriodId: number;
	startTime: string;
	endTime: string;
	durationMinutes: number;
};

/**
 * Fetches all students enrolled in FET classes for a given timetable draft
 */
export async function getStudentEnrollmentsWithAllocations(
	timetableDraftId: number
): Promise<StudentEnrollment[]> {
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

	// Get all users enrolled in these classes
	const usersInClasses = await db
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

	// Get end times for allocations (since we joined on start period)
	const endPeriodIds = [...new Set(allocations.map((a) => a.endPeriodId))];
	const endPeriods = await db
		.select({
			id: table.timetablePeriod.id,
			endTime: table.timetablePeriod.endTime
		})
		.from(table.timetablePeriod)
		.where(inArray(table.timetablePeriod.id, endPeriodIds));

	const endPeriodMap = new Map(endPeriods.map((p) => [p.id, p.endTime]));

	// Build enrollment objects
	const enrollmentMap = new Map<string, StudentEnrollment>();

	for (const userClass of usersInClasses) {
		const key = `${userClass.userId}-${userClass.fetSubOffClassId}`;
		const userName = `${userClass.firstName} ${userClass.lastName}`;

		if (!enrollmentMap.has(key)) {
			enrollmentMap.set(key, {
				userId: userClass.userId,
				userName,
				userType: userClass.userType,
				fetSubjectOfferingClassId: userClass.fetSubOffClassId,
				allocations: []
			});
		}
		const enrollment = enrollmentMap.get(key)!;

		// Add allocations for this class
		const classAllocations = allocations.filter(
			(a) => a.fetSubOffClassId === userClass.fetSubOffClassId
		);

		for (const alloc of classAllocations) {
			const actualEndTime = endPeriodMap.get(alloc.endPeriodId) || alloc.endTime;
			const durationMinutes = calculateDurationMinutes(alloc.startTime, actualEndTime);

			enrollment.allocations.push({
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

	return Array.from(enrollmentMap.values());
}

/**
 * Aggregates all enrollments for each student across all their classes
 */
export function aggregateStudentEnrollments(
	enrollments: StudentEnrollment[]
): Map<string, StudentEnrollment[]> {
	const studentMap = new Map<string, StudentEnrollment[]>();

	for (const enrollment of enrollments) {
		if (!studentMap.has(enrollment.userId)) {
			studentMap.set(enrollment.userId, []);
		}
		studentMap.get(enrollment.userId)!.push(enrollment);
	}

	return studentMap;
}

/**
 * Calculates statistics for a single student from their enrollments
 */
export function calculateStudentStatistic(
	userId: string,
	enrollments: StudentEnrollment[]
): StudentStatistic {
	if (enrollments.length === 0) {
		return {
			userId,
			userName: 'Unknown',
			userType: 'student',
			numberOfEnrolledClasses: 0,
			totalHoursPerCycle: 0,
			averageHoursPerDay: 0,
			maxHoursPerDay: 0,
			minHoursPerDay: 0,
			numberOfFreeDays: 0,
			dailyHours: {}
		};
	}

	// Get user info from first enrollment
	const userName = enrollments[0].userName;
	const userType = enrollments[0].userType;
	const numberOfEnrolledClasses = enrollments.length;

	// Collect all allocations across all classes
	const allAllocations: ClassAllocation[] = [];
	for (const enrollment of enrollments) {
		allAllocations.push(...enrollment.allocations);
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
		numberOfEnrolledClasses,
		totalHoursPerCycle,
		averageHoursPerDay,
		maxHoursPerDay,
		minHoursPerDay,
		numberOfFreeDays: numberOfFreeDays > 0 ? numberOfFreeDays : 0,
		dailyHours: Object.fromEntries(dailyHours)
	};
}

/**
 * Main function to generate all student statistics for a timetable draft
 */
export async function generateStudentStatistics(
	timetableDraftId: number
): Promise<StudentStatistic[]> {
	// Fetch all enrollments with allocations
	const enrollments = await getStudentEnrollmentsWithAllocations(timetableDraftId);

	// Filter only students (exclude teachers)
	const studentEnrollments = enrollments.filter((e) => e.userType === 'student');

	// Aggregate by student
	const studentMap = aggregateStudentEnrollments(studentEnrollments);

	// Calculate statistics for each student
	const statistics: StudentStatistic[] = [];
	for (const [userId, userEnrollments] of studentMap.entries()) {
		const statistic = calculateStudentStatistic(userId, userEnrollments);
		statistics.push(statistic);
	}

	// Sort by student name
	statistics.sort((a, b) => a.userName.localeCompare(b.userName));

	return statistics;
}

/**
 * Utility to get a summary of a student's schedule
 */
export function getStudentScheduleSummary(statistic: StudentStatistic): string {
	const days = Object.entries(statistic.dailyHours)
		.sort(([a], [b]) => Number(a) - Number(b))
		.map(([day, hours]) => `Day ${Number(day)}: ${hours.toFixed(2)}h`)
		.join(', ');

	return `${statistic.userName} (${statistic.numberOfEnrolledClasses} classes): ${days}`;
}

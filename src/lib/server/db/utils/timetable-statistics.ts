import type { StudentStatistic } from '../../../../routes/admin/timetables/[timetableId]/[timetableDraftId]/result/student-columns';
import { generateStudentStatistics } from './student-statistics';
import type { TeacherStatistic } from './teacher-statistics';
import { generateTeacherStatistics } from './teacher-statistics';

/**
 * Comprehensive timetable statistics for a draft
 */
export type TimetableStatistics = {
	students: StudentStatistic[];
	teachers: TeacherStatistic[];
	summary: TimetableSummary;
};

/**
 * Summary statistics for the entire timetable
 */
export type TimetableSummary = {
	totalStudents: number;
	totalTeachers: number;
	totalClasses: number;
	averageStudentHoursPerCycle: number;
	averageTeacherHoursPerCycle: number;
	studentWorkloadDistribution: WorkloadDistribution;
	teacherWorkloadDistribution: WorkloadDistribution;
	dayUtilization: Map<number, DayUtilization>;
};

/**
 * Workload distribution metrics
 */
export type WorkloadDistribution = {
	min: number;
	max: number;
	mean: number;
	median: number;
	standardDeviation: number;
};

/**
 * Utilization metrics for a specific day
 */
export type DayUtilization = {
	dayNumber: number;
	dayName: string;
	totalStudentHours: number;
	totalTeacherHours: number;
	averageStudentHours: number;
	averageTeacherHours: number;
	studentsScheduled: number;
	teachersScheduled: number;
};

/**
 * Generate comprehensive statistics for a timetable draft
 */
export async function generateTimetableStatistics(
	timetableDraftId: number
): Promise<TimetableStatistics> {
	// Generate individual statistics
	const students = await generateStudentStatistics(timetableDraftId);
	const teachers = await generateTeacherStatistics(timetableDraftId);

	// Calculate summary
	const summary = calculateTimetableSummary(students, teachers);

	return {
		students,
		teachers,
		summary
	};
}

/**
 * Calculate summary statistics from student and teacher data
 */
function calculateTimetableSummary(
	students: StudentStatistic[],
	teachers: TeacherStatistic[]
): TimetableSummary {
	const totalStudents = students.length;
	const totalTeachers = teachers.length;

	// Calculate unique classes (approximate based on student enrollments)
	const uniqueClassesSet = new Set<number>();
	students.forEach((s) => {
		for (let i = 0; i < s.numberOfEnrolledClasses; i++) {
			uniqueClassesSet.add(i);
		}
	});

	const studentHours = students.map((s) => s.totalHoursPerCycle);
	const teacherHours = teachers.map((t) => t.totalHoursPerCycle);

	const averageStudentHoursPerCycle =
		studentHours.length > 0 ? studentHours.reduce((a, b) => a + b, 0) / studentHours.length : 0;
	const averageTeacherHoursPerCycle =
		teacherHours.length > 0 ? teacherHours.reduce((a, b) => a + b, 0) / teacherHours.length : 0;

	const studentWorkloadDistribution = calculateWorkloadDistribution(studentHours);
	const teacherWorkloadDistribution = calculateWorkloadDistribution(teacherHours);

	const dayUtilization = calculateDayUtilization(students, teachers);

	return {
		totalStudents,
		totalTeachers,
		totalClasses: uniqueClassesSet.size,
		averageStudentHoursPerCycle,
		averageTeacherHoursPerCycle,
		studentWorkloadDistribution,
		teacherWorkloadDistribution,
		dayUtilization
	};
}

/**
 * Calculate workload distribution statistics
 */
function calculateWorkloadDistribution(hours: number[]): WorkloadDistribution {
	if (hours.length === 0) {
		return {
			min: 0,
			max: 0,
			mean: 0,
			median: 0,
			standardDeviation: 0
		};
	}

	const sorted = [...hours].sort((a, b) => a - b);
	const min = sorted[0];
	const max = sorted[sorted.length - 1];
	const mean = hours.reduce((a, b) => a + b, 0) / hours.length;

	// Calculate median
	const mid = Math.floor(sorted.length / 2);
	const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

	// Calculate standard deviation
	const variance = hours.reduce((sum, h) => sum + Math.pow(h - mean, 2), 0) / hours.length;
	const standardDeviation = Math.sqrt(variance);

	return {
		min,
		max,
		mean,
		median,
		standardDeviation
	};
}

/**
 * Calculate utilization statistics for each day
 */
function calculateDayUtilization(
	students: StudentStatistic[],
	teachers: TeacherStatistic[]
): Map<number, DayUtilization> {
	const dayMap = new Map<number, DayUtilization>();

	// Initialize days 0-4
	for (let i = 0; i < 5; i++) {
		dayMap.set(i, {
			dayNumber: i,
			dayName: 'Day ' + i,
			totalStudentHours: 0,
			totalTeacherHours: 0,
			averageStudentHours: 0,
			averageTeacherHours: 0,
			studentsScheduled: 0,
			teachersScheduled: 0
		});
	}

	// Aggregate student hours per day
	for (const student of students) {
		for (const [dayStr, hours] of Object.entries(student.dailyHours)) {
			const dayNumber = Number(dayStr);
			const dayUtil = dayMap.get(dayNumber - 1);
			if (dayUtil && hours > 0) {
				dayUtil.totalStudentHours += hours;
				dayUtil.studentsScheduled++;
			}
		}
	}

	// Aggregate teacher hours per day
	for (const teacher of teachers) {
		for (const [dayStr, hours] of Object.entries(teacher.dailyHours)) {
			const dayNumber = Number(dayStr);
			const dayUtil = dayMap.get(dayNumber - 1);
			if (dayUtil && hours > 0) {
				dayUtil.totalTeacherHours += hours;
				dayUtil.teachersScheduled++;
			}
		}
	}

	// Calculate averages
	for (const dayUtil of dayMap.values()) {
		dayUtil.averageStudentHours =
			dayUtil.studentsScheduled > 0 ? dayUtil.totalStudentHours / dayUtil.studentsScheduled : 0;
		dayUtil.averageTeacherHours =
			dayUtil.teachersScheduled > 0 ? dayUtil.totalTeacherHours / dayUtil.teachersScheduled : 0;
	}

	return dayMap;
}

/**
 * Identify students with potential workload issues
 */
export function identifyWorkloadIssues(
	students: StudentStatistic[],
	maxHoursPerDay: number = 7,
	minHoursPerDay: number = 3
): {
	overloaded: StudentStatistic[];
	underutilized: StudentStatistic[];
	unbalanced: StudentStatistic[];
} {
	const overloaded = students.filter((s) => s.maxHoursPerDay > maxHoursPerDay);
	const underutilized = students.filter((s) => s.averageHoursPerDay < minHoursPerDay);

	// Unbalanced: high standard deviation in daily hours
	const unbalanced = students.filter((s) => {
		const hours = Object.values(s.dailyHours);
		if (hours.length < 2) return false;

		const mean = hours.reduce((a, b) => a + b, 0) / hours.length;
		const variance = hours.reduce((sum, h) => sum + Math.pow(h - mean, 2), 0) / hours.length;
		const stdDev = Math.sqrt(variance);

		// Flag if standard deviation is more than 2 hours
		return stdDev > 2;
	});

	return {
		overloaded,
		underutilized,
		unbalanced
	};
}

/**
 * Identify teachers with potential workload issues
 */
export function identifyTeacherWorkloadIssues(
	teachers: TeacherStatistic[],
	maxHoursPerDay: number = 8,
	minHoursPerDay: number = 2
): {
	overloaded: TeacherStatistic[];
	underutilized: TeacherStatistic[];
	unbalanced: TeacherStatistic[];
} {
	const overloaded = teachers.filter((t) => t.maxHoursPerDay > maxHoursPerDay);
	const underutilized = teachers.filter((t) => t.averageHoursPerDay < minHoursPerDay);

	// Unbalanced: high standard deviation in daily hours
	const unbalanced = teachers.filter((t) => {
		const hours = Object.values(t.dailyHours);
		if (hours.length < 2) return false;

		const mean = hours.reduce((a, b) => a + b, 0) / hours.length;
		const variance = hours.reduce((sum, h) => sum + Math.pow(h - mean, 2), 0) / hours.length;
		const stdDev = Math.sqrt(variance);

		// Flag if standard deviation is more than 2 hours
		return stdDev > 2;
	});

	return {
		overloaded,
		underutilized,
		unbalanced
	};
}

/**
 * Generate a text report of timetable statistics
 */
export function generateStatisticsReport(stats: TimetableStatistics): string {
	const lines: string[] = [];

	lines.push('='.repeat(60));
	lines.push('TIMETABLE STATISTICS REPORT');
	lines.push('='.repeat(60));
	lines.push('');

	lines.push('OVERVIEW');
	lines.push('-'.repeat(60));
	lines.push(`Total Students: ${stats.summary.totalStudents}`);
	lines.push(`Total Teachers: ${stats.summary.totalTeachers}`);
	lines.push(`Total Classes: ${stats.summary.totalClasses}`);
	lines.push('');

	lines.push('STUDENT WORKLOAD');
	lines.push('-'.repeat(60));
	lines.push(`Average Hours/Cycle: ${stats.summary.averageStudentHoursPerCycle.toFixed(2)}h`);
	lines.push(
		`Min: ${stats.summary.studentWorkloadDistribution.min.toFixed(2)}h | Max: ${stats.summary.studentWorkloadDistribution.max.toFixed(2)}h`
	);
	lines.push(
		`Median: ${stats.summary.studentWorkloadDistribution.median.toFixed(2)}h | Std Dev: ${stats.summary.studentWorkloadDistribution.standardDeviation.toFixed(2)}h`
	);
	lines.push('');

	lines.push('TEACHER WORKLOAD');
	lines.push('-'.repeat(60));
	lines.push(`Average Hours/Cycle: ${stats.summary.averageTeacherHoursPerCycle.toFixed(2)}h`);
	lines.push(
		`Min: ${stats.summary.teacherWorkloadDistribution.min.toFixed(2)}h | Max: ${stats.summary.teacherWorkloadDistribution.max.toFixed(2)}h`
	);
	lines.push(
		`Median: ${stats.summary.teacherWorkloadDistribution.median.toFixed(2)}h | Std Dev: ${stats.summary.teacherWorkloadDistribution.standardDeviation.toFixed(2)}h`
	);
	lines.push('');

	lines.push('DAY UTILIZATION');
	lines.push('-'.repeat(60));
	for (const dayUtil of stats.summary.dayUtilization.values()) {
		lines.push(`${dayUtil.dayName}:`);
		lines.push(
			`  Students: ${dayUtil.studentsScheduled} scheduled, avg ${dayUtil.averageStudentHours.toFixed(2)}h`
		);
		lines.push(
			`  Teachers: ${dayUtil.teachersScheduled} scheduled, avg ${dayUtil.averageTeacherHours.toFixed(2)}h`
		);
	}
	lines.push('');

	lines.push('='.repeat(60));

	return lines.join('\n');
}

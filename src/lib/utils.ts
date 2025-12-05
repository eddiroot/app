import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { yearLevelEnum } from './enums';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export enum userPermissions {
	viewLessons = 'view_lessons',
	createTasks = 'create_tasks',
	viewAnalytics = 'view_analytics',
	manageTeachers = 'manage_teachers',
	viewChildGrades = 'view_child_grades',
	viewDashboard = 'view_dashboard',
	viewAdmin = 'view_admin',
	viewCalendar = 'view_calendar',
	viewClassAttendance = 'view_class_attendance',
	viewGuardianAttendance = 'view_guardian_attendance',
	viewNews = 'view_news',
	createNews = 'create_news',
	viewCourseMap = 'view_course_map'
}

export function getPermissions(userType: string): string[] {
	switch (userType) {
		case 'student':
			return [
				userPermissions.viewLessons,
				userPermissions.viewDashboard,
				userPermissions.viewCalendar,
				userPermissions.viewNews
			];
		case 'teacher':
			return [
				userPermissions.viewLessons,
				userPermissions.createTasks,
				userPermissions.viewAnalytics,
				userPermissions.viewCalendar,
				userPermissions.viewDashboard,
				userPermissions.viewClassAttendance,
				userPermissions.viewNews,
				userPermissions.createNews,
				userPermissions.viewCourseMap
			];
		case 'guardian':
			return [
				userPermissions.viewChildGrades,
				userPermissions.viewLessons,
				userPermissions.viewCalendar,
				userPermissions.viewDashboard,
				userPermissions.viewGuardianAttendance,
				userPermissions.viewNews
			];
		case 'principal':
			return [
				userPermissions.manageTeachers,
				userPermissions.viewAnalytics,
				userPermissions.viewCalendar,
				userPermissions.viewDashboard,
				userPermissions.viewClassAttendance,
				userPermissions.viewNews,
				userPermissions.createNews,
				userPermissions.viewCourseMap
			];
		case 'schoolAdmin':
			return [
				userPermissions.viewAdmin,
				userPermissions.viewDashboard,
				userPermissions.viewCalendar,
				userPermissions.viewAnalytics,
				userPermissions.manageTeachers,
				userPermissions.viewLessons,
				userPermissions.viewClassAttendance,
				userPermissions.viewNews,
				userPermissions.createNews,
				userPermissions.viewCourseMap
			];
		case 'systemAdmin':
			return [
				userPermissions.viewAdmin,
				userPermissions.viewDashboard,
				userPermissions.viewCalendar,
				userPermissions.viewAnalytics,
				userPermissions.manageTeachers,
				userPermissions.viewLessons,
				userPermissions.viewClassAttendance,
				userPermissions.viewNews,
				userPermissions.createNews,
				userPermissions.viewCourseMap
			];
		default:
			return [];
	}
}

export function convertToFullName(
	firstName: string | null | undefined,
	middleName: string | null | undefined,
	lastName: string | null | undefined
): string {
	const parts: string[] = [];
	if (firstName) {
		parts.push(firstName);
	}
	if (middleName) {
		parts.push(middleName);
	}
	if (lastName) {
		parts.push(lastName);
	}

	return parts.join(' ').trim();
}

export function yearLevelToLabel(yearLevel: string): string {
	switch (yearLevel) {
		case yearLevelEnum.foundation:
			return 'Foundation';
		case yearLevelEnum.year1:
			return 'Year 1';
		case yearLevelEnum.year2:
			return 'Year 2';
		case yearLevelEnum.year3:
			return 'Year 3';
		case yearLevelEnum.year4:
			return 'Year 4';
		case yearLevelEnum.year5:
			return 'Year 5';
		case yearLevelEnum.year6:
			return 'Year 6';
		case yearLevelEnum.year7:
			return 'Year 7';
		case yearLevelEnum.year8:
			return 'Year 8';
		case yearLevelEnum.year9:
			return 'Year 9';
		case yearLevelEnum.year10:
			return 'Year 10';
		case yearLevelEnum.year10A:
			return 'Year 10A';
		case yearLevelEnum.year11:
			return 'Year 11';
		case yearLevelEnum.year12:
			return 'Year 12';
		case yearLevelEnum.year13:
			return 'Year 13';
		case yearLevelEnum.none:
			return 'No Year Level';
		default:
			return yearLevel;
	}
}

export function formatTime(time: string): string {
	const [hours, minutes] = time.split(':').map(Number);
	const period = hours >= 12 ? 'pm' : 'am';
	const displayHours = hours % 12 || 12;
	return `${displayHours}:${minutes.toString().padStart(2, '0')}${period}`;
}

export function formatTimer(seconds: number): string {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = Math.floor(seconds % 60);

	if (hours > 0) {
		return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	}
	return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function formatTimestamp(timestamp: Date): string {
	return timestamp
		.toLocaleDateString('en-AU', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			hour12: true
		})
		.replace(/\s(?=am|pm)/g, '');
}

export function formatTimestampAsDate(timestamp: Date): string {
	return timestamp.toLocaleDateString('en-AU', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	});
}

export function formatTimestampAsTime(timestamp: Date): string {
	return timestamp
		.toLocaleTimeString('en-AU', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: true
		})
		.replace(/\s/g, '');
}

export function toLocalDatetimeString(date: Date | string | null): string {
	if (!date) return '';
	const d = new Date(date);
	// Adjust for timezone offset to get local time
	const offset = d.getTimezoneOffset() * 60000; // offset in milliseconds
	const localTime = new Date(d.getTime() - offset);
	return localTime.toISOString().slice(0, 16);
}

export function formatDate(dateString: string) {
	const date = new Date(dateString);
	return date.toLocaleDateString('en-AU', { day: '2-digit', month: 'short' });
}

export const days = [
	{ name: 'Monday', shortName: 'Mon', value: 'monday', number: 1 },
	{ name: 'Tuesday', shortName: 'Tue', value: 'tuesday', number: 2 },
	{ name: 'Wednesday', shortName: 'Wed', value: 'wednesday', number: 3 },
	{ name: 'Thursday', shortName: 'Thu', value: 'thursday', number: 4 },
	{ name: 'Friday', shortName: 'Fri', value: 'friday', number: 5 }
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

// CSV utilities
export function parseCSVHeaders(csvText: string): string[] {
	const lines = csvText.split('\n');
	if (lines.length === 0) return [];
	const headerLine = lines[0].trim();
	return headerLine.split(',').map((header) => header.trim().replace(/['"]/g, ''));
}

export interface CSVValidationResult {
	isValid: boolean;
	foundColumns: string[];
	missingColumns: string[];
	extraColumns: string[];
}

export async function validateCSVFile(
	file: File,
	requiredColumns: string[],
	optionalColumns: string[] = []
): Promise<CSVValidationResult> {
	try {
		const text = await file.text();
		const foundColumns = parseCSVHeaders(text);

		const missingColumns = requiredColumns.filter(
			(col) => !foundColumns.some((found) => found.toLowerCase() === col.toLowerCase())
		);

		const extraColumns = foundColumns.filter(
			(col) =>
				!requiredColumns.some((req) => req.toLowerCase() === col.toLowerCase()) &&
				!optionalColumns.some((opt) => opt.toLowerCase() === col.toLowerCase())
		);

		return {
			isValid: missingColumns.length === 0,
			foundColumns,
			missingColumns,
			extraColumns
		};
	} catch (error) {
		console.error('Error validating CSV:', error);
		return {
			isValid: false,
			foundColumns: [],
			missingColumns: requiredColumns,
			extraColumns: []
		};
	}
}

// CSV parsing utilities
export function parseCSVRow(row: string): string[] {
	const values: string[] = [];
	let current = '';
	let inQuotes = false;
	let i = 0;

	while (i < row.length) {
		const char = row[i];
		const nextChar = row[i + 1];

		if (char === '"') {
			if (inQuotes && nextChar === '"') {
				// Escaped quote
				current += '"';
				i += 2;
			} else {
				// Toggle quote state
				inQuotes = !inQuotes;
				i++;
			}
		} else if (char === ',' && !inQuotes) {
			// End of field
			values.push(current.trim());
			current = '';
			i++;
		} else {
			current += char;
			i++;
		}
	}

	// Add the last field
	values.push(current.trim());
	return values;
}

/**
 * Calculates duration in minutes between two time strings (HH:MM:SS format)
 */
export function calculateDurationMinutes(startTime: string, endTime: string): number {
	const [startHour, startMin] = startTime.split(':').map(Number);
	const [endHour, endMin] = endTime.split(':').map(Number);

	const startTotalMin = startHour * 60 + startMin;
	const endTotalMin = endHour * 60 + endMin;

	return endTotalMin - startTotalMin;
}

export function parseCSVData(csvText: string): Array<Record<string, string>> {
	const lines = csvText.split('\n').filter((line) => line.trim());
	if (lines.length <= 1) return [];

	const headers = parseCSVRow(lines[0]).map((h) => h.toLowerCase());
	const data: Array<Record<string, string>> = [];

	for (let i = 1; i < lines.length; i++) {
		const values = parseCSVRow(lines[i]);
		if (values.length >= headers.length && values.some((v) => v.trim())) {
			const rowData: Record<string, string> = {};
			headers.forEach((header, index) => {
				rowData[header] = values[index] || '';
			});
			data.push(rowData);
		}
	}

	return data;
}

import { subjectClassAllocationAttendanceStatus } from '$lib/enums.js';
import { CalendarDate, getLocalTimeZone, type DateValue } from '@internationalized/date';
import type { ScheduleWithAttendanceRecord } from './+page.server.js';

export type { ScheduleWithAttendanceRecord };

export function getRecordsForDate(
	records: ScheduleWithAttendanceRecord[],
	selectedDate: DateValue | undefined
): ScheduleWithAttendanceRecord[] {
	if (!selectedDate || !records?.length) return [];

	return records.filter((record) => {
		const recordDate = dateValueToCalendarDate(new Date(record.subjectClassAllocation.date));
		return selectedDate.compare(recordDate) === 0;
	});
}

export function hasClassesOnDate(
	records: ScheduleWithAttendanceRecord[],
	selectedDate: DateValue | undefined
): boolean {
	return getRecordsForDate(records, selectedDate).length > 0;
}

export type AttendanceStatus = 'all-present' | 'all-absent' | 'mixed' | 'none';

export function getAttendanceStatusForDay(
	records: ScheduleWithAttendanceRecord[],
	day: DateValue
): AttendanceStatus {
	const recordsForDay = getRecordsForDate(records, day);
	const attendanceRecords = recordsForDay.filter((record) => record.attendance !== null);

	if (!attendanceRecords.length) return 'none';

	const allPresent = attendanceRecords.every(
		(record) => record.attendance?.status === subjectClassAllocationAttendanceStatus.present
	);
	const allAbsent = attendanceRecords.every(
		(record) => record.attendance?.status === subjectClassAllocationAttendanceStatus.absent
	);

	if (allPresent) return 'all-present';
	if (allAbsent) return 'all-absent';
	return 'mixed';
}

export function getAttendanceStyleClasses(status: AttendanceStatus): string {
	const statusStyles = {
		'all-present':
			'!bg-success hover:!bg-success !text-success-foreground hover:!text-success-foreground',
		'all-absent':
			'!bg-destructive hover:!bg-destructive !text-destructive-foreground hover:!text-destructive-foreground',
		mixed:
			'!bg-secondary hover:!bg-secondary !text-secondary-foreground hover:!text-secondary-foreground',
		none: ''
	};

	return statusStyles[status];
}

export function dateValueToCalendarDate(date: Date): CalendarDate {
	return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

export function isDateInFuture(date: DateValue | undefined): boolean {
	if (!date) return false;
	const selectedDate = date.toDate(getLocalTimeZone());
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	selectedDate.setHours(0, 0, 0, 0);
	return selectedDate > today;
}

export function isDateToday(date: DateValue | undefined): boolean {
	if (!date) return false;
	const selectedDate = date.toDate(getLocalTimeZone());
	const today = new Date();
	return (
		selectedDate.getFullYear() === today.getFullYear() &&
		selectedDate.getMonth() === today.getMonth() &&
		selectedDate.getDate() === today.getDate()
	);
}

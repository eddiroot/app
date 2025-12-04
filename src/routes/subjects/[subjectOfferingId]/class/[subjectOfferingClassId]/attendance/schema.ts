import { subjectClassAllocationAttendanceStatus } from '$lib/enums';
import type { SubjectClassAllocationAttendance } from '$lib/server/db/schema';
import { z } from 'zod';

export const attendanceSchema = z.object({
	subjectClassAllocationId: z.number(),
	userId: z.string(),
	status: z.enum([
		subjectClassAllocationAttendanceStatus.absent,
		subjectClassAllocationAttendanceStatus.present
	]),
	attendanceNote: z.string().optional(),
	note: z.string().optional(),
	behaviourQuickActionIds: z.array(z.string()).optional()
});

export type AttendanceSchema = typeof attendanceSchema;

export type AttendanceFormData = Pick<
	SubjectClassAllocationAttendance,
	'subjectClassAllocationId' | 'userId' | 'status' | 'attendanceNote' | 'note'
> & {
	behaviourQuickActionIds?: number[];
};

export type AttendanceUpdate = Omit<AttendanceFormData, 'subjectClassAllocationId' | 'userId'> & {
	subjectClassAllocationId: number;
	userId: string;
};

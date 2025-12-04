import { subjectClassAllocationAttendanceStatus } from '$lib/enums';
import { z } from 'zod';

export const attendanceSchema = z.object({
	subjectClassAllocationId: z.number().min(1, 'Subject Class Allocation ID is required'),
	userId: z.string().min(1, 'User ID is required'),
	status: z.enum([
		subjectClassAllocationAttendanceStatus.absent,
		subjectClassAllocationAttendanceStatus.present
	]),
	noteTeacher: z.string().optional(),
	behaviourQuickActionIds: z.array(z.string()).optional().default([])
});

export type AttendanceSchema = typeof attendanceSchema;

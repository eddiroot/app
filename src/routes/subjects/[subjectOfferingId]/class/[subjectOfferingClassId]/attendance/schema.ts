import { subjectClassAllocationAttendanceStatus } from '$lib/enums'
import { z } from 'zod'

export const attendanceSchema = z.object({
	subjectClassAllocationId: z
		.number()
		.min(1, 'Subject Class Allocation ID is required'),
	userId: z.string().min(1, 'User ID is required'),
	status: z.enum([
		subjectClassAllocationAttendanceStatus.absent,
		subjectClassAllocationAttendanceStatus.present,
	]),
	noteTeacher: z.string().optional(),
	behaviourIds: z.array(z.string()).optional().default([]),
})

export const bulkApplyBehavioursSchema = z.object({
	subjectClassAllocationId: z
		.number()
		.min(1, 'Subject Class Allocation ID is required'),
	userIds: z.array(z.string()).min(1, 'At least one user must be selected'),
	behaviourIds: z
		.array(z.string())
		.min(1, 'At least one behaviour must be selected'),
})

export const classPassSchema = z.object({
	subjectClassAllocationId: z
		.number()
		.min(1, 'Subject Class Allocation ID is required'),
	userId: z.string().min(1, 'User ID is required'),
})

export type AttendanceSchema = typeof attendanceSchema
export type BulkApplyBehavioursSchema = typeof bulkApplyBehavioursSchema
export type ClassPassSchema = typeof classPassSchema

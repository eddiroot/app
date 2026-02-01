import { z } from 'zod';

export const markAbsentSchema = z.object({
	studentId: z.string().min(1, 'Student ID is required'),
	date: z.date(),
	noteGuardian: z.string().min(1, 'Note is required'),
});

export type MarkAbsentSchema = typeof markAbsentSchema;

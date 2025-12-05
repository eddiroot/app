import { z } from 'zod';

const currentYear = new Date().getFullYear();

export const createTimetableSchema = z.object({
	name: z
		.string()
		.min(1, 'Timetable name is required')
		.max(255, 'Name must be 255 characters or less'),
	schoolYear: z
		.number()
		.int()
		.min(currentYear, `Year must be ${currentYear} or later`)
		.default(currentYear),
	schoolSemester: z
		.number()
		.int('Please select a semester')
		.positive('Please select a valid semester')
		.refine((val) => val > 0, 'Please select a semester')
});

export type CreateTimetableSchema = typeof createTimetableSchema;

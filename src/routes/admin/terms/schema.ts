import { z } from 'zod';

export const changeYearSchema = z.object({
	year: z.coerce.number().int().positive()
});

export const createTermSchema = z
	.object({
		semesterId: z.coerce.number().int().positive(),
		name: z.string().min(1, 'Term name is required'),
		startDate: z.coerce.date(),
		endDate: z.coerce.date(),
		currentYear: z.coerce.number().int().positive()
	})
	.refine((data) => data.endDate > data.startDate, {
		message: 'End date must be after start date',
		path: ['endDate']
	});

export const updateTermSchema = z
	.object({
		termId: z.coerce.number().int().positive(),
		startDate: z.coerce.date(),
		endDate: z.coerce.date(),
		currentYear: z.coerce.number().int().positive()
	})
	.refine((data) => data.endDate > data.startDate, {
		message: 'End date must be after start date',
		path: ['endDate']
	});

export const deleteTermSchema = z.object({
	termId: z.coerce.number().int().positive(),
	currentYear: z.coerce.number().int().positive()
});

export type ChangeYearSchema = typeof changeYearSchema;
export type CreateTermSchema = typeof createTermSchema;
export type UpdateTermSchema = typeof updateTermSchema;
export type DeleteTermSchema = typeof deleteTermSchema;

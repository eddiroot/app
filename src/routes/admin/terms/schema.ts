import { z } from 'zod'

export const changeYearSchema = z.object({
	year: z.coerce.number().int().positive(),
})

export const createTermSchema = z
	.object({
		semesterId: z.coerce.number().int().positive(),
		name: z.string().min(1, 'Term name is required'),
		start: z.coerce.date(),
		end: z.coerce.date(),
		currentYear: z.coerce.number().int().positive(),
	})
	.refine((data) => data.end > data.start, {
		message: 'End date must be after start date',
		path: ['endDate'],
	})

export const updateTermSchema = z
	.object({
		termId: z.coerce.number().int().positive(),
		start: z.coerce.date(),
		end: z.coerce.date(),
		currentYear: z.coerce.number().int().positive(),
	})
	.refine((data) => data.end > data.start, {
		message: 'End date must be after start date',
		path: ['endDate'],
	})

export const archiveTermSchema = z.object({
	termId: z.coerce.number().int().positive(),
	currentYear: z.coerce.number().int().positive(),
})

export type ChangeYearSchema = typeof changeYearSchema
export type CreateTermSchema = typeof createTermSchema
export type UpdateTermSchema = typeof updateTermSchema
export type ArchiveTermSchema = typeof archiveTermSchema

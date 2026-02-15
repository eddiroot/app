import { z } from 'zod';

export const createSemesterSchema = z.object({
	year: z.coerce.number().int().positive(),
});

export const createTermSchema = z.object({
	semesterId: z.coerce.number().int().positive(),
});

export const deleteSemesterSchema = z.object({
	semesterId: z.coerce.number().int().positive(),
});

export const deleteTermSchema = z.object({
	termId: z.coerce.number().int().positive(),
});

export const updateTermSchema = z.object({
	termId: z.coerce.number().int().positive(),
	start: z.coerce.date(),
	end: z.coerce.date(),
});

export type CreateSemesterSchema = typeof createSemesterSchema;
export type CreateTermSchema = typeof createTermSchema;
export type UpdateTermSchema = typeof updateTermSchema;
export type DeleteSemesterSchema = typeof deleteSemesterSchema;
export type DeleteTermSchema = typeof deleteTermSchema;

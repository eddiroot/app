import { z } from 'zod';

export const createActivitySchema = z.object({
	duration: z
		.number()
		.int()
		.min(1, 'Duration must be at least 1 period')
		.max(20, 'Duration must be at most 20 periods'),
});

export const editActivitySchema = z.object({
	activityId: z.number().int().positive('Activity ID is required'),
	duration: z
		.number()
		.int()
		.min(1, 'Duration must be at least 1 period')
		.max(20, 'Duration must be at most 20 periods'),
});

export const deleteActivitySchema = z.object({
	activityId: z.coerce.number(),
});

export type CreateActivitySchema = typeof createActivitySchema;
export type EditActivitySchema = typeof editActivitySchema;
export type DeleteActivitySchema = typeof deleteActivitySchema;

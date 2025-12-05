import { yearLevelEnum } from '$lib/enums';
import { z } from 'zod';

export const createGroupSchema = z.object({
	name: z.string().min(1, 'Group name is required').max(255, 'Name must be 255 characters or less'),
	yearLevel: z.enum(yearLevelEnum, {
		message: 'Year level is required'
	})
});

export const randomlyAssignSchema = z.object({
	yearLevel: z.enum(yearLevelEnum, {
		message: 'Year level is required'
	})
});

export type CreateGroupSchema = typeof createGroupSchema;
export type RandomlyAssignSchema = typeof randomlyAssignSchema;

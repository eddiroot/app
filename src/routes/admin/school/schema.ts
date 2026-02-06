import { imageSchema } from '$lib/schema/resource';
import { z } from 'zod';

export const schoolFormSchema = z.object({
	name: z
		.string()
		.min(1, 'School name cannot be empty')
		.max(255, 'School name cannot exceed 255 characters'),
	logo: imageSchema,
});

export type SchoolFormSchema = typeof schoolFormSchema;

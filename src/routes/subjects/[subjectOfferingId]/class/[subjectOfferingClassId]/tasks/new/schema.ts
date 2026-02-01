import { taskTypeEnum } from '$lib/enums';
import { filesSchema } from '$lib/schema/resource';
import { z } from 'zod';

export const formSchema = z.object({
	title: z.string().min(1, 'Title cannot be empty'),
	description: z.string().max(500, 'Description cannot exceed 500 characters'),
	taskTopicId: z.string(),
	type: z.enum(taskTypeEnum).default(taskTypeEnum.lesson),
	dueDate: z.date().optional(),
	week: z.number().optional(),
	files: filesSchema.optional(),
	creationMethod: z.enum(['manual', 'ai']),
	aiTutorEnabled: z.boolean().default(true),
});

export type FormSchema = typeof formSchema;

import { taskTypeEnum } from '$lib/enums';
import { filesOptionalSchema } from '$lib/schema/resource';
import { z } from 'zod';

export const formSchema = z.object({
	title: z.string().min(1, 'Title cannot be empty'),
	description: z.string().max(500, 'Description cannot exceed 500 characters'),
	taskTopicId: z.string().min(1, 'Please select a topic'),
	type: z.enum(taskTypeEnum).default(taskTypeEnum.lesson),
	dueDate: z.date().optional(),
	week: z.number().optional(),
	files: filesOptionalSchema,
});

export type FormSchema = typeof formSchema;

import { subjectThreadResponseTypeEnum } from '$lib/enums';
import { z } from 'zod';

export const formSchema = z.object({
	type: z.enum(subjectThreadResponseTypeEnum),
	content: z.string().min(1, 'Content cannot be empty'),
	parentResponseId: z.number().optional(),
	isAnonymous: z.boolean().default(false)
});

export type FormSchema = typeof formSchema;

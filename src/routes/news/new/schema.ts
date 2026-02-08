import { newsVisibilityEnum } from '$lib/enums'
import { imagesSchema } from '$lib/schema/resource'
import { z } from 'zod'

export const newsFormSchema = z.object({
	title: z
		.string()
		.min(1, 'Title is required')
		.max(200, 'Title cannot exceed 200 characters'),
	excerpt: z
		.string()
		.max(500, 'Excerpt cannot exceed 500 characters')
		.optional(),
	content: z.string().min(1, 'Content is required'),
	categoryId: z.number().optional(),
	campusId: z.number().optional(),
	visibility: z
		.enum([
			newsVisibilityEnum.public,
			newsVisibilityEnum.internal,
			newsVisibilityEnum.staff,
			newsVisibilityEnum.students,
		])
		.default(newsVisibilityEnum.public),
	tags: z.string().optional(),
	isPinned: z.boolean().default(false),
	publishedAt: z.date().optional(),
	expiresAt: z.date().optional(),
	images: imagesSchema.optional(),
	action: z.enum(['save_draft', 'publish']).default('save_draft'),
})

export type NewsFormSchema = typeof newsFormSchema

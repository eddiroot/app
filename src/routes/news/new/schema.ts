import { newsVisibilityEnum } from '$lib/enums';
import { z } from 'zod';

const MAX_MB_COUNT = 10;
const MAX_UPLOAD_SIZE = 1024 * 1024 * MAX_MB_COUNT;

const ACCEPTED_IMAGE_TYPES = [
	'image/png',
	'image/jpeg',
	'image/jpg',
	'image/webp',
];
const ACCEPTED_IMAGE_TYPES_HR = ACCEPTED_IMAGE_TYPES.map((type) =>
	type.split('/')[1].toUpperCase(),
).join(', ');

export const imageSchema = z
	.instanceof(File)
	.refine((file) => {
		return file.size <= MAX_UPLOAD_SIZE;
	}, `File size must be less than ${MAX_MB_COUNT}MB`)
	.refine((file) => {
		return ACCEPTED_IMAGE_TYPES.includes(file.type);
	}, `File must be one of ${ACCEPTED_IMAGE_TYPES_HR}`);

export const imagesSchema = z
	.array(
		z
			.instanceof(File)
			.refine((file) => file.size <= MAX_UPLOAD_SIZE, {
				message: `File size must be less than ${MAX_MB_COUNT}MB`,
			})
			.refine(
				(file) => {
					return ACCEPTED_IMAGE_TYPES.includes(file.type);
				},
				{ message: `File must be one of ${ACCEPTED_IMAGE_TYPES_HR}` },
			),
	)
	.max(10, 'Maximum 10 images allowed')
	.optional();

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
	images: imagesSchema,
	action: z.enum(['save_draft', 'publish']).default('save_draft'),
});

export type ImageSchema = typeof imageSchema;
export type ImagesSchema = typeof imagesSchema;
export type NewsFormSchema = typeof newsFormSchema;

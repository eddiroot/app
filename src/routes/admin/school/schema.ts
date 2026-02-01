import { z } from 'zod';

export const schoolFormSchema = z.object({
	name: z
		.string()
		.min(1, 'School name cannot be empty')
		.max(255, 'School name cannot exceed 255 characters'),
	logo: z
		.instanceof(File)
		.optional()
		.refine((file) => !file || file.size > 0, 'Please select a logo file')
		.refine(
			(file) => !file || file.size <= 5 * 1024 * 1024,
			'Logo file must be smaller than 5MB',
		)
		.refine(
			(file) =>
				!file ||
				['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(
					file.type,
				),
			'Logo must be a JPEG, PNG, or WebP image',
		),
});

export type SchoolFormSchema = typeof schoolFormSchema;

import { z } from 'zod';

const MAX_MB_COUNT = 50;
const MAX_UPLOAD_SIZE = 1024 * 1024 * MAX_MB_COUNT;

const ACCEPTED_FILE_TYPES = [
	// Images
	{ mime: 'image/png', extension: 'PNG' },
	{ mime: 'image/jpeg', extension: 'JPEG' },
	{ mime: 'image/jpg', extension: 'JPG' },
	{ mime: 'image/gif', extension: 'GIF' },
	{ mime: 'image/bmp', extension: 'BMP' },
	{ mime: 'image/webp', extension: 'WEBP' },
	{ mime: 'image/svg+xml', extension: 'SVG' },
	// Videos
	{ mime: 'video/mp4', extension: 'MP4' },
	{ mime: 'video/quicktime', extension: 'MOV' },
	{ mime: 'video/x-msvideo', extension: 'AVI' },
	{ mime: 'video/x-matroska', extension: 'MKV' },
	{ mime: 'video/webm', extension: 'WEBM' },
	{ mime: 'video/x-ms-wmv', extension: 'WMV' },
	// Audio
	{ mime: 'audio/mpeg', extension: 'MP3' },
	{ mime: 'audio/wav', extension: 'WAV' },
	{ mime: 'audio/ogg', extension: 'OGG' },
	{ mime: 'audio/flac', extension: 'FLAC' },
	{ mime: 'audio/mp4', extension: 'M4A' },
	// Documents
	{ mime: 'application/pdf', extension: 'PDF' },
	{ mime: 'application/msword', extension: 'DOC' },
	{
		mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		extension: 'DOCX',
	},
	{ mime: 'text/plain', extension: 'TXT' },
	{ mime: 'application/rtf', extension: 'RTF' },
	{ mime: 'application/vnd.ms-excel', extension: 'XLS' },
	{
		mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		extension: 'XLSX',
	},
	{ mime: 'application/vnd.ms-powerpoint', extension: 'PPT' },
	{
		mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
		extension: 'PPTX',
	},
	{ mime: 'text/csv', extension: 'CSV' },
	// Compressed Formats
	{ mime: 'application/zip', extension: 'ZIP' },
	{ mime: 'application/x-zip-compressed', extension: 'ZIP' },
];

// File schema for single resource upload
export const resourceFileSchema = z
	.instanceof(File)
	.refine((file) => {
		return file.size <= MAX_UPLOAD_SIZE;
	}, `File size must be less than ${MAX_MB_COUNT}MB`)
	.refine(
		(file) => {
			return ACCEPTED_FILE_TYPES.map((ft) => ft.mime).includes(file.type);
		},
		`File must be one of: ${ACCEPTED_FILE_TYPES.map((ft) => ft.extension).join(', ')}`,
	);

// Multiple files schema for batch uploads
export const resourceFilesSchema = z
	.array(resourceFileSchema)
	.min(1, 'At least one file is required')
	.max(10, 'Maximum 10 files allowed per upload');

// Base resource schema for creating resources
export const createResourceSchema = z.object({
	fileName: z
		.string()
		.min(1, 'File name is required')
		.max(255, 'File name must not exceed 255 characters'),
	file: resourceFileSchema,
	description: z
		.string()
		.max(500, 'Description cannot exceed 500 characters')
		.optional(),
});

// Schema for updating resource metadata
export const updateResourceSchema = z.object({
	fileName: z
		.string()
		.min(1, 'File name is required')
		.max(255, 'File name must not exceed 255 characters')
		.optional(),
	description: z
		.string()
		.max(500, 'Description cannot exceed 500 characters')
		.optional(),
	isArchived: z.boolean().optional(),
});

// Schema for resource upload form (multiple files)
export const resourceUploadFormSchema = z.object({
	files: resourceFilesSchema,
	description: z
		.string()
		.max(500, 'Description cannot exceed 500 characters')
		.optional(),
});

// Schema for linking resources to entities (course items, lesson plans, etc.)
export const resourceLinkSchema = z.object({
	resourceId: z.number().positive('Resource ID must be a positive number'),
	entityId: z.number().positive('Entity ID must be a positive number'),
	entityType: z.enum([
		'courseMapItem',
		'lessonPlan',
		'assessmentPlan',
		'subjectOfferingClass',
		'task',
	]),
	description: z
		.string()
		.max(250, 'Link description cannot exceed 250 characters')
		.optional(),
});

// Validation schema for resource queries/filters
export const resourceQuerySchema = z.object({
	search: z
		.string()
		.max(100, 'Search term cannot exceed 100 characters')
		.optional(),
	isArchived: z.boolean().default(false),
	limit: z.number().min(1).max(100).default(20),
	offset: z.number().min(0).default(0),
	sortBy: z
		.enum(['fileName', 'createdAt', 'fileSize', 'resourceType'])
		.default('createdAt'),
	sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ResourceFileSchema = typeof resourceFileSchema;
export type ResourceFilesSchema = typeof resourceFilesSchema;
export type CreateResourceSchema = typeof createResourceSchema;
export type UpdateResourceSchema = typeof updateResourceSchema;
export type ResourceUploadFormSchema = typeof resourceUploadFormSchema;
export type ResourceLinkSchema = typeof resourceLinkSchema;
export type ResourceQuerySchema = typeof resourceQuerySchema;

export type ResourceFile = z.infer<typeof resourceFileSchema>;
export type ResourceFiles = z.infer<typeof resourceFilesSchema>;
export type CreateResource = z.infer<typeof createResourceSchema>;
export type UpdateResource = z.infer<typeof updateResourceSchema>;
export type ResourceUploadForm = z.infer<typeof resourceUploadFormSchema>;
export type ResourceLink = z.infer<typeof resourceLinkSchema>;
export type ResourceQuery = z.infer<typeof resourceQuerySchema>;

export { ACCEPTED_FILE_TYPES, MAX_MB_COUNT, MAX_UPLOAD_SIZE };

import z from 'zod';

const MIN_KB_COUNT = 10;
const MIN_UPLOAD_SIZE_BYTES = 10_000; // 10KB
const MAX_MB_COUNT = 10;
const MAX_UPLOAD_SIZE_BYTES = 10_000_000; // 10MB

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

export function getFileTypeFromMimeType(mimeType: string): string {
	if (mimeType.startsWith('image/')) return 'image';
	if (mimeType.startsWith('video/')) return 'video';
	if (mimeType.startsWith('audio/')) return 'audio';
	if (mimeType === 'application/pdf') return 'pdf';
	if (mimeType.includes('document')) return 'document';
	return 'document';
}

const fileSchema = z
	.file()
	.min(MIN_UPLOAD_SIZE_BYTES, `Files must be at least ${MIN_KB_COUNT}KB`)
	.max(MAX_UPLOAD_SIZE_BYTES, `Files must be less than ${MAX_MB_COUNT}MB`)
	.mime(
		ACCEPTED_FILE_TYPES.map((t) => t.mime),
		'File is not one of the accepted types',
	);

const filesSchema = z
	.array(fileSchema)
	.min(1, 'At least one file is required')
	.max(10, 'Maximum 10 files allowed');

const filesOptionalSchema = z.preprocess((val) => {
	if (!Array.isArray(val)) return undefined;
	const filtered = val.filter((f) => f !== undefined);
	return filtered.length === 0 ? undefined : filtered;
}, z.array(fileSchema).max(10, 'Maximum 10 files allowed').optional());

const imageSchema = fileSchema.refine(
	(file) => file.type.startsWith('image/'),
	{ message: 'File must be an image' },
);

const imagesSchema = z
	.array(imageSchema)
	.min(1, 'At least one image is required')
	.max(10, 'Maximum 10 images allowed');

export {
	fileSchema,
	filesOptionalSchema,
	filesSchema,
	imageSchema,
	imagesSchema,
};

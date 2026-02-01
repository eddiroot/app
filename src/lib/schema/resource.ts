import z from 'zod';

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

const fileSchema = z
	.instanceof(File)
	.refine((file) => {
		return file.size <= MAX_UPLOAD_SIZE;
	}, `File size must be less than ${MAX_MB_COUNT}MB`)
	.refine((file) => {
		return ACCEPTED_FILE_TYPES.map((t) => t.mime).includes(file.type);
	}, 'File is not one of the accepted types');

const filesSchema = z
	.array(fileSchema)
	.min(1, 'At least one file is required')
	.max(10, 'Maximum 10 files allowed');

export { fileSchema, filesSchema, MAX_MB_COUNT, MAX_UPLOAD_SIZE };

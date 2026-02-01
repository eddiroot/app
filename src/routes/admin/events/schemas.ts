import { z } from 'zod';

// Common validation helpers
const eventNameSchema = z
	.string()
	.min(1, 'Event name is required')
	.max(255, 'Event name cannot exceed 255 characters');

const eventTimestampSchema = z.iso
	.datetime({ local: true })
	.min(1, 'Please provide a valid date and time');

export const createSchoolEventSchema = z
	.object({
		name: eventNameSchema,
		start: eventTimestampSchema,
		end: eventTimestampSchema,
		requiresRSVP: z.boolean().optional().default(false),
	})
	.refine((data) => data.end > data.start, {
		error: 'End time must be after start time',
		path: ['end'],
	});

export const createCampusEventSchema = z
	.object({
		name: eventNameSchema,
		campusId: z.coerce.number().int().positive('Please select a campus'),
		start: eventTimestampSchema,
		end: eventTimestampSchema,
		requiresRSVP: z.boolean().optional().default(false),
	})
	.refine((data) => data.end > data.start, {
		error: 'End time must be after start time',
		path: ['end'],
	});

export const createSubjectOfferingEventSchema = z
	.object({
		name: eventNameSchema,
		subjectOfferingId: z.coerce
			.number()
			.int()
			.positive('Please select a subject offering'),
		start: eventTimestampSchema,
		end: eventTimestampSchema,
		requiresRSVP: z.boolean().optional().default(false),
	})
	.refine((data) => data.end > data.start, {
		error: 'End time must be after start time',
		path: ['end'],
	});

export const createSubjectOfferingClassEventSchema = z
	.object({
		name: eventNameSchema,
		subjectOfferingClassId: z.coerce
			.number()
			.int()
			.positive('Please select a class'),
		start: eventTimestampSchema,
		end: eventTimestampSchema,
		requiresRSVP: z.boolean().optional().default(false),
	})
	.refine((data) => data.end > data.start, {
		error: 'End time must be after start time',
		path: ['end'],
	});

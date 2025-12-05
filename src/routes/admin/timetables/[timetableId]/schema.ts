import z from 'zod';

export const createTimetableDraftSchema = z.object({
	name: z
		.string()
		.min(1, 'Timetable name is required')
		.max(255, 'Name must be 255 characters or less')
});

export const publishTimetableDraftSchema = z.object({
	draftId: z.coerce.number().min(1, 'Please select a draft to publish')
});

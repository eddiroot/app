import { z } from 'zod';

export const createClassSchema = z.object({
	subjectOfferingId: z.number().int().positive('Subject is required'),
	teacherIds: z.array(z.uuid()).min(1, 'At least one teacher must be selected'),
	yearLevelIds: z.array(z.string()).default([]).optional(),
	groupIds: z.array(z.string()).default([]).optional(),
	studentIds: z.array(z.uuid()).default([]).optional(),
	spaceIds: z.array(z.string()).default([]).optional(),
});

export const editClassSchema = z.object({
	classId: z.number().min(1, 'Class ID is required'),
	subjectOfferingId: z.number().int().positive('Subject is required'),
	teacherIds: z.array(z.uuid()).min(1, 'At least one teacher must be selected'),
	yearLevelIds: z.array(z.string()).default([]).optional(),
	groupIds: z.array(z.string()).default([]).optional(),
	studentIds: z.array(z.uuid()).default([]).optional(),
	spaceIds: z.array(z.string()).default([]).optional(),
});

export const deleteClassSchema = z.object({ classId: z.coerce.number() });

export const createActivitySchema = z.object({
	classId: z.coerce.number().int().positive('Class ID is required'),
	duration: z.coerce
		.number()
		.int()
		.min(1, 'Duration must be at least 1 period')
		.max(20, 'Duration must be at most 20 periods'),
});

export const editActivitySchema = z.object({
	activityId: z.coerce.number().int().positive('Activity ID is required'),
	duration: z.coerce
		.number()
		.int()
		.min(1, 'Duration must be at least 1 period')
		.max(20, 'Duration must be at most 20 periods'),
});

export const deleteActivitySchema = z.object({ activityId: z.coerce.number() });

export type CreateClassSchema = typeof createClassSchema;
export type EditClassSchema = typeof editClassSchema;
export type DeleteClassSchema = typeof deleteClassSchema;
export type CreateActivitySchema = typeof createActivitySchema;
export type EditActivitySchema = typeof editActivitySchema;
export type DeleteActivitySchema = typeof deleteActivitySchema;

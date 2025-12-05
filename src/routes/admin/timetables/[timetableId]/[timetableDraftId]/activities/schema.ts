import { z } from 'zod';

export const createActivitySchema = z.object({
	subjectOfferingId: z.number().int().positive('Subject is required'),
	teacherIds: z.array(z.string().uuid()).min(1, 'At least one teacher must be selected'),
	yearLevels: z.array(z.string()).default([]).optional(),
	groupIds: z.array(z.number().int()).default([]).optional(),
	studentIds: z.array(z.string().uuid()).default([]).optional(),
	locationIds: z.array(z.number().int()).default([]).optional(),
	numInstancesPerWeek: z.number().int().min(1, 'At least one instance per week is required'),
	periodsPerInstance: z.number().int().min(1, 'At least one period per instance is required')
});

export const editActivitySchema = z.object({
	activityId: z.number().min(1, 'Activity ID is required'),
	subjectOfferingId: z.number().int().positive('Subject is required'),
	teacherIds: z.array(z.string().uuid()).min(1, 'At least one teacher must be selected'),
	yearLevels: z.array(z.string()).default([]).optional(),
	groupIds: z.array(z.number().int()).default([]).optional(),
	studentIds: z.array(z.string().uuid()).default([]).optional(),
	locationIds: z.array(z.number().int()).default([]).optional(),
	numInstancesPerWeek: z.number().int().min(1, 'At least one instance per week is required'),
	periodsPerInstance: z.number().int().min(1, 'At least one period per instance is required')
});

export const deleteActivitySchema = z.object({
	activityId: z.coerce.number()
});

export type CreateActivitySchema = typeof createActivitySchema;
export type EditActivitySchema = typeof editActivitySchema;
export type DeleteActivitySchema = typeof deleteActivitySchema;

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

export type CreateClassSchema = typeof createClassSchema;
export type EditClassSchema = typeof editClassSchema;
export type DeleteClassSchema = typeof deleteClassSchema;

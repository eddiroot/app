import { z } from 'zod';

import { constraintTypeEnum } from '$lib/enums';

import type { ConstraintMeta } from '../types';

export const minDaysBetweenActivitiesSchema = z.object({
	Weight_Percentage: z.number().min(1).max(100),
	Consecutive_If_Same_Day: z.boolean().default(true),
	MinDays: z.number().min(1).max(6),
	Number_of_Activities: z.number().min(2),
	Activity_Id: z.array(z.union([z.string(), z.number()])).min(2),
	Active: z.boolean().default(true),
	Comments: z.string().nullable().optional(),
});

export const minDaysBetweenActivities: ConstraintMeta = {
	fetName: 'ConstraintMinDaysBetweenActivities',
	friendlyName: 'Minimum Days Between Activities',
	description:
		'Ensures activities are spread across multiple days. Prevents clustering all lessons of a subject on consecutive days. Automatically added for split activities.',
	type: constraintTypeEnum.time,
	optional: true,
	repeatable: true,
	paramsSchema: minDaysBetweenActivitiesSchema,
	requiresFormData: ['timetableActivities'],
};

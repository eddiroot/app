import { z } from 'zod';

import { constraintTypeEnum } from '$lib/enums';

import type { ConstraintMeta } from '../types';

export const teachersMaxGapsSchema = z.object({
	Weight_Percentage: z.number().min(1).max(100),
	Max_Gaps: z.number().min(0).max(20),
	Active: z.boolean().default(true),
	Comments: z.string().nullable().optional(),
});

export const teachersMaxGapsPerWeek: ConstraintMeta = {
	fetName: 'ConstraintTeachersMaxGapsPerWeek',
	friendlyName: 'Teachers Max Gaps Per Week',
	description:
		'Minimizes free periods during work days for efficiency and teacher satisfaction. Recommended for optimization, helps create efficient schedules.',
	type: constraintTypeEnum.time,
	optional: false,
	repeatable: false,
	paramsSchema: teachersMaxGapsSchema,
	requiresFormData: [],
};

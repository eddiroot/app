import { z } from 'zod';

import { constraintTypeEnum } from '$lib/enums';

import type { ConstraintMeta } from '../types';

export const basicCompulsoryTimeSchema = z.object({
	Weight_Percentage: z.number().min(1).max(100),
	Active: z.boolean().default(true),
	Comments: z.string().nullable().optional(),
});

export const basicCompulsoryTime: ConstraintMeta = {
	fetName: 'ConstraintBasicCompulsoryTime',
	friendlyName: 'Basic Compulsory Time',
	description:
		'Ensures that a teacher never instructs two or more activities at the same time, and students have maximum one activity per period. Essential foundation constraint that must always be included.',
	type: constraintTypeEnum.time,
	optional: false,
	repeatable: false,
	paramsSchema: basicCompulsoryTimeSchema,
	requiresFormData: [],
};

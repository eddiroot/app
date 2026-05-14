import { z } from 'zod';

import { constraintTypeEnum } from '$lib/enums';

import type { ConstraintMeta } from '../types';

export const basicCompulsorySpaceSchema = z.object({
	Weight_Percentage: z.number().min(1).max(100),
	Active: z.boolean().default(true),
	Comments: z.string().nullable().optional(),
});

export const basicCompulsorySpace: ConstraintMeta = {
	fetName: 'ConstraintBasicCompulsorySpace',
	friendlyName: 'Basic Compulsory Space',
	description:
		'Ensures that a room never has two or more activities scheduled simultaneously. Essential foundation constraint for room allocation.',
	type: constraintTypeEnum.space,
	optional: false,
	repeatable: false,
	paramsSchema: basicCompulsorySpaceSchema,
	requiresFormData: [],
	summarize: (parameters) => {
		const parsed = basicCompulsorySpaceSchema.safeParse(parameters);
		const weight = parsed.success ? parsed.data.Weight_Percentage : 100;
		return `Always on · weight ${weight}%`;
	},
};

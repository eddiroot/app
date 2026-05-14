import { z } from 'zod';

import { constraintTypeEnum } from '$lib/enums';

import type { ConstraintMeta } from '../types';

export const minDaysBetweenActivitiesSchema = z.object({
	Weight_Percentage: z.number().min(1).max(100),
	Consecutive_If_Same_Day: z.boolean().default(true),
	MinDays: z.number().min(1).max(6),
	Number_of_Activities: z.number().min(2),
	// Prefixed identifiers: `c-{classId}` (expanded to all child activities at
	// FET-build time) or `a-{activityId}` (referenced directly).
	Activity_Id: z.array(z.string().regex(/^[ca]-\d+$/)).min(2),
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
	requiresFormData: ['timetableClasses', 'timetableActivities'],
	summarize: (parameters, formData) => {
		const parsed = minDaysBetweenActivitiesSchema.safeParse(parameters);
		if (!parsed.success) return 'Minimum days between activities';
		const { Activity_Id, MinDays, Number_of_Activities } = parsed.data;
		const labels = Activity_Id.map((id) => {
			const set = id.startsWith('c-')
				? formData?.timetableClasses
				: formData?.timetableActivities;
			return set?.find((opt) => String(opt.value) === id)?.label ?? id;
		});
		const head = labels.slice(0, 2).join(', ');
		const more = labels.length > 2 ? ` (+${labels.length - 2} more)` : '';
		return `${Number_of_Activities} activities · min ${MinDays} day${MinDays === 1 ? '' : 's'} apart · ${head}${more}`;
	},
};

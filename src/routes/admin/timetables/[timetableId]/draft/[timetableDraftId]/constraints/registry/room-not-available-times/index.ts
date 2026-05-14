import { z } from 'zod';

import { constraintTypeEnum } from '$lib/enums';

import type { ConstraintMeta } from '../types';

export const roomNotAvailableTimesSchema = z.object({
	Weight_Percentage: z.number().min(1).max(100),
	Room: z
		.union([z.string(), z.number()])
		.refine((val) => val !== '' && val !== 0, { message: 'Room is required' }),
	Number_of_Not_Available_Times: z.number().min(1),
	Not_Available_Time: z
		.array(
			z.object({
				Day: z.number().min(1, { message: 'Day is required' }),
				Hour: z.number().min(1, { message: 'Period is required' }),
			}),
		)
		.min(1, { message: 'At least one time slot is required' })
		.refine(
			(times) => {
				const seen = new Set<string>();
				return times.every((time) => {
					const key = `${time.Day}-${time.Hour}`;
					if (seen.has(key)) return false;
					seen.add(key);
					return true;
				});
			},
			{ message: 'Duplicate time slots are not allowed' },
		),
	Active: z.boolean().default(true),
	Comments: z.string().nullable().optional(),
});

export const roomNotAvailableTimes: ConstraintMeta = {
	fetName: 'ConstraintRoomNotAvailableTimes',
	friendlyName: 'Room Not Available Times',
	description:
		'Blocks specific time periods when rooms cannot be used due to maintenance, special events, or shared facilities.',
	type: constraintTypeEnum.space,
	optional: true,
	repeatable: true,
	paramsSchema: roomNotAvailableTimesSchema,
	requiresFormData: ['spaces', 'timetableDays', 'timetablePeriods'],
	summarize: (parameters, formData) => {
		const parsed = roomNotAvailableTimesSchema.safeParse(parameters);
		if (!parsed.success) return 'Room not available times';
		const { Room, Not_Available_Time } = parsed.data;
		const roomLabel =
			formData?.spaces
				.find((opt) => String(opt.value) === String(Room))
				?.label.split(' (')[0] ?? `Room #${Room}`;
		const count = Not_Available_Time.length;
		return `${roomLabel} · ${count} time slot${count === 1 ? '' : 's'} blocked`;
	},
};

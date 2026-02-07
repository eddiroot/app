import { z } from 'zod';

export const updateDaysSchema = z.object({
	selectedDays: z
		.array(z.number())
		.min(1, 'At least one day must be selected')
		.refine(
			(days) => days.every((d) => !isNaN(d) && d >= 0 && d <= 6),
			'Invalid day values',
		),
});

export const addPeriodSchema = z
	.object({
		start: z.iso.time({ precision: -1 }),
		end: z.iso.time({ precision: -1 }),
	})
	.refine(
		(data) => {
			const start = new Date(`1970-01-01T${data.start}:00`);
			const end = new Date(`1970-01-01T${data.end}:00`);
			return start < end;
		},
		{ message: 'Start time must be before end time' },
	);

export const updateCycleWeeksRepeatSchema = z.object({
	cycleWeeksRepeat: z.number(),
});

export type UpdateDaysSchema = typeof updateDaysSchema;
export type AddPeriodSchema = typeof addPeriodSchema;
export type UpdateCycleWeeksRepeatSchema = typeof updateCycleWeeksRepeatSchema;

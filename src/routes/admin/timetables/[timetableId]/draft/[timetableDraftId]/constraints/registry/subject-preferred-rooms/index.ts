import { z } from 'zod';

import { constraintTypeEnum } from '$lib/enums';

import type { ConstraintMeta } from '../types';

export const subjectPreferredRoomsSchema = z.object({
	Weight_Percentage: z.number().min(1).max(100),
	Subject: z
		.union([z.string(), z.number()])
		.refine((val) => val !== '' && val !== 0, {
			message: 'Subject is required',
		}),
	Number_of_Preferred_Rooms: z.number().min(1),
	Preferred_Room: z
		.array(z.union([z.string(), z.number()]))
		.min(1, { message: 'At least one room is required' })
		.refine((rooms) => rooms.every((room) => room !== '' && room !== 0), {
			message: 'All rooms must be selected',
		}),
	Active: z.boolean().default(true),
	Comments: z.string().nullable().optional(),
});

export const subjectPreferredRooms: ConstraintMeta = {
	fetName: 'ConstraintSubjectPreferredRooms',
	friendlyName: 'Subject Preferred Rooms',
	description:
		'Assigns multiple preferred rooms for a specific subject. Provides flexibility while maintaining specialization.',
	type: constraintTypeEnum.space,
	optional: false,
	repeatable: true,
	paramsSchema: subjectPreferredRoomsSchema,
	requiresFormData: ['subjects', 'spaces'],
};

import { z } from 'zod';

/**
 * Basic Compulsory Time Constraint
 * Ensures all activities are scheduled within defined time periods
 */
export const basicCompulsoryTimeSchema = z.object({
	Weight_Percentage: z.number().min(1).max(100),
	Active: z.boolean().default(true),
	Comments: z.string().nullable().optional()
});

export type BasicCompulsoryTimeForm = z.infer<typeof basicCompulsoryTimeSchema>;

/**
 * Basic Compulsory Space Constraint
 * Ensures all activities are assigned to appropriate spaces
 */
export const basicCompulsorySpaceSchema = z.object({
	Weight_Percentage: z.number().min(1).max(100),
	Active: z.boolean().default(true),
	Comments: z.string().nullable().optional()
});

export type BasicCompulsorySpaceForm = z.infer<typeof basicCompulsorySpaceSchema>;

/**
 * Teachers Max Gaps Per Week Constraint
 * Limits the maximum number of free periods teachers can have
 */
export const teachersMaxGapsSchema = z.object({
	Weight_Percentage: z.number().min(1).max(100),
	Max_Gaps: z.number().min(0).max(20),
	Active: z.boolean().default(true),
	Comments: z.string().nullable().optional()
});

export type TeachersMaxGapsForm = z.infer<typeof teachersMaxGapsSchema>;

/**
 * Minimum Days Between Activities Constraint
 * Ensures activities are spread across multiple days
 */
export const minDaysBetweenActivitiesSchema = z.object({
	Weight_Percentage: z.number().min(1).max(100),
	Consecutive_If_Same_Day: z.boolean().default(true),
	MinDays: z.number().min(1).max(6),
	Number_of_Activities: z.number().min(2),
	Activity_Id: z.array(z.union([z.string(), z.number()])).min(2),
	Active: z.boolean().default(true),
	Comments: z.string().nullable().optional()
});

export type MinDaysBetweenActivitiesForm = z.infer<typeof minDaysBetweenActivitiesSchema>;

/**
 * Subject Preferred Rooms Constraint
 * Sets preferred rooms for a specific subject
 */
export const subjectPreferredRoomsSchema = z.object({
	Weight_Percentage: z.number().min(1).max(100),
	Subject: z
		.union([z.string(), z.number()])
		.refine((val) => val !== '' && val !== 0, { message: 'Subject is required' }),
	Number_of_Preferred_Rooms: z.number().min(1),
	Preferred_Room: z
		.array(z.union([z.string(), z.number()]))
		.min(1, { message: 'At least one room is required' })
		.refine((rooms) => rooms.every((room) => room !== '' && room !== 0), {
			message: 'All rooms must be selected'
		}),
	Active: z.boolean().default(true),
	Comments: z.string().nullable().optional()
});

export type SubjectPreferredRoomsForm = z.infer<typeof subjectPreferredRoomsSchema>;

/**
 * Room Not Available Times Constraint
 * Blocks specific time periods when rooms cannot be used
 */
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
				Period: z.number().min(1, { message: 'Period is required' })
			})
		)
		.min(1, { message: 'At least one time slot is required' })
		.refine(
			(times) => {
				const seen = new Set<string>();
				return times.every((time) => {
					const key = `${time.Day}-${time.Period}`;
					if (seen.has(key)) return false;
					seen.add(key);
					return true;
				});
			},
			{ message: 'Duplicate time slots are not allowed' }
		),
	Active: z.boolean().default(true),
	Comments: z.string().nullable().optional()
});

export type RoomNotAvailableTimesForm = z.infer<typeof roomNotAvailableTimesSchema>;

/**
 * Map constraint FET names to their schemas
 */
export const constraintSchemas = {
	ConstraintBasicCompulsoryTime: basicCompulsoryTimeSchema,
	ConstraintBasicCompulsorySpace: basicCompulsorySpaceSchema,
	ConstraintTeachersMaxGapsPerWeek: teachersMaxGapsSchema,
	ConstraintMinDaysBetweenActivities: minDaysBetweenActivitiesSchema,
	ConstraintSubjectPreferredRooms: subjectPreferredRoomsSchema,
	ConstraintRoomNotAvailableTimes: roomNotAvailableTimesSchema
} as const;

/**
 * Get schema for a specific constraint by FET name
 */
export function getConstraintSchema(FETName: string): z.ZodSchema | null {
	return constraintSchemas[FETName as keyof typeof constraintSchemas] || null;
}

/**
 * Validate constraint parameters
 */
export function validateConstraintParameters(
	FETName: string,
	parameters: unknown
): { success: true; data: unknown } | { success: false; errors: z.ZodError } {
	const schema = getConstraintSchema(FETName);
	if (!schema) {
		return {
			success: false,
			errors: new z.ZodError([
				{
					code: 'custom',
					message: `No schema found for constraint: ${FETName}`,
					path: []
				}
			])
		};
	}

	const result = schema.safeParse(parameters);
	if (result.success) {
		return { success: true, data: result.data };
	}
	return { success: false, errors: result.error };
}

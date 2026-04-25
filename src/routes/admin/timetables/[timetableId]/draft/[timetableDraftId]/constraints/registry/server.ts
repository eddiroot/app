import { z } from 'zod';

import { basicCompulsorySpace } from './basic-compulsory-space';
import { basicCompulsoryTime } from './basic-compulsory-time';
import { minDaysBetweenActivities } from './min-days-between-activities';
import { roomNotAvailableTimes } from './room-not-available-times';
import { subjectPreferredRooms } from './subject-preferred-rooms';
import { teachersMaxGapsPerWeek } from './teachers-max-gaps-per-week';
import type { ConstraintMeta, FormDataKey } from './types';

export const ALL_ENTRIES: readonly ConstraintMeta[] = [
	basicCompulsoryTime,
	basicCompulsorySpace,
	teachersMaxGapsPerWeek,
	minDaysBetweenActivities,
	subjectPreferredRooms,
	roomNotAvailableTimes,
];

const BY_FET_NAME: Record<string, ConstraintMeta> = Object.fromEntries(
	ALL_ENTRIES.map((e) => [e.fetName, e]),
);

export function getEntry(fetName: string): ConstraintMeta | undefined {
	return BY_FET_NAME[fetName];
}

export function hasEntry(fetName: string): boolean {
	return fetName in BY_FET_NAME;
}

export function requiredFormDataKeys(
	fetNames: readonly string[],
): FormDataKey[] {
	const set = new Set<FormDataKey>();
	for (const fetName of fetNames) {
		const entry = BY_FET_NAME[fetName];
		if (!entry) continue;
		for (const key of entry.requiresFormData) set.add(key);
	}
	return [...set];
}

export function validateParams(
	fetName: string,
	parameters: unknown,
):
	| { success: true; data: unknown }
	| { success: false; errors: z.ZodError } {
	const entry = BY_FET_NAME[fetName];
	if (!entry) {
		return {
			success: false,
			errors: new z.ZodError([
				{
					code: 'custom',
					message: `No registry entry for constraint: ${fetName}`,
					path: [],
				},
			]),
		};
	}
	const result = entry.paramsSchema.safeParse(parameters);
	if (result.success) return { success: true, data: result.data };
	return { success: false, errors: result.error };
}

export { buildConstraintFormData } from './form-data';
export type { ConstraintMeta, FormDataKey } from './types';
export type {
	AutocompleteOption,
	ConstraintFormComponentProps,
	ConstraintFormData,
} from './types';

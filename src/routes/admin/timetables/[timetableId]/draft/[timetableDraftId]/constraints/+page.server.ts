import { constraintTypeEnum } from '$lib/enums';
import { getAllConstraintsByTimetableDraftId } from '$lib/server/db/service';

import { buildConstraintFormData } from './registry/form-data';
import { ALL_ENTRIES, hasEntry, requiredFormDataKeys } from './registry/utils';

export const load = async ({ locals: { security }, params }) => {
	const user = security.isAuthenticated().isAdmin().getUser();
	const timetableId = parseInt(params.timetableId, 10);
	const timetableDraftId = parseInt(params.timetableDraftId, 10);

	const assignedConstraints =
		await getAllConstraintsByTimetableDraftId(timetableDraftId);

	// Defensively ignore assigned rows whose fetName isn't in the registry.
	// Happens if a constraint was removed from code but still sits in the DB.
	const knownAssigned = assignedConstraints.filter(({ con }) =>
		hasEntry(con.fetName),
	);

	const assignedFetNames = new Set(knownAssigned.map(({ con }) => con.fetName));

	const availableEntries = ALL_ENTRIES.filter(
		(entry) => entry.repeatable || !assignedFetNames.has(entry.fetName),
	);

	const currentTimeConstraints = knownAssigned.filter(
		({ con }) => con.type === constraintTypeEnum.time,
	);
	const currentSpaceConstraints = knownAssigned.filter(
		({ con }) => con.type === constraintTypeEnum.space,
	);

	const availableTimeConstraints = availableEntries
		.filter((e) => e.type === constraintTypeEnum.time)
		.map(toAvailable);
	const availableSpaceConstraints = availableEntries
		.filter((e) => e.type === constraintTypeEnum.space)
		.map(toAvailable);

	// Only fetch autocomplete option sets actually needed by forms in play.
	const visibleFetNames = [
		...knownAssigned.map(({ con }) => con.fetName),
		...availableEntries.map((e) => e.fetName),
	];
	const formData = await buildConstraintFormData(
		{ timetableDraftId, schoolId: user.schoolId },
		requiredFormDataKeys(visibleFetNames),
	);

	return {
		user,
		timetableId,
		timetableDraftId,
		currentTimeConstraints,
		currentSpaceConstraints,
		availableTimeConstraints,
		availableSpaceConstraints,
		formData,
	};
};

function toAvailable(entry: (typeof ALL_ENTRIES)[number]) {
	return {
		fetName: entry.fetName,
		friendlyName: entry.friendlyName,
		description: entry.description,
		type: entry.type,
		optional: entry.optional,
		repeatable: entry.repeatable,
	};
}

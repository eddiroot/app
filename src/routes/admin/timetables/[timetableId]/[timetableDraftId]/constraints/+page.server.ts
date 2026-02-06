import { constraintTypeEnum } from '$lib/enums';
import {
	getAllConstraints,
	getAllConstraintsByTimetableDraftId,
} from '$lib/server/db/service';
import { buildConstraintFormData } from '$lib/server/fet/constraints/constraint-data-fetchers';
import { hasCustomForm } from '$lib/server/fet/constraints/constraint-form-mapping.js';

export const load = async ({ locals: { security }, params }) => {
	const user = security.isAuthenticated().isAdmin().getUser();
	const timetableId = parseInt(params.timetableId, 10);
	const timetableDraftId = parseInt(params.timetableDraftId, 10);

	// Get all constraints from the database
	const allConstraints = await getAllConstraints();

	// Get constraints currently assigned to this timetable
	const assignedConstraints =
		await getAllConstraintsByTimetableDraftId(timetableDraftId);

	// Filter to only show constraints that have custom forms
	const constraintsWithForms = allConstraints.filter((constraint) =>
		hasCustomForm(constraint.fetName),
	);

	// Get the constraint IDs that are already assigned to this timetable
	const assignedConstraintIds = new Set(
		assignedConstraints.map(({ tt_draft_con }) => tt_draft_con.id),
	);

	// Filter available constraints based on repeatability rules
	const availableConstraints = constraintsWithForms.filter((constraint) => {
		// If the constraint is repeatable, always show it
		if (constraint.repeatable) {
			return true;
		}
		// If the constraint is not repeatable, only show it if it hasn't been used yet
		return !assignedConstraintIds.has(constraint.id);
	});

	// Separate current constraints by type
	const currentTimeConstraints = assignedConstraints.filter(
		({ con }) => con.type === constraintTypeEnum.time,
	);
	const currentSpaceConstraints = assignedConstraints.filter(
		({ con }) => con.type === constraintTypeEnum.space,
	);

	// Separate available constraints by type
	const availableTimeConstraints = availableConstraints.filter(
		(con) => con.type === constraintTypeEnum.time,
	);
	const availableSpaceConstraints = availableConstraints.filter(
		(con) => con.type === constraintTypeEnum.space,
	);

	// Build form data for autocomplete components
	const formData = await buildConstraintFormData(
		timetableDraftId,
		user.schoolId,
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

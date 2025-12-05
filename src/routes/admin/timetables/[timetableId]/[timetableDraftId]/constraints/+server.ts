import { validateConstraintParameters } from '$lib/schemas/constraints';
import {
	createTimetableDraftConstraint,
	deleteTimetableDraftConstraint,
	getConstraintById,
	updateTimetableDraftConstraintActiveStatus
} from '$lib/server/db/service';
import { json } from '@sveltejs/kit';

// Add a constraint to a timetable
export const POST = async ({ request, params, locals: { security } }) => {
	security.isAuthenticated().isSchoolAdmin().getUser();
	const timetableDraftId = parseInt(params.timetableDraftId, 10);

	try {
		const { constraintId, parameters = {} } = await request.json();

		// Get constraint details to validate parameters
		const constraint = await getConstraintById(constraintId);
		if (!constraint) {
			return json(
				{
					success: false,
					error: 'Constraint not found'
				},
				{ status: 404 }
			);
		}

		// Validate parameters with Zod
		const validationResult = validateConstraintParameters(constraint.FETName, parameters);
		if (!validationResult.success) {
			return json(
				{
					success: false,
					error: 'Invalid constraint parameters',
					validationErrors: validationResult.errors.flatten()
				},
				{ status: 400 }
			);
		}

		const data = {
			timetableDraftId,
			constraintId,
			active: true,
			parameters: validationResult.data as Record<string, unknown>
		};

		const timetableConstraint = await createTimetableDraftConstraint(data);

		return json({
			success: true,
			constraint: timetableConstraint
		});
	} catch (error) {
		console.error('Error adding constraint:', error);
		return json(
			{
				success: false,
				error: 'Failed to add constraint'
			},
			{ status: 500 }
		);
	}
};

// Update a constraint (toggle active state or update parameters)
export const PATCH = async ({ request, locals: { security } }) => {
	security.isAuthenticated().isSchoolAdmin().getUser();

	try {
		const { constraintId: ttConstraintId, active } = await request.json();

		if (!ttConstraintId) {
			return json(
				{
					success: false,
					error: 'constraintId is required'
				},
				{ status: 400 }
			);
		}

		if (typeof active !== 'boolean') {
			return json(
				{
					success: false,
					error: 'Active field must be a boolean'
				},
				{ status: 400 }
			);
		}

		const updatedConstraint = await updateTimetableDraftConstraintActiveStatus(
			ttConstraintId,
			active
		);

		if (!updatedConstraint) {
			return json(
				{
					success: false,
					error: 'Constraint not found'
				},
				{ status: 404 }
			);
		}

		return json({
			success: true,
			message: 'Constraint updated successfully',
			constraint: updatedConstraint
		});
	} catch (error) {
		console.error('Error updating constraint:', error);
		return json(
			{
				success: false,
				error: 'Failed to update constraint'
			},
			{ status: 500 }
		);
	}
};

// Remove a constraint from a timetable
export const DELETE = async ({ request, locals: { security } }) => {
	security.isAuthenticated().isSchoolAdmin().getUser();

	try {
		const { ttConstraintId: ttConstraintId } = await request.json();

		if (!ttConstraintId) {
			return json(
				{
					success: false,
					error: 'constraintId is required'
				},
				{ status: 400 }
			);
		}

		await deleteTimetableDraftConstraint(ttConstraintId);

		return json({ success: true });
	} catch (error) {
		console.error('Error removing constraint:', error);
		return json(
			{
				success: false,
				error: 'Failed to remove constraint'
			},
			{ status: 500 }
		);
	}
};

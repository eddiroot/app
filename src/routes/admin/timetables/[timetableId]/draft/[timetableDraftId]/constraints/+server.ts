import { json } from '@sveltejs/kit';

import {
	createTimetableDraftConstraint,
	deleteTimetableDraftConstraint,
	getConstraintByFetName,
	getTimetableDraftConstraintWithDef,
	updateTimetableDraftConstraintActiveStatus,
	updateTimetableDraftConstraintParameters,
} from '$lib/server/db/service';

import { validateParams } from './registry/utils';

// Add a constraint to a timetable draft.
// Payload: { fetName, parameters }
export const POST = async ({ request, params, locals: { security } }) => {
	security.isAuthenticated().isAdmin().getUser();
	const timetableDraftId = parseInt(params.timetableDraftId, 10);

	try {
		const { fetName, parameters = {} } = await request.json();

		if (!fetName || typeof fetName !== 'string') {
			return json(
				{ success: false, error: 'fetName is required' },
				{ status: 400 },
			);
		}

		const validation = validateParams(fetName, parameters);
		if (!validation.success) {
			return json(
				{
					success: false,
					error: 'Invalid constraint parameters',
					validationErrors: validation.errors.flatten(),
				},
				{ status: 400 },
			);
		}

		const dbConstraint = await getConstraintByFetName(fetName);
		if (!dbConstraint) {
			return json(
				{
					success: false,
					error: `Constraint ${fetName} is not seeded in the database. Restart the app to run syncConstraintsFromRegistry().`,
				},
				{ status: 500 },
			);
		}

		const timetableConstraint = await createTimetableDraftConstraint({
			timetableDraftId,
			constraintId: dbConstraint.id,
			active: true,
			parameters: validation.data as Record<string, unknown>,
		});

		return json({ success: true, constraint: timetableConstraint });
	} catch (error) {
		console.error('Error adding constraint:', error);
		return json(
			{ success: false, error: 'Failed to add constraint' },
			{ status: 500 },
		);
	}
};

// Update an assigned constraint: toggle active flag OR replace parameters.
// Payload: { ttConstraintId, active } | { ttConstraintId, parameters }
export const PATCH = async ({ request, locals: { security } }) => {
	security.isAuthenticated().isAdmin().getUser();

	try {
		const body = await request.json();
		const ttConstraintId: number | undefined = body.ttConstraintId;

		if (typeof ttConstraintId !== 'number') {
			return json(
				{ success: false, error: 'ttConstraintId is required' },
				{ status: 400 },
			);
		}

		if (typeof body.active === 'boolean') {
			const updated = await updateTimetableDraftConstraintActiveStatus(
				ttConstraintId,
				body.active,
			);
			if (!updated) {
				return json(
					{ success: false, error: 'Constraint not found' },
					{ status: 404 },
				);
			}
			return json({ success: true, constraint: updated });
		}

		if (body.parameters && typeof body.parameters === 'object') {
			const row = await getTimetableDraftConstraintWithDef(ttConstraintId);
			if (!row) {
				return json(
					{ success: false, error: 'Constraint not found' },
					{ status: 404 },
				);
			}

			const validation = validateParams(row.con.fetName, body.parameters);
			if (!validation.success) {
				return json(
					{
						success: false,
						error: 'Invalid constraint parameters',
						validationErrors: validation.errors.flatten(),
					},
					{ status: 400 },
				);
			}

			const updated = await updateTimetableDraftConstraintParameters(
				ttConstraintId,
				validation.data as Record<string, unknown>,
			);
			return json({ success: true, constraint: updated });
		}

		return json(
			{
				success: false,
				error:
					'Payload must include either `active: boolean` or `parameters: object`',
			},
			{ status: 400 },
		);
	} catch (error) {
		console.error('Error updating constraint:', error);
		return json(
			{ success: false, error: 'Failed to update constraint' },
			{ status: 500 },
		);
	}
};

export const DELETE = async ({ request, locals: { security } }) => {
	security.isAuthenticated().isAdmin().getUser();

	try {
		const { ttConstraintId } = await request.json();

		if (!ttConstraintId) {
			return json(
				{ success: false, error: 'ttConstraintId is required' },
				{ status: 400 },
			);
		}

		await deleteTimetableDraftConstraint(ttConstraintId);

		return json({ success: true });
	} catch (error) {
		console.error('Error removing constraint:', error);
		return json(
			{ success: false, error: 'Failed to remove constraint' },
			{ status: 500 },
		);
	}
};

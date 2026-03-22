import { userTypeEnum } from '$lib/enums';
import {
	getWhiteboardWithTask,
	toggleWhiteboardLock,
} from '$lib/server/db/service';
import { error, fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const load = async ({
	params,
}: {
	params: { whiteboardId: string; taskId: string };
}) => {
	const whiteboardId = parseInt(params.whiteboardId, 10);
	const taskId = parseInt(params.taskId, 10);

	if (!whiteboardId || !taskId) {
		throw error(404, 'Whiteboard or task not found');
	}

	// Get whiteboard and verify it belongs to the task
	const whiteboardData = await getWhiteboardWithTask(whiteboardId, taskId);

	if (!whiteboardData) {
		throw error(404, 'Whiteboard not found or does not belong to this task');
	}

	return whiteboardData;
};

export const actions = {
	toggleLock: async ({ params, locals: { security } }) => {
		const user = security.isAuthenticated().getUser();

		// Only teachers can toggle lock
		if (user.type !== userTypeEnum.teacher) {
			return fail(403, { error: 'Only teachers can lock/unlock whiteboards' });
		}

		const whiteboardId = parseInt(params.whiteboardId, 10);

		if (isNaN(whiteboardId)) {
			return fail(400, { error: 'Invalid whiteboard ID' });
		}

		try {
			const updatedWhiteboard = await toggleWhiteboardLock(whiteboardId);

			return {
				type: 'success',
				data: { isLocked: updatedWhiteboard.isLocked },
			};
		} catch (err) {
			console.error('Error toggling whiteboard lock:', err);
			return fail(500, { error: 'Failed to toggle whiteboard lock' });
		}
	},
} satisfies Actions;

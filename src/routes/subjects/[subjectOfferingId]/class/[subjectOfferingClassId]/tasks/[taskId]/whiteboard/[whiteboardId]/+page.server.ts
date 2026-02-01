import { getWhiteboardWithTask } from '$lib/server/db/service';
import { error } from '@sveltejs/kit';

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

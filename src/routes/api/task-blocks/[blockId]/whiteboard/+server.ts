import { getWhiteboardByTaskBlockId } from '$lib/server/db/service';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const blockId = parseInt(params.blockId, 10);

	if (isNaN(blockId)) {
		return json({ error: 'Invalid block ID' }, { status: 400 });
	}

	try {
		const whiteboard = await getWhiteboardByTaskBlockId(blockId);

		if (!whiteboard) {
			return json({ error: 'Whiteboard not found' }, { status: 404 });
		}

		return json({ whiteboardId: whiteboard.id });
	} catch (error) {
		console.error('Error fetching whiteboard:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

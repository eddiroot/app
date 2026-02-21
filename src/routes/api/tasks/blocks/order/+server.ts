import { updateTaskBlocksOrder } from '$lib/server/db/service';
import { json } from '@sveltejs/kit';

export async function PUT({ request }: { request: Request }) {
	try {
		const { blockOrder } = await request.json();

		if (!blockOrder) {
			return json({ error: 'Block order is required' }, { status: 400 });
		}

		if (!Array.isArray(blockOrder)) {
			return json({ error: 'Block order must be an array' }, { status: 400 });
		}

		// Validate each block update object
		for (const update of blockOrder) {
			if (typeof update.id !== 'number' || typeof update.index !== 'number') {
				return json(
					{ error: 'Each block update must have valid id and index' },
					{ status: 400 },
				);
			}
		}

		await updateTaskBlocksOrder(blockOrder);
		return json({ success: true });
	} catch (error) {
		console.error('Error updating block order:', error);
		return json({ error: 'Failed to update block order' }, { status: 500 });
	}
}

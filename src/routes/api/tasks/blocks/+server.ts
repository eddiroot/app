import { taskBlockTypeEnum } from '$lib/enums';
import {
	createTaskBlock,
	createWhiteboard,
	deleteTaskBlock,
	updateTaskBlock,
} from '$lib/server/db/service';
import { json } from '@sveltejs/kit';

export async function POST({ request }: { request: Request }) {
	try {
		const { taskId, type, config, index } = await request.json();

		if (!taskId || !type || (!index && index != 0) || config === undefined) {
			return json(
				{ error: 'Task ID, type, index, and config are required' },
				{ status: 400 },
			);
		}

		if (
			typeof taskId !== 'number' ||
			typeof type !== 'string' ||
			typeof index !== 'number'
		) {
			return json({ error: 'Invalid input types' }, { status: 400 });
		}

		if (
			typeof config !== 'object' ||
			config === null ||
			Array.isArray(config)
		) {
			return json({ error: 'Config must be a valid object' }, { status: 400 });
		}

		if (!Object.values(taskBlockTypeEnum).includes(type as taskBlockTypeEnum)) {
			return json({ error: 'Invalid block type' }, { status: 400 });
		}

		const block = await createTaskBlock({
			taskId,
			type: type as taskBlockTypeEnum,
			config: config as Record<string, unknown>,
			index,
		});

		// If this is a whiteboard block, create the whiteboard entry
		if (type === 'whiteboard') {
			await createWhiteboard({
				taskBlockId: block.id,
				title: (config as { title?: string }).title || null,
			});
		}

		return json({ block });
	} catch (error) {
		console.error('Error creating block:', error);
		return json({ error: 'Failed to create block' }, { status: 500 });
	}
}

export async function PATCH({ request }: { request: Request }) {
	try {
		const { block, config } = await request.json();

		if (!block.id) {
			return json({ error: 'Block ID is required' }, { status: 400 });
		}

		if (typeof block.id !== 'number') {
			return json({ error: 'Invalid block ID type' }, { status: 400 });
		}

		const updates: {
			config?: Record<string, unknown>;
			type?: taskBlockTypeEnum;
		} = {};
		if (config !== undefined) {
			if (
				typeof config !== 'object' ||
				config === null ||
				Array.isArray(config)
			) {
				return json(
					{ error: 'Config must be a valid object' },
					{ status: 400 },
				);
			}
			updates.config = config as Record<string, unknown>;
		}
		if (block.type !== undefined) {
			if (typeof block.type !== 'string') {
				return json({ error: 'Invalid block type' }, { status: 400 });
			}
			updates.type = block.type as taskBlockTypeEnum;
		}

		if (Object.keys(updates).length === 0) {
			return json({ error: 'No valid updates provided' }, { status: 400 });
		}

		const updatedBlock = await updateTaskBlock(block.id, updates);
		return json({ block: updatedBlock });
	} catch (error) {
		console.error('Error updating block:', error);
		return json({ error: 'Failed to update block' }, { status: 500 });
	}
}

export async function DELETE({ url }: { url: URL }) {
	try {
		const blockIdParam = url.searchParams.get('blockId');

		if (!blockIdParam) {
			return json({ error: 'Block ID is required' }, { status: 400 });
		}

		let blockId: number;
		try {
			blockId = parseInt(blockIdParam, 10);
		} catch {
			return json({ error: 'Invalid block ID' }, { status: 400 });
		}

		await deleteTaskBlock(blockId);
		return json({ success: true });
	} catch (error) {
		console.error('Error deleting block:', error);
		return json({ error: 'Failed to delete block' }, { status: 500 });
	}
}

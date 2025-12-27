import { invalidateAll } from '$app/navigation'
import type { taskBlockTypeEnum } from '$lib/enums'

const API_BASE = '/api/tasks'

export async function updateTaskTitle(request: { taskId: number; title: string }) {
	const response = await fetch(API_BASE, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(request)
	})

	const data = await response.json()

	if (!response.ok) {
		throw new Error(data.error || 'Failed to update task title')
	}

	return data
}

export async function createBlock(request: {
	taskId: number
	type: taskBlockTypeEnum
	config: unknown
	index: number
}) {
	const response = await fetch(`${API_BASE}/blocks`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(request)
	})

	const data = await response.json()

	if (!response.ok) {
		throw new Error(data.error || 'Failed to create block')
	}

	// If a whiteboard block was created, invalidate to reload whiteboardMap
	if (request.type === 'whiteboard') {
		await invalidateAll()
	}

	return data
}

export async function updateBlock(request: {
	block: {
		id: number
		createdAt: Date
		updatedAt: Date
		type: taskBlockTypeEnum
		taskId: number
		config: unknown
		index: number
		availableMarks: number | null
	}
	config: unknown
}) {
	const response = await fetch(`${API_BASE}/blocks`, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(request)
	})

	const data = await response.json()

	if (!response.ok) {
		throw new Error(data.error || 'Failed to update block')
	}

	return data
}

export async function deleteBlock(blockId: number) {
	const response = await fetch(`${API_BASE}/blocks?blockId=${blockId}`, {
		method: 'DELETE'
	})

	const data = await response.json()

	if (!response.ok) {
		throw new Error(data.error || 'Failed to delete block')
	}

	return data
}

export async function updateBlockOrder(request: { blockOrder: { id: number; index: number }[] }) {
	const response = await fetch(`${API_BASE}/blocks/order`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(request)
	})

	const data = await response.json()

	if (!response.ok) {
		throw new Error(data.error || 'Failed to update block order')
	}

	return data
}

export async function upsertBlockResponse(
	taskBlockId: number,
	classTaskId: number,
	response: unknown
) {
	const result = await fetch(`${API_BASE}/blocks/responses`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			taskBlockId,
			classTaskId,
			response
		})
	})

	if (!result.ok) {
		throw new Error('Failed to save response')
	}

	return result.json()
}

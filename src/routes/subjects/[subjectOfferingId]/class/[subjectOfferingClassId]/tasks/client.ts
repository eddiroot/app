// Client-side API helper functions for Tasks ordering

const API_BASE = '/api/tasks';

/**
 * Update task order within topics
 */
interface TaskOrderRequest {
	taskIds: string[];
	topicId: string;
}

export async function updateTaskOrder(request: TaskOrderRequest) {
	const response = await fetch(`${API_BASE}/order`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ type: 'task', ...request }),
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.error || 'Failed to update task order');
	}

	return data;
}

/**
 * Update topic order
 */
interface TopicOrderRequest {
	topicIds: string[];
}

export async function updateTopicOrder(request: TopicOrderRequest) {
	const response = await fetch(`${API_BASE}/order`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ type: 'topic', ...request }),
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.error || 'Failed to update topic order');
	}

	return data;
}

import { updateTaskOrder } from '$lib/server/db/service'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const PATCH: RequestHandler = async ({
	request,
	locals: { security },
}) => {
	security.isAuthenticated()

	try {
		const body = await request.json()
		const { type, taskOrder } = body as {
			type: string
			taskOrder: { id: number; index: number }[]
		}

		if (type === 'task') {
			await updateTaskOrder(taskOrder)
		} else {
			return json({ error: 'Invalid order type' }, { status: 400 })
		}

		return json({ success: true })
	} catch (error) {
		console.error('Error updating order:', error)
		return json({ error: 'Failed to update order' }, { status: 500 })
	}
}

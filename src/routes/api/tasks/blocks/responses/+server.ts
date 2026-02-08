import {
	upsertClassTaskBlockResponse,
	upsertClassTaskResponse,
} from '$lib/server/db/service'
import { json } from '@sveltejs/kit'

export async function POST({ request, locals: { security } }) {
	try {
		const user = security.isAuthenticated().isStudent().getUser()
		const { taskBlockId, classTaskId, response } = await request.json()

		if (!taskBlockId || !classTaskId || response === undefined) {
			return json({ error: 'Missing required fields' }, { status: 400 })
		}

		// Will create the class task response if it doesn't yet exist
		await upsertClassTaskResponse(classTaskId, user.id)

		const savedResponse = await upsertClassTaskBlockResponse(
			taskBlockId,
			user.id,
			classTaskId,
			response,
		)

		return json({ success: true, response: savedResponse })
	} catch (error) {
		console.error('Error saving task block response:', error)
		return json({ error: 'Failed to save response' }, { status: 500 })
	}
}

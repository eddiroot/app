import { createTimetableQueueEntry } from '$lib/server/db/service/timetables.js';
import { FETDockerService } from '$lib/server/fet';
import { uploadBufferHelper } from '$lib/server/obj.js';
import { error, json, type RequestHandler } from '@sveltejs/kit';
import { processTimetableQueue } from '../../../../scripts/process/timetable.js';

export const POST: RequestHandler = async ({ locals: { security }, request }) => {
	security.isAuthenticated();
	try {
		// Ensure user is authenticated and is a school admin
		security.isAuthenticated().isSchoolAdmin();

		const user = security.getUser();
		const requestData = await request.json();
		const { timetableId, draft, fetXmlContent } = requestData;

		// Validate inputs
		if (!timetableId) {
			return error(400, {
				message: 'Missing required fields: timetableId and fileName'
			});
		}

		// If no FET XML content provided, generate it from timetable data
		if (!fetXmlContent || fetXmlContent.trim() === '') {
			console.error('Error recieving FET input:' + error);
			return error(500, {
				message: 'Failed to generate timetable data. Please ensure all required data is configured.'
			});
		}

		const uniqueFileName = `ID_${draft.id}_CreatedAt_${draft.createdAt}.fet`;
		const objectKey = `${user.schoolId}/${timetableId}/${draft.id}/input/${uniqueFileName}`;

		await uploadBufferHelper(Buffer.from(fetXmlContent, 'utf-8'), objectKey, 'application/xml');
		console.log(`✅ [TIMETABLE PROCESSOR] Input file stored: ${objectKey}`);

		await createTimetableQueueEntry(timetableId, draft.id, user.id, uniqueFileName);

		// Trigger processing (this will run asynchronously)
		processTimetableQueue().catch((err: Error) => {
			console.error('Error in timetable processing:', err);
		});

		return json({
			success: true,
			message: 'Timetable generation has been queued successfully',
			timetableDraftId: draft.id,
			queuedAt: new Date().toISOString()
		});
	} catch (err) {
		console.error('Error queuing timetable generation:', err);
		return error(500, {
			message: 'Failed to queue timetable generation'
		});
	}
};

export const GET: RequestHandler = async ({ locals: { security } }) => {
	security.isAuthenticated();
	try {
		security.isAuthenticated().isSchoolAdmin();

		const fetService = new FETDockerService();
		const isRunning = await fetService.isContainerRunning();

		return json({
			serviceStatus: isRunning ? 'running' : 'stopped',
			available: isRunning
		});
	} catch (err) {
		console.error('Error checking FET service status:', err);
		return error(500, {
			message: 'Failed to check service status'
		});
	}
};

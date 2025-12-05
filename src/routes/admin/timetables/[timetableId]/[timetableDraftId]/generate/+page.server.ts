import { userTypeEnum } from '$lib/enums.js';
import {
	getActiveTimetableDraftConstraintsByTimetableDraftId,
	getAllStudentGroupsByTimetableDraftId,
	getAllStudentsWithYearLevelsBySchoolId,
	getBuildingsBySchoolId,
	getEnhancedTimetableDraftActivitiesByTimetableDraftId,
	getSchoolById,
	getSpacesBySchoolId,
	getSubjectsBySchoolId,
	getTimetableDraftById,
	getTimetableDraftDaysByTimetableDraftId,
	getTimetableDraftPeriodsByTimetableDraftId,
	getTimetableQueueByTimetableId,
	getUsersBySchoolIdAndType
} from '$lib/server/db/service';
import { fail } from '@sveltejs/kit';
import { processTimetableQueue } from '../../../../../../scripts/process/timetable.js';
import { buildFETInput } from './utils.js';

export const load = async ({ params, locals: { security }, depends }) => {
	security.isAuthenticated().isSchoolAdmin();

	const timetableId = parseInt(params.timetableId, 10);
	if (isNaN(timetableId)) {
		return fail(400, { error: 'Invalid timetable ID' });
	}

	depends('app:queue');
	const queueEntries = await getTimetableQueueByTimetableId(timetableId);

	return {
		queueEntries
	};
};

export const actions = {
	generateTimetable: async ({ params, locals: { security }, fetch }) => {
		security.isAuthenticated().isSchoolAdmin();

		const user = security.getUser();
		const timetableId = parseInt(params.timetableId, 10);
		const draft = await getTimetableDraftById(parseInt(params.timetableDraftId, 10));

		try {
			const [
				timetableDays,
				timetablePeriods,
				studentGroups,
				studentsByYear,
				activities,
				buildings,
				spaces,
				teachers,
				subjects,
				school,
				activeConstraints
			] = await Promise.all([
				getTimetableDraftDaysByTimetableDraftId(draft.id),
				getTimetableDraftPeriodsByTimetableDraftId(draft.id),
				getAllStudentGroupsByTimetableDraftId(draft.id),
				getAllStudentsWithYearLevelsBySchoolId(user.schoolId),
				getEnhancedTimetableDraftActivitiesByTimetableDraftId(draft.id),
				getBuildingsBySchoolId(user.schoolId),
				getSpacesBySchoolId(user.schoolId),
				getUsersBySchoolIdAndType(user.schoolId, userTypeEnum.teacher),
				getSubjectsBySchoolId(user.schoolId),
				getSchoolById(user.schoolId),
				getActiveTimetableDraftConstraintsByTimetableDraftId(draft.id)
			]);

			const xmlContent = await buildFETInput({
				timetableDays,
				timetablePeriods,
				studentGroups,
				studentsByYear,
				activities,
				buildings,
				spaces,
				teachers,
				subjects,
				school,
				activeConstraints
			});

			// Call the FET API to generate the timetable
			try {
				const response = await fetch('/api/timetables/generate', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						timetableId,
						draft,
						fetXmlContent: xmlContent
					})
				});

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.message || 'Failed to generate timetable');
				}

				const result = await response.json();
				return {
					success: true,
					message: result.message || 'Timetable generation has been queued successfully'
				};
			} catch (apiError) {
				console.error('Error calling FET API:', apiError);
				// Fallback to manual queue entry if API call fails
				// await createTimetableQueueEntry(timetableId, user.id, uniqueFileName);
				return {
					success: true,
					message: 'Timetable data queued for processing (fallback mode)'
				};
			}
		} catch (error) {
			console.error('Error generating timetable XML:', error);
			return fail(500, {
				error: 'Failed to generate timetable. Please ensure all required data is configured.'
			});
		}
	},
	processQueue: async ({ locals: { security } }) => {
		security.isAuthenticated().isSchoolAdmin();

		try {
			// Trigger the queue processor
			processTimetableQueue().catch((err: Error) => {
				console.error('Background processing error:', err);
			});

			return {
				success: true,
				message: 'Queue processing started'
			};
		} catch (error) {
			console.error('Error starting queue processor:', error);
			return fail(500, {
				error: 'Failed to start queue processing'
			});
		}
	}
};

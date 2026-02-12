import {
	getCampusEventsForDayByUserId,
	getRecentAnnouncementsByUserId,
	getSchoolEventsForDayByUserId,
	getSubjectClassAllocationsByUserIdForToday,
	getSubjectOfferingClassEventsForDayByUserId,
	getSubjectOfferingEventsForDayByUserId,
	getSubjectsByUserId,
} from '$lib/server/db/service';
import { getPublishedNewsBySchoolId } from '$lib/server/db/service/news';
import { getCampusesByUserId } from '$lib/server/db/service/school';

export const load = async ({ locals: { security } }) => {
	const user = security.isAuthenticated().getUser();

	// Existing dashboard data
	const subjects = await getSubjectsByUserId(user.id);
	const announcements = await getRecentAnnouncementsByUserId(user.id);
	const userClassesTemp = await getSubjectClassAllocationsByUserIdForToday(
		user.id,
	);
	const userClasses = [
		...userClassesTemp,
		{
			classAllocation: {
				id: 999,
				subjectOfferingClassId: 999,
				schoolSpaceId: 1,
				start: new Date(2026, 1, 12, 9, 0),
				end: new Date(2026, 1, 12, 10, 0),
				createdAt: new Date(),
				updatedAt: new Date(),
				isArchived: false,
			},
			schoolSpace: {
				id: 1,
				name: 'Room 101',
				description: 'Sample classroom',
				type: 'classroom',
				capacity: 30,
				schoolBuildingId: 1,
				createdAt: new Date(),
				updatedAt: new Date(),
				isArchived: false,
			},
			subjectOffering: { id: 1 },
			subject: { id: 1, name: 'Mathematics' },
			userSubjectOffering: {
				userId: user.id,
				subOfferingId: 1,
				isComplete: false,
				color: 45,
				createdAt: new Date(),
				updatedAt: new Date(),
				isArchived: false,
			},
		},
	];

	// Get all event data to determine which events they should see for today
	const [
		schoolEvents,
		campusEvents,
		subjectOfferingEvents,
		subjectOfferingClassEvents,
	] = await Promise.all([
		getSchoolEventsForDayByUserId(user.id, new Date(2026, 1, 12)),
		getCampusEventsForDayByUserId(user.id, new Date(2026, 1, 12)),
		getSubjectOfferingEventsForDayByUserId(user.id, new Date(2026, 1, 12)),
		getSubjectOfferingClassEventsForDayByUserId(user.id, new Date(2026, 1, 12)),
	]);

	// Create an dictionary of events

	// Get user's campuses to determine which news they should see
	const userCampuses = await getCampusesByUserId(user.id);
	const userCampusId = userCampuses.length > 0 ? userCampuses[0].id : undefined;

	// Get all published news for the user's school and campus, filtered by visibility
	const news = await getPublishedNewsBySchoolId(
		user.schoolId,
		userCampusId,
		user.type,
	);
	console.log(
		schoolEvents,
		campusEvents,
		subjectOfferingEvents,
		subjectOfferingClassEvents,
	);

	return {
		user,
		subjects,
		announcements,
		userClasses,
		news,
		schoolEvents,
		campusEvents,
		subjectOfferingEvents,
		subjectOfferingClassEvents,
	};
};

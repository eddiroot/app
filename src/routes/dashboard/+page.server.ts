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
	const userClasses = await getSubjectClassAllocationsByUserIdForToday(user.id);

	// Get all event data to determine which events they should see for today
	const [
		schoolEvents,
		campusEvents,
		subjectOfferingEvents,
		subjectOfferingClassEvents,
	] = await Promise.all([
		getSchoolEventsForDayByUserId(user.id, new Date()),
		getCampusEventsForDayByUserId(user.id, new Date()),
		getSubjectOfferingEventsForDayByUserId(user.id, new Date()),
		getSubjectOfferingClassEventsForDayByUserId(user.id, new Date()),
	]);

	// Get user's campuses to determine which news they should see
	const userCampuses = await getCampusesByUserId(user.id);
	const userCampusId = userCampuses.length > 0 ? userCampuses[0].id : undefined;

	// Get all published news for the user's school and campus, filtered by visibility
	const news = await getPublishedNewsBySchoolId(
		user.schoolId,
		userCampusId,
		user.type,
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

import {
	getCampusEventsForWeekByUserId,
	getSchoolEventsForWeekBySchoolId,
	getSubjectClassAllocationsByUserIdForWeek,
	getSubjectOfferingClassEventsForWeekByUserId,
	getSubjectOfferingEventsForWeekByUserId,
	getUserEventRSVPs
} from '$lib/server/db/service';

export const load = async ({ locals: { security }, url }) => {
	const user = security.isAuthenticated().getUser();

	const weekParam = url.searchParams.get('week');
	const weekStartDate = new Date(weekParam ?? new Date().toISOString().split('T')[0]);

	const [
		classAllocation,
		schoolEvents,
		campusEvents,
		subjectOfferingEvents,
		subjectOfferingClassEvents,
		userRSVPs
	] = await Promise.all([
		getSubjectClassAllocationsByUserIdForWeek(user.id, weekStartDate),
		getSchoolEventsForWeekBySchoolId(user.schoolId, weekStartDate),
		getCampusEventsForWeekByUserId(user.id, weekStartDate),
		getSubjectOfferingEventsForWeekByUserId(user.id, weekStartDate),
		getSubjectOfferingClassEventsForWeekByUserId(user.id, weekStartDate),
		getUserEventRSVPs(user.id)
	]);

	return {
		user,
		classAllocation,
		schoolEvents,
		campusEvents,
		subjectOfferingEvents,
		subjectOfferingClassEvents,
		userRSVPs,
		currentWeekStart: weekStartDate.toISOString().split('T')[0]
	};
};

export const actions = {
	changeWeek: async ({ locals: { security }, request }) => {
		const user = security.isAuthenticated().getUser();
		const formData = await request.formData();
		const weekStartDate = new Date(formData.get('week') as string);

		// Get class allocations and events for the new week
		const [
			classAllocation,
			schoolEvents,
			campusEvents,
			subjectOfferingEvents,
			subjectOfferingClassEvents,
			userRSVPs
		] = await Promise.all([
			getSubjectClassAllocationsByUserIdForWeek(user.id, weekStartDate),
			getSchoolEventsForWeekBySchoolId(user.schoolId, weekStartDate),
			getCampusEventsForWeekByUserId(user.id, weekStartDate),
			getSubjectOfferingEventsForWeekByUserId(user.id, weekStartDate),
			getSubjectOfferingClassEventsForWeekByUserId(user.id, weekStartDate),
			getUserEventRSVPs(user.id)
		]);

		return {
			success: true,
			classAllocation: classAllocation || [],
			schoolEvents: schoolEvents || [],
			campusEvents: campusEvents || [],
			subjectOfferingEvents: subjectOfferingEvents || [],
			subjectOfferingClassEvents: subjectOfferingClassEvents || [],
			userRSVPs: userRSVPs || [],
			currentWeekStart: weekStartDate.toISOString().split('T')[0]
		};
	}
};

import type {
	Event,
	SubjectOffering,
	SubjectOfferingClass,
} from '$lib/server/db/schema';
import {
	getCampusEventsForWeekByUserId,
	getSchoolEventsForWeekBySchoolId,
	getSubjectClassAllocationsByUserIdForWeek,
	getSubjectOfferingClassEventsForWeekByUserId,
	getSubjectOfferingEventsForWeekByUserId,
	getUserEventRSVPs,
} from '$lib/server/db/service';

type WeekEvent = {
	event: Event;
	subjectOffering?: SubjectOffering;
	subject?: { id: number; name: string };
	subjectOfferingClass?: SubjectOfferingClass;
};

export const load = async ({ locals: { security }, url }) => {
	const user = security.isAuthenticated().getUser();

	const weekParam = url.searchParams.get('week');
	const weekStartDate = new Date(
		weekParam ?? new Date().toISOString().split('T')[0],
	);

	const [
		classAllocation,
		schoolEvents,
		campusEvents,
		subjectOfferingEvents,
		subjectOfferingClassEvents,
		userRSVPs,
	] = await Promise.all([
		getSubjectClassAllocationsByUserIdForWeek(user.id, weekStartDate),
		getSchoolEventsForWeekBySchoolId(user.schoolId, weekStartDate),
		getCampusEventsForWeekByUserId(user.id, weekStartDate),
		getSubjectOfferingEventsForWeekByUserId(user.id, weekStartDate),
		getSubjectOfferingClassEventsForWeekByUserId(user.id, weekStartDate),
		getUserEventRSVPs(user.id),
	]);

	const weekEvents: WeekEvent[] = [
		...schoolEvents,
		...campusEvents,
		...subjectOfferingEvents,
		...subjectOfferingClassEvents,
	];

	return {
		user,
		classAllocation,
		weekEvents,
		userRSVPs,
		currentWeekStart: weekStartDate.toISOString().split('T')[0],
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
			userRSVPs,
		] = await Promise.all([
			getSubjectClassAllocationsByUserIdForWeek(user.id, weekStartDate),
			getSchoolEventsForWeekBySchoolId(user.schoolId, weekStartDate),
			getCampusEventsForWeekByUserId(user.id, weekStartDate),
			getSubjectOfferingEventsForWeekByUserId(user.id, weekStartDate),
			getSubjectOfferingClassEventsForWeekByUserId(user.id, weekStartDate),
			getUserEventRSVPs(user.id),
		]);

		const weekEvents: WeekEvent[] = [
			...schoolEvents,
			...campusEvents,
			...subjectOfferingEvents,
			...subjectOfferingClassEvents,
		];

		return {
			success: true,
			classAllocation: classAllocation || [],
			weekEvents,
			userRSVPs: userRSVPs || [],
			currentWeekStart: weekStartDate.toISOString().split('T')[0],
		};
	},
};

import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema/user';
import { generateTimetableStatistics } from '$lib/server/db/utils/timetable-statistics';
import { generateUserTimetable } from '$lib/server/db/utils/user-timetable-statistics';
import { fail } from '@sveltejs/kit';
import { and, eq, ilike, or } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { security } }) => {
	security.isAuthenticated().isSchoolAdmin();

	const timetableDraftId = parseInt(params.timetableDraftId);

	// Generate comprehensive statistics which includes students and teachers
	const statistics = await generateTimetableStatistics(timetableDraftId);

	// Convert Map to plain object for serialization
	const dayUtilization = Object.fromEntries(statistics.summary.dayUtilization);

	return {
		students: statistics.students,
		teachers: statistics.teachers,
		summary: {
			...statistics.summary,
			dayUtilization
		}
	};
};

export const actions: Actions = {
	searchUser: async ({ request, locals: { security } }) => {
		const currentUser = security.isAuthenticated().isSchoolAdmin().getUser();
		const schoolId = currentUser.schoolId;

		const formData = await request.formData();
		const searchQuery = formData.get('search')?.toString().trim();

		if (!searchQuery || searchQuery.length < 2) {
			return fail(400, { error: 'Search query must be at least 2 characters' });
		}

		// Search for users by first name, last name, or email
		const users = await db
			.select({
				id: user.id,
				firstName: user.firstName,
				lastName: user.lastName,
				email: user.email,
				type: user.type
			})
			.from(user)
			.where(
				and(
					eq(user.schoolId, schoolId),
					eq(user.isArchived, false),
					or(
						ilike(user.firstName, `%${searchQuery}%`),
						ilike(user.lastName, `%${searchQuery}%`),
						ilike(user.email, `%${searchQuery}%`)
					)
				)
			)
			.limit(10);

		return { users, searchQuery };
	},

	loadUserTimetable: async ({ request, params, locals: { security } }) => {
		const currentUser = security.isAuthenticated().isSchoolAdmin().getUser();
		const schoolId = currentUser.schoolId;

		const formData = await request.formData();
		const userId = formData.get('userId')?.toString();

		if (!userId) {
			return fail(400, { error: 'User ID is required' });
		}

		// Verify user belongs to the same school
		const selectedUser = await db
			.select()
			.from(user)
			.where(and(eq(user.id, userId), eq(user.schoolId, schoolId)))
			.limit(1);

		if (selectedUser.length === 0) {
			return fail(404, { error: 'User not found' });
		}

		try {
			const userTimetable = await generateUserTimetable(userId, parseInt(params.timetableDraftId));

			return { userTimetable };
		} catch (error) {
			console.error('Error loading user timetable:', error);
			return fail(500, { error: 'Failed to load timetable' });
		}
	}
};

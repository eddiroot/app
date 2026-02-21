import { userTypeEnum } from '$lib/enums';
import {
	getUserProfileById /*, getStudentGrades */,
} from '$lib/server/db/service';
import { redirect } from '@sveltejs/kit';

export const load = async ({ params, locals: { security } }) => {
	const currentUser = security.isAuthenticated().getUser();
	const targetUserId = params.userId;

	if (!targetUserId) {
		redirect(302, '/dashboard');
	}

	// Get the target user's profile
	const profile = await getUserProfileById(targetUserId);
	if (!profile) {
		redirect(302, '/dashboard');
	}

	// Only students have grades, redirect others to dashboard
	if (profile.type !== userTypeEnum.student) {
		redirect(302, '/dashboard');
	}

	// Anyone can view student grades (for now - you might want to add permissions later)
	const isOwnProfile = currentUser.id === targetUserId;
	const isAdmin = currentUser.type === userTypeEnum.admin;

	// Load student grades/subjects
	let studentSubjects = null;
	// Mock data for demonstration - subject overview with overall grades
	studentSubjects = [
		{
			subjectId: 1,
			subjectName: 'Mathematics',
			overallGrade: 85,
			totalTasks: 8,
			completedTasks: 7,
			lastUpdated: new Date('2024-01-15').toISOString(),
		},
		{
			subjectId: 2,
			subjectName: 'Biology',
			overallGrade: 92,
			totalTasks: 6,
			completedTasks: 6,
			lastUpdated: new Date('2024-01-12').toISOString(),
		},
		{
			subjectId: 3,
			subjectName: 'English Literature',
			overallGrade: 78,
			totalTasks: 10,
			completedTasks: 9,
			lastUpdated: new Date('2024-01-10').toISOString(),
		},
		{
			subjectId: 4,
			subjectName: 'History',
			overallGrade: 45,
			totalTasks: 5,
			completedTasks: 5,
			lastUpdated: new Date('2024-01-08').toISOString(),
		},
		{
			subjectId: 5,
			subjectName: 'Chemistry',
			overallGrade: 95,
			totalTasks: 7,
			completedTasks: 6,
			lastUpdated: new Date('2024-01-05').toISOString(),
		},
		{
			subjectId: 6,
			subjectName: 'Physics',
			overallGrade: 38,
			totalTasks: 4,
			completedTasks: 3,
			lastUpdated: new Date('2024-01-03').toISOString(),
		},
	];
	// Real implementation: studentSubjects = await getStudentSubjectGrades(targetUserId);

	return { profile, isOwnProfile, isAdmin, currentUser, studentSubjects };
};

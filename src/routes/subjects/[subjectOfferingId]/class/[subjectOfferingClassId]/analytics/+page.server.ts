import { db } from '$lib/server/db/index.js';
import { subject, subjectOfferingClass } from '$lib/server/db/schema';
import {
	getStudentsBySubjectOfferingClassId,
	getTasksBySubjectOfferingClassId,
	getTeachersBySubjectOfferingClassId
} from '$lib/server/db/service';
import { error } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({
	locals,
	params: { subjectOfferingId, subjectOfferingClassId }
}) => {
	const user = locals.security.isAuthenticated().getUser();
	const subjectOfferingIdInt = parseInt(subjectOfferingId, 10);
	const subjectOfferingClassIdInt = parseInt(subjectOfferingClassId, 10);
	if (isNaN(subjectOfferingIdInt) || isNaN(subjectOfferingClassIdInt)) {
		throw error(400, 'Invalid subject offering or class ID');
	}

	const subjectData = await db.query.subject.findFirst({
		where: eq(subject.id, subjectOfferingIdInt)
	});
	if (!subjectData) throw error(404, 'Subject not found');

	// Ensure class belongs to offering
	const cls = await db.query.subjectOfferingClass.findFirst({
		where: and(eq(subjectOfferingClass.id, subjectOfferingClassIdInt))
	});
	if (!cls) throw error(404, 'Class not found');

	const [students, tasksRaw, teachers] = await Promise.all([
		getStudentsBySubjectOfferingClassId(subjectOfferingClassIdInt),
		getTasksBySubjectOfferingClassId(user.id, subjectOfferingClassIdInt),
		getTeachersBySubjectOfferingClassId(subjectOfferingClassIdInt)
	]);

	const totalStudents = students.length || 0;
	const studentPerformance = {
		keyInsights: [] as string[],
		currentAverage: 0,
		currentAverageChange: 0,
		gradeDistribution: [] as Array<{ grade: string; count: number }>,
		students: students.map((s) => ({
			id: s.id,
			firstName: s.firstName,
			lastName: s.lastName,
			avatarUrl: s.avatarUrl,
			participation: 0,
			participationCompletedCount: 0,
			participationTotal: 0,
			assignmentsCompleted: 0,
			assignmentsTotal: 0,
			assignmentsCompletedCount: 0,
			lessonsCompleted: 0,
			lessonsTotal: 0,
			lessonsCompletedCount: 0,
			homeworkCompleted: 0,
			homeworkTotal: 0,
			homeworkCompletedCount: 0,
			lastActive: '—',
			grade: 0
		}))
	};

	const tasks = tasksRaw.map((t) => ({
		id: `task-${t.subjectOfferingClassTask.id}`,
		name: t.task.title,
		type: t.task.type,
		studentsCompleted: 0,
		totalStudents,
		completedCount: 0,
		averageGrade: 0,
		totalGrade: 0,
		gradeCount: 0,
		averageTime: '—',
		weight: 0,
		dueDate: t.subjectOfferingClassTask.dueDate
			? t.subjectOfferingClassTask.dueDate.toISOString().slice(0, 10)
			: new Date().toISOString().slice(0, 10),
		status: 'due'
	}));

	const taskAnalytics = {
		keyInsights: [] as string[],
		submissionsDue: tasks.length,
		avgGradeOverTime: [] as Array<{ lesson: string; grade: number }>,
		tasks
	};

	const discussionAnalytics = {
		keyInsights: [] as string[],
		viewsOnLastAnnouncement: { views: 0, total: totalStudents },
		postsOverTime: [] as Array<{ week: string; posts: number }>,
		students: studentPerformance.students.map((s) => ({
			id: s.id,
			firstName: s.firstName,
			lastName: s.lastName,
			avatarUrl: s.avatarUrl,
			questionsPosted: 0,
			questionsAnswered: 0,
			totalContributions: 0,
			lastActive: s.lastActive
		}))
	};

	const analyticsData = { studentPerformance, taskAnalytics, discussionAnalytics };

	const mockData = {
		studentPerformance: {
			keyInsights: [
				"2 students haven't turned in assignment 1",
				"1 student hasn't visited your page in the past week"
			],
			currentAverage: 65,
			currentAverageChange: 3,
			students: [
				{
					id: '1',
					firstName: 'Sam',
					lastName: 'Smith',
					avatarUrl: '/avatars/sam.jpg',
					participation: 82,
					participationCompletedCount: 8,
					participationTotal: 10,
					assignmentsCompleted: 75,
					assignmentsTotal: 4,
					assignmentsCompletedCount: 3,
					lessonsCompleted: 100,
					lessonsTotal: 6,
					lessonsCompletedCount: 6,
					homeworkCompleted: 75,
					homeworkTotal: 4,
					homeworkCompletedCount: 3,
					lastActive: '< 1 day',
					grade: 85
				},
				{
					id: '2',
					firstName: 'Emma',
					lastName: 'Johnson',
					avatarUrl: '/avatars/emma.jpg',
					participation: 95,
					participationCompletedCount: 10,
					participationTotal: 10,
					assignmentsCompleted: 100,
					assignmentsTotal: 4,
					assignmentsCompletedCount: 4,
					lessonsCompleted: 100,
					lessonsTotal: 6,
					lessonsCompletedCount: 6,
					homeworkCompleted: 100,
					homeworkTotal: 4,
					homeworkCompletedCount: 4,
					lastActive: '2 hours ago',
					grade: 92
				},
				{
					id: '3',
					firstName: 'Michael',
					lastName: 'Chen',
					avatarUrl: '/avatars/michael.jpg',
					participation: 60,
					participationCompletedCount: 6,
					participationTotal: 10,
					assignmentsCompleted: 50,
					assignmentsTotal: 4,
					assignmentsCompletedCount: 2,
					lessonsCompleted: 83,
					lessonsTotal: 6,
					lessonsCompletedCount: 5,
					homeworkCompleted: 25,
					homeworkTotal: 4,
					homeworkCompletedCount: 1,
					lastActive: '3 days ago',
					grade: 68
				},
				{
					id: '4',
					firstName: 'Sarah',
					lastName: 'Davis',
					avatarUrl: '/avatars/sarah.jpg',
					participation: 88,
					participationCompletedCount: 9,
					participationTotal: 10,
					assignmentsCompleted: 100,
					assignmentsTotal: 4,
					assignmentsCompletedCount: 4,
					lessonsCompleted: 100,
					lessonsTotal: 6,
					lessonsCompletedCount: 6,
					homeworkCompleted: 75,
					homeworkTotal: 4,
					homeworkCompletedCount: 3,
					lastActive: '1 day ago',
					grade: 88
				},
				{
					id: '5',
					firstName: 'David',
					lastName: 'Wilson',
					avatarUrl: '/avatars/david.jpg',
					participation: 40,
					participationCompletedCount: 4,
					participationTotal: 10,
					assignmentsCompleted: 25,
					assignmentsTotal: 4,
					assignmentsCompletedCount: 1,
					lessonsCompleted: 67,
					lessonsTotal: 6,
					lessonsCompletedCount: 4,
					homeworkCompleted: 0,
					homeworkTotal: 4,
					homeworkCompletedCount: 0,
					lastActive: '1 week ago',
					grade: 45
				},
				{
					id: '6',
					firstName: 'Lisa',
					lastName: 'Martinez',
					avatarUrl: '/avatars/lisa.jpg',
					participation: 97,
					participationCompletedCount: 10,
					participationTotal: 10,
					assignmentsCompleted: 100,
					assignmentsTotal: 4,
					assignmentsCompletedCount: 4,
					lessonsCompleted: 100,
					lessonsTotal: 6,
					lessonsCompletedCount: 6,
					homeworkCompleted: 100,
					homeworkTotal: 4,
					homeworkCompletedCount: 4,
					lastActive: '3 hours ago',
					grade: 95
				},
				{
					id: '7',
					firstName: 'James',
					lastName: 'Brown',
					avatarUrl: '/avatars/james.jpg',
					participation: 70,
					participationCompletedCount: 7,
					participationTotal: 10,
					assignmentsCompleted: 75,
					assignmentsTotal: 4,
					assignmentsCompletedCount: 3,
					lessonsCompleted: 83,
					lessonsTotal: 6,
					lessonsCompletedCount: 5,
					homeworkCompleted: 50,
					homeworkTotal: 4,
					homeworkCompletedCount: 2,
					lastActive: '2 days ago',
					grade: 73
				},
				{
					id: '8',
					firstName: 'Ashley',
					lastName: 'Taylor',
					avatarUrl: '/avatars/ashley.jpg',
					participation: 92,
					participationCompletedCount: 9,
					participationTotal: 10,
					assignmentsCompleted: 100,
					assignmentsTotal: 4,
					assignmentsCompletedCount: 4,
					lessonsCompleted: 100,
					lessonsTotal: 6,
					lessonsCompletedCount: 6,
					homeworkCompleted: 100,
					homeworkTotal: 4,
					homeworkCompletedCount: 4,
					lastActive: '5 hours ago',
					grade: 90
				}
			]
		},
		taskAnalytics: {
			keyInsights: [
				'Your most used lesson component used to question is the fill in the blank block',
				'Your students on average score best on the multiple choice block'
			],
			submissionsDue: 7,
			avgGradeOverTime: [
				{ lesson: 'Week 1', grade: 58 },
				{ lesson: 'Week 2', grade: 65 },
				{ lesson: 'Week 3', grade: 62 },
				{ lesson: 'Week 4', grade: 72 },
				{ lesson: 'Week 5', grade: 68 },
				{ lesson: 'Week 6', grade: 78 },
				{ lesson: 'Week 7', grade: 75 },
				{ lesson: 'Week 8', grade: 82 },
				{ lesson: 'Week 9', grade: 79 },
				{ lesson: 'Week 10', grade: 85 },
				{ lesson: 'Week 11', grade: 83 },
				{ lesson: 'Week 12', grade: 88 }
			],
			tasks: [
				{
					id: 'assignment-1',
					name: 'Assignment 1',
					type: 'assignment',
					studentsCompleted: 100,
					totalStudents: 21,
					completedCount: 21,
					averageGrade: 65,
					totalGrade: 40,
					gradeCount: 26,
					averageTime: '58 Minutes',
					weight: 10,
					dueDate: '2025-08-17',
					status: 'completed'
				},
				{
					id: 'lesson-1',
					name: 'Lesson 1',
					type: 'lesson',
					studentsCompleted: 67,
					totalStudents: 21,
					completedCount: 14,
					averageGrade: 83,
					totalGrade: 40,
					gradeCount: 33,
					averageTime: '22 Minutes',
					weight: 5,
					dueDate: '2025-08-25',
					status: 'due'
				},
				{
					id: 'quiz-1',
					name: 'Quiz 1',
					type: 'test',
					studentsCompleted: 95,
					totalStudents: 21,
					completedCount: 20,
					averageGrade: 78,
					totalGrade: 40,
					gradeCount: 31,
					averageTime: '15 Minutes',
					weight: 15,
					dueDate: '2025-08-21',
					status: 'completed'
				},
				{
					id: 'assignment-2',
					name: 'Assignment 2',
					type: 'assignment',
					studentsCompleted: 81,
					totalStudents: 21,
					completedCount: 17,
					averageGrade: 72,
					totalGrade: 40,
					gradeCount: 29,
					averageTime: '45 Minutes',
					weight: 12,
					dueDate: '2025-08-27',
					status: 'due'
				},
				{
					id: 'lesson-2',
					name: 'Lesson 2',
					type: 'lesson',
					studentsCompleted: 76,
					totalStudents: 21,
					completedCount: 16,
					averageGrade: 85,
					totalGrade: 40,
					gradeCount: 34,
					averageTime: '28 Minutes',
					weight: 5,
					dueDate: '2025-08-22',
					status: 'completed'
				},
				{
					id: 'homework-1',
					name: 'Homework 1',
					type: 'homework',
					studentsCompleted: 54,
					totalStudents: 21,
					completedCount: 11,
					averageGrade: 74,
					totalGrade: 40,
					gradeCount: 30,
					averageTime: '35 Minutes',
					weight: 8,
					dueDate: '2025-12-24',
					status: 'due'
				},
				{
					id: 'project-proposal',
					name: 'Project Proposal',
					type: 'assignment',
					studentsCompleted: 38,
					totalStudents: 21,
					completedCount: 8,
					averageGrade: 88,
					totalGrade: 40,
					gradeCount: 35,
					averageTime: '2 Hours',
					weight: 25,
					dueDate: '2026-08-31',
					status: 'due'
				}
			]
		},
		discussionAnalytics: {
			keyInsights: [
				'The average response time on your discussion forum is 123 minutes',
				'There are 2 unanswered questions'
			],
			viewsOnLastAnnouncement: { views: 19, total: 21 },
			postsOverTime: [
				{ week: 'Jan W1', posts: 3 },
				{ week: 'Jan W2', posts: 5 },
				{ week: 'Jan W3', posts: 8 },
				{ week: 'Jan W4', posts: 12 },
				{ week: 'Feb W1', posts: 15 },
				{ week: 'Feb W2', posts: 18 },
				{ week: 'Feb W3', posts: 22 },
				{ week: 'Feb W4', posts: 25 },
				{ week: 'Mar W1', posts: 28 },
				{ week: 'Mar W2', posts: 32 },
				{ week: 'Mar W3', posts: 29 },
				{ week: 'Mar W4', posts: 35 },
				{ week: 'Apr W1', posts: 38 },
				{ week: 'Apr W2', posts: 42 },
				{ week: 'Apr W3', posts: 45 },
				{ week: 'Apr W4', posts: 48 }
			],
			students: [
				{
					id: '1',
					firstName: 'Sam',
					lastName: 'Smith',
					avatarUrl: '/avatars/sam.jpg',
					questionsPosted: 7,
					questionsAnswered: 15,
					totalContributions: 22,
					lastActive: '< 1 day'
				},
				{
					id: '2',
					firstName: 'Emma',
					lastName: 'Johnson',
					avatarUrl: '/avatars/emma.jpg',
					questionsPosted: 12,
					questionsAnswered: 23,
					totalContributions: 35,
					lastActive: '2 hours ago'
				},
				{
					id: '3',
					firstName: 'Michael',
					lastName: 'Chen',
					avatarUrl: '/avatars/michael.jpg',
					questionsPosted: 3,
					questionsAnswered: 8,
					totalContributions: 11,
					lastActive: '3 days ago'
				},
				{
					id: '4',
					firstName: 'Sarah',
					lastName: 'Davis',
					avatarUrl: '/avatars/sarah.jpg',
					questionsPosted: 9,
					questionsAnswered: 18,
					totalContributions: 27,
					lastActive: '1 day ago'
				},
				{
					id: '5',
					firstName: 'David',
					lastName: 'Wilson',
					avatarUrl: '/avatars/david.jpg',
					questionsPosted: 1,
					questionsAnswered: 2,
					totalContributions: 3,
					lastActive: '1 week ago'
				},
				{
					id: '6',
					firstName: 'Lisa',
					lastName: 'Martinez',
					avatarUrl: '/avatars/lisa.jpg',
					questionsPosted: 15,
					questionsAnswered: 28,
					totalContributions: 43,
					lastActive: '3 hours ago'
				},
				{
					id: '7',
					firstName: 'James',
					lastName: 'Brown',
					avatarUrl: '/avatars/james.jpg',
					questionsPosted: 5,
					questionsAnswered: 12,
					totalContributions: 17,
					lastActive: '2 days ago'
				},
				{
					id: '8',
					firstName: 'Ashley',
					lastName: 'Taylor',
					avatarUrl: '/avatars/ashley.jpg',
					questionsPosted: 8,
					questionsAnswered: 20,
					totalContributions: 28,
					lastActive: '5 hours ago'
				}
			]
		}
	};
	const primaryTeacher = teachers[0]?.teacher;

	return {
		subject: subjectData,
		subjectOfferingId: subjectOfferingIdInt,
		subjectOfferingClassId: subjectOfferingClassIdInt,
		primaryTeacher: primaryTeacher
			? `${primaryTeacher.firstName} ${primaryTeacher.lastName}`
			: null,
		analyticsData,
		mockData
	};
};

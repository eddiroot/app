import { taskStatusEnum, taskTypeEnum } from '$lib/enums';
import { eq } from 'drizzle-orm';
import * as schema from '../../schema';
import type { Database } from '../types';
import type { DemoSchoolData, DemoSubjectData, DemoUserData } from './types';

// Task templates by subject - 3 blank tasks per class
const TASK_TEMPLATES: Record<string, { title: string; description: string; type: taskTypeEnum }[]> =
	{
		Mathematics: [
			{
				title: 'Weekly Problem Set',
				description: 'Complete the assigned practice problems for this week.',
				type: taskTypeEnum.homework
			},
			{
				title: 'Topic Assessment',
				description: 'Assessment covering the current unit content.',
				type: taskTypeEnum.test
			},
			{
				title: 'Investigation Task',
				description: 'Mathematical investigation and problem-solving task.',
				type: taskTypeEnum.assignment
			}
		],
		English: [
			{
				title: 'Reading Response',
				description: 'Written response to the assigned reading.',
				type: taskTypeEnum.homework
			},
			{
				title: 'Writing Assessment',
				description: 'Formal writing assessment for the unit.',
				type: taskTypeEnum.test
			},
			{
				title: 'Essay Draft',
				description: 'Draft submission for the analytical essay.',
				type: taskTypeEnum.assignment
			}
		],
		Science: [
			{
				title: 'Lab Report',
				description: 'Complete lab report for the practical experiment.',
				type: taskTypeEnum.assignment
			},
			{
				title: 'Unit Test',
				description: 'Test covering the current science unit.',
				type: taskTypeEnum.test
			},
			{
				title: 'Research Task',
				description: 'Research investigation on the assigned topic.',
				type: taskTypeEnum.homework
			}
		],
		'Physical Education': [
			{
				title: 'Fitness Journal',
				description: 'Log your fitness activities for the week.',
				type: taskTypeEnum.homework
			},
			{
				title: 'Skills Assessment',
				description: 'Practical skills assessment for the current sport.',
				type: taskTypeEnum.test
			},
			{
				title: 'Health Report',
				description: 'Written report on a health-related topic.',
				type: taskTypeEnum.assignment
			}
		],
		History: [
			{
				title: 'Source Analysis',
				description: 'Analyze the provided historical sources.',
				type: taskTypeEnum.homework
			},
			{
				title: 'Historical Essay',
				description: 'Extended response essay on the unit topic.',
				type: taskTypeEnum.assignment
			},
			{
				title: 'Knowledge Test',
				description: 'Test on key facts and concepts from the unit.',
				type: taskTypeEnum.test
			}
		],
		Geography: [
			{
				title: 'Map Skills Exercise',
				description: 'Complete the map reading and analysis exercises.',
				type: taskTypeEnum.homework
			},
			{
				title: 'Fieldwork Report',
				description: 'Report based on the geographic fieldwork.',
				type: taskTypeEnum.assignment
			},
			{
				title: 'Geography Test',
				description: 'Assessment on the current geography unit.',
				type: taskTypeEnum.test
			}
		]
	};

export async function seedDemoTasks(
	db: Database,
	schoolData: DemoSchoolData,
	userData: DemoUserData,
	subjectData: DemoSubjectData
): Promise<void> {
	const { offerings, subjects, coreSubjects, classes } = subjectData;

	let taskCount = 0;
	let classTaskCount = 0;

	// Process each class
	for (const cls of classes) {
		// Find the offering for this class
		const offering = offerings.find((o) => o.id === cls.subOfferingId);
		if (!offering) continue;

		// Find the subject
		const subject = subjects.find((s) => s.id === offering.subjectId);
		if (!subject) continue;

		// Find the core subject to get subject name
		const coreSubject = coreSubjects.find((cs) => cs.id === subject.coreSubjectId);
		if (!coreSubject) continue;

		const subjectName = coreSubject.name;
		const templates = TASK_TEMPLATES[subjectName];
		if (!templates) continue;

		// Get the first course map item for this offering
		const courseMapItems = await db
			.select()
			.from(schema.courseMapItem)
			.where(eq(schema.courseMapItem.subjectOfferingId, offering.id))
			.orderBy(schema.courseMapItem.startWeek)
			.limit(1);

		if (courseMapItems.length === 0) continue;
		const firstCourseMapItem = courseMapItems[0];

		// Get the teacher for this class
		const classTeachers = await db
			.select({ userId: schema.userSubjectOfferingClass.userId })
			.from(schema.userSubjectOfferingClass)
			.where(eq(schema.userSubjectOfferingClass.subOffClassId, cls.id));

		// Find the teacher (not a student)
		const teacherIds = userData.teachers.map((t) => t.id);
		const classTeacher = classTeachers.find((ct) => teacherIds.includes(ct.userId));

		if (!classTeacher) continue;

		// Create 3 blank tasks for this class linked to the first course map item
		for (let i = 0; i < templates.length; i++) {
			const template = templates[i];

			// Create the task (linked to offering)
			const [newTask] = await db
				.insert(schema.task)
				.values({
					title: template.title,
					type: template.type,
					description: template.description,
					subjectOfferingId: offering.id,
					aiTutorEnabled: true
				})
				.returning();

			taskCount++;

			// Link task to the class with the course map item
			await db.insert(schema.subjectOfferingClassTask).values({
				index: i,
				status: taskStatusEnum.draft,
				subjectOfferingClassId: cls.id,
				taskId: newTask.id,
				authorId: classTeacher.userId,
				courseMapItemId: firstCourseMapItem.id,
				week: firstCourseMapItem.startWeek
			});

			classTaskCount++;
		}
	}

	console.log(`  Created ${taskCount} tasks`);
	console.log(`  Linked ${classTaskCount} tasks to classes`);
}

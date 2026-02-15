import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { hash } from '@node-rs/argon2';
import { randomInt } from 'crypto';
import { and, eq, inArray, max, sql } from 'drizzle-orm';

// Schema: School
export async function createSchool(data: typeof table.school.$inferInsert) {
	const [newSchool] = await db.insert(table.school).values(data).returning();
	return newSchool;
}

export async function createSchoolCampus(
	data: typeof table.schoolCampus.$inferInsert,
) {
	const [campus] = await db.insert(table.schoolCampus).values(data).returning();
	return campus;
}

export async function createSchoolBuilding(
	data: typeof table.schoolBuilding.$inferInsert,
) {
	const [building] = await db
		.insert(table.schoolBuilding)
		.values(data)
		.returning();
	return building;
}

export async function createSchoolBuildings(
	data: (typeof table.schoolBuilding.$inferInsert)[],
) {
	const buildings = await db
		.insert(table.schoolBuilding)
		.values(data)
		.returning();
	return buildings;
}

export async function createSchoolSpace(
	data: typeof table.schoolSpace.$inferInsert,
) {
	const [space] = await db.insert(table.schoolSpace).values(data).returning();
	return space;
}

export async function createSchoolSpaces(
	data: (typeof table.schoolSpace.$inferInsert)[],
) {
	const spaces = await db.insert(table.schoolSpace).values(data).returning();
	return spaces;
}

export async function createSchoolYearLevel(
	data: typeof table.schoolYearLevel.$inferInsert,
) {
	const [yearLevel] = await db
		.insert(table.schoolYearLevel)
		.values(data)
		.returning();
	return yearLevel;
}

export async function createSchoolSemester(
	data: typeof table.schoolSemester.$inferInsert,
) {
	const [semester] = await db
		.insert(table.schoolSemester)
		.values(data)
		.returning();
	return semester;
}

export async function createSchoolSemesterWithAutoNumber(
	schoolId: number,
	year: number,
) {
	const [result] = await db
		.select({ maxNumber: max(table.schoolSemester.number) })
		.from(table.schoolSemester)
		.where(eq(table.schoolSemester.year, year));
	const number = (result?.maxNumber || 0) + 1;
	return await createSchoolSemester({ schoolId, year, number });
}

export async function createSchoolTerm(
	data: typeof table.schoolTerm.$inferInsert,
) {
	const [term] = await db.insert(table.schoolTerm).values(data).returning();
	return term;
}

export async function createSchoolTermWithRenumber(semesterId: number) {
	const semester = await db
		.select()
		.from(table.schoolSemester)
		.where(eq(table.schoolSemester.id, semesterId))
		.limit(1);

	if (!semester[0]) {
		throw new Error('Semester not found');
	}

	const { schoolId, year } = semester[0];

	const semestersThisYear = await db
		.select({ id: table.schoolSemester.id })
		.from(table.schoolSemester)
		.where(
			and(
				eq(table.schoolSemester.schoolId, schoolId),
				eq(table.schoolSemester.year, year),
			),
		)
		.orderBy(table.schoolSemester.number);

	// Find the maximum end date of existing terms
	const [maxEndResult] = await db
		.select({ maxEnd: max(table.schoolTerm.end) })
		.from(table.schoolTerm)
		.where(
			inArray(
				table.schoolTerm.schoolSemesterId,
				semestersThisYear.map((s) => s.id),
			),
		);

	const maxEnd = maxEndResult?.maxEnd;
	const start = maxEnd
		? new Date(maxEnd.getTime() + 24 * 60 * 60 * 1000) // Day after the latest term ends
		: new Date(); // If no terms exist, start now
	const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days later

	const newTerm = await createSchoolTerm({
		schoolSemesterId: semesterId,
		number: 10000, // temporary
		start,
		end,
	});

	// Temporarily set all term numbers to unique negative values to avoid unique constraint conflicts
	await db
		.update(table.schoolTerm)
		.set({ number: sql`-id` })
		.where(
			inArray(
				table.schoolTerm.schoolSemesterId,
				semestersThisYear.map((s) => s.id),
			),
		);

	let termNumber = 1;
	for (const semester of semestersThisYear) {
		const semesterTerms = await db
			.select({ id: table.schoolTerm.id })
			.from(table.schoolTerm)
			.where(eq(table.schoolTerm.schoolSemesterId, semester.id))
			.orderBy(table.schoolTerm.id);

		for (const term of semesterTerms) {
			await db
				.update(table.schoolTerm)
				.set({ number: termNumber })
				.where(eq(table.schoolTerm.id, term.id));
			termNumber++;
		}
	}

	return newTerm;
}

export async function createBehaviourLevel(
	data: typeof table.schoolBehaviourLevel.$inferInsert,
) {
	const [behaviourLevel] = await db
		.insert(table.schoolBehaviourLevel)
		.values(data)
		.returning();
	return behaviourLevel;
}

export async function createBehaviour(
	data: typeof table.schoolBehaviour.$inferInsert,
) {
	const [behaviour] = await db
		.insert(table.schoolBehaviour)
		.values(data)
		.returning();
	return behaviour;
}

// Schema: User
export async function createUser(
	data: typeof table.user.$inferInsert,
	password?: string,
) {
	if (password) {
		const passwordHash = await hash(password);
		const verificationCode = String(randomInt(100000, 1000000));

		const [user] = await db
			.insert(table.user)
			.values({ ...data, passwordHash, verificationCode })
			.returning();

		return user;
	}

	const [user] = await db.insert(table.user).values(data).returning();
	return user;
}

// Schema: Subject
export async function createSubject(data: typeof table.subject.$inferInsert) {
	const [subject] = await db.insert(table.subject).values(data).returning();
	return subject;
}

export async function createSubjects(
	data: (typeof table.subject.$inferInsert)[],
) {
	const subjects = await db.insert(table.subject).values(data).returning();
	return subjects;
}

export async function createSubjectOffering(
	data: typeof table.subjectOffering.$inferInsert,
) {
	const [offering] = await db
		.insert(table.subjectOffering)
		.values(data)
		.returning();
	return offering;
}

export async function createSubjectThread(
	data: typeof table.subjectThread.$inferInsert,
) {
	const [thread] = await db
		.insert(table.subjectThread)
		.values(data)
		.returning();
	return thread;
}

export async function createSubjectThreadResponse(
	data: typeof table.subjectThreadResponse.$inferInsert,
) {
	const [response] = await db
		.insert(table.subjectThreadResponse)
		.values(data)
		.returning();
	return response;
}

export async function createUserSubjectOfferingClass(
	data: typeof table.userSubjectOfferingClass.$inferInsert,
) {
	const [allocation] = await db
		.insert(table.userSubjectOfferingClass)
		.values(data)
		.returning();
	return allocation;
}

export async function createSubjectSelectionConstraint(
	data: typeof table.subjectSelectionConstraint.$inferInsert,
) {
	const [constraint] = await db
		.insert(table.subjectSelectionConstraint)
		.values(data)
		.returning();
	return constraint;
}

export async function createSubjectSelectionConstraintSubject(
	data: typeof table.subjectSelectionConstraintSubject.$inferInsert,
) {
	const [constraintSubject] = await db
		.insert(table.subjectSelectionConstraintSubject)
		.values(data)
		.returning();
	return constraintSubject;
}

// Schema: Task
export async function createTask(data: typeof table.task.$inferInsert) {
	const [task] = await db.insert(table.task).values(data).returning();
	return task;
}

export async function createSubjectOfferingClassTask(
	data: typeof table.subjectOfferingClassTask.$inferInsert,
) {
	const [subjectOfferingClassTask] = await db
		.insert(table.subjectOfferingClassTask)
		.values(data)
		.returning();

	return subjectOfferingClassTask;
}

export async function createTaskBlock(
	data: typeof table.taskBlock.$inferInsert,
) {
	const [taskBlock] = await db.insert(table.taskBlock).values(data).returning();
	return taskBlock;
}

export async function createTaskBlocks(
	data: (typeof table.taskBlock.$inferInsert)[],
) {
	const taskBlocks = await db.insert(table.taskBlock).values(data);
	return taskBlocks;
}

export async function createClassTaskResponse(
	data: typeof table.classTaskResponse.$inferInsert,
) {
	const [response] = await db
		.insert(table.classTaskResponse)
		.values(data)
		.returning();
	return response;
}

export async function createWhiteboard(
	data: typeof table.whiteboard.$inferInsert,
) {
	const [newWhiteboard] = await db
		.insert(table.whiteboard)
		.values(data)
		.returning();
	return newWhiteboard;
}

export async function createRubric(title: string) {
	const [rubric] = await db.insert(table.rubric).values({ title }).returning();
	return rubric;
}

export async function createRubricRow(rubricId: number, title: string) {
	const [row] = await db
		.insert(table.rubricRow)
		.values({ rubricId, title })
		.returning();
	return row;
}

export async function createRubricCell(
	data: typeof table.rubricCell.$inferInsert,
) {
	const [cell] = await db.insert(table.rubricCell).values(data).returning();
	return cell;
}

// Schema: Event
export async function createEvent(data: typeof table.event.$inferInsert) {
	const [event] = await db.insert(table.event).values(data).returning();
	return event;
}

// Schema: News
export async function createNewsCategory(
	data: typeof table.newsCategory.$inferInsert,
) {
	const [category] = await db
		.insert(table.newsCategory)
		.values(data)
		.returning();
	return category;
}

export async function createNews(data: typeof table.news.$inferInsert) {
	const [newsItem] = await db.insert(table.news).values(data).returning();
	return newsItem;
}

// Schema: Resource
export async function createResource(data: typeof table.resource.$inferInsert) {
	const [resource] = await db.insert(table.resource).values(data).returning();
	return resource;
}

export async function createSubjectOfferingClassResource(
	data: typeof table.subjectOfferingClassResource.$inferInsert,
) {
	const [subjectOfferingClassResource] = await db
		.insert(table.subjectOfferingClassResource)
		.values(data)
		.returning();
	return subjectOfferingClassResource;
}

// Schema: Timetable
export async function createTimetable(
	data: typeof table.timetable.$inferInsert,
) {
	const [timetable] = await db.insert(table.timetable).values(data).returning();
	return timetable;
}

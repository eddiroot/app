import { eventTypeEnum } from '$lib/enums';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { and, asc, desc, eq, gte, lt } from 'drizzle-orm';

export async function getSchoolEventsBySchoolId(
	schoolId: number,
	includeArchived: boolean = false,
) {
	const events = await db
		.select()
		.from(table.event)
		.where(
			and(
				eq(table.event.schoolId, schoolId),
				eq(table.event.type, eventTypeEnum.school),
				includeArchived ? undefined : eq(table.event.isArchived, false),
			),
		)
		.orderBy(desc(table.event.start));

	return events;
}

export async function getSchoolEventsForWeekBySchoolId(
	schoolId: number,
	weekStartDate: Date,
	includeArchived: boolean = false,
) {
	const weekStart = new Date(weekStartDate);
	weekStart.setHours(0, 0, 0, 0);

	const weekEnd = new Date(weekStart);
	weekEnd.setDate(weekEnd.getDate() + 7);

	const events = await db
		.select({ event: table.event })
		.from(table.event)
		.where(
			and(
				eq(table.event.type, eventTypeEnum.school),
				eq(table.event.schoolId, schoolId),
				gte(table.event.start, weekStart),
				lt(table.event.start, weekEnd),
				includeArchived ? undefined : eq(table.event.isArchived, false),
			),
		)
		.orderBy(asc(table.event.start));

	return events;
}

export async function getSchoolEventsForWeekByUserId(
	userId: string,
	weekStartDate: Date,
	includeArchived: boolean = false,
) {
	const weekStart = new Date(weekStartDate);
	weekStart.setHours(0, 0, 0, 0);

	const weekEnd = new Date(weekStart);
	weekEnd.setDate(weekEnd.getDate() + 7);

	const events = await db
		.select({ event: table.event })
		.from(table.event)
		.innerJoin(table.school, eq(table.event.schoolId, table.school.id))
		.innerJoin(table.user, eq(table.school.id, table.user.schoolId))
		.where(
			and(
				eq(table.event.type, eventTypeEnum.school),
				eq(table.user.id, userId),
				gte(table.event.start, weekStart),
				lt(table.event.start, weekEnd),
				includeArchived ? undefined : eq(table.event.isArchived, false),
			),
		)
		.orderBy(asc(table.event.start));

	return events;
}

export async function getSchoolEventsForDayByUserId(
	userId: string,
	date: Date,
	includeArchived: boolean = false,
) {
	const dayStart = new Date(date);
	dayStart.setHours(0, 0, 0, 0);

	const dayEnd = new Date(dayStart);
	dayEnd.setDate(dayEnd.getDate() + 1);

	const events = await db
		.select({ event: table.event })
		.from(table.event)
		.innerJoin(table.school, eq(table.event.schoolId, table.school.id))
		.innerJoin(table.user, eq(table.school.id, table.user.schoolId))
		.where(
			and(
				eq(table.event.type, eventTypeEnum.school),
				eq(table.user.id, userId),
				gte(table.event.start, dayStart),
				lt(table.event.start, dayEnd),
				includeArchived ? undefined : eq(table.event.isArchived, false),
			),
		)
		.orderBy(asc(table.event.start));

	return events;
}

export async function updateSchoolEvent(
	eventId: number,
	updates: { name?: string; start?: Date; end?: Date; isArchived?: boolean },
) {
	const [updatedEvent] = await db
		.update(table.event)
		.set(updates)
		.where(eq(table.event.id, eventId))
		.returning();

	return updatedEvent;
}

// Campus Event Functions

export async function getCampusEventsByCampusId(
	schoolCampusId: number,
	includeArchived: boolean = false,
) {
	const events = await db
		.select()
		.from(table.event)
		.where(
			and(
				eq(table.event.type, eventTypeEnum.campus),
				eq(table.event.schoolCampusId, schoolCampusId),
				includeArchived ? undefined : eq(table.event.isArchived, false),
			),
		)
		.orderBy(desc(table.event.start));

	return events;
}

export async function getCampusEventsForWeekByCampusId(
	schoolCampusId: number,
	weekStartDate: Date,
	includeArchived: boolean = false,
) {
	const weekStart = new Date(weekStartDate);
	weekStart.setHours(0, 0, 0, 0);

	const weekEnd = new Date(weekStart);
	weekEnd.setDate(weekEnd.getDate() + 7);

	const events = await db
		.select()
		.from(table.event)
		.where(
			and(
				eq(table.event.type, eventTypeEnum.campus),
				eq(table.event.schoolCampusId, schoolCampusId),
				gte(table.event.start, weekStart),
				lt(table.event.start, weekEnd),
				includeArchived ? undefined : eq(table.event.isArchived, false),
			),
		)
		.orderBy(asc(table.event.start));

	return events;
}

export async function getCampusEventsForWeekByUserId(
	userId: string,
	weekStartDate: Date,
	includeArchived: boolean = false,
) {
	const weekStart = new Date(weekStartDate);
	weekStart.setHours(0, 0, 0, 0);

	const weekEnd = new Date(weekStart);
	weekEnd.setDate(weekEnd.getDate() + 7);

	const events = await db
		.select({ event: table.event })
		.from(table.event)
		.innerJoin(
			table.schoolCampus,
			eq(table.event.schoolCampusId, table.schoolCampus.id),
		)
		.innerJoin(
			table.userCampus,
			eq(table.schoolCampus.id, table.userCampus.schoolCampusId),
		)
		.where(
			and(
				eq(table.event.type, eventTypeEnum.campus),
				eq(table.userCampus.userId, userId),
				gte(table.event.start, weekStart),
				lt(table.event.start, weekEnd),
				includeArchived ? undefined : eq(table.event.isArchived, false),
			),
		)
		.orderBy(asc(table.event.start));

	return events;
}

export async function getCampusEventsForDayByUserId(
	userId: string,
	date: Date,
	includeArchived: boolean = false,
) {
	const dayStart = new Date(date);
	dayStart.setHours(0, 0, 0, 0);

	const dayEnd = new Date(dayStart);
	dayEnd.setDate(dayEnd.getDate() + 1);

	const events = await db
		.select({ event: table.event })
		.from(table.event)
		.innerJoin(
			table.schoolCampus,
			eq(table.event.schoolCampusId, table.schoolCampus.id),
		)
		.innerJoin(
			table.userCampus,
			eq(table.schoolCampus.id, table.userCampus.schoolCampusId),
		)
		.where(
			and(
				eq(table.event.type, eventTypeEnum.campus),
				eq(table.userCampus.userId, userId),
				gte(table.event.start, dayStart),
				lt(table.event.start, dayEnd),
				includeArchived ? undefined : eq(table.event.isArchived, false),
			),
		)
		.orderBy(asc(table.event.start));

	return events;
}

export async function updateCampusEvent(
	eventId: number,
	updates: { name?: string; start?: Date; end?: Date; isArchived?: boolean },
) {
	const [updatedEvent] = await db
		.update(table.event)
		.set(updates)
		.where(eq(table.event.id, eventId))
		.returning();

	return updatedEvent;
}

// Subject Offering Event Functions

export async function getSubjectOfferingEventsBySchoolId(
	schoolId: number,
	includeArchived: boolean = false,
) {
	const events = await db
		.select({
			event: table.event,
			subjectOffering: table.subjectOffering,
			subject: { id: table.subject.id, name: table.subject.name },
		})
		.from(table.event)
		.innerJoin(
			table.subjectOffering,
			eq(table.event.subjectOfferingId, table.subjectOffering.id),
		)
		.innerJoin(
			table.subject,
			eq(table.subjectOffering.subjectId, table.subject.id),
		)
		.where(
			and(
				eq(table.event.type, eventTypeEnum.subject),
				eq(table.subject.schoolId, schoolId),
				includeArchived ? undefined : eq(table.event.isArchived, false),
			),
		)
		.orderBy(desc(table.event.start));

	return events;
}

export async function getSubjectOfferingEventsForWeekBySchoolId(
	schoolId: number,
	weekStartDate: Date,
	includeArchived: boolean = false,
) {
	const weekStart = new Date(weekStartDate);
	weekStart.setHours(0, 0, 0, 0);

	const weekEnd = new Date(weekStart);
	weekEnd.setDate(weekEnd.getDate() + 7);

	const events = await db
		.select({
			event: table.event,
			subjectOffering: table.subjectOffering,
			subject: { id: table.subject.id, name: table.subject.name },
		})
		.from(table.event)
		.innerJoin(
			table.subjectOffering,
			eq(table.event.subjectOfferingId, table.subjectOffering.id),
		)
		.innerJoin(
			table.subject,
			eq(table.subjectOffering.subjectId, table.subject.id),
		)
		.where(
			and(
				eq(table.event.type, eventTypeEnum.subject),
				eq(table.subject.schoolId, schoolId),
				gte(table.event.start, weekStart),
				lt(table.event.start, weekEnd),
				includeArchived ? undefined : eq(table.event.isArchived, false),
			),
		)
		.orderBy(asc(table.event.start));

	return events;
}

export async function getSubjectOfferingEventsForWeekByUserId(
	userId: string,
	weekStartDate: Date,
	includeArchived: boolean = false,
) {
	const weekStart = new Date(weekStartDate);
	weekStart.setHours(0, 0, 0, 0);

	const weekEnd = new Date(weekStart);
	weekEnd.setDate(weekEnd.getDate() + 7);

	const events = await db
		.select({
			event: table.event,
			subjectOffering: table.subjectOffering,
			subject: { id: table.subject.id, name: table.subject.name },
		})
		.from(table.event)
		.innerJoin(
			table.subjectOffering,
			eq(table.event.subjectOfferingId, table.subjectOffering.id),
		)
		.innerJoin(
			table.subject,
			eq(table.subjectOffering.subjectId, table.subject.id),
		)
		.innerJoin(
			table.userSubjectOffering,
			eq(table.userSubjectOffering.subOfferingId, table.subjectOffering.id),
		)
		.where(
			and(
				eq(table.event.type, eventTypeEnum.subject),
				eq(table.userSubjectOffering.userId, userId),
				gte(table.event.start, weekStart),
				lt(table.event.start, weekEnd),
				includeArchived ? undefined : eq(table.event.isArchived, false),
			),
		)
		.orderBy(asc(table.event.start));

	return events;
}

export async function getSubjectOfferingEventsForDayByUserId(
	userId: string,
	date: Date,
	includeArchived: boolean = false,
) {
	const dayStart = new Date(date);
	dayStart.setHours(0, 0, 0, 0);

	const dayEnd = new Date(dayStart);
	dayEnd.setDate(dayEnd.getDate() + 1);

	const events = await db
		.select({
			event: table.event,
			subjectOffering: table.subjectOffering,
			subject: { id: table.subject.id, name: table.subject.name },
		})
		.from(table.event)
		.innerJoin(
			table.subjectOffering,
			eq(table.event.subjectOfferingId, table.subjectOffering.id),
		)
		.innerJoin(
			table.subject,
			eq(table.subjectOffering.subjectId, table.subject.id),
		)
		.innerJoin(
			table.userSubjectOffering,
			eq(table.userSubjectOffering.subOfferingId, table.subjectOffering.id),
		)
		.where(
			and(
				eq(table.event.type, eventTypeEnum.subject),
				eq(table.userSubjectOffering.userId, userId),
				gte(table.event.start, dayStart),
				lt(table.event.start, dayEnd),
				includeArchived ? undefined : eq(table.event.isArchived, false),
			),
		)
		.orderBy(asc(table.event.start));

	return events;
}

export async function updateSubjectOfferingEvent(
	eventId: number,
	updates: { name?: string; start?: Date; end?: Date; isArchived?: boolean },
) {
	const [updatedEvent] = await db
		.update(table.event)
		.set(updates)
		.where(eq(table.event.id, eventId))
		.returning();

	return updatedEvent;
}

// Subject Offering Class Event Functions

export async function getSubjectOfferingClassEventsBySchoolId(
	schoolId: number,
	includeArchived: boolean = false,
) {
	const events = await db
		.select({
			event: table.event,
			subjectOfferingClass: table.subjectOfferingClass,
			subjectOffering: table.subjectOffering,
			subject: { id: table.subject.id, name: table.subject.name },
		})
		.from(table.event)
		.innerJoin(
			table.subjectOfferingClass,
			eq(table.event.subjectOfferingClassId, table.subjectOfferingClass.id),
		)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectOfferingClass.subOfferingId, table.subjectOffering.id),
		)
		.innerJoin(
			table.subject,
			eq(table.subjectOffering.subjectId, table.subject.id),
		)
		.where(
			and(
				eq(table.event.type, eventTypeEnum.class),
				eq(table.subject.schoolId, schoolId),
				includeArchived ? undefined : eq(table.event.isArchived, false),
			),
		)
		.orderBy(desc(table.event.start));

	return events;
}

export async function getSubjectOfferingClassEventsForWeekBySchoolId(
	schoolId: number,
	weekStartDate: Date,
	includeArchived: boolean = false,
) {
	const weekStart = new Date(weekStartDate);
	weekStart.setHours(0, 0, 0, 0);

	const weekEnd = new Date(weekStart);
	weekEnd.setDate(weekEnd.getDate() + 7);

	const events = await db
		.select({
			event: table.event,
			subjectOfferingClass: table.subjectOfferingClass,
			subjectOffering: table.subjectOffering,
			subject: { id: table.subject.id, name: table.subject.name },
		})
		.from(table.event)
		.innerJoin(
			table.subjectOfferingClass,
			eq(table.event.subjectOfferingClassId, table.subjectOfferingClass.id),
		)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectOfferingClass.subOfferingId, table.subjectOffering.id),
		)
		.innerJoin(
			table.subject,
			eq(table.subjectOffering.subjectId, table.subject.id),
		)
		.where(
			and(
				eq(table.event.type, eventTypeEnum.class),
				eq(table.subject.schoolId, schoolId),
				gte(table.event.start, weekStart),
				lt(table.event.start, weekEnd),
				includeArchived ? undefined : eq(table.event.isArchived, false),
			),
		)
		.orderBy(asc(table.event.start));

	return events;
}

export async function getSubjectOfferingClassEventsForWeekByUserId(
	userId: string,
	weekStartDate: Date,
	includeArchived: boolean = false,
) {
	const weekStart = new Date(weekStartDate);
	weekStart.setHours(0, 0, 0, 0);

	const weekEnd = new Date(weekStart);
	weekEnd.setDate(weekEnd.getDate() + 7);

	const events = await db
		.select({
			event: table.event,
			subjectOfferingClass: table.subjectOfferingClass,
			subjectOffering: table.subjectOffering,
			subject: { id: table.subject.id, name: table.subject.name },
		})
		.from(table.event)
		.innerJoin(
			table.subjectOfferingClass,
			eq(table.event.subjectOfferingClassId, table.subjectOfferingClass.id),
		)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectOfferingClass.subOfferingId, table.subjectOffering.id),
		)
		.innerJoin(
			table.subject,
			eq(table.subjectOffering.subjectId, table.subject.id),
		)
		.innerJoin(
			table.userSubjectOfferingClass,
			eq(
				table.userSubjectOfferingClass.subOffClassId,
				table.subjectOfferingClass.id,
			),
		)
		.where(
			and(
				eq(table.event.type, eventTypeEnum.class),
				eq(table.userSubjectOfferingClass.userId, userId),
				gte(table.event.start, weekStart),
				lt(table.event.start, weekEnd),
				includeArchived ? undefined : eq(table.event.isArchived, false),
			),
		)
		.orderBy(asc(table.event.start));

	return events;
}

export async function getSubjectOfferingClassEventsForDayByUserId(
	userId: string,
	date: Date,
	includeArchived: boolean = false,
) {
	const dayStart = new Date(date);
	dayStart.setHours(0, 0, 0, 0);

	const dayEnd = new Date(dayStart);
	dayEnd.setDate(dayEnd.getDate() + 1);

	const events = await db
		.select({
			event: table.event,
			subjectOfferingClass: table.subjectOfferingClass,
			subjectOffering: table.subjectOffering,
			subject: { id: table.subject.id, name: table.subject.name },
		})
		.from(table.event)
		.innerJoin(
			table.subjectOfferingClass,
			eq(table.event.subjectOfferingClassId, table.subjectOfferingClass.id),
		)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectOfferingClass.subOfferingId, table.subjectOffering.id),
		)
		.innerJoin(
			table.subject,
			eq(table.subjectOffering.subjectId, table.subject.id),
		)
		.innerJoin(
			table.userSubjectOfferingClass,
			eq(
				table.userSubjectOfferingClass.subOffClassId,
				table.subjectOfferingClass.id,
			),
		)
		.where(
			and(
				eq(table.event.type, eventTypeEnum.class),
				eq(table.userSubjectOfferingClass.userId, userId),
				gte(table.event.start, dayStart),
				lt(table.event.start, dayEnd),
				includeArchived ? undefined : eq(table.event.isArchived, false),
			),
		)
		.orderBy(asc(table.event.start));

	return events;
}

export async function updateSubjectOfferingClassEvent(
	eventId: number,
	updates: { name?: string; start?: Date; end?: Date; isArchived?: boolean },
) {
	const [updatedEvent] = await db
		.update(table.event)
		.set(updates)
		.where(eq(table.event.id, eventId))
		.returning();

	return updatedEvent;
}

// RSVP Functions
export async function upsertEventRSVP(
	userId: string,
	eventId: number,
	isAttending: boolean,
) {
	const [rsvp] = await db
		.insert(table.eventRSVP)
		.values({ userId, eventId, isAttending })
		.onConflictDoUpdate({
			target: [table.eventRSVP.userId, table.eventRSVP.eventId],
			set: { isAttending },
		})
		.returning();

	return rsvp;
}

export async function getEventRSVP(userId: string, eventId: number) {
	const [rsvp] = await db
		.select()
		.from(table.eventRSVP)
		.where(
			and(
				eq(table.eventRSVP.userId, userId),
				eq(table.eventRSVP.eventId, eventId),
			),
		);

	return rsvp;
}

export async function getUserEventRSVPs(userId: string) {
	const rsvps = await db
		.select()
		.from(table.eventRSVP)
		.where(eq(table.eventRSVP.userId, userId));

	return rsvps;
}

// Get individual event by ID functions
export async function getEventSchoolById(eventId: number) {
	const events = await db
		.select()
		.from(table.event)
		.where(
			and(
				eq(table.event.id, eventId),
				eq(table.event.type, eventTypeEnum.school),
			),
		);

	return events?.length ? events[0] : null;
}

export async function getEventCampusById(eventId: number) {
	const events = await db
		.select()
		.from(table.event)
		.where(
			and(
				eq(table.event.id, eventId),
				eq(table.event.type, eventTypeEnum.campus),
			),
		);

	return events?.length ? events[0] : null;
}

export async function getEventSubjectOfferingById(eventId: number) {
	const events = await db
		.select()
		.from(table.event)
		.where(
			and(
				eq(table.event.id, eventId),
				eq(table.event.type, eventTypeEnum.subject),
			),
		);

	return events?.length ? events[0] : null;
}

export async function getEventSubjectOfferingClassById(eventId: number) {
	const events = await db
		.select()
		.from(table.event)
		.where(
			and(
				eq(table.event.id, eventId),
				eq(table.event.type, eventTypeEnum.class),
			),
		);

	return events?.length ? events[0] : null;
}

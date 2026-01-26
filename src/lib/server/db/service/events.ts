import type { eventTypeEnum } from '$lib/enums';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { and, asc, desc, eq, gte, lt } from 'drizzle-orm';

export async function getSchoolEventsBySchoolId(
	schoolId: number,
	includeArchived: boolean = false,
) {
	const events = await db
		.select({ event: table.eventSchool })
		.from(table.eventSchool)
		.where(
			and(
				eq(table.eventSchool.schoolId, schoolId),
				includeArchived ? undefined : eq(table.eventSchool.isArchived, false),
			),
		)
		.orderBy(desc(table.eventSchool.start));

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
		.select({ event: table.eventSchool })
		.from(table.eventSchool)
		.where(
			and(
				eq(table.eventSchool.schoolId, schoolId),
				gte(table.eventSchool.start, weekStart),
				lt(table.eventSchool.start, weekEnd),
				includeArchived ? undefined : eq(table.eventSchool.isArchived, false),
			),
		)
		.orderBy(asc(table.eventSchool.start));

	return events;
}

export async function updateSchoolEvent(
	eventId: number,
	updates: { name?: string; start?: Date; end?: Date; isArchived?: boolean },
) {
	const [updatedEvent] = await db
		.update(table.eventSchool)
		.set(updates)
		.where(eq(table.eventSchool.id, eventId))
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
		.from(table.eventSchool)
		.where(
			and(
				eq(table.eventCampus.schoolCampusId, schoolCampusId),
				includeArchived ? undefined : eq(table.eventCampus.isArchived, false),
			),
		)
		.orderBy(desc(table.eventSchool.start));

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
		.select({ event: table.eventCampus })
		.from(table.eventCampus)
		.where(
			and(
				eq(table.eventCampus.schoolCampusId, schoolCampusId),
				gte(table.eventCampus.start, weekStart),
				lt(table.eventCampus.start, weekEnd),
				includeArchived ? undefined : eq(table.eventCampus.isArchived, false),
			),
		)
		.orderBy(asc(table.eventCampus.start));

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
		.select({ event: table.eventCampus })
		.from(table.eventCampus)
		.innerJoin(
			table.schoolCampus,
			eq(table.eventCampus.schoolCampusId, table.schoolCampus.id),
		)
		.innerJoin(
			table.userCampus,
			eq(table.schoolCampus.id, table.userCampus.schoolCampusId),
		)
		.where(
			and(
				eq(table.userCampus.userId, userId),
				gte(table.eventCampus.start, weekStart),
				lt(table.eventCampus.start, weekEnd),
				includeArchived ? undefined : eq(table.eventCampus.isArchived, false),
			),
		)
		.orderBy(asc(table.eventCampus.start));

	return events;
}

export async function updateCampusEvent(
	eventId: number,
	updates: { name?: string; start?: Date; end?: Date; isArchived?: boolean },
) {
	const [updatedEvent] = await db
		.update(table.eventCampus)
		.set(updates)
		.where(eq(table.eventCampus.id, eventId))
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
			event: table.eventSubjectOffering,
			subjectOffering: table.subjectOffering,
			subject: { id: table.subject.id, name: table.subject.name },
		})
		.from(table.eventSubjectOffering)
		.innerJoin(
			table.subjectOffering,
			eq(
				table.eventSubjectOffering.subjectOfferingId,
				table.subjectOffering.id,
			),
		)
		.innerJoin(
			table.subject,
			eq(table.subjectOffering.subjectId, table.subject.id),
		)
		.where(
			and(
				eq(table.subject.schoolId, schoolId),
				includeArchived
					? undefined
					: eq(table.eventSubjectOffering.isArchived, false),
			),
		)
		.orderBy(desc(table.eventSubjectOffering.start));

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
			event: table.eventSubjectOffering,
			subjectOffering: table.subjectOffering,
			subject: { id: table.subject.id, name: table.subject.name },
		})
		.from(table.eventSubjectOffering)
		.innerJoin(
			table.subjectOffering,
			eq(
				table.eventSubjectOffering.subjectOfferingId,
				table.subjectOffering.id,
			),
		)
		.innerJoin(
			table.subject,
			eq(table.subjectOffering.subjectId, table.subject.id),
		)
		.where(
			and(
				eq(table.subject.schoolId, schoolId),
				gte(table.eventSubjectOffering.start, weekStart),
				lt(table.eventSubjectOffering.start, weekEnd),
				includeArchived
					? undefined
					: eq(table.eventSubjectOffering.isArchived, false),
			),
		)
		.orderBy(asc(table.eventSubjectOffering.start));

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
			event: table.eventSubjectOffering,
			subjectOffering: table.subjectOffering,
			subject: { id: table.subject.id, name: table.subject.name },
		})
		.from(table.eventSubjectOffering)
		.innerJoin(
			table.subjectOffering,
			eq(
				table.eventSubjectOffering.subjectOfferingId,
				table.subjectOffering.id,
			),
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
				eq(table.userSubjectOffering.userId, userId),
				gte(table.eventSubjectOffering.start, weekStart),
				lt(table.eventSubjectOffering.start, weekEnd),
				includeArchived
					? undefined
					: eq(table.eventSubjectOffering.isArchived, false),
			),
		)
		.orderBy(asc(table.eventSubjectOffering.start));

	return events;
}

export async function updateSubjectOfferingEvent(
	eventId: number,
	updates: { name?: string; start?: Date; end?: Date; isArchived?: boolean },
) {
	const [updatedEvent] = await db
		.update(table.eventSubjectOffering)
		.set(updates)
		.where(eq(table.eventSubjectOffering.id, eventId))
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
			event: table.eventSubjectOfferingClass,
			subjectOfferingClass: table.subjectOfferingClass,
			subjectOffering: table.subjectOffering,
			subject: { id: table.subject.id, name: table.subject.name },
		})
		.from(table.eventSubjectOfferingClass)
		.innerJoin(
			table.subjectOfferingClass,
			eq(
				table.eventSubjectOfferingClass.subjectOfferingClassId,
				table.subjectOfferingClass.id,
			),
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
				eq(table.subject.schoolId, schoolId),
				includeArchived
					? undefined
					: eq(table.eventSubjectOfferingClass.isArchived, false),
			),
		)
		.orderBy(desc(table.eventSubjectOfferingClass.start));

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
			event: table.eventSubjectOfferingClass,
			subjectOfferingClass: table.subjectOfferingClass,
			subjectOffering: table.subjectOffering,
			subject: { id: table.subject.id, name: table.subject.name },
		})
		.from(table.eventSubjectOfferingClass)
		.innerJoin(
			table.subjectOfferingClass,
			eq(
				table.eventSubjectOfferingClass.subjectOfferingClassId,
				table.subjectOfferingClass.id,
			),
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
				eq(table.subject.schoolId, schoolId),
				gte(table.eventSubjectOfferingClass.start, weekStart),
				lt(table.eventSubjectOfferingClass.start, weekEnd),
				includeArchived
					? undefined
					: eq(table.eventSubjectOfferingClass.isArchived, false),
			),
		)
		.orderBy(asc(table.eventSubjectOfferingClass.start));

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
			event: table.eventSubjectOfferingClass,
			subjectOfferingClass: table.subjectOfferingClass,
			subjectOffering: table.subjectOffering,
			subject: { id: table.subject.id, name: table.subject.name },
		})
		.from(table.eventSubjectOfferingClass)
		.innerJoin(
			table.subjectOfferingClass,
			eq(
				table.eventSubjectOfferingClass.subjectOfferingClassId,
				table.subjectOfferingClass.id,
			),
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
				eq(table.userSubjectOfferingClass.userId, userId),
				gte(table.eventSubjectOfferingClass.start, weekStart),
				lt(table.eventSubjectOfferingClass.start, weekEnd),
				includeArchived
					? undefined
					: eq(table.eventSubjectOfferingClass.isArchived, false),
			),
		)
		.orderBy(asc(table.eventSubjectOfferingClass.start));

	return events;
}

export async function updateSubjectOfferingClassEvent(
	eventId: number,
	updates: { name?: string; start?: Date; end?: Date; isArchived?: boolean },
) {
	const [updatedEvent] = await db
		.update(table.eventSubjectOfferingClass)
		.set(updates)
		.where(eq(table.eventSubjectOfferingClass.id, eventId))
		.returning();

	return updatedEvent;
}

// RSVP Functions
export async function upsertEventRSVP(
	userId: string,
	eventType: eventTypeEnum,
	eventId: number,
	willAttend: boolean,
) {
	const [rsvp] = await db
		.insert(table.eventRSVP)
		.values({ userId, eventType, eventId, willAttend })
		.onConflictDoUpdate({
			target: [
				table.eventRSVP.userId,
				table.eventRSVP.eventType,
				table.eventRSVP.eventId,
			],
			set: { willAttend },
		})
		.returning();

	return rsvp;
}

export async function getEventRSVP(
	userId: string,
	eventType: eventTypeEnum,
	eventId: number,
) {
	const [rsvp] = await db
		.select()
		.from(table.eventRSVP)
		.where(
			and(
				eq(table.eventRSVP.userId, userId),
				eq(table.eventRSVP.eventType, eventType),
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
		.from(table.eventSchool)
		.where(eq(table.eventSchool.id, eventId));

	return events?.length ? events[0] : null;
}

export async function getEventCampusById(eventId: number) {
	const events = await db
		.select()
		.from(table.eventCampus)
		.where(eq(table.eventCampus.id, eventId));

	return events?.length ? events[0] : null;
}

export async function getEventSubjectOfferingById(eventId: number) {
	const events = await db
		.select()
		.from(table.eventSubjectOffering)
		.where(eq(table.eventSubjectOffering.id, eventId));

	return events?.length ? events[0] : null;
}

export async function getEventSubjectOfferingClassById(eventId: number) {
	const events = await db
		.select()
		.from(table.eventSubjectOfferingClass)
		.where(eq(table.eventSubjectOfferingClass.id, eventId));

	return events?.length ? events[0] : null;
}

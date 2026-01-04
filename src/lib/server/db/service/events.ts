import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { and, asc, desc, eq, gte, lt } from 'drizzle-orm';

// School Event Functions
export async function createSchoolEvent(
	schoolId: number,
	name: string,
	startTimestamp: Date,
	endTimestamp: Date,
	requiresRSVP: boolean = false
) {
	const [schoolEvent] = await db
		.insert(table.schoolEvent)
		.values({
			schoolId,
			name,
			startTimestamp,
			endTimestamp,
			requiresRSVP
		})
		.returning();

	return schoolEvent;
}

export async function getSchoolEventsBySchoolId(
	schoolId: number,
	includeArchived: boolean = false
) {
	const events = await db
		.select({
			event: table.schoolEvent
		})
		.from(table.schoolEvent)
		.where(
			and(
				eq(table.schoolEvent.schoolId, schoolId),
				includeArchived ? undefined : eq(table.schoolEvent.isArchived, false)
			)
		)
		.orderBy(desc(table.schoolEvent.startTimestamp));

	return events;
}

export async function getSchoolEventsForWeekBySchoolId(
	schoolId: number,
	weekStartDate: Date,
	includeArchived: boolean = false
) {
	const weekStart = new Date(weekStartDate);
	weekStart.setHours(0, 0, 0, 0);

	const weekEnd = new Date(weekStart);
	weekEnd.setDate(weekEnd.getDate() + 7);

	const events = await db
		.select({
			event: table.schoolEvent
		})
		.from(table.schoolEvent)
		.where(
			and(
				eq(table.schoolEvent.schoolId, schoolId),
				gte(table.schoolEvent.startTimestamp, weekStart),
				lt(table.schoolEvent.startTimestamp, weekEnd),
				includeArchived ? undefined : eq(table.schoolEvent.isArchived, false)
			)
		)
		.orderBy(asc(table.schoolEvent.startTimestamp));

	return events;
}

export async function updateSchoolEvent(
	eventId: number,
	updates: {
		name?: string;
		startTimestamp?: Date;
		endTimestamp?: Date;
		isArchived?: boolean;
	}
) {
	const [updatedEvent] = await db
		.update(table.schoolEvent)
		.set(updates)
		.where(eq(table.schoolEvent.id, eventId))
		.returning();

	return updatedEvent;
}

// Campus Event Functions
export async function createCampusEvent(
	campusId: number,
	name: string,
	startTimestamp: Date,
	endTimestamp: Date,
	requiresRSVP: boolean = false
) {
	const [campusEvent] = await db
		.insert(table.campusEvent)
		.values({
			campusId,
			name,
			startTimestamp,
			endTimestamp,
			requiresRSVP
		})
		.returning();

	return campusEvent;
}

export async function getCampusEventsByCampusId(
	campusId: number,
	includeArchived: boolean = false
) {
	const events = await db
		.select()
		.from(table.schoolEvent)
		.where(
			and(
				eq(table.campusEvent.campusId, campusId),
				includeArchived ? undefined : eq(table.campusEvent.isArchived, false)
			)
		)
		.orderBy(desc(table.schoolEvent.startTimestamp));

	return events;
}

export async function getCampusEventsForWeekByCampusId(
	campusId: number,
	weekStartDate: Date,
	includeArchived: boolean = false
) {
	const weekStart = new Date(weekStartDate);
	weekStart.setHours(0, 0, 0, 0);

	const weekEnd = new Date(weekStart);
	weekEnd.setDate(weekEnd.getDate() + 7);

	const events = await db
		.select({
			event: table.campusEvent
		})
		.from(table.campusEvent)
		.where(
			and(
				eq(table.campusEvent.campusId, campusId),
				gte(table.campusEvent.startTimestamp, weekStart),
				lt(table.campusEvent.startTimestamp, weekEnd),
				includeArchived ? undefined : eq(table.campusEvent.isArchived, false)
			)
		)
		.orderBy(asc(table.campusEvent.startTimestamp));

	return events;
}

export async function getCampusEventsForWeekByUserId(
	userId: string,
	weekStartDate: Date,
	includeArchived: boolean = false
) {
	const weekStart = new Date(weekStartDate);
	weekStart.setHours(0, 0, 0, 0);

	const weekEnd = new Date(weekStart);
	weekEnd.setDate(weekEnd.getDate() + 7);

	const events = await db
		.select({
			event: table.campusEvent
		})
		.from(table.campusEvent)
		.innerJoin(table.campus, eq(table.campusEvent.campusId, table.campus.id))
		.innerJoin(table.userCampus, eq(table.campus.id, table.userCampus.campusId))
		.where(
			and(
				eq(table.userCampus.userId, userId),
				gte(table.campusEvent.startTimestamp, weekStart),
				lt(table.campusEvent.startTimestamp, weekEnd),
				includeArchived ? undefined : eq(table.campusEvent.isArchived, false)
			)
		)
		.orderBy(asc(table.campusEvent.startTimestamp));

	return events;
}

export async function updateCampusEvent(
	eventId: number,
	updates: {
		name?: string;
		startTimestamp?: Date;
		endTimestamp?: Date;
		isArchived?: boolean;
	}
) {
	const [updatedEvent] = await db
		.update(table.campusEvent)
		.set(updates)
		.where(eq(table.campusEvent.id, eventId))
		.returning();

	return updatedEvent;
}

// Subject Offering Event Functions
export async function createSubjectOfferingEvent(
	subjectOfferingId: number,
	name: string,
	startTimestamp: Date,
	endTimestamp: Date,
	requiresRSVP: boolean = false
) {
	const [subjectEvent] = await db
		.insert(table.subjectOfferingEvent)
		.values({
			subjectOfferingId,
			name,
			startTimestamp,
			endTimestamp,
			requiresRSVP
		})
		.returning();

	return subjectEvent;
}

export async function getSubjectOfferingEventsBySchoolId(
	schoolId: number,
	includeArchived: boolean = false
) {
	const events = await db
		.select({
			event: table.subjectOfferingEvent,
			subjectOffering: table.subjectOffering,
			subject: {
				id: table.subject.id,
				name: table.subject.name
			}
		})
		.from(table.subjectOfferingEvent)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectOfferingEvent.subjectOfferingId, table.subjectOffering.id)
		)
		.innerJoin(table.subject, eq(table.subjectOffering.subjectId, table.subject.id))
		.where(
			and(
				eq(table.subject.schoolId, schoolId),
				includeArchived ? undefined : eq(table.subjectOfferingEvent.isArchived, false)
			)
		)
		.orderBy(desc(table.subjectOfferingEvent.startTimestamp));

	return events;
}

export async function getSubjectOfferingEventsForWeekBySchoolId(
	schoolId: number,
	weekStartDate: Date,
	includeArchived: boolean = false
) {
	const weekStart = new Date(weekStartDate);
	weekStart.setHours(0, 0, 0, 0);

	const weekEnd = new Date(weekStart);
	weekEnd.setDate(weekEnd.getDate() + 7);

	const events = await db
		.select({
			event: table.subjectOfferingEvent,
			subjectOffering: table.subjectOffering,
			subject: {
				id: table.subject.id,
				name: table.subject.name
			}
		})
		.from(table.subjectOfferingEvent)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectOfferingEvent.subjectOfferingId, table.subjectOffering.id)
		)
		.innerJoin(table.subject, eq(table.subjectOffering.subjectId, table.subject.id))
		.where(
			and(
				eq(table.subject.schoolId, schoolId),
				gte(table.subjectOfferingEvent.startTimestamp, weekStart),
				lt(table.subjectOfferingEvent.startTimestamp, weekEnd),
				includeArchived ? undefined : eq(table.subjectOfferingEvent.isArchived, false)
			)
		)
		.orderBy(asc(table.subjectOfferingEvent.startTimestamp));

	return events;
}

export async function getSubjectOfferingEventsForWeekByUserId(
	userId: string,
	weekStartDate: Date,
	includeArchived: boolean = false
) {
	const weekStart = new Date(weekStartDate);
	weekStart.setHours(0, 0, 0, 0);

	const weekEnd = new Date(weekStart);
	weekEnd.setDate(weekEnd.getDate() + 7);

	const events = await db
		.select({
			event: table.subjectOfferingEvent,
			subjectOffering: table.subjectOffering,
			subject: {
				id: table.subject.id,
				name: table.subject.name
			}
		})
		.from(table.subjectOfferingEvent)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectOfferingEvent.subjectOfferingId, table.subjectOffering.id)
		)
		.innerJoin(table.subject, eq(table.subjectOffering.subjectId, table.subject.id))
		.innerJoin(
			table.userSubjectOffering,
			eq(table.userSubjectOffering.subOfferingId, table.subjectOffering.id)
		)
		.where(
			and(
				eq(table.userSubjectOffering.userId, userId),
				gte(table.subjectOfferingEvent.startTimestamp, weekStart),
				lt(table.subjectOfferingEvent.startTimestamp, weekEnd),
				includeArchived ? undefined : eq(table.subjectOfferingEvent.isArchived, false)
			)
		)
		.orderBy(asc(table.subjectOfferingEvent.startTimestamp));

	return events;
}

export async function updateSubjectOfferingEvent(
	eventId: number,
	updates: {
		name?: string;
		startTimestamp?: Date;
		endTimestamp?: Date;
		isArchived?: boolean;
	}
) {
	const [updatedEvent] = await db
		.update(table.subjectOfferingEvent)
		.set(updates)
		.where(eq(table.subjectOfferingEvent.id, eventId))
		.returning();

	return updatedEvent;
}

// Subject Offering Class Event Functions
export async function createSubjectOfferingClassEvent(
	subjectOfferingClassId: number,
	name: string,
	startTimestamp: Date,
	endTimestamp: Date,
	requiresRSVP: boolean = false
) {
	const [classEvent] = await db
		.insert(table.subjectOfferingClassEvent)
		.values({
			subjectOfferingClassId,
			name,
			startTimestamp,
			endTimestamp,
			requiresRSVP
		})
		.returning();

	return classEvent;
}

export async function getSubjectOfferingClassEventsBySchoolId(
	schoolId: number,
	includeArchived: boolean = false
) {
	const events = await db
		.select({
			event: table.subjectOfferingClassEvent,
			subjectOfferingClass: table.subjectOfferingClass,
			subjectOffering: table.subjectOffering,
			subject: {
				id: table.subject.id,
				name: table.subject.name
			}
		})
		.from(table.subjectOfferingClassEvent)
		.innerJoin(
			table.subjectOfferingClass,
			eq(table.subjectOfferingClassEvent.subjectOfferingClassId, table.subjectOfferingClass.id)
		)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectOfferingClass.subOfferingId, table.subjectOffering.id)
		)
		.innerJoin(table.subject, eq(table.subjectOffering.subjectId, table.subject.id))
		.where(
			and(
				eq(table.subject.schoolId, schoolId),
				includeArchived ? undefined : eq(table.subjectOfferingClassEvent.isArchived, false)
			)
		)
		.orderBy(desc(table.subjectOfferingClassEvent.startTimestamp));

	return events;
}

export async function getSubjectOfferingClassEventsForWeekBySchoolId(
	schoolId: number,
	weekStartDate: Date,
	includeArchived: boolean = false
) {
	const weekStart = new Date(weekStartDate);
	weekStart.setHours(0, 0, 0, 0);

	const weekEnd = new Date(weekStart);
	weekEnd.setDate(weekEnd.getDate() + 7);

	const events = await db
		.select({
			event: table.subjectOfferingClassEvent,
			subjectOfferingClass: table.subjectOfferingClass,
			subjectOffering: table.subjectOffering,
			subject: {
				id: table.subject.id,
				name: table.subject.name
			}
		})
		.from(table.subjectOfferingClassEvent)
		.innerJoin(
			table.subjectOfferingClass,
			eq(table.subjectOfferingClassEvent.subjectOfferingClassId, table.subjectOfferingClass.id)
		)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectOfferingClass.subOfferingId, table.subjectOffering.id)
		)
		.innerJoin(table.subject, eq(table.subjectOffering.subjectId, table.subject.id))
		.where(
			and(
				eq(table.subject.schoolId, schoolId),
				gte(table.subjectOfferingClassEvent.startTimestamp, weekStart),
				lt(table.subjectOfferingClassEvent.startTimestamp, weekEnd),
				includeArchived ? undefined : eq(table.subjectOfferingClassEvent.isArchived, false)
			)
		)
		.orderBy(asc(table.subjectOfferingClassEvent.startTimestamp));

	return events;
}

export async function getSubjectOfferingClassEventsForWeekByUserId(
	userId: string,
	weekStartDate: Date,
	includeArchived: boolean = false
) {
	const weekStart = new Date(weekStartDate);
	weekStart.setHours(0, 0, 0, 0);

	const weekEnd = new Date(weekStart);
	weekEnd.setDate(weekEnd.getDate() + 7);

	const events = await db
		.select({
			event: table.subjectOfferingClassEvent,
			subjectOfferingClass: table.subjectOfferingClass,
			subjectOffering: table.subjectOffering,
			subject: {
				id: table.subject.id,
				name: table.subject.name
			}
		})
		.from(table.subjectOfferingClassEvent)
		.innerJoin(
			table.subjectOfferingClass,
			eq(table.subjectOfferingClassEvent.subjectOfferingClassId, table.subjectOfferingClass.id)
		)
		.innerJoin(
			table.subjectOffering,
			eq(table.subjectOfferingClass.subOfferingId, table.subjectOffering.id)
		)
		.innerJoin(table.subject, eq(table.subjectOffering.subjectId, table.subject.id))
		.innerJoin(
			table.userSubjectOfferingClass,
			eq(table.userSubjectOfferingClass.subOffClassId, table.subjectOfferingClass.id)
		)
		.where(
			and(
				eq(table.userSubjectOfferingClass.userId, userId),
				gte(table.subjectOfferingClassEvent.startTimestamp, weekStart),
				lt(table.subjectOfferingClassEvent.startTimestamp, weekEnd),
				includeArchived ? undefined : eq(table.subjectOfferingClassEvent.isArchived, false)
			)
		)
		.orderBy(asc(table.subjectOfferingClassEvent.startTimestamp));

	return events;
}

export async function updateSubjectOfferingClassEvent(
	eventId: number,
	updates: {
		name?: string;
		startTimestamp?: Date;
		endTimestamp?: Date;
		isArchived?: boolean;
	}
) {
	const [updatedEvent] = await db
		.update(table.subjectOfferingClassEvent)
		.set(updates)
		.where(eq(table.subjectOfferingClassEvent.id, eventId))
		.returning();

	return updatedEvent;
}

// RSVP Functions
export async function createOrUpdateEventRSVP(
	userId: string,
	eventType: 'school' | 'campus' | 'subject' | 'class',
	eventId: number,
	willAttend: boolean
) {
	const [rsvp] = await db
		.insert(table.eventRSVP)
		.values({
			userId,
			eventType,
			eventId,
			willAttend
		})
		.onConflictDoUpdate({
			target: [table.eventRSVP.userId, table.eventRSVP.eventType, table.eventRSVP.eventId],
			set: {
				willAttend,
				updatedAt: new Date()
			}
		})
		.returning();

	return rsvp;
}

export async function getEventRSVP(
	userId: string,
	eventType: 'school' | 'campus' | 'subject' | 'class',
	eventId: number
) {
	const [rsvp] = await db
		.select()
		.from(table.eventRSVP)
		.where(
			and(
				eq(table.eventRSVP.userId, userId),
				eq(table.eventRSVP.eventType, eventType),
				eq(table.eventRSVP.eventId, eventId)
			)
		);

	return rsvp;
}

export async function getUserEventRSVPs(userId: string) {
	const rsvps = await db.select().from(table.eventRSVP).where(eq(table.eventRSVP.userId, userId));

	return rsvps;
}

// Get individual event by ID functions
export async function getSchoolEventById(eventId: number) {
	const [event] = await db
		.select()
		.from(table.schoolEvent)
		.where(eq(table.schoolEvent.id, eventId));

	return event;
}

export async function getCampusEventById(eventId: number) {
	const [event] = await db
		.select()
		.from(table.campusEvent)
		.where(eq(table.campusEvent.id, eventId));

	return event;
}

export async function getSubjectOfferingEventById(eventId: number) {
	const [event] = await db
		.select()
		.from(table.subjectOfferingEvent)
		.where(eq(table.subjectOfferingEvent.id, eventId));

	return event;
}

export async function getSubjectOfferingClassEventById(eventId: number) {
	const [event] = await db
		.select()
		.from(table.subjectOfferingClassEvent)
		.where(eq(table.subjectOfferingClassEvent.id, eventId));

	return event;
}

export async function deleteEventRSVP(
	userId: string,
	eventType: 'school' | 'campus' | 'subject' | 'class',
	eventId: number
) {
	await db
		.delete(table.eventRSVP)
		.where(
			and(
				eq(table.eventRSVP.userId, userId),
				eq(table.eventRSVP.eventType, eventType),
				eq(table.eventRSVP.eventId, eventId)
			)
		);
}

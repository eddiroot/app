import { boolean, integer, pgSchema, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { campus, school } from './schools';
import { subjectOffering, subjectOfferingClass } from './subjects';
import { user } from './user';
import { timestamps } from './utils';

export const eventsSchema = pgSchema('events');

// Things like whole school assemblies, school fairs etc
export const schoolEvent = eventsSchema.table('sch_evt', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	schoolId: integer('sch_id')
		.notNull()
		.references(() => school.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	startTimestamp: timestamp('start_ts').notNull(),
	endTimestamp: timestamp('end_ts').notNull(),
	requiresRSVP: boolean('requires_rsvp').notNull().default(false),
	isArchived: boolean('is_archived').default(false).notNull(),
	...timestamps
});

export type SchoolEvent = typeof schoolEvent.$inferSelect;

// Per-campus athletics days, swimming carnivals, etc
export const campusEvent = eventsSchema.table('cmps_evt', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	campusId: integer('cmps_id')
		.notNull()
		.references(() => campus.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	startTimestamp: timestamp('start_ts').notNull(),
	endTimestamp: timestamp('end_ts').notNull(),
	requiresRSVP: boolean('requires_rsvp').notNull().default(false),
	isArchived: boolean('is_archived').default(false).notNull(),
	...timestamps
});

export type CampusEvent = typeof campusEvent.$inferSelect;

// Things like a year 8 geography excursion, or a subject-level exam
export const subjectOfferingEvent = eventsSchema.table('sub_off_evt', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	subjectOfferingId: integer('sub_off_id')
		.notNull()
		.references(() => subjectOffering.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	startTimestamp: timestamp('start_ts').notNull(),
	endTimestamp: timestamp('end_ts').notNull(),
	requiresRSVP: boolean('requires_rsvp').notNull().default(false),
	isArchived: boolean('is_archived').default(false).notNull(),
	...timestamps
});

export type SubjectOfferingEvent = typeof subjectOfferingEvent.$inferSelect;

// Thing like a class test or a class excursion
export const subjectOfferingClassEvent = eventsSchema.table('sub_off_cls_evt', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	subjectOfferingClassId: integer('sub_off_cls_id')
		.notNull()
		.references(() => subjectOfferingClass.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	startTimestamp: timestamp('start_ts').notNull(),
	endTimestamp: timestamp('end_ts').notNull(),
	requiresRSVP: boolean('requires_rsvp').notNull().default(false),
	isArchived: boolean('is_archived').default(false).notNull(),
	...timestamps
});

export type SubjectOfferingClassEvent = typeof subjectOfferingClassEvent.$inferSelect;

// RSVP Response table to track event RSVPs
export const eventRSVP = eventsSchema.table(
	'event_rsvp',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		userId: uuid('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		eventType: text('event_type', {
			enum: ['school', 'campus', 'subject', 'class']
		}).notNull(),
		eventId: integer('event_id').notNull(),
		willAttend: boolean('will_attend').notNull(),
		...timestamps
	},
	(self) => [unique().on(self.userId, self.eventType, self.eventId)]
);

export type EventRSVP = typeof eventRSVP.$inferSelect;

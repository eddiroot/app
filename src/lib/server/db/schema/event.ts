import {
	boolean,
	index,
	integer,
	pgSchema,
	text,
	unique,
	uuid,
} from 'drizzle-orm/pg-core';
import { userTypeEnum } from '../../../enums';
import { school, schoolCampus } from './school';
import { subjectOffering, subjectOfferingClass } from './subject';
import { user } from './user';
import { enumToPgEnum, essentials, standardTimestamp } from './utils';

export const eventSchema = pgSchema('event');

export const genericEventFields = {
	...essentials,
	name: text().notNull(),
	start: standardTimestamp('start').notNull(),
	end: standardTimestamp('end').notNull(),
	requiresRSVP: boolean().notNull().default(false),
};

// Whole school assemblies, school fairs, etc
export const eventSchool = eventSchema.table(
	'evt_sch',
	{
		...genericEventFields,
		schoolId: integer('sch_id')
			.notNull()
			.references(() => school.id, { onDelete: 'cascade' }),
	},
	(self) => [index().on(self.schoolId)],
);

export type EventSchool = typeof eventSchool.$inferSelect;

// Per-campus athletics days, swimming carnivals, etc
export const eventCampus = eventSchema.table(
	'evt_cmps',
	{
		...genericEventFields,
		schoolCampusId: integer('sch_cmps_id')
			.notNull()
			.references(() => schoolCampus.id, { onDelete: 'cascade' }),
	},
	(self) => [index().on(self.schoolCampusId)],
);

export type EventCampus = typeof eventCampus.$inferSelect;

// Year-wide subject-level excursion or a subject-level exam
export const eventSubjectOffering = eventSchema.table(
	'evt_sub_off',
	{
		...genericEventFields,
		subjectOfferingId: integer('sub_off_id')
			.notNull()
			.references(() => subjectOffering.id, { onDelete: 'cascade' }),
	},
	(self) => [index().on(self.subjectOfferingId)],
);

export type EventSubjectOffering = typeof eventSubjectOffering.$inferSelect;

// Class tests or class excursions
export const eventSubjectOfferingClass = eventSchema.table(
	'evt_sub_off_cls',
	{
		...genericEventFields,
		subjectOfferingClassId: integer('sub_off_cls_id')
			.notNull()
			.references(() => subjectOfferingClass.id, { onDelete: 'cascade' }),
	},
	(self) => [index().on(self.subjectOfferingClassId)],
);

export type EventSubjectOfferingClass =
	typeof eventSubjectOfferingClass.$inferSelect;

export const eventTypeEnumPg = eventSchema.enum(
	'enum_user_type',
	enumToPgEnum(userTypeEnum),
);

export const eventRSVP = eventSchema.table(
	'evt_rsvp',
	{
		...essentials,
		userId: uuid()
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		eventType: text({
			enum: ['school', 'campus', 'subject', 'class'],
		}).notNull(),
		eventId: integer().notNull(),
		willAttend: boolean().notNull(),
	},
	(self) => [
		unique().on(self.userId, self.eventType, self.eventId),
		index().on(self.userId),
	],
);

export type EventRSVP = typeof eventRSVP.$inferSelect;

import {
	boolean,
	index,
	integer,
	pgSchema,
	text,
	unique,
	uuid,
} from 'drizzle-orm/pg-core'
import { eventTypeEnum } from '../../../enums'
import { school, schoolCampus } from './school'
import { subjectOffering, subjectOfferingClass } from './subject'
import { user } from './user'
import { enumToPgEnum, essentials, standardTimestamp } from './utils'

export const eventSchema = pgSchema('event')

export const eventTypeEnumPg = eventSchema.enum(
	'enum_event_type',
	enumToPgEnum(eventTypeEnum),
)

export const event = eventSchema.table(
	'evt',
	{
		...essentials,
		name: text().notNull(),
		type: eventTypeEnumPg().notNull(),
		start: standardTimestamp('start').notNull(),
		end: standardTimestamp('end').notNull(),
		requiresRSVP: boolean().notNull().default(false),
		schoolId: integer('sch_id').references(() => school.id, {
			onDelete: 'cascade',
		}), // e.g. school-wide event such as assembly
		schoolCampusId: integer('sch_cmps_id').references(() => schoolCampus.id, {
			onDelete: 'cascade',
		}), // e.g. campus-specific event such as sports day
		subjectOfferingId: integer('sub_off_id').references(
			() => subjectOffering.id,
			{ onDelete: 'cascade' },
		), // e.g. subject-specific event such as a field trip
		subjectOfferingClassId: integer('sub_off_cls_id').references(
			() => subjectOfferingClass.id,
			{ onDelete: 'cascade' },
		), // e.g. class-specific event such as an end-of-week quiz
	},
	(self) => [
		index().on(self.schoolId),
		index().on(self.schoolCampusId),
		index().on(self.subjectOfferingId),
		index().on(self.subjectOfferingClassId),
	],
)

export type Event = typeof event.$inferSelect

export const eventRSVP = eventSchema.table(
	'evt_rsvp',
	{
		...essentials,
		userId: uuid()
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		eventId: integer().notNull(),
		isAttending: boolean().notNull(),
	},
	(self) => [unique().on(self.userId, self.eventId), index().on(self.userId)],
)

export type EventRSVP = typeof eventRSVP.$inferSelect

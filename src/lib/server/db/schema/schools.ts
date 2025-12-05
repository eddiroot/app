import { SQL, sql } from 'drizzle-orm';
import {
	boolean,
	check,
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
	unique,
	varchar
} from 'drizzle-orm/pg-core';
import { schoolSpaceTypeEnum } from '../../../enums';
import { timestamps } from './utils';

export const school = pgTable('sch', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	name: text('name').notNull().unique(),
	logoUrl: text('logo_url'),
	countryCode: varchar('country_code', { length: 2 }).notNull(),
	stateCode: varchar('state_code', { length: 3 }).notNull(),
	...timestamps
});

export type School = typeof school.$inferSelect;

export const campus = pgTable('cmps', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	schoolId: integer('sch_id')
		.notNull()
		.references(() => school.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	address: text('address').notNull(),
	description: text('description'),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type Campus = typeof campus.$inferSelect;

export const schoolBuilding = pgTable(
	'sch_bldng',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		campusId: integer('cmps_id')
			.notNull()
			.references(() => campus.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		description: text('description'),
		isArchived: boolean('is_archived').notNull().default(false),
		...timestamps
	},
	(self) => [unique().on(self.campusId, self.name)]
);

export type SchoolBuilding = typeof schoolBuilding.$inferSelect;

export const schoolSpaceTypeEnumPg = pgEnum('enum_sch_space_type', [
	schoolSpaceTypeEnum.classroom,
	schoolSpaceTypeEnum.laboratory,
	schoolSpaceTypeEnum.gymnasium,
	schoolSpaceTypeEnum.pool,
	schoolSpaceTypeEnum.library,
	schoolSpaceTypeEnum.auditorium
]);

export const schoolSpace = pgTable(
	'sch_space',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		buildingId: integer('sch_bldng_id')
			.notNull()
			.references(() => schoolBuilding.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		type: schoolSpaceTypeEnumPg().notNull(),
		capacity: integer('capacity'),
		description: text('description'),
		isArchived: boolean('is_archived').notNull().default(false),
		...timestamps
	},
	(self) => [unique().on(self.buildingId, self.name)]
);

export type SchoolSpace = typeof schoolSpace.$inferSelect;

export const schoolSemester = pgTable(
	'sch_sem',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		schoolId: integer('sch_id').notNull(),
		schoolYear: integer('sch_year_id').notNull(),
		semNumber: integer('sem_number').notNull(),
		name: text('name').generatedAlwaysAs((): SQL => sql`'Semester ' || sem_number`),
		isArchived: boolean('is_archived').notNull().default(false),
		...timestamps
	},
	(self) => [
		check('valid_sem_number', sql`${self.semNumber} IN (1, 2)`),
		unique().on(self.schoolId, self.schoolYear, self.semNumber)
	]
);

export type SchoolSemester = typeof schoolSemester.$inferSelect;

export const schoolTerm = pgTable(
	'sch_term',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		schoolSemesterId: integer('sch_sem_id')
			.notNull()
			.references(() => schoolSemester.id, { onDelete: 'cascade' }),
		termNumber: integer('term_number').notNull(),
		name: text('name').generatedAlwaysAs((): SQL => sql`'Term ' || term_number`),
		startDate: timestamp('sch_term_start_date', { withTimezone: true, mode: 'date' }).notNull(),
		endDate: timestamp('sch_term_end_date', { withTimezone: true, mode: 'date' }).notNull(),
		isArchived: boolean('is_archived').notNull().default(false),
		...timestamps
	},
	(self) => [
		check('valid_term_number', sql`${self.termNumber} IN (1, 2, 3, 4)`),
		unique().on(self.schoolSemesterId, self.termNumber)
	]
);

export type SchoolTerm = typeof schoolTerm.$inferSelect;

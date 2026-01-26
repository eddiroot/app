import {
	index,
	integer,
	pgSchema,
	text,
	unique,
	varchar,
} from 'drizzle-orm/pg-core';
import { schoolSpaceTypeEnum } from '../../../enums';
import { gradeScale } from './curriculum';
import { yearLevelEnumPg } from './global';
import { enumToPgEnum, essentials, standardTimestamp } from './utils';

export const schoolSchema = pgSchema('school');

export const school = schoolSchema.table('sch', {
	...essentials,
	name: text().notNull().unique(),
	logoPath: text(),
	countryCode: varchar({ length: 2 }).notNull(),
	stateCode: varchar({ length: 3 }).notNull(),
});

export type School = typeof school.$inferSelect;

export const schoolYearLevel = schoolSchema.table(
	'sch_yl',
	{
		...essentials,
		code: yearLevelEnumPg().notNull(), // e.g. 11
		schoolId: integer('sch_id')
			.notNull()
			.references(() => school.id, { onDelete: 'cascade' }),
		gradeScaleId: integer('grade_scale_id').references(() => gradeScale.id, {
			onDelete: 'set null',
		}),
	},
	(self) => [index().on(self.schoolId), index().on(self.gradeScaleId)],
);

export type SchoolYearLevel = typeof schoolYearLevel.$inferSelect;

export const schoolCampus = schoolSchema.table(
	'sch_cmps',
	{
		...essentials,
		name: text().notNull(),
		description: text(),
		address: text().notNull(),
		schoolId: integer('sch_id')
			.notNull()
			.references(() => school.id, { onDelete: 'cascade' }),
	},
	(self) => [index().on(self.schoolId)],
);

export type SchoolCampus = typeof schoolCampus.$inferSelect;

export const schoolBuilding = schoolSchema.table(
	'sch_bldng',
	{
		...essentials,
		name: text().notNull(),
		description: text(),
		schoolCampusId: integer('sch_cmps_id')
			.notNull()
			.references(() => schoolCampus.id, { onDelete: 'cascade' }),
	},
	(self) => [
		unique().on(self.schoolCampusId, self.name),
		index().on(self.schoolCampusId),
	],
);

export type SchoolBuilding = typeof schoolBuilding.$inferSelect;

export const schoolSpaceTypeEnumPg = schoolSchema.enum(
	'enum_sch_space_type',
	enumToPgEnum(schoolSpaceTypeEnum),
);

export const schoolSpace = schoolSchema.table(
	'sch_space',
	{
		...essentials,
		name: text().notNull(),
		description: text(),
		type: schoolSpaceTypeEnumPg().notNull(),
		capacity: integer(),
		schoolBuildingId: integer('sch_bldng_id')
			.notNull()
			.references(() => schoolBuilding.id, { onDelete: 'cascade' }),
	},
	(self) => [
		unique().on(self.schoolBuildingId, self.name),
		index().on(self.schoolBuildingId),
	],
);

export type SchoolSpace = typeof schoolSpace.$inferSelect;

export const schoolSemester = schoolSchema.table(
	'sch_sem',
	{
		...essentials,
		year: integer().notNull(),
		number: integer().notNull(),
		schoolId: integer('sch_id')
			.notNull()
			.references(() => school.id, { onDelete: 'cascade' }),
	},
	(self) => [
		unique().on(self.schoolId, self.number),
		index().on(self.schoolId),
	],
);

export type SchoolSemester = typeof schoolSemester.$inferSelect;

export const schoolTerm = schoolSchema.table(
	'sch_term',
	{
		...essentials,
		number: integer().notNull(),
		start: standardTimestamp('start').notNull(),
		end: standardTimestamp('end').notNull(),
		schoolSemesterId: integer('sch_sem_id')
			.notNull()
			.references(() => schoolSemester.id, { onDelete: 'cascade' }),
	},
	(self) => [
		unique().on(self.schoolSemesterId, self.number),
		index().on(self.schoolSemesterId),
	],
);

export type SchoolTerm = typeof schoolTerm.$inferSelect;

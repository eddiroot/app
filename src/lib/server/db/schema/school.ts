import { sql } from 'drizzle-orm';
import {
	check,
	doublePrecision,
	index,
	integer,
	pgSchema,
	text,
	unique,
	varchar,
} from 'drizzle-orm/pg-core';
import {
	gradeScaleEnum,
	schoolSpaceTypeEnum,
	yearLevelEnum,
} from '../../../enums';
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

export const yearLevelEnumPg = schoolSchema.enum(
	'enum_year_level',
	enumToPgEnum(yearLevelEnum),
);

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

export const schoolBehaviourLevel = schoolSchema.table(
	'sch_bvr_lvl',
	{
		...essentials,
		level: integer().notNull(),
		name: text().notNull(),
		schoolId: integer('sch_id')
			.notNull()
			.references(() => school.id, { onDelete: 'cascade' }),
	},
	(self) => [
		unique().on(self.schoolId, self.level),
		check('valid_level_range', sql`${self.level} >= 0 AND ${self.level} <= 10`),
		index().on(self.schoolId),
	],
);

export type BehaviourLevel = typeof schoolBehaviourLevel.$inferSelect;

export const schoolBehaviour = schoolSchema.table(
	'sch_bvr',
	{
		...essentials,
		name: text().notNull(),
		description: text(),
		schoolId: integer('sch_id')
			.notNull()
			.references(() => school.id, { onDelete: 'cascade' }),
		levelId: integer('level_id')
			.references(() => schoolBehaviourLevel.id, { onDelete: 'cascade' })
			.notNull(),
	},
	(self) => [
		unique().on(self.schoolId, self.name),
		index().on(self.schoolId),
		index().on(self.levelId),
	],
);

export type Behaviour = typeof schoolBehaviour.$inferSelect;

export const gradeScaleEnumPg = schoolSchema.enum(
	'enum_grade_scale',
	enumToPgEnum(gradeScaleEnum),
);

export const gradeScale = schoolSchema.table('grade_scale', {
	...essentials,
	name: text().notNull(),
	gradeScaleType: gradeScaleEnumPg().notNull(),
});

export type GradeScale = typeof gradeScale.$inferSelect;

export const gradeScaleLevel = schoolSchema.table(
	'grade_scale_level',
	{
		...essentials,
		gradeScaleId: integer('grade_scale_id')
			.notNull()
			.references(() => gradeScale.id, { onDelete: 'cascade' }),
		name: text().notNull(),
		color: text().notNull(),
		minimumScore: doublePrecision().notNull(),
		maximumScore: doublePrecision().notNull(),
		gradeValue: doublePrecision(),
	},
	(self) => [index().on(self.gradeScaleId)],
);

export type GradeScaleLevel = typeof gradeScaleLevel.$inferSelect;

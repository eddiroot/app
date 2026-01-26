import { pgSchema } from 'drizzle-orm/pg-core';
import { yearLevelEnum } from '../../../enums';
import { enumToPgEnum } from './utils';

// Anything that's one level above schools (even eddi school)

export const globalSchema = pgSchema('global');

export const yearLevelEnumPg = globalSchema.enum(
	'enum_year_level',
	enumToPgEnum(yearLevelEnum),
);

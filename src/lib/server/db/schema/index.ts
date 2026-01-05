// Re-export all schema definitions and types from individual schema files
// This allows importing directly from $lib/server/db/schema instead of specific files

// Task schemas
export * from './task';

// School schemas
export * from './schools';

// Timetable schemas
export * from './timetables';

// Subject schemas
export * from './subjects';

// User schemas
export * from './user';

// Utility schemas
export * from './utils';

// Coursemap schemas
export * from './coursemap';

// Curriculum schemas
export * from './curriculum';

// Resource schemas
export * from './resource';

// Event schemas
export * from './events';

// News schemas
export * from './news';

// ============================================================================
// SCHEMA REGISTRY
// ============================================================================

import * as coursemapModule from './coursemap';
import * as curriculumModule from './curriculum';
import * as eventsModule from './events';
import * as newsModule from './news';
import * as resourceModule from './resource';
import * as schoolModule from './schools';
import * as subjectsModule from './subjects';
import * as taskModule from './task';
import * as timetableModule from './timetables';
import * as userModule from './user';

export type SchemaModule = Record<string, unknown>;

export const AVAILABLE_SCHEMAS: Record<string, SchemaModule> = {
	curriculum: curriculumModule,
	task: taskModule,
	school: schoolModule,
	user: userModule,
	news: newsModule,
	subjects: subjectsModule,
	timetable: timetableModule,
	events: eventsModule,
	resource: resourceModule,
	coursemap: coursemapModule
};

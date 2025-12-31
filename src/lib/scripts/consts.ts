import * as coursemapModule from '$lib/server/db/schema/coursemap';
import * as curriculumModule from '$lib/server/db/schema/curriculum';
import * as eventsModule from '$lib/server/db/schema/events';
import * as newsModule from '$lib/server/db/schema/news';
import * as resourceModule from '$lib/server/db/schema/resource';
import * as schoolModule from '$lib/server/db/schema/schools';
import * as subjectsModule from '$lib/server/db/schema/subjects';
import * as taskModule from '$lib/server/db/schema/task';
import * as timetableModule from '$lib/server/db/schema/timetables';
import * as userModule from '$lib/server/db/schema/user';

// ============================================================================
// SCHEMA REGISTRY
// ============================================================================


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
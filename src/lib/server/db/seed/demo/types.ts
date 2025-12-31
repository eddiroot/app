import type * as schema from '../../schema';
// School infrastructure data
export interface DemoSchoolData {
    school: typeof schema.school.$inferSelect;
    campus: typeof schema.campus.$inferSelect;
    buildings: {
        middleSchool: typeof schema.schoolBuilding.$inferSelect;
        seniorSchool: typeof schema.schoolBuilding.$inferSelect;
        gymnasium: typeof schema.schoolBuilding.$inferSelect;
    };
    spaces: (typeof schema.schoolSpace.$inferSelect)[];
    yearLevels: (typeof schema.yearLevel.$inferSelect)[];
}

// User data
export interface DemoUserData {
    admin: typeof schema.user.$inferSelect;
    teachers: (typeof schema.user.$inferSelect)[];
    students: (typeof schema.user.$inferSelect)[];
    parents: (typeof schema.user.$inferSelect)[];
}

// Subject data
export interface DemoSubjectData {
    coreSubjects: (typeof schema.coreSubject.$inferSelect)[];
    subjects: (typeof schema.subject.$inferSelect)[];
    offerings: (typeof schema.subjectOffering.$inferSelect)[];
    classes: (typeof schema.subjectOfferingClass.$inferSelect)[];
    year9Offerings: (typeof schema.subjectOffering.$inferSelect)[];
}
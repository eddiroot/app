import type * as schema from '../../schema'

export interface DemoSchoolData {
	school: typeof schema.school.$inferSelect
	semestersAndTerms: {
		semesters: (typeof schema.schoolSemester.$inferSelect)[]
		terms: (typeof schema.schoolTerm.$inferSelect)[]
	}
	campus: typeof schema.schoolCampus.$inferSelect
	buildings: {
		middleSchool: typeof schema.schoolBuilding.$inferSelect
		seniorSchool: typeof schema.schoolBuilding.$inferSelect
		gymnasium: typeof schema.schoolBuilding.$inferSelect
	}
	spaces: (typeof schema.schoolSpace.$inferSelect)[]
	yearLevels: {
		none: typeof schema.schoolYearLevel.$inferSelect
		year7: typeof schema.schoolYearLevel.$inferSelect
		year8: typeof schema.schoolYearLevel.$inferSelect
		year9: typeof schema.schoolYearLevel.$inferSelect
		year10: typeof schema.schoolYearLevel.$inferSelect
	}
}

export interface DemoUserData {
	admin: typeof schema.user.$inferSelect
	principal: typeof schema.user.$inferSelect
	coordinators: (typeof schema.user.$inferSelect)[]
	teachers: (typeof schema.user.$inferSelect)[]
	students: (typeof schema.user.$inferSelect)[]
	parents: (typeof schema.user.$inferSelect)[]
}

export interface DemoSubjectData {
	subjectGroups: (typeof schema.subjectGroup.$inferSelect)[]
	subjects: (typeof schema.subject.$inferSelect)[]
	offerings: (typeof schema.subjectOffering.$inferSelect)[]
	classes: (typeof schema.subjectOfferingClass.$inferSelect)[]
}

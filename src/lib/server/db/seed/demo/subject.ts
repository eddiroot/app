import * as schema from '../../schema'
import type { Database } from '../types'
import type { DemoSchoolData, DemoSubjectData, DemoUserData } from './types'

// Seeded random number generator for consistent results
function seededRandom(seed: number): () => number {
	return function () {
		seed = (seed * 1103515245 + 12345) & 0x7fffffff
		return seed / 0x7fffffff
	}
}

// Fisher-Yates shuffle with seeded random
function shuffle<T>(array: T[], random: () => number): T[] {
	const result = [...array]
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1))
		;[result[i], result[j]] = [result[j], result[i]]
	}
	return result
}

export async function seedDemoSubjects(
	db: Database,
	schoolData: DemoSchoolData,
	userData: DemoUserData,
): Promise<DemoSubjectData> {
	const { school, campus, yearLevels } = schoolData
	const random = seededRandom(54321)

	const subjectGroups = await db
		.insert(schema.subjectGroup)
		.values([
			{ name: 'English', description: 'Core English', schoolId: school.id },
			{
				name: 'Mathematics',
				description: 'Core Mathematics',
				schoolId: school.id,
			},
			{ name: 'Science', description: 'Core Science', schoolId: school.id },
			{ name: 'History', description: 'Core History', schoolId: school.id },
			{ name: 'Geography', description: 'Core Geography', schoolId: school.id },
			{
				name: 'Physical Education',
				description: 'Core Physical Education',
				schoolId: school.id,
			},
		])
		.returning()

	// Create subjects for each year level
	const subjects: (typeof schema.subject.$inferSelect)[] = []

	// Year 7 to Year 10 (exclude 'none')
	const activeYearLevelEntries = Object.entries(yearLevels)
		.filter(([key]) => key !== 'none')
		.map(([, value]) => [value.code, value.id]) as [string, number][]

	for (const subjectGroup of subjectGroups) {
		for (const [yearLevelCode, yearLevelId] of activeYearLevelEntries) {
			const [subject] = await db
				.insert(schema.subject)
				.values({
					name: `Year ${yearLevelCode} ${subjectGroup.name}`,
					schoolId: school.id,
					subjectGroupId: subjectGroup.id,
					schoolYearLevelId: yearLevelId,
				})
				.returning()

			subjects.push(subject)
		}
	}

	const currentYear = new Date().getFullYear()
	const offerings = await db
		.insert(schema.subjectOffering)
		.values(
			subjects.map((subject) => ({
				subjectId: subject.id,
				year: currentYear,
				schoolCampusId: campus.id,
			})),
		)
		.returning()

	// Create three classes (A, B, C) for each offering
	const allClasses: (typeof schema.subjectOfferingClass.$inferSelect)[] = []
	for (const offering of offerings) {
		const classes = await db
			.insert(schema.subjectOfferingClass)
			.values(
				['A', 'B', 'C'].map((className) => ({
					name: className,
					subOfferingId: offering.id,
				})),
			)
			.returning()
		allClasses.push(...classes)
	}

	// ============================================================================
	// ASSIGN TEACHERS TO SUBJECTS (5 teachers per core subject)
	// ============================================================================
	const TEACHERS_PER_SUBJECT = 5
	const shuffledTeachers = shuffle(userData.teachers, random)

	// Map to track which teachers are assigned to which core subjects
	const subjectGroupTeachers: Map<number, typeof userData.teachers> = new Map()

	// Assign 5 teachers to each core subject (teachers can overlap across subjects)
	for (let i = 0; i < subjectGroups.length; i++) {
		const subjectGroup = subjectGroups[i]
		// Rotate through teachers so each subject gets different primary teachers
		// but allows overlap since we have 6 subjects and 30 teachers
		const startIndex = (i * TEACHERS_PER_SUBJECT) % shuffledTeachers.length
		const assignedTeachers: typeof userData.teachers = []

		for (let j = 0; j < TEACHERS_PER_SUBJECT; j++) {
			const teacherIndex = (startIndex + j) % shuffledTeachers.length
			assignedTeachers.push(shuffledTeachers[teacherIndex])
		}

		subjectGroupTeachers.set(subjectGroup.id, assignedTeachers)
	}

	// Assign teachers to their subject offerings and classes
	for (const subjectGroup of subjectGroups) {
		const teachers = subjectGroupTeachers.get(subjectGroup.id) || []

		// Get all offerings for this core subject (across all year levels and semesters)
		const subjectIds = subjects
			.filter((s) => s.subjectGroupId === subjectGroup.id)
			.map((s) => s.id)

		const subjectGroupOfferings = offerings.filter((o) =>
			subjectIds.includes(o.subjectId),
		)

		// Assign all teachers to all offerings for this core subject
		for (const teacher of teachers) {
			for (const offering of subjectGroupOfferings) {
				await db
					.insert(schema.userSubjectOffering)
					.values({ userId: teacher.id, subOfferingId: offering.id })
			}
		}

		// Distribute classes among the 5 teachers (each teacher gets ~equal classes)
		const subjectGroupClasses = allClasses.filter((c) =>
			subjectGroupOfferings.some((o) => o.id === c.subOfferingId),
		)

		for (let i = 0; i < subjectGroupClasses.length; i++) {
			const cls = subjectGroupClasses[i]
			const teacher = teachers[i % teachers.length]

			await db
				.insert(schema.userSubjectOfferingClass)
				.values({ userId: teacher.id, subOffClassId: cls.id })
		}
	}

	// ============================================================================
	// ASSIGN STUDENTS TO SUBJECT OFFERINGS AND CLASSES
	// ============================================================================
	for (const yearLevel of activeYearLevelEntries.map((entry) => entry[1])) {
		const studentsInYearLevel = userData.students.filter(
			(s) => s.schoolYearLevelId === yearLevel,
		)

		const offeringsForYearLevel = offerings.filter((offering) => {
			const subject = subjects.find((s) => s.id === offering.subjectId)
			return subject && subject.schoolYearLevelId === yearLevel
		})

		// Assign all students to all subject offerings for their year level
		for (const student of studentsInYearLevel) {
			for (const offering of offeringsForYearLevel) {
				await db
					.insert(schema.userSubjectOffering)
					.values({ userId: student.id, subOfferingId: offering.id })
			}
		}

		// Assign students to classes (distribute 20 students per class)
		for (const offering of offeringsForYearLevel) {
			const classesForOffering = allClasses.filter(
				(c) => c.subOfferingId === offering.id,
			)
			const shuffledStudents = shuffle(studentsInYearLevel, random)

			const studentsPerClass = Math.ceil(
				shuffledStudents.length / classesForOffering.length,
			)

			for (let i = 0; i < classesForOffering.length; i++) {
				const cls = classesForOffering[i]
				const startIdx = i * studentsPerClass
				const endIdx = Math.min(
					startIdx + studentsPerClass,
					shuffledStudents.length,
				)
				const studentsForClass = shuffledStudents.slice(startIdx, endIdx)

				for (const student of studentsForClass) {
					await db
						.insert(schema.userSubjectOfferingClass)
						.values({ userId: student.id, subOffClassId: cls.id })
				}
			}
		}
	}

	// Assign admin to all offerings
	for (const offering of offerings) {
		await db
			.insert(schema.userSubjectOffering)
			.values({ userId: userData.admin.id, subOfferingId: offering.id })
	}

	// Assign admin to all classes so they can see all timetable allocations
	for (const cls of allClasses) {
		await db
			.insert(schema.userSubjectOfferingClass)
			.values({ userId: userData.admin.id, subOffClassId: cls.id })
	}

	// Assign year level coordinators to their year level offerings
	for (const coordinator of userData.coordinators) {
		// Assume coordinator's year level is indicated in their assigned yearLevelId
		const coordinatorYearLevel = Object.entries(yearLevels).find(
			([, yearLevel]) => yearLevel.id === coordinator.schoolYearLevelId,
		)?.[0]

		if (!coordinatorYearLevel || coordinatorYearLevel === 'none') continue

		const offeringsForYearLevel = offerings.filter((offering) => {
			const subject = subjects.find((s) => s.id === offering.subjectId)
			return (
				subject && subject.schoolYearLevelId === coordinator.schoolYearLevelId
			)
		})

		for (const offering of offeringsForYearLevel) {
			await db
				.insert(schema.userSubjectOffering)
				.values({ userId: coordinator.id, subOfferingId: offering.id })
		}
	}

	// Create course map items for all offerings
	await seedCourseMapItems(db, offerings, subjects, subjectGroups)

	return { subjectGroups, subjects, offerings, classes: allClasses }
}

async function seedCourseMapItems(
	db: Database,
	offerings: (typeof schema.subjectOffering.$inferSelect)[],
	subjects: (typeof schema.subject.$inferSelect)[],
	subjectGroups: (typeof schema.subjectGroup.$inferSelect)[],
) {
	const weeksPerSemester = 18
	const totalWeeks = 36
	const duration = 6

	for (const offering of offerings) {
		const subject = subjects.find((s) => s.id === offering.subjectId)
		if (!subject) continue

		const subjectGroup = subjectGroups.find(
			(cs) => cs.id === subject.subjectGroupId,
		)
		if (!subjectGroup) continue

		const subjectName = subjectGroup.name
		const baseTopics = getBaseTopicsForSubject(subjectName)

		for (let week = 1; week <= totalWeeks; week += duration) {
			const topicIndex = Math.floor(
				((week - 1) / totalWeeks) * baseTopics.length,
			)
			const topic = baseTopics[topicIndex] || `${subjectName} Review`

			const semester = week <= weeksPerSemester ? 1 : 2
			const startWeekInSemester =
				semester === 1 ? week : week - weeksPerSemester

			await db
				.insert(schema.curriculumItem)
				.values({
					subjectOfferingId: offering.id,
					topic,
					description: `${topic} activities and learning for ${subjectName}`,
					startWeek: startWeekInSemester,
					duration,
					hexColor: getSubjectColor(subjectName),
				})
		}
	}
}

function getBaseTopicsForSubject(subjectName: string): string[] {
	const topicMap: Record<string, string[]> = {
		Mathematics: [
			'Number and Algebra',
			'Measurement and Geometry',
			'Statistics and Probability',
			'Linear Equations',
			'Quadratic Functions',
			'Data Analysis',
		],
		English: [
			'Reading Comprehension',
			'Creative Writing',
			'Poetry Analysis',
			'Essay Writing',
			'Literature Study',
			'Media Literacy',
		],
		Science: [
			'Biology Fundamentals',
			'Chemistry Basics',
			'Physics Principles',
			'Scientific Method',
			'Environmental Science',
			'Human Body Systems',
		],
		'Physical Education': [
			'Fitness and Health',
			'Team Sports',
			'Individual Sports',
			'Motor Skills',
			'Sports Psychology',
			'Nutrition',
		],
		History: [
			'Ancient Civilizations',
			'Medieval Times',
			'Industrial Revolution',
			'World Wars',
			'Modern History',
			'Australian History',
		],
		Geography: [
			'Physical Geography',
			'Human Geography',
			'Climate and Weather',
			'Environmental Systems',
			'Urban Geography',
			'Global Issues',
		],
	}

	return (
		topicMap[subjectName] || [
			`${subjectName} Fundamentals`,
			`${subjectName} Practice`,
			`${subjectName} Assessment`,
		]
	)
}

function getSubjectColor(subjectName: string): string {
	const colorMap: Record<string, string> = {
		Mathematics: '#3B82F6',
		English: '#8B5CF6',
		Science: '#10B981',
		'Physical Education': '#EF4444',
		History: '#F59E0B',
		Geography: '#06B6D4',
	}

	return colorMap[subjectName] || '#6B7280'
}

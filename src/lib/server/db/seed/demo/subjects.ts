import { yearLevelEnum } from '$lib/enums';
import * as schema from '../../schema';
import type { Database } from '../types';
import { DEMO_SUBJECTS, DEMO_YEAR_LEVELS } from './consts';
import type { DemoSchoolData, DemoSubjectData, DemoUserData } from './types';

// Seeded random number generator for consistent results
function seededRandom(seed: number): () => number {
	return function () {
		seed = (seed * 1103515245 + 12345) & 0x7fffffff;
		return seed / 0x7fffffff;
	};
}

// Fisher-Yates shuffle with seeded random
function shuffle<T>(array: T[], random: () => number): T[] {
	const result = [...array];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}

export async function seedDemoSubjects(
	db: Database,
	schoolData: DemoSchoolData,
	userData: DemoUserData
): Promise<DemoSubjectData> {
	const { school, campus, yearLevels } = schoolData;
	const random = seededRandom(54321);

	// Create core subjects
	const coreSubjects: (typeof schema.coreSubject.$inferSelect)[] = [];

	for (const subjectDef of DEMO_SUBJECTS) {
		const [coreSubject] = await db
			.insert(schema.coreSubject)
			.values({
				name: subjectDef.name,
				description: `Core ${subjectDef.name}`,
				schoolId: school.id,
				subjectGroup: subjectDef.group
			})
			.returning();

		coreSubjects.push(coreSubject);
	}

	console.log(`  Created ${coreSubjects.length} core subjects`);

	// Create subjects for each year level
	const subjects: (typeof schema.subject.$inferSelect)[] = [];

	// Year 7 to Year 10 (exclude 'none')
	const activeYearLevelEntries = Object.entries(yearLevels).filter(
		([key]) => key !== 'none'
	) as [string, number][];

	for (const coreSubject of coreSubjects) {
		for (const [yearLevel, yearLevelId] of activeYearLevelEntries) {
			const [subject] = await db
				.insert(schema.subject)
				.values({
					name: `Year ${yearLevel} ${coreSubject.name}`,
					schoolId: school.id,
					coreSubjectId: coreSubject.id,
					yearLevelId: yearLevelId
				})
				.returning();

			subjects.push(subject);
		}
	}

	console.log(`  Created ${subjects.length} subjects`);

	// Create subject offerings for Current Year
	const currentYear = new Date().getFullYear();
	const offeringsSem1 = subjects.map((subject) => ({
		subjectId: subject.id,
		year: currentYear,
		semester: 1,
		campusId: campus.id
	}));

	const offeringsSem2 = subjects.map((subject) => ({
		subjectId: subject.id,
		year: currentYear,
		semester: 2,
		campusId: campus.id
	}));

	const offerings = await db
		.insert(schema.subjectOffering)
		.values([...offeringsSem1, ...offeringsSem2])
		.returning();

	console.log(`  Created ${offerings.length} subject offerings`);

	// Create three classes (A, B, C) for each offering
	const allClasses: (typeof schema.subjectOfferingClass.$inferSelect)[] = [];
	for (const offering of offerings) {
		const classes = await db
			.insert(schema.subjectOfferingClass)
			.values(
				['A', 'B', 'C'].map((className) => ({
					name: className,
					subOfferingId: offering.id
				}))
			)
			.returning();
		allClasses.push(...classes);
	}

	console.log(`  Created ${allClasses.length} subject offering classes`);

	// ============================================================================
	// ASSIGN TEACHERS TO SUBJECTS (5 teachers per core subject)
	// ============================================================================
	const TEACHERS_PER_SUBJECT = 5;
	const shuffledTeachers = shuffle(userData.teachers, random);
	
	// Map to track which teachers are assigned to which core subjects
	const coreSubjectTeachers: Map<number, typeof userData.teachers> = new Map();
	
	// Assign 5 teachers to each core subject (teachers can overlap across subjects)
	for (let i = 0; i < coreSubjects.length; i++) {
		const coreSubject = coreSubjects[i];
		// Rotate through teachers so each subject gets different primary teachers
		// but allows overlap since we have 6 subjects and 30 teachers
		const startIndex = (i * TEACHERS_PER_SUBJECT) % shuffledTeachers.length;
		const assignedTeachers: typeof userData.teachers = [];
		
		for (let j = 0; j < TEACHERS_PER_SUBJECT; j++) {
			const teacherIndex = (startIndex + j) % shuffledTeachers.length;
			assignedTeachers.push(shuffledTeachers[teacherIndex]);
		}
		
		coreSubjectTeachers.set(coreSubject.id, assignedTeachers);
	}

	// Assign teachers to their subject offerings and classes
	let teacherOfferingCount = 0;
	let teacherClassCount = 0;

	for (const coreSubject of coreSubjects) {
		const teachers = coreSubjectTeachers.get(coreSubject.id) || [];
		
		// Get all offerings for this core subject (across all year levels and semesters)
		const subjectIds = subjects
			.filter((s) => s.coreSubjectId === coreSubject.id)
			.map((s) => s.id);
		
		const coreSubjectOfferings = offerings.filter((o) => subjectIds.includes(o.subjectId));
		
		// Assign all teachers to all offerings for this core subject
		for (const teacher of teachers) {
			for (const offering of coreSubjectOfferings) {
				await db.insert(schema.userSubjectOffering).values({
					userId: teacher.id,
					subOfferingId: offering.id
				});
				teacherOfferingCount++;
			}
		}
		
		// Distribute classes among the 5 teachers (each teacher gets ~equal classes)
		const coreSubjectClasses = allClasses.filter((c) => 
			coreSubjectOfferings.some((o) => o.id === c.subOfferingId)
		);
		
		for (let i = 0; i < coreSubjectClasses.length; i++) {
			const cls = coreSubjectClasses[i];
			const teacher = teachers[i % teachers.length];
			
			await db.insert(schema.userSubjectOfferingClass).values({
				userId: teacher.id,
				subOffClassId: cls.id
			});
			teacherClassCount++;
		}
	}

	console.log(`  Assigned teachers to ${teacherOfferingCount} subject offerings`);
	console.log(`  Assigned teachers to ${teacherClassCount} subject offering classes`);

	// ============================================================================
	// ASSIGN STUDENTS TO SUBJECT OFFERINGS AND CLASSES
	// ============================================================================
	const activeYearLevels = DEMO_YEAR_LEVELS.filter((yl) => yl !== yearLevelEnum.none);
	
	for (const yearLevel of activeYearLevels) {
		const yearLevelId = yearLevels[yearLevel as keyof typeof yearLevels];
		const studentsInYearLevel = userData.students.filter((s) => s.yearLevelId === yearLevelId);

		const offeringsForYearLevel = offerings.filter((offering) => {
			const subject = subjects.find((s) => s.id === offering.subjectId);
			return subject && subject.yearLevelId === yearLevelId;
		});

		// Assign all students to all subject offerings for their year level
		for (const student of studentsInYearLevel) {
			for (const offering of offeringsForYearLevel) {
				await db.insert(schema.userSubjectOffering).values({
					userId: student.id,
					subOfferingId: offering.id
				});
			}
		}

		// Assign students to classes (distribute 20 students per class)
		for (const offering of offeringsForYearLevel) {
			const classesForOffering = allClasses.filter((c) => c.subOfferingId === offering.id);
			const shuffledStudents = shuffle(studentsInYearLevel, random);
			
			const studentsPerClass = Math.ceil(shuffledStudents.length / classesForOffering.length);
			
			for (let i = 0; i < classesForOffering.length; i++) {
				const cls = classesForOffering[i];
				const startIdx = i * studentsPerClass;
				const endIdx = Math.min(startIdx + studentsPerClass, shuffledStudents.length);
				const studentsForClass = shuffledStudents.slice(startIdx, endIdx);

				for (const student of studentsForClass) {
					await db.insert(schema.userSubjectOfferingClass).values({
						userId: student.id,
						subOffClassId: cls.id
					});
				}
			}
		}
	}

	console.log(`  Assigned students to subject offerings and classes`);

	// Assign admin to all offerings
	for (const offering of offerings) {
		await db.insert(schema.userSubjectOffering).values({
			userId: userData.admin.id,
			subOfferingId: offering.id
		});
	}

	// Assingn year level coordinators to their year level offerings
	for (const coordinator of userData.coordinators) {
		// Assume coordinator's year level is indicated in their assigned yearLevelId
		const coordinatorYearLevel = Object.entries(yearLevels).find(
			([, id]) => id === coordinator.yearLevelId
		)?.[0];

		if (!coordinatorYearLevel || coordinatorYearLevel === 'none') continue;

		const yearLevelId = yearLevels[coordinatorYearLevel as keyof typeof yearLevels];

		const offeringsForYearLevel = offerings.filter((offering) => {
			const subject = subjects.find((s) => s.id === offering.subjectId);
			return subject && subject.yearLevelId === yearLevelId;
		});

		for (const offering of offeringsForYearLevel) {
			await db.insert(schema.userSubjectOffering).values({
				userId: coordinator.id,
				subOfferingId: offering.id
			});
		}
	}

	// Create course map items for all offerings
	await seedCourseMapItems(db, offerings, subjects, coreSubjects);


	return {
		coreSubjects,
		subjects,
		offerings,
		classes: allClasses
	};
}

async function seedCourseMapItems(
	db: Database,
	offerings: (typeof schema.subjectOffering.$inferSelect)[],
	subjects: (typeof schema.subject.$inferSelect)[],
	coreSubjects: (typeof schema.coreSubject.$inferSelect)[]
) {
	const weeksPerSemester = 18;
	const totalWeeks = 36;
	const duration = 6;
	let itemCount = 0;

	for (const offering of offerings) {
		const subject = subjects.find((s) => s.id === offering.subjectId);
		if (!subject) continue;

		const coreSubject = coreSubjects.find((cs) => cs.id === subject.coreSubjectId);
		if (!coreSubject) continue;

		const subjectName = coreSubject.name;
		const baseTopics = getBaseTopicsForSubject(subjectName);

		for (let week = 1; week <= totalWeeks; week += duration) {
			const topicIndex = Math.floor(((week - 1) / totalWeeks) * baseTopics.length);
			const topic = baseTopics[topicIndex] || `${subjectName} Review`;

			const semester = week <= weeksPerSemester ? 1 : 2;
			const startWeekInSemester = semester === 1 ? week : week - weeksPerSemester;

			await db.insert(schema.courseMapItem).values({
				subjectOfferingId: offering.id,
				topic: topic,
				description: `${topic} activities and learning for ${subjectName}`,
				startWeek: startWeekInSemester,
				duration: duration,
				semester: semester,
				color: getSubjectColor(subjectName)
			});

			itemCount++;
		}
	}

	console.log(`  Created ${itemCount} course map items`);
}

function getBaseTopicsForSubject(subjectName: string): string[] {
	const topicMap: Record<string, string[]> = {
		Mathematics: [
			'Number and Algebra',
			'Measurement and Geometry',
			'Statistics and Probability',
			'Linear Equations',
			'Quadratic Functions',
			'Data Analysis'

		],
		English: [
			'Reading Comprehension',
			'Creative Writing',
			'Poetry Analysis',
			'Essay Writing',
			'Literature Study',
			'Media Literacy'
		],
		Science: [
			'Biology Fundamentals',
			'Chemistry Basics',
			'Physics Principles',
			'Scientific Method',
			'Environmental Science',
			'Human Body Systems'
		],
		'Physical Education': [
			'Fitness and Health',
			'Team Sports',
			'Individual Sports',
			'Motor Skills',
			'Sports Psychology',
			'Nutrition'
		],
		History: [
			'Ancient Civilizations',
			'Medieval Times',
			'Industrial Revolution',
			'World Wars',
			'Modern History',
			'Australian History'
		],
		Geography: [
			'Physical Geography',
			'Human Geography',
			'Climate and Weather',
			'Environmental Systems',
			'Urban Geography',
			'Global Issues'
		]
	};

	return (
		topicMap[subjectName] || [
			`${subjectName} Fundamentals`,
			`${subjectName} Practice`,
			`${subjectName} Assessment`
		]
	);
}

function getSubjectColor(subjectName: string): string {
	const colorMap: Record<string, string> = {
		Mathematics: '#3B82F6',
		English: '#8B5CF6',
		Science: '#10B981',
		'Physical Education': '#EF4444',
		History: '#F59E0B',
		Geography: '#06B6D4'
	};

	return colorMap[subjectName] || '#6B7280';
}

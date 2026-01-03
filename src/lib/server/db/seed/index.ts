import {
	newsPriorityEnum,
	newsStatusEnum,
	newsVisibilityEnum,
	relationshipTypeEnum,
	schoolSpaceTypeEnum,
	userGenderEnum,
	userHonorificEnum,
	userTypeEnum,
	VCAAF10SubjectEnum,
	VCAAVCESubjectEnum,
	yearLevelEnum
} from '$lib/enums.js';
import { getTermsByYear } from '$lib/server/vic-school-terms';
import { hash } from '@node-rs/argon2';
import { and, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { Resource } from 'sst';
import * as schema from '../schema';
import { ALL_CONSTRAINTS } from './data/constraints.js';

// VCAA curriculum tables that are restored from snapshot (not truncated during seeding)
const VCAA_TABLES = [
	'crclm', // curriculum
	'crclm_sub', // curriculumSubject
	'crclm_sub_la', // learningArea
	'lrn_a_cont', // learningAreaContent
	'lrn_a_std', // learningAreaStandard
	'lrn_a_std_elab', // standardElaboration
	'lrn_a_outcome', // learningAreaOutcome
	'outcome', // outcome
	'key_skill', // keySkill
	'key_knowledge', // keyKnowledge
	'exam_question', // examQuestion
	'lrn_activity', // learningActivity
	'assess_task', // assessmentTask
	'crclm_sub_cont' // curriculumSubjectExtraContent
];

const pool = new Pool({
	host: Resource.Database.host,
	port: Resource.Database.port,
	user: Resource.Database.username,
	password: Resource.Database.password,
	database: Resource.Database.database
});

export const db = drizzle(pool, { schema });

async function seed() {
	// Get all table names except VCAA curriculum tables (restored from snapshot prior to db seed with embeddings)
	const tables = await pool.query(`
		SELECT tablename 
		FROM pg_tables 
		WHERE schemaname = 'public'
		AND tablename NOT LIKE 'drizzle%'
	`);

	// Filter out VCAA tables that should be preserved from the snapshot
	const tablesToTruncate = tables.rows
		.map((row: { tablename: string }) => row.tablename)
		.filter((name: string) => !VCAA_TABLES.includes(name));

	// Truncate non-VCAA tables and reset sequences
	if (tablesToTruncate.length > 0) {
		const tableNames = tablesToTruncate.map((name: string) => `"${name}"`).join(', ');
		await pool.query(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE`);
	}

	// VCAA curriculum data is already seeded from snapshot restore
	// Just verify it exists
	const [existingCurriculum] = await db.select().from(schema.curriculum).limit(1);

	if (!existingCurriculum) {
		throw new Error(
			'VCAA curriculum data not found! Run `npm run db:restore -- snapshots/<snapshot>.sql.gz` first.'
		);
	}

	const [schoolRecord] = await db
		.insert(schema.school)
		.values({
			name: 'Demo School',
			countryCode: 'AU',
			stateCode: 'VIC'
		})
		.returning();

	// Create behaviour quick actions for the school
	await db
		.insert(schema.behaviourQuickAction)
		.values([
			{
				schoolId: schoolRecord.id,
				name: 'Out of uniform',
				description: 'Student not wearing correct school uniform'
			},
			{
				schoolId: schoolRecord.id,
				name: 'Distracting other students',
				description: 'Student disrupting the learning of others'
			},
			{
				schoolId: schoolRecord.id,
				name: 'Late to class',
				description: 'Student arrived late without valid reason'
			},
			{
				schoolId: schoolRecord.id,
				name: 'Excellent participation',
				description: 'Student showed outstanding engagement and contribution'
			},
			{
				schoolId: schoolRecord.id,
				name: 'Helping others',
				description: 'Student assisted classmates with their learning'
			},
			{
				schoolId: schoolRecord.id,
				name: 'Incomplete homework',
				description: 'Student did not complete assigned homework'
			},
			{
				schoolId: schoolRecord.id,
				name: 'Forgot materials',
				description: 'Student came to class without required materials or equipment'
			},
			{
				schoolId: schoolRecord.id,
				name: 'Outstanding effort',
				description: 'Student demonstrated exceptional effort and dedication'
			}
		])
		.returning();

	const [campusRecord] = await db
		.insert(schema.campus)
		.values({
			schoolId: schoolRecord.id,
			name: 'Main Campus',
			address: '123 Education Street, Melbourne VIC 3000',
			description: 'Primary campus of Demo School'
		})
		.returning();

	const [buildingMiddleSchool, buildingSeniorSchool, buildingGymnasium] = await db
		.insert(schema.schoolBuilding)
		.values([
			{
				campusId: campusRecord.id,
				name: 'Middle School Building',
				description: 'All year 7-9 classrooms.',
				isArchived: false
			},
			{
				campusId: campusRecord.id,
				name: 'Senior School Building',
				description: 'All year 10-12 classrooms.',
				isArchived: false
			},
			{
				campusId: campusRecord.id,
				name: 'Gymnasium',
				description: 'Gymnasium and sporting facilities.',
				isArchived: false
			}
		])
		.returning();

	const spaces = await db
		.insert(schema.schoolSpace)
		.values([
			// Middle School Building
			{
				buildingId: buildingMiddleSchool.id,
				name: 'Science Lab ML.01',
				type: schoolSpaceTypeEnum.laboratory,
				capacity: 30,
				isArchived: false
			},
			{
				buildingId: buildingMiddleSchool.id,
				name: 'Science Lab ML.02',
				type: schoolSpaceTypeEnum.laboratory,
				capacity: 30,
				isArchived: false
			},
			{
				buildingId: buildingMiddleSchool.id,
				name: 'Classroom MC.01',
				type: schoolSpaceTypeEnum.classroom,
				capacity: 30,
				isArchived: false
			},
			{
				buildingId: buildingMiddleSchool.id,
				name: 'Classroom MC.02',
				type: schoolSpaceTypeEnum.classroom,
				capacity: 30,
				isArchived: false
			},
			{
				buildingId: buildingMiddleSchool.id,
				name: 'Classroom MC.03',
				type: schoolSpaceTypeEnum.classroom,
				capacity: 30,
				isArchived: false
			},
			{
				buildingId: buildingMiddleSchool.id,
				name: 'Classroom MC.11',
				type: schoolSpaceTypeEnum.classroom,
				capacity: 30,
				isArchived: false
			},
			{
				buildingId: buildingMiddleSchool.id,
				name: 'Classroom MC.12',
				type: schoolSpaceTypeEnum.classroom,
				capacity: 30,
				isArchived: false
			},
			{
				buildingId: buildingMiddleSchool.id,
				name: 'Classroom MC.13',
				type: schoolSpaceTypeEnum.classroom,
				capacity: 30,
				isArchived: false
			},
			// Senior School Building
			{
				buildingId: buildingSeniorSchool.id,
				name: 'Science Lab SL.01',
				type: schoolSpaceTypeEnum.laboratory,
				capacity: 30,
				isArchived: false
			},
			{
				buildingId: buildingSeniorSchool.id,
				name: 'Science Lab SL.02',
				type: schoolSpaceTypeEnum.laboratory,
				capacity: 30,
				isArchived: false
			},
			{
				buildingId: buildingSeniorSchool.id,
				name: 'Classroom SC.01',
				type: schoolSpaceTypeEnum.classroom,
				capacity: 30,
				isArchived: false
			},
			{
				buildingId: buildingSeniorSchool.id,
				name: 'Classroom SC.02',
				type: schoolSpaceTypeEnum.classroom,
				capacity: 30,
				isArchived: false
			},
			{
				buildingId: buildingSeniorSchool.id,
				name: 'Classroom SC.03',
				type: schoolSpaceTypeEnum.classroom,
				capacity: 30,
				isArchived: false
			},
			{
				buildingId: buildingSeniorSchool.id,
				name: 'Classroom SC.11',
				type: schoolSpaceTypeEnum.classroom,
				capacity: 30,
				isArchived: false
			},
			{
				buildingId: buildingSeniorSchool.id,
				name: 'Classroom SC.12',
				type: schoolSpaceTypeEnum.classroom,
				capacity: 30,
				isArchived: false
			},
			{
				buildingId: buildingSeniorSchool.id,
				name: 'Classroom SC.13',
				type: schoolSpaceTypeEnum.classroom,
				capacity: 30,
				isArchived: false
			},
			// Gynasium
			{
				buildingId: buildingGymnasium.id,
				name: 'Courts',
				type: schoolSpaceTypeEnum.gymnasium,
				capacity: 120,
				isArchived: false
			},
			{
				buildingId: buildingGymnasium.id,
				name: 'Swimming Pool',
				type: schoolSpaceTypeEnum.pool,
				capacity: 40,
				isArchived: false
			}
		])
		.returning();

	const currentYear = new Date().getFullYear();
	const yearsToCreate = 5;

	for (let yearOffset = 0; yearOffset < yearsToCreate; yearOffset++) {
		const year = currentYear + yearOffset;
		const victorianTerms = getTermsByYear(year);

		const semester1Terms = victorianTerms?.filter((t) => t.termNumber === 1 || t.termNumber === 2);
		const semester2Terms = victorianTerms?.filter((t) => t.termNumber === 3 || t.termNumber === 4);

		if (semester1Terms) {
			const [semester1] = await db
				.insert(schema.schoolSemester)
				.values({
					schoolId: schoolRecord.id,
					semNumber: 1,
					schoolYear: year,
					isArchived: false
				})
				.returning();

			for (const term of semester1Terms) {
				await db.insert(schema.schoolTerm).values({
					schoolSemesterId: semester1.id,
					termNumber: term.termNumber,
					startDate: term.startDate,
					endDate: term.endDate,
					isArchived: false
				});
			}
		}

		if (semester2Terms) {
			const [semester2] = await db
				.insert(schema.schoolSemester)
				.values({
					schoolId: schoolRecord.id,
					schoolYear: year,
					semNumber: 2,
					isArchived: false
				})
				.returning();

			for (const term of semester2Terms) {
				await db.insert(schema.schoolTerm).values({
					schoolSemesterId: semester2.id,
					termNumber: term.termNumber,
					startDate: term.startDate,
					endDate: term.endDate,
					isArchived: false
				});
			}
		}
	}

	// Query for VC2 curriculum (Foundation-10) - created by seedVCAA()
	const [F10Curriculum] = await db
		.select()
		.from(schema.curriculum)
		.where(eq(schema.curriculum.version, 'VC2'))
		.limit(1);

	if (!F10Curriculum) {
		throw new Error('VC2 curriculum not found - seedVCAA must be run first');
	}

	// Query for VCE curriculum - created by seedVCAA()
	const [vceCurriculum] = await db
		.select()
		.from(schema.curriculum)
		.where(eq(schema.curriculum.version, '2025'))
		.limit(1);

	if (!vceCurriculum) {
		throw new Error('VCE curriculum not found - seedVCAA must be run first');
	}

	// Get all VC2 curriculum subjects
	const vc2CurriculumSubjects = await db
		.select()
		.from(schema.curriculumSubject)
		.where(eq(schema.curriculumSubject.curriculumId, F10Curriculum.id));

	// Get all VCE curriculum subjects
	const vceCurriculumSubjects = await db
		.select()
		.from(schema.curriculumSubject)
		.where(eq(schema.curriculumSubject.curriculumId, vceCurriculum.id));

	// Create core subjects for VC2 (Foundation-10) - one for each VCAAF10SubjectEnum
	const f10CoreSubjects: (typeof schema.coreSubject.$inferSelect)[] = [];
	for (const subjectEnum of Object.values(VCAAF10SubjectEnum)) {
		const subjectName = subjectEnum
			.split('_')
			.map((word, index) => {
				if (word.toLowerCase() === 'and' && index > 0) return 'and';
				return word.charAt(0).toUpperCase() + word.slice(1);
			})
			.join(' ');

		const curriculumSubject = vc2CurriculumSubjects.find((cs) => cs.name === subjectName);
		if (!curriculumSubject) {
			continue;
		}

		const [coreSubject] = await db
			.insert(schema.coreSubject)
			.values({
				name: subjectName,
				description: `Core ${subjectName}`,
				curriculumSubjectId: curriculumSubject.id,
				schoolId: schoolRecord.id
			})
			.returning();

		f10CoreSubjects.push(coreSubject);
	}

	// Create core subjects for VCE - one for each VCAAVCESubjectEnum
	const vceCoreSubjects: (typeof schema.coreSubject.$inferSelect)[] = [];
	for (const subjectEnum of Object.values(VCAAVCESubjectEnum)) {
		const subjectName = subjectEnum
			.split('_')
			.map((word, index) => {
				if (word.toLowerCase() === 'and' && index > 0) return 'and';
				return word.charAt(0).toUpperCase() + word.slice(1);
			})
			.join(' ');

		const curriculumSubject = vceCurriculumSubjects.find((cs) => cs.name === subjectName);
		if (!curriculumSubject) {
			continue;
		}

		const [coreSubject] = await db
			.insert(schema.coreSubject)
			.values({
				name: subjectName,
				description: `VCE ${subjectName}`,
				curriculumSubjectId: curriculumSubject.id,
				schoolId: schoolRecord.id
			})
			.returning();

		vceCoreSubjects.push(coreSubject);
	}

	// Create subjects for Foundation to Year 10 for each VC2 core subject
	const subjects: (typeof schema.subject.$inferSelect)[] = [];
	const f10YearLevels = [
		{ level: yearLevelEnum.foundation, name: 'Foundation' },
		{ level: yearLevelEnum.year1, name: 'Year 1' },
		{ level: yearLevelEnum.year2, name: 'Year 2' },
		{ level: yearLevelEnum.year3, name: 'Year 3' },
		{ level: yearLevelEnum.year4, name: 'Year 4' },
		{ level: yearLevelEnum.year5, name: 'Year 5' },
		{ level: yearLevelEnum.year6, name: 'Year 6' },
		{ level: yearLevelEnum.year7, name: 'Year 7' },
		{ level: yearLevelEnum.year8, name: 'Year 8' },
		{ level: yearLevelEnum.year9, name: 'Year 9' },
		{ level: yearLevelEnum.year10, name: 'Year 10' }
	];

	for (const coreSubject of f10CoreSubjects) {
		for (const yearLevel of f10YearLevels) {
			const subjectValues = {
				name: `${yearLevel.name} ${coreSubject.name}`,
				schoolId: schoolRecord.id,
				coreSubjectId: coreSubject.id,
				yearLevel: yearLevel.level
			};

			const [subject] = await db.insert(schema.subject).values(subjectValues).returning();
			subjects.push(subject);
		}
	}

	// Create VCE subjects for Units 1-2 (VCE12) and Units 3-4 (VCE34)
	const vceYearLevels = [
		{ level: yearLevelEnum.VCE12, name: 'VCE Units 1-2' },
		{ level: yearLevelEnum.VCE34, name: 'VCE Units 3-4' }
	];

	for (const coreSubject of vceCoreSubjects) {
		for (const yearLevel of vceYearLevels) {
			const subjectValues = {
				name: `${yearLevel.name} ${coreSubject.name}`,
				schoolId: schoolRecord.id,
				coreSubjectId: coreSubject.id,
				yearLevel: yearLevel.level
			};

			const [subject] = await db.insert(schema.subject).values(subjectValues).returning();
			subjects.push(subject);
		}
	}

	// Create subject offerings for all F-10 subjects
	const offeringsSem1 = subjects.map((subject) => ({
		subjectId: subject.id,
		year: 2025,
		semester: 1,
		campusId: campusRecord.id
	}));
	const offeringsSem2 = subjects.map((subject) => ({
		subjectId: subject.id,
		year: 2025,
		semester: 2,
		campusId: campusRecord.id
	}));

	const subjectOfferings = await db
		.insert(schema.subjectOffering)
		.values([...offeringsSem1, ...offeringsSem2])
		.returning();

	// Filter to get only Year 9 offerings for student/teacher assignments
	const year9Offerings = subjectOfferings.filter((offering) => {
		const subject = subjects.find((s) => s.id === offering.subjectId);
		return subject && subject.yearLevel === yearLevelEnum.year9;
	});

	// Combine all core subjects for course map generation
	const allCoreSubjects = [...f10CoreSubjects, ...vceCoreSubjects];

	// Create 36-week coursemap items for each subject offering (18 weeks per semester)
	const courseMapItems = [];
	const weeksPerSemester = 18;
	const totalWeeks = 36; // Full year

	for (const offering of subjectOfferings) {
		// Find the corresponding subject and core subject info
		const subject = subjects.find((s) => s.id === offering.subjectId);
		if (!subject) continue;

		const coreSubject = allCoreSubjects.find((cs) => cs.id === subject.coreSubjectId);
		if (!coreSubject) continue;

		// Use the core subject name (which is clean without "Year 9")
		const subjectName = coreSubject.name;
		const baseTopics = getBaseTopicsForSubject(subjectName);
		const duration = 6;

		// Distribute topics across 36 weeks (full year)
		for (let week = 1; week <= totalWeeks; week += duration) {
			const topicIndex = Math.floor(((week - 1) / totalWeeks) * baseTopics.length);
			const topic = baseTopics[topicIndex] || `${subjectName} Review`;

			// Determine which semester this week belongs to
			const semester = week <= weeksPerSemester ? 1 : 2;

			// Calculate the week within the semester (1-18 for each semester)
			const startWeekInSemester = semester === 1 ? week : week - weeksPerSemester;

			const [courseMapItem] = await db
				.insert(schema.courseMapItem)
				.values({
					subjectOfferingId: offering.id,
					topic: `${topic}`,
					description: `${topic} activities and learning for ${subjectName}`,
					startWeek: startWeekInSemester,
					duration: duration,
					semester: semester,
					color: getSubjectColor(subjectName)
				})
				.returning();

			courseMapItems.push(courseMapItem);
		}
	}

	// Helper function to get base topics for each subject
	function getBaseTopicsForSubject(subjectName: string): string[] {
		const topicMap: { [key: string]: string[] } = {
			Mathematics: [
				'Number and Algebra',
				'Measurement and Geometry',
				'Statistics and Probability',
				'Linear Equations',
				'Quadratic Functions',
				'Trigonometry',
				'Data Analysis'
			],
			English: [
				'Reading Comprehension',
				'Creative Writing',
				'Poetry Analysis',
				'Essay Writing',
				'Literature Study',
				'Media Literacy',
				'Oral Presentations',
				'Grammar and Language'
			],
			Science: [
				'Biology Fundamentals',
				'Chemistry Basics',
				'Physics Principles',
				'Scientific Method',
				'Environmental Science',
				'Human Body Systems',
				'Chemical Reactions',
				'Energy and Motion'
			],
			'Physical Education': [
				'Fitness and Health',
				'Team Sports',
				'Individual Sports',
				'Motor Skills',
				'Sports Psychology',
				'Nutrition',
				'Injury Prevention',
				'Game Strategy'
			],
			History: [
				'Ancient Civilizations',
				'Medieval Times',
				'Industrial Revolution',
				'World Wars',
				'Modern History',
				'Australian History',
				'Social Movements',
				'Historical Analysis'
			],
			Geography: [
				'Physical Geography',
				'Human Geography',
				'Climate and Weather',
				'Environmental Systems',
				'Urban Geography',
				'Global Issues',
				'Mapping and GIS',
				'Sustainability'
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

	// Helper function to get subject color (hex values)
	function getSubjectColor(subjectName: string): string {
		const colorMap: { [key: string]: string } = {
			Mathematics: '#3B82F6', // Blue
			English: '#8B5CF6', // Purple
			Science: '#10B981', // Green
			'Physical Education': '#EF4444', // Red
			History: '#F59E0B', // Amber/Orange
			Geography: '#06B6D4' // Cyan
		};

		return colorMap[subjectName] || '#6B7280'; // Default gray
	}

	// Helper to find Year 9 offering by subject keyword
	const findYear9Offering = (keyword: string) => {
		return year9Offerings.find((offering) => {
			const subject = subjects.find((s) => s.id === offering.subjectId);
			return subject && subject.name.includes(keyword);
		});
	};

	const mathOffering = findYear9Offering('Mathematics');
	const englishOffering = findYear9Offering('English');
	const scienceOffering = findYear9Offering('Science');
	const peOffering = findYear9Offering('Physical Education');
	const historyOffering = findYear9Offering('History');
	const geographyOffering = findYear9Offering('Geography');

	const subjectOfferingClasses = await db
		.insert(schema.subjectOfferingClass)
		.values([
			{
				name: 'A',
				subOfferingId: mathOffering!.id
			},
			{
				name: 'A',
				subOfferingId: englishOffering!.id
			},
			{
				name: 'A',
				subOfferingId: scienceOffering!.id
			},
			{
				name: 'A',
				subOfferingId: peOffering!.id
			},
			{
				name: 'A',
				subOfferingId: historyOffering!.id
			},
			{
				name: 'A',
				subOfferingId: geographyOffering!.id
			}
		])
		.returning();

	// Create users
	const passwordHash = await hash('password123');

	// School Admin
	const [schoolAdmin] = await db
		.insert(schema.user)
		.values({
			email: 'admin@demo.edu.au',
			passwordHash,
			schoolId: schoolRecord.id,
			type: userTypeEnum.schoolAdmin,
			yearLevel: yearLevelEnum.none,
			firstName: 'School',
			lastName: 'Admin',
			emailVerified: true
		})
		.returning();

	// Students
	const [student1, student2, student3, vceStudent] = await db
		.insert(schema.user)
		.values([
			{
				email: 'student001@demo.edu.au',
				passwordHash,
				schoolId: schoolRecord.id,
				type: userTypeEnum.student,
				gender: userGenderEnum.female,
				yearLevel: yearLevelEnum.year9,
				firstName: 'Student',
				lastName: 'One',
				dateOfBirth: new Date('2009-03-15'),
				emailVerified: true
			},
			{
				email: 'student002@demo.edu.au',
				passwordHash,
				schoolId: schoolRecord.id,
				type: userTypeEnum.student,
				gender: userGenderEnum.male,
				yearLevel: yearLevelEnum.year9,
				firstName: 'Student',
				lastName: 'Two',
				dateOfBirth: new Date('2009-07-22'),
				emailVerified: true
			},
			{
				email: 'student003@demo.edu.au',
				passwordHash,
				schoolId: schoolRecord.id,
				type: userTypeEnum.student,
				gender: userGenderEnum.male,
				yearLevel: yearLevelEnum.year9,
				firstName: 'Student',
				lastName: 'Three',
				dateOfBirth: new Date('2009-11-08'),
				emailVerified: true
			},
			{
				email: 'vcestudent@demo.edu.au',
				passwordHash,
				schoolId: schoolRecord.id,
				type: userTypeEnum.student,
				gender: userGenderEnum.female,
				yearLevel: yearLevelEnum.VCE,
				firstName: 'VCE',
				lastName: 'Student',
				dateOfBirth: new Date('2007-05-15'),
				emailVerified: true
			}
		])
		.returning();

	// Create parent users
	const [mother1, father1, mother2, father2, mother3, father3] = await db
		.insert(schema.user)
		.values([
			{
				email: 'mother001@demo.edu.au',
				passwordHash,
				schoolId: schoolRecord.id,
				type: userTypeEnum.guardian,
				gender: userGenderEnum.female,
				honorific: userHonorificEnum.mrs,
				yearLevel: yearLevelEnum.none,
				firstName: 'Mother',
				lastName: 'One',
				dateOfBirth: new Date('1985-05-12'),
				emailVerified: true
			},
			{
				email: 'father001@demo.edu.au',
				passwordHash,
				schoolId: schoolRecord.id,
				type: userTypeEnum.guardian,
				gender: userGenderEnum.male,
				honorific: userHonorificEnum.mr,
				yearLevel: yearLevelEnum.none,
				firstName: 'Father',
				lastName: 'One',
				dateOfBirth: new Date('1983-09-08'),
				emailVerified: true
			},
			{
				email: 'mother002@demo.edu.au',
				passwordHash,
				schoolId: schoolRecord.id,
				type: userTypeEnum.guardian,
				gender: userGenderEnum.female,
				honorific: userHonorificEnum.ms,
				yearLevel: yearLevelEnum.none,
				firstName: 'Mother',
				lastName: 'Two',
				dateOfBirth: new Date('1987-02-20'),
				emailVerified: true
			},
			{
				email: 'father002@demo.edu.au',
				passwordHash,
				schoolId: schoolRecord.id,
				type: userTypeEnum.guardian,
				gender: userGenderEnum.male,
				honorific: userHonorificEnum.mr,
				yearLevel: yearLevelEnum.none,
				firstName: 'Father',
				lastName: 'Two',
				dateOfBirth: new Date('1984-11-15'),
				emailVerified: true
			},
			{
				email: 'mother003@demo.edu.au',
				passwordHash,
				schoolId: schoolRecord.id,
				type: userTypeEnum.guardian,
				gender: userGenderEnum.female,
				honorific: userHonorificEnum.mrs,
				yearLevel: yearLevelEnum.none,
				firstName: 'Mother',
				lastName: 'Three',
				dateOfBirth: new Date('1986-08-03'),
				emailVerified: true
			},
			{
				email: 'father003@demo.edu.au',
				passwordHash,
				schoolId: schoolRecord.id,
				type: userTypeEnum.guardian,
				gender: userGenderEnum.male,
				honorific: userHonorificEnum.mr,
				yearLevel: yearLevelEnum.none,
				firstName: 'Father',
				lastName: 'Three',
				dateOfBirth: new Date('1985-12-18'),
				emailVerified: true
			}
		])
		.returning();

	const teachers = await db
		.insert(schema.user)
		.values([
			{
				firstName: 'Math',
				lastName: 'Teacher',
				email: 'm.teacher@demo.edu.au',
				passwordHash,
				schoolId: schoolRecord.id,
				type: userTypeEnum.teacher,
				gender: userGenderEnum.female,
				honorific: userHonorificEnum.ms,
				yearLevel: yearLevelEnum.none,
				dateOfBirth: new Date('1982-04-10'),
				emailVerified: true
			},
			{
				firstName: 'English',
				lastName: 'Teacher',
				email: 'e.teacher@demo.edu.au',
				passwordHash,
				schoolId: schoolRecord.id,
				type: userTypeEnum.teacher,
				gender: userGenderEnum.male,
				honorific: userHonorificEnum.mr,
				yearLevel: yearLevelEnum.none,
				dateOfBirth: new Date('1978-11-23'),
				emailVerified: true
			},
			{
				firstName: 'Science',
				lastName: 'Teacher',
				email: 's.teacher@demo.edu.au',
				passwordHash,
				schoolId: schoolRecord.id,
				type: userTypeEnum.teacher,
				gender: userGenderEnum.female,
				honorific: userHonorificEnum.dr,
				yearLevel: yearLevelEnum.none,
				dateOfBirth: new Date('1981-09-14'),
				emailVerified: true
			},
			{
				firstName: 'PE',
				lastName: 'Teacher',
				email: 'pe.teacher@demo.edu.au',
				passwordHash,
				schoolId: schoolRecord.id,
				type: userTypeEnum.teacher,
				gender: userGenderEnum.male,
				honorific: userHonorificEnum.mr,
				yearLevel: yearLevelEnum.none,
				dateOfBirth: new Date('1985-02-28'),
				emailVerified: true
			},
			{
				firstName: 'History',
				lastName: 'Teacher',
				email: 'h.teacher@demo.edu.au',
				passwordHash,
				schoolId: schoolRecord.id,
				type: userTypeEnum.teacher,
				gender: userGenderEnum.female,
				honorific: userHonorificEnum.mrs,
				yearLevel: yearLevelEnum.none,
				dateOfBirth: new Date('1979-07-05'),
				emailVerified: true
			},
			{
				firstName: 'Geography',
				lastName: 'Teacher',
				email: 'g.teacher@demo.edu.au',
				passwordHash,
				schoolId: schoolRecord.id,
				type: userTypeEnum.teacher,
				gender: userGenderEnum.male,
				honorific: userHonorificEnum.mr,
				yearLevel: yearLevelEnum.none,
				dateOfBirth: new Date('1983-12-12'),
				emailVerified: true
			}
		])
		.returning();

	const teacherIds: string[] = teachers.map((t) => t.id);

	// Add teacher specialisations - match teachers to their core subjects
	const teacherSpecialisations = [];

	// Math Teacher (index 0) - specialises in Mathematics subjects
	const mathSubjects = subjects.filter((s) => s.name.includes('Mathematics'));
	for (const subject of mathSubjects) {
		teacherSpecialisations.push({
			teacherId: teacherIds[0],
			subjectId: subject.id
		});
	}

	// English Teacher (index 1) - specialises in English subjects
	const englishSubjects = subjects.filter((s) => s.name.includes('English'));
	for (const subject of englishSubjects) {
		teacherSpecialisations.push({
			teacherId: teacherIds[1],
			subjectId: subject.id
		});
	}

	// Science Teacher (index 2) - specialises in Science subjects
	const scienceSubjects = subjects.filter((s) => s.name.includes('Science'));
	for (const subject of scienceSubjects) {
		teacherSpecialisations.push({
			teacherId: teacherIds[2],
			subjectId: subject.id
		});
	}

	// PE Teacher (index 3) - specialises in Physical Education subjects
	const peSubjects = subjects.filter((s) => s.name.includes('Physical Education'));
	for (const subject of peSubjects) {
		teacherSpecialisations.push({
			teacherId: teacherIds[3],
			subjectId: subject.id
		});
	}

	// History Teacher (index 4) - specialises in History subjects
	const historySubjects = subjects.filter((s) => s.name.includes('History'));
	for (const subject of historySubjects) {
		teacherSpecialisations.push({
			teacherId: teacherIds[4],
			subjectId: subject.id
		});
	}

	// Geography Teacher (index 5) - specialises in Geography subjects
	const geographySubjects = subjects.filter((s) => s.name.includes('Geography'));
	for (const subject of geographySubjects) {
		teacherSpecialisations.push({
			teacherId: teacherIds[5],
			subjectId: subject.id
		});
	}

	// Insert all teacher specialisations
	if (teacherSpecialisations.length > 0) {
		await db.insert(schema.userTeacherSpecialization).values(teacherSpecialisations);
	}

	// Assign users to campus
	const allUserIds = [
		schoolAdmin.id,
		student1.id,
		student2.id,
		student3.id,
		vceStudent.id,
		mother1.id,
		father1.id,
		mother2.id,
		father2.id,
		mother3.id,
		father3.id,
		...teacherIds
	];

	await db.insert(schema.userCampus).values(
		allUserIds.map((userId) => ({
			userId,
			campusId: campusRecord.id
		}))
	);

	// Create user relationships (parent-child relationships)
	await db.insert(schema.userRelationship).values([
		// Student 1's parents
		{
			userId: student1.id,
			relatedUserId: mother1.id,
			relationshipType: relationshipTypeEnum.mother
		},
		{
			userId: student1.id,
			relatedUserId: father1.id,
			relationshipType: relationshipTypeEnum.father
		},
		// Student 2's parents
		{
			userId: student2.id,
			relatedUserId: mother2.id,
			relationshipType: relationshipTypeEnum.mother
		},
		{
			userId: student2.id,
			relatedUserId: father2.id,
			relationshipType: relationshipTypeEnum.father
		},
		// Student 3's parents
		{
			userId: student3.id,
			relatedUserId: mother3.id,
			relationshipType: relationshipTypeEnum.mother
		},
		{
			userId: student3.id,
			relatedUserId: father3.id,
			relationshipType: relationshipTypeEnum.father
		}
	]);

	const studentIds = [student1.id, student2.id, student3.id];
	for (const studentId of studentIds) {
		for (let i = 0; i < year9Offerings.length; i++) {
			const subjectOffering = year9Offerings[i];

			const subjectColorHues = [
				210, // Mathematics - Blue (210 degrees)
				350, // English - Red (350 degrees - vibrant red)
				120, // Science - Green (120 degrees)
				270, // Physical Education - Purple (270 degrees)
				30, // History - Orange (30 degrees)
				180 // Geography - Cyan (180 degrees)
			];

			const colorHue = subjectColorHues[i] || 200; // Default to blue if index out of range

			// Students can change their subject colors
			await db.insert(schema.userSubjectOffering).values({
				userId: studentId,
				subOfferingId: subjectOffering.id,
				color: colorHue
			});
		}
	}

	// Assign teachers to Year 9 subject offerings based on their specialisation
	const teacherSubjectMap: { teacherIndex: number; subjectKeyword: string }[] = [
		{ teacherIndex: 0, subjectKeyword: 'Mathematics' },
		{ teacherIndex: 1, subjectKeyword: 'English' },
		{ teacherIndex: 2, subjectKeyword: 'Science' },
		{ teacherIndex: 3, subjectKeyword: 'Physical Education' },
		{ teacherIndex: 4, subjectKeyword: 'History' },
		{ teacherIndex: 5, subjectKeyword: 'Geography' }
	];

	for (const { teacherIndex, subjectKeyword } of teacherSubjectMap) {
		const matchingOffering = year9Offerings.find((offering) => {
			const subject = subjects.find((s) => s.id === offering.subjectId);
			return subject && subject.name.includes(subjectKeyword);
		});

		if (matchingOffering && teacherIds[teacherIndex]) {
			await db.insert(schema.userSubjectOffering).values({
				userId: teacherIds[teacherIndex],
				subOfferingId: matchingOffering.id
			});
		}
	}

	// Enroll students in subject offering classes
	for (const studentId of studentIds) {
		for (const subjectOfferingClass of subjectOfferingClasses) {
			await db.insert(schema.userSubjectOfferingClass).values({
				userId: studentId,
				subOffClassId: subjectOfferingClass.id
			});
		}
	}

	// Assign teachers to subject offering classes based on their specialisation
	const teacherClassMap: { teacherIndex: number; subjectKeyword: string }[] = [
		{ teacherIndex: 0, subjectKeyword: 'Mathematics' },
		{ teacherIndex: 1, subjectKeyword: 'English' },
		{ teacherIndex: 2, subjectKeyword: 'Science' },
		{ teacherIndex: 3, subjectKeyword: 'Physical Education' },
		{ teacherIndex: 4, subjectKeyword: 'History' },
		{ teacherIndex: 5, subjectKeyword: 'Geography' }
	];

	for (const { teacherIndex, subjectKeyword } of teacherClassMap) {
		const matchingClass = subjectOfferingClasses.find((soc) => {
			const offering = year9Offerings.find((o) => o.id === soc.subOfferingId);
			if (!offering) return false;
			const subject = subjects.find((s) => s.id === offering.subjectId);
			return subject && subject.name.includes(subjectKeyword);
		});

		if (matchingClass && teacherIds[teacherIndex]) {
			await db.insert(schema.userSubjectOfferingClass).values({
				userId: teacherIds[teacherIndex],
				subOffClassId: matchingClass.id
			});
		}
	}

	const [semester1] = await db
		.select()
		.from(schema.schoolSemester)
		.where(
			and(
				eq(schema.schoolSemester.schoolId, schoolRecord.id),
				eq(schema.schoolSemester.schoolYear, new Date().getFullYear()),
				eq(schema.schoolSemester.semNumber, 1)
			)
		)
		.limit(1);

	const [mockTimetable] = await db
		.insert(schema.timetable)
		.values({
			schoolId: schoolRecord.id,
			name: 'Main School Timetable 2025',
			schoolYear: 2025,
			schoolSemesterId: semester1.id,
			isArchived: false
		})
		.returning();

	const [mockTimetableDraft] = await db
		.insert(schema.timetableDraft)
		.values({
			timetableId: mockTimetable.id,
			name: 'Draft for Main School Timetable 2025'
		})
		.returning();

	// Create timetable days (Monday to Friday)
	await db
		.insert(schema.timetableDay)
		.values([
			{ timetableDraftId: mockTimetableDraft.id, day: 1 }, // Monday
			{ timetableDraftId: mockTimetableDraft.id, day: 2 }, // Tuesday
			{ timetableDraftId: mockTimetableDraft.id, day: 3 }, // Wednesday
			{ timetableDraftId: mockTimetableDraft.id, day: 4 }, // Thursday
			{ timetableDraftId: mockTimetableDraft.id, day: 5 } // Friday
		])
		.returning();

	// Create timetable periods (6 periods from 9:00 to 15:30)
	const periods = await db
		.insert(schema.timetablePeriod)
		.values([
			{
				timetableDraftId: mockTimetableDraft.id,
				startTime: '09:00',
				endTime: '09:50'
			},
			{
				timetableDraftId: mockTimetableDraft.id,
				startTime: '09:50',
				endTime: '10:40'
			},
			{
				timetableDraftId: mockTimetableDraft.id,
				startTime: '11:00',
				endTime: '11:50'
			}, // 20 min break after period 2
			{
				timetableDraftId: mockTimetableDraft.id,
				startTime: '11:50',
				endTime: '12:40'
			},
			{
				timetableDraftId: mockTimetableDraft.id,
				startTime: '13:40',
				endTime: '14:30'
			}, // 1 hour lunch break after period 4
			{ timetableDraftId: mockTimetableDraft.id, startTime: '14:30', endTime: '15:20' }
		])
		.returning();

	// Update the nextPeriodId chain for all periods
	for (let i = 0; i < periods.length; i++) {
		const currentPeriod = periods[i];
		const nextPeriod = periods[i + 1];

		await db
			.update(schema.timetablePeriod)
			.set({
				nextPeriodId: nextPeriod ? nextPeriod.id : null
			})
			.where(eq(schema.timetablePeriod.id, currentPeriod.id));
	}

	// Create timetable groups for Year 9 students - one group per subject (like auto-create groups button)
	// Limit to 6 offerings to match the 6 teachers we created
	const timetableGroups = [];
	const limitedYear9Offerings = year9Offerings.slice(0, 6);
	for (let i = 0; i < limitedYear9Offerings.length; i++) {
		const offering = limitedYear9Offerings[i];
		// Get the subject to determine the name
		const subject = subjects.find((s) => s.id === offering.subjectId);
		const subjectName = subject ? subject.name.replace('Year 9 ', '') : `Subject ${i + 1}`;

		const [group] = await db
			.insert(schema.timetableGroup)
			.values({
				timetableDraftId: mockTimetableDraft.id,
				yearLevel: yearLevelEnum.year9,
				name: `Year 9 ${subjectName}`
			})
			.returning();

		timetableGroups.push(group);
	}

	// Assign all 3 students to all groups
	const studentGroupAssignments = [];
	const allStudentIds = [student1.id, student2.id, student3.id];
	for (const group of timetableGroups) {
		for (const studentId of allStudentIds) {
			studentGroupAssignments.push({
				userId: studentId,
				groupId: group.id
			});
		}
	}
	await db.insert(schema.timetableGroupMember).values(studentGroupAssignments);

	// Create 2 activities for each group with variety of locations and assignments
	for (let groupIndex = 0; groupIndex < timetableGroups.length; groupIndex++) {
		const group = timetableGroups[groupIndex];
		const offering = limitedYear9Offerings[groupIndex];
		const teacherId = teacherIds[groupIndex];

		// Activity 1: Group-based activity with preferred rooms
		const [activity1] = await db
			.insert(schema.timetableActivity)
			.values({
				timetableDraftId: mockTimetableDraft.id,
				subjectOfferingId: offering.id,
				periodsPerInstance: 1,
				totalPeriods: 3 // 3 periods per week
			})
			.returning();

		// Assign teacher to activity 1
		await db.insert(schema.timetableActivityTeacherPreference).values({
			timetableActivityId: activity1.id,
			teacherId: teacherId
		});

		// Assign group to activity 1
		await db.insert(schema.timetableActivityAssignedGroup).values({
			timetableActivityId: activity1.id,
			timetableGroupId: group.id
		});

		// Assign preferred rooms (rotate through available spaces)
		const spaceIndex = groupIndex % spaces.length;
		await db.insert(schema.timetableActivityPreferredSpace).values({
			timetableActivityId: activity1.id,
			schoolSpaceId: spaces[spaceIndex].id
		});

		// Activity 2: Mix of group and individual student assignments with different rooms
		const [activity2] = await db
			.insert(schema.timetableActivity)
			.values({
				timetableDraftId: mockTimetableDraft.id,
				subjectOfferingId: offering.id,
				periodsPerInstance: 2, // Double period
				totalPeriods: 4 // 2 instances of 2 periods each per week
			})
			.returning();

		// Assign teacher to activity 2
		await db.insert(schema.timetableActivityTeacherPreference).values({
			timetableActivityId: activity2.id,
			teacherId: teacherId
		});

		// For some activities, assign to group; for others, assign to individual students or year level
		if (groupIndex % 3 === 0) {
			// Assign to year level
			await db.insert(schema.timetableActivityAssignedYear).values({
				timetableActivityId: activity2.id,
				yearlevel: yearLevelEnum.year9
			});
		} else if (groupIndex % 3 === 1) {
			// Assign to group
			await db.insert(schema.timetableActivityAssignedGroup).values({
				timetableActivityId: activity2.id,
				timetableGroupId: group.id
			});
		} else {
			// Assign to individual students
			for (const studentId of allStudentIds) {
				await db.insert(schema.timetableActivityAssignedStudent).values({
					timetableActivityId: activity2.id,
					userId: studentId
				});
			}
		}

		// Assign different preferred rooms (use next 2 spaces in rotation)
		const space1Index = (groupIndex + 1) % spaces.length;
		const space2Index = (groupIndex + 2) % spaces.length;
		await db.insert(schema.timetableActivityPreferredSpace).values([
			{
				timetableActivityId: activity2.id,
				schoolSpaceId: spaces[space1Index].id
			},
			{
				timetableActivityId: activity2.id,
				schoolSpaceId: spaces[space2Index].id
			}
		]);
	}

	// Convert constraint definitions to database format
	const constraintsToSeed = ALL_CONSTRAINTS.map((constraint) => ({
		FETName: constraint.FETName,
		friendlyName: constraint.friendlyName,
		description: constraint.description,
		type: constraint.type,
		optional: constraint.optional ?? true,
		repeatable: constraint.repeatable ?? true
	}));

	const allConstraints = await db.insert(schema.constraint).values(constraintsToSeed).returning();

	// Only add the mandatory constraints to the mock timetable
	const mandatoryConstraints = allConstraints.filter(
		(c) =>
			c.FETName === 'ConstraintBasicCompulsoryTime' ||
			c.FETName === 'ConstraintBasicCompulsorySpace'
	);

	for (const con of mandatoryConstraints) {
		await db.insert(schema.timetableDraftConstraint).values({
			timetableDraftId: mockTimetableDraft.id,
			constraintId: con.id,
			active: true,
			parameters: {
				Active: true,
				Comments: 'This is a mandatory constraint added by the seeding script.',
				Weight_Percentage: 100
			}
		});
	}

	// Calculate the most recent Monday
	const today = new Date();
	const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
	const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If Sunday, go back 6 days; otherwise go back to Monday
	const mostRecentMonday = new Date(today);
	mostRecentMonday.setDate(today.getDate() - daysToSubtract);
	mostRecentMonday.setHours(0, 0, 0, 0); // Set to start of day

	const baseDate = mostRecentMonday;

	// Helper function to create a Date object for a specific day
	const createDate = (weekOffset: number, dayOffset: number) => {
		const date = new Date(baseDate);
		date.setDate(baseDate.getDate() + weekOffset * 7 + dayOffset);
		return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
	};

	// Helper function to create a time string
	const createTime = (hour: number, minute: number = 0) => {
		return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
	};

	// Create timetable for multiple weeks with varying patterns
	const timetableEntries = [];

	// Define different weekly patterns to add variety
	const weeklyPatterns = [
		// Week 1 Pattern - Standard Schedule
		[
			// MONDAY - Math, English, Science, PE, History, Geography
			[0, 1, 2, 3, 4, 5], // [Math, English, Science, PE, History, Geography]
			// TUESDAY - English, Science, Math, History, PE, Geography
			[1, 2, 0, 4, 3, 5],
			// WEDNESDAY - Science, Math, English, Geography, History, PE
			[2, 0, 1, 5, 4, 3],
			// THURSDAY - PE, History, Geography, English, Science, Math
			[3, 4, 5, 1, 2, 0],
			// FRIDAY - Geography, PE, History, Math, English, Science
			[5, 3, 4, 0, 1, 2]
		],
		// Week 2 Pattern - Math Heavy Start
		[
			// MONDAY - Math, Math, English, Science, PE, History
			[0, 0, 1, 2, 3, 4],
			// TUESDAY - Science, English, Geography, Math, PE, History
			[2, 1, 5, 0, 3, 4],
			// WEDNESDAY - PE, Science, Math, English, History, Geography
			[3, 2, 0, 1, 4, 5],
			// THURSDAY - History, Geography, PE, Science, Math, English
			[4, 5, 3, 2, 0, 1],
			// FRIDAY - English, Math, History, Geography, Science, PE
			[1, 0, 4, 5, 2, 3]
		],
		// Week 3 Pattern - Science Focus
		[
			// MONDAY - Science, Science, Math, English, PE, Geography
			[2, 2, 0, 1, 3, 5],
			// TUESDAY - Math, English, PE, Science, History, Geography
			[0, 1, 3, 2, 4, 5],
			// WEDNESDAY - English, PE, Science, Math, Geography, History
			[1, 3, 2, 0, 5, 4],
			// THURSDAY - Geography, Math, English, PE, Science, History
			[5, 0, 1, 3, 2, 4],
			// FRIDAY - PE, History, Geography, Science, English, Math
			[3, 4, 5, 2, 1, 0]
		],
		// Week 4 Pattern - Balanced Mix
		[
			// MONDAY - English, PE, Math, Science, Geography, History
			[1, 3, 0, 2, 5, 4],
			// TUESDAY - Geography, Math, Science, English, History, PE
			[5, 0, 2, 1, 4, 3],
			// WEDNESDAY - History, English, PE, Geography, Math, Science
			[4, 1, 3, 5, 0, 2],
			// THURSDAY - Math, Science, Geography, History, English, PE
			[0, 2, 5, 4, 1, 3],
			// FRIDAY - Science, History, English, PE, Math, Geography
			[2, 4, 1, 3, 0, 5]
		]
	];

	// Create 4 weeks of timetable data with different patterns
	for (let week = 0; week < 4; week++) {
		const pattern = weeklyPatterns[week];

		// Create entries for each day of the week
		for (let day = 0; day < 5; day++) {
			// Monday to Friday
			const dayPattern = pattern[day];

			// Create 6 classes per day with the specified pattern
			for (let period = 0; period < 6; period++) {
				const subjectIndex = dayPattern[period];
				let hour: number, minute: number;

				// Define time slots for each period
				switch (period) {
					case 0:
						hour = 8;
						minute = 0;
						break; // 8:00-9:00 AM
					case 1:
						hour = 9;
						minute = 0;
						break; // 9:00-10:00 AM
					case 2:
						hour = 10;
						minute = 30;
						break; // 10:30-11:30 AM (after break)
					case 3:
						hour = 11;
						minute = 30;
						break; // 11:30 AM-12:30 PM
					case 4:
						hour = 13;
						minute = 30;
						break; // 1:30-2:30 PM (after lunch)
					case 5:
						hour = 14;
						minute = 30;
						break; // 2:30-3:30 PM
					default:
						hour = 8;
						minute = 0;
						break; // fallback
				}

				const timetableEntry = {
					subjectOfferingClassId: subjectOfferingClasses[subjectIndex].id,
					schoolSpaceId: spaces[subjectIndex].id, // Use appropriate space for subject
					date: createDate(week, day),
					startTime: createTime(hour, minute),
					endTime: createTime(hour + 1, minute) // 1 hour duration
				};

				timetableEntries.push(timetableEntry);
			}
		}
	}

	await db.insert(schema.subjectClassAllocation).values(timetableEntries);

	// Create news categories
	const newsCategories = await db
		.insert(schema.newsCategory)
		.values([
			{
				name: 'School Announcements',
				description: 'General school announcements and updates',
				color: '#3B82F6', // Blue
				isArchived: false
			},
			{
				name: 'Academic News',
				description: 'Academic achievements and educational updates',
				color: '#10B981', // Green
				isArchived: false
			},
			{
				name: 'Sports & Activities',
				description: 'Sports events, extracurricular activities, and student achievements',
				color: '#F59E0B', // Orange
				isArchived: false
			},
			{
				name: 'Community Events',
				description: 'Community involvement and special events',
				color: '#8B5CF6', // Purple
				isArchived: false
			}
		])
		.returning();

	// Create news articles
	await db
		.insert(schema.news)
		.values([
			{
				title: 'Welcome Back to School Year 2025',
				excerpt: `We are excited to welcome all students, teachers, and families back for another fantastic year at ${schoolRecord.name}.`,
				content: {
					blocks: [
						{
							type: 'paragraph',
							content: `Dear ${schoolRecord.name} Community,`
						},
						{
							type: 'paragraph',
							content: `We are thrilled to welcome everyone back to ${schoolRecord.name} for the 2025 academic year! After a wonderful summer break, our campus is buzzing with excitement as students return to their classrooms and teachers prepare for another year of inspiring education.`
						},
						{
							type: 'paragraph',
							content:
								'This year, we have some exciting new initiatives planned, including enhanced STEM programs, updated library resources, and improved playground facilities. Our dedicated teaching staff has been working hard during the break to prepare engaging lessons and activities for all year levels.'
						},
						{
							type: 'paragraph',
							content: 'Important reminders for the start of term:'
						},
						{
							type: 'list',
							items: [
								'School starts at 8:00 AM sharp',
								'Please ensure students bring their water bottles daily',
								'Uniform requirements are strictly enforced',
								'Parent-teacher meetings will be scheduled in Week 3'
							]
						},
						{
							type: 'paragraph',
							content:
								"We look forward to working together to make 2025 a successful and memorable year for all our students. If you have any questions or concerns, please don't hesitate to contact the school office."
						},
						{
							type: 'paragraph',
							content: 'Warm regards,<br>School Administration Team'
						}
					]
				},
				schoolId: schoolRecord.id,
				campusId: campusRecord.id,
				categoryId: newsCategories[0].id, // School Announcements
				authorId: schoolAdmin.id,
				status: newsStatusEnum.published,
				priority: newsPriorityEnum.high,
				visibility: newsVisibilityEnum.public,
				publishedAt: new Date(),
				isPinned: true,
				viewCount: 0,
				isArchived: false
			},
			{
				title: 'Year 9 Science Fair Competition Results',
				excerpt:
					"Congratulations to all Year 9 students who participated in our annual Science Fair. Outstanding projects showcased creativity and scientific thinking across multiple disciplines including biology, chemistry, physics, and environmental science. This year's event featured over 150 student projects, representing months of dedicated research, experimentation, and analysis. Students demonstrated exceptional problem-solving skills while investigating real-world issues ranging from sustainable energy solutions to innovative medical devices. The judges were particularly impressed by the depth of research and the practical applications many students proposed. Notable winners include Sarah Chen's groundbreaking water purification system using locally sourced materials, Marcus Thompson's renewable energy storage prototype, and the collaborative team effort by Emma Rodriguez and James Park on biodegradable plastic alternatives. These projects not only demonstrate academic excellence but also show our students' commitment to addressing global challenges through scientific innovation. The Science Fair continues to be a highlight of our academic calendar, fostering critical thinking, creativity, and scientific literacy among our students.",
				content: {
					blocks: [
						{
							type: 'paragraph',
							content:
								'We are proud to announce the results of our annual Year 9 Science Fair, which took place last Friday in the school gymnasium.'
						},
						{
							type: 'paragraph',
							content:
								'This year\'s theme was "Sustainability and Innovation," and our students rose to the challenge with incredible projects that demonstrated both scientific rigor and creative problem-solving. From renewable energy solutions to biodegradable materials research, the quality of work was exceptional.'
						},
						{
							type: 'heading',
							level: 3,
							content: 'Prize Winners:'
						},
						{
							type: 'list',
							items: [
								'1st Place: "Solar-Powered Water Filtration System" by Student One',
								'2nd Place: "Biodegradable Plastic from Orange Peels" by Student Two',
								'3rd Place: "Wind Energy Generation Model" by Student Three',
								'People\'s Choice Award: "Sustainable Garden Ecosystem" by various students'
							]
						},
						{
							type: 'paragraph',
							content:
								'All participants should be proud of their efforts. The projects will be on display in the Science Lab A for the next two weeks, and we encourage all students and families to visit and see the amazing work our Year 9 students have accomplished.'
						},
						{
							type: 'paragraph',
							content:
								'Special thanks to our Science teachers for their guidance and support, and to the parent volunteers who helped make this event possible.'
						},
						{
							type: 'paragraph',
							content:
								"Next year's Science Fair is already in planning, so start thinking about your projects early!"
						}
					]
				},
				schoolId: schoolRecord.id,
				campusId: campusRecord.id,
				categoryId: newsCategories[1].id, // Academic News
				authorId: teacherIds[2], // Science Teacher
				status: newsStatusEnum.published,
				priority: newsPriorityEnum.normal,
				visibility: newsVisibilityEnum.public,
				publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
				isPinned: false,
				viewCount: 15,
				isArchived: false
			},
			{
				title: 'Basketball Team Wins Regional Championship',
				excerpt:
					'Our senior basketball team has achieved an incredible victory at the Regional Championships, defeating Central High School 78-65 in a thrilling final match.',
				content: {
					blocks: [
						{
							type: 'paragraph',
							content: `What an amazing weekend for ${schoolRecord.name} Basketball! Our senior team has brought home the Regional Championship trophy after an outstanding tournament performance.`
						},
						{
							type: 'paragraph',
							content:
								'The team showed exceptional teamwork, determination, and sportsmanship throughout the three-day tournament. Captain Sarah Williams led the team with outstanding leadership both on and off the court.'
						},
						{
							type: 'heading',
							level: 3,
							content: 'Tournament Results:'
						},
						{
							type: 'list',
							items: [
								'Quarter-final: def. Westside Academy 65-58',
								'Semi-final: def. Northshore College 71-62',
								'Final: def. Central High School 78-65'
							]
						},
						{
							type: 'paragraph',
							content:
								'Special mentions go to MVP player Jake Thompson for his consistent scoring, and to Emma Davis for her outstanding defensive plays that secured our victory in the final.'
						},
						{
							type: 'paragraph',
							content:
								'The team will now advance to the State Championships next month. We encourage all students and families to come out and support our champions!'
						},
						{
							type: 'paragraph',
							content:
								'Congratulations to Coach Martinez and the entire basketball program for this fantastic achievement.'
						}
					]
				},
				schoolId: schoolRecord.id,
				campusId: campusRecord.id,
				categoryId: newsCategories[2].id, // Sports & Activities
				authorId: teacherIds[4], // PE Teacher
				status: newsStatusEnum.published,
				priority: newsPriorityEnum.high,
				visibility: newsVisibilityEnum.public,
				publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
				isPinned: true,
				viewCount: 42,
				isArchived: false
			},
			{
				title: 'Library Renovation Project Update',
				excerpt:
					'The much-anticipated library renovation is progressing well, with new study spaces, technology upgrades, and improved accessibility features set to be completed by the end of March.',
				content: {
					blocks: [
						{
							type: 'paragraph',
							content:
								'We are excited to provide an update on our library renovation project, which has been progressing smoothly since construction began in January.'
						},
						{
							type: 'paragraph',
							content:
								'The renovation includes modern study pods, updated computer stations, improved lighting, and enhanced accessibility features to serve all members of our school community better.'
						},
						{
							type: 'heading',
							level: 3,
							content: "What's New:"
						},
						{
							type: 'list',
							items: [
								'20 new individual study pods with power outlets',
								'Collaborative learning spaces for group projects',
								'Updated computer lab with 30 new stations',
								'Accessible ramps and wider doorways',
								'Quiet reading nooks with comfortable seating',
								'Expanded non-fiction and digital resource sections'
							]
						},
						{
							type: 'paragraph',
							content:
								'During the renovation period, library services are available in the temporary location in Building C. Students can still access online resources and request book loans through the school portal.'
						},
						{
							type: 'paragraph',
							content:
								'We expect the renovation to be completed by late March, with a grand reopening celebration planned for early April. Thank you for your patience during this exciting upgrade!'
						}
					]
				},
				schoolId: schoolRecord.id,
				campusId: campusRecord.id,
				categoryId: newsCategories[0].id, // School Announcements
				authorId: schoolAdmin.id,
				status: newsStatusEnum.published,
				priority: newsPriorityEnum.normal,
				visibility: newsVisibilityEnum.public,
				publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
				isPinned: false,
				viewCount: 28,
				isArchived: false
			},
			{
				title: "Drama Club Presents: A Midsummer Night's Dream",
				excerpt:
					"Join us for our spring theatrical production featuring talented students from Years 8-12 in Shakespeare's beloved comedy, running March 15-17 in the school auditorium.",
				content: {
					blocks: [
						{
							type: 'paragraph',
							content: `The ${schoolRecord.name} Drama Club is thrilled to announce our spring production of William Shakespeare's "A Midsummer Night's Dream"!`
						},
						{
							type: 'paragraph',
							content:
								'This enchanting comedy brings together a talented cast of students from Years 8-12, who have been rehearsing since January to bring this magical story to life. The production features beautiful costumes, creative set design, and outstanding performances that promise to captivate audiences of all ages.'
						},
						{
							type: 'heading',
							level: 3,
							content: 'Show Details:'
						},
						{
							type: 'list',
							items: [
								'Dates: March 15, 16, and 17',
								'Time: 7:00 PM (doors open at 6:30 PM)',
								'Location: School Auditorium',
								'Tickets: $12 adults, $8 students/seniors',
								'Duration: Approximately 2 hours with one intermission'
							]
						},
						{
							type: 'paragraph',
							content:
								'Tickets are available at the school office or online through our website. We encourage families to book early as previous productions have sold out quickly.'
						},
						{
							type: 'paragraph',
							content:
								'Special thanks to Ms. Johnson and the Drama Club for their incredible dedication, and to our parent volunteers who have helped with costumes, set construction, and promotion.'
						},
						{
							type: 'paragraph',
							content:
								'Come and support our talented students in what promises to be a magical theatrical experience!'
						}
					]
				},
				schoolId: schoolRecord.id,
				campusId: campusRecord.id,
				categoryId: newsCategories[2].id, // Sports & Activities
				authorId: teacherIds[5], // English Teacher (assuming Drama teacher)
				status: newsStatusEnum.published,
				priority: newsPriorityEnum.normal,
				visibility: newsVisibilityEnum.public,
				publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
				isPinned: false,
				viewCount: 35,
				isArchived: false
			},
			{
				title: 'Community Garden Project Launch',
				excerpt:
					'Students, parents, and teachers are invited to participate in our new community garden project, promoting sustainability education and healthy eating habits.',
				content: {
					blocks: [
						{
							type: 'paragraph',
							content: `We are excited to announce the launch of the ${schoolRecord.name} Community Garden Project, a collaborative initiative that brings together students, families, and staff to create a sustainable learning environment.`
						},
						{
							type: 'paragraph',
							content:
								'The garden will serve as an outdoor classroom where students can learn about plant biology, environmental science, nutrition, and sustainable farming practices. It will also provide fresh produce for our school canteen and local food bank donations.'
						},
						{
							type: 'heading',
							level: 3,
							content: 'How to Get Involved:'
						},
						{
							type: 'list',
							items: [
								'Volunteer for weekend planting sessions',
								'Donate seeds, tools, or materials',
								'Join the Garden Committee as a parent representative',
								'Participate in harvest festivals and educational workshops'
							]
						},
						{
							type: 'paragraph',
							content:
								'Our first community planting day is scheduled for Saturday, March 10th from 9:00 AM to 2:00 PM. We welcome volunteers of all ages and gardening experience levels.'
						},
						{
							type: 'paragraph',
							content:
								"The project is supported by the local council's sustainability grant and has been designed with input from environmental science students and the school's eco-committee."
						},
						{
							type: 'paragraph',
							content:
								'For more information or to volunteer, please contact the school office or email gardens@schoolofdemo.edu.au.au'
						}
					]
				},
				schoolId: schoolRecord.id,
				campusId: campusRecord.id,
				categoryId: newsCategories[3].id, // Community Events
				authorId: teacherIds[2], // Science Teacher
				status: newsStatusEnum.published,
				priority: newsPriorityEnum.normal,
				visibility: newsVisibilityEnum.public,
				publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
				isPinned: false,
				viewCount: 22,
				isArchived: false
			},
			{
				title: 'Parent-Teacher Conference Scheduling Now Open',
				excerpt:
					'Online booking for Term 1 parent-teacher conferences is now available. Conferences will be held during Week 8, with both in-person and virtual options available.',
				content: {
					blocks: [
						{
							type: 'paragraph',
							content:
								'We are pleased to announce that online booking for Term 1 parent-teacher conferences is now open through our school portal.'
						},
						{
							type: 'paragraph',
							content:
								"These conferences provide valuable opportunities for parents and teachers to discuss student progress, address any concerns, and collaborate on strategies to support each student's learning journey."
						},
						{
							type: 'heading',
							level: 3,
							content: 'Conference Details:'
						},
						{
							type: 'list',
							items: [
								'Dates: March 19-21 (Week 8)',
								'Times: 3:30 PM - 7:00 PM each day',
								'Duration: 15 minutes per appointment',
								'Options: In-person or video conference',
								'Booking deadline: March 15th'
							]
						},
						{
							type: 'paragraph',
							content:
								'To book your appointments, log in to the school portal using your parent access credentials. You can select your preferred teachers, times, and meeting format (in-person or online).'
						},
						{
							type: 'paragraph',
							content:
								"We encourage all parents to take advantage of this opportunity to connect with their child's teachers. If you need assistance with booking or have technical difficulties, please contact the school office."
						},
						{
							type: 'paragraph',
							content:
								'Student reports will be available through the portal one week prior to conferences to help guide your discussions.'
						}
					]
				},
				schoolId: schoolRecord.id,
				campusId: campusRecord.id,
				categoryId: newsCategories[0].id, // School Announcements
				authorId: schoolAdmin.id,
				status: newsStatusEnum.published,
				priority: newsPriorityEnum.high,
				visibility: newsVisibilityEnum.public,
				publishedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
				isPinned: false,
				viewCount: 67,
				isArchived: false
			}
		])
		.returning();
}

seed()
	.then(() => {
		process.exit(0);
	})
	.catch((error) => {
		console.error('Seeding failed:', error);
		process.exit(1);
	});

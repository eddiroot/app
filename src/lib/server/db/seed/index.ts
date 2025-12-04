import {
	newsPriorityEnum,
	newsStatusEnum,
	newsVisibilityEnum,
	relationshipTypeEnum,
	schoolSpaceTypeEnum,
	userGenderEnum,
	userHonorificEnum,
	userTypeEnum,
	yearLevelEnum
} from '$lib/enums.js';
import { getTermsByYear } from '$lib/server/vic-school-terms';
import { hash } from '@node-rs/argon2';
import { and, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { reset } from 'drizzle-seed';
import { readFileSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import { Pool } from 'pg';
import { Resource } from 'sst';
import { fileURLToPath } from 'url';
import * as schema from '../schema';
import type {
	KeyKnowledgeData,
	KeySkillData,
	LearningAreaData,
	OutcomeData,
	VCAACurriculumData,
	VCAAData
} from './data/types.js';

// Map JSON filenames to proper subject names
const subjectNameMap: Record<string, string> = {
	accounting12: 'Accounting',
	accounting34: 'Accounting',
	biology12: 'Biology',
	biology34: 'Biology',
	busman12: 'Business Management',
	busman34: 'Business Management',
	chemistry12: 'Chemistry',
	chemistry34: 'Chemistry',
	economics12: 'Economics',
	economics34: 'Economics',
	english12: 'English',
	english34: 'English',
	general12: 'General Mathematics',
	general34: 'General Mathematics',
	health12: 'Health and Human Development',
	health34: 'Health and Human Development',
	legal12: 'Legal Studies',
	legal34: 'Legal Studies',
	literature12: 'Literature',
	literature34: 'Literature',
	methods12: 'Mathematical Methods',
	methods34: 'Mathematical Methods',
	pe12: 'Physical Education',
	pe34: 'Physical Education',
	physics12: 'Physics',
	physics34: 'Physics',
	psychology12: 'Psychology',
	psychology34: 'Psychology',
	spec12: 'Specialist Mathematics',
	spec34: 'Specialist Mathematics'
};

const pool = new Pool({
	host: Resource.Database.host,
	port: Resource.Database.port,
	user: Resource.Database.username,
	password: Resource.Database.password,
	database: Resource.Database.database
});

export const db = drizzle(pool, { schema });

// VCE Helper Functions
function extractTopicName(
	item: KeySkillData | KeyKnowledgeData,
	outcomeTopics?: Array<{ id?: number; name: string; outcomeTopic?: string }>
): string | null {
	// Priority order: outcomeTopic > name > topicName
	if (item.outcomeTopic) return item.outcomeTopic;
	if (item.name) return item.name;
	if (item.topicName) return item.topicName;

	// Handle outcomeTopicId by looking up the actual topic name
	if (item.outcomeTopicId !== undefined && outcomeTopics && outcomeTopics.length > 0) {
		const matchingTopic = outcomeTopics.find((topic) => topic.id === item.outcomeTopicId);
		if (matchingTopic) {
			return matchingTopic.name;
		}
		// Fallback to generic topic name if not found
		return `Topic ${item.outcomeTopicId}`;
	}

	// If we have outcome topics, try to match
	if (outcomeTopics && outcomeTopics.length > 0) {
		return outcomeTopics[0].outcomeTopic || outcomeTopics[0].name;
	}

	return null;
}

function parseNumber(value: string | number | undefined): number {
	if (value === undefined || value === null) return 1;
	if (typeof value === 'number') return value;
	const parsed = parseInt(value.toString(), 10);
	return isNaN(parsed) ? 1 : parsed;
}

async function seed() {
	await reset(db, schema);
	try {
		const [schoolRecord] = await db
			.insert(schema.school)
			.values({
				name: 'School of eddi',
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
				description: 'Primary campus of School of eddi'
			})
			.returning();

		const [buildingRecord] = await db
			.insert(schema.schoolBuilding)
			.values({
				campusId: campusRecord.id,
				name: 'Main Building',
				description: 'Main building of the campus',
				isArchived: false
			})
			.returning();

		const spaces = await db
			.insert(schema.schoolSpace)
			.values([
				{
					buildingId: buildingRecord.id,
					name: 'Science Lab A',
					type: schoolSpaceTypeEnum.laboratory,
					capacity: 30,
					isArchived: false
				},
				{
					buildingId: buildingRecord.id,
					name: 'Classroom 101',
					type: schoolSpaceTypeEnum.classroom,
					capacity: 25,
					isArchived: false
				},
				{
					buildingId: buildingRecord.id,
					name: 'Mathematics Room',
					type: schoolSpaceTypeEnum.classroom,
					capacity: 30,
					isArchived: false
				},
				{
					buildingId: buildingRecord.id,
					name: 'English Room',
					type: schoolSpaceTypeEnum.classroom,
					capacity: 28,
					isArchived: false
				},
				{
					buildingId: buildingRecord.id,
					name: 'Gymnasium',
					type: schoolSpaceTypeEnum.gymnasium,
					capacity: 200,
					isArchived: false
				},
				{
					buildingId: buildingRecord.id,
					name: 'History Room',
					type: schoolSpaceTypeEnum.classroom,
					capacity: 30,
					isArchived: false
				},
				{
					buildingId: buildingRecord.id,
					name: 'Geography Room',
					type: schoolSpaceTypeEnum.classroom,
					capacity: 30,
					isArchived: false
				}
			])
			.returning();

		// Create semesters and terms using Victorian school term dates
		const currentYear = new Date().getFullYear();
		const victorianTerms = getTermsByYear(currentYear);

		if (victorianTerms) {
			// Determine semester 1 (terms 1 and 2) and semester 2 (terms 3 and 4)
			const semester1Terms = victorianTerms.filter((t) => t.term === 1 || t.term === 2);
			const semester2Terms = victorianTerms.filter((t) => t.term === 3 || t.term === 4);

			// Create Semester 1
			if (semester1Terms.length > 0) {
				const semester1StartDate = semester1Terms[0].startDate.toISOString().split('T')[0];
				const semester1EndDate = semester1Terms[semester1Terms.length - 1].endDate
					.toISOString()
					.split('T')[0];

				const [semester1] = await db
					.insert(schema.schoolSemester)
					.values({
						schoolId: schoolRecord.id,
						schoolYear: currentYear,
						name: 'Semester 1',
						startDate: semester1StartDate,
						endDate: semester1EndDate,
						isArchived: false
					})
					.returning();

				// Create terms for semester 1
				for (const term of semester1Terms) {
					await db.insert(schema.schoolTerm).values({
						schoolSemesterId: semester1.id,
						name: `Term ${term.term}`,
						startDate: term.startDate,
						endDate: term.endDate,
						isArchived: false
					});
				}
			}

			// Create Semester 2
			if (semester2Terms.length > 0) {
				const semester2StartDate = semester2Terms[0].startDate.toISOString().split('T')[0];
				const semester2EndDate = semester2Terms[semester2Terms.length - 1].endDate
					.toISOString()
					.split('T')[0];

				const [semester2] = await db
					.insert(schema.schoolSemester)
					.values({
						schoolId: schoolRecord.id,
						schoolYear: currentYear,
						name: 'Semester 2',
						startDate: semester2StartDate,
						endDate: semester2EndDate,
						isArchived: false
					})
					.returning();

				// Create terms for semester 2
				for (const term of semester2Terms) {
					await db.insert(schema.schoolTerm).values({
						schoolSemesterId: semester2.id,
						name: `Term ${term.term}`,
						startDate: term.startDate,
						endDate: term.endDate,
						isArchived: false
					});
				}
			}
		}

		const [curriculumRecord] = await db
			.insert(schema.curriculum)
			.values({
				name: 'Victorian Curriculum',
				version: '2.0'
			})
			.returning();

		const curriculumSubjects = await db
			.insert(schema.curriculumSubject)
			.values([
				{
					name: 'Mathematics',
					curriculumId: curriculumRecord.id
				},
				{
					name: 'English',
					curriculumId: curriculumRecord.id
				},
				{
					name: 'Science',
					curriculumId: curriculumRecord.id
				},
				{
					name: 'Physical Education',
					curriculumId: curriculumRecord.id
				},
				{
					name: 'History',
					curriculumId: curriculumRecord.id
				},
				{
					name: 'Geography',
					curriculumId: curriculumRecord.id
				}
			])
			.returning();

		const coreSubjects = await db
			.insert(schema.coreSubject)
			.values([
				{
					name: 'Mathematics',
					description: 'Core mathematics',
					curriculumSubjectId: curriculumSubjects[0].id,
					schoolId: schoolRecord.id
				},
				{
					name: 'English',
					description: 'Core English',
					curriculumSubjectId: curriculumSubjects[1].id,
					schoolId: schoolRecord.id
				},
				{
					name: 'Science',
					description: 'Core Science',
					curriculumSubjectId: curriculumSubjects[2].id,
					schoolId: schoolRecord.id
				},
				{
					name: 'Physical Education',
					description: 'Core PE',
					curriculumSubjectId: curriculumSubjects[3].id,
					schoolId: schoolRecord.id
				},
				{
					name: 'History',
					description: 'Core History',
					curriculumSubjectId: curriculumSubjects[4].id,
					schoolId: schoolRecord.id
				},
				{
					name: 'Geography',
					description: 'Core Geography',
					curriculumSubjectId: curriculumSubjects[5].id,
					schoolId: schoolRecord.id
				}
			])
			.returning();

		// Create subjects for Foundation to Year 10 (F-10) for each core subject
		const subjects: (typeof schema.subject.$inferSelect)[] = [];
		const yearLevels = [
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

		for (const coreSubject of coreSubjects) {
			for (const yearLevel of yearLevels) {
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

		// Create subject offerings for all F-10 subjects (year-long offerings with semester = null)
		const subjectOfferings: (typeof schema.subjectOffering.$inferSelect)[] = [];
		for (const subject of subjects) {
			// Create year-long offering (semester = null for full year)
			const yearOfferingValues = {
				subjectId: subject.id,
				year: 2025,
				semester: 0, // 0 indicates full year
				campusId: campusRecord.id
			};
			const [yearOffering] = await db
				.insert(schema.subjectOffering)
				.values(yearOfferingValues)
				.returning();
			subjectOfferings.push(yearOffering);
		}

		// Filter to get only Year 9 offerings for student/teacher assignments
		const year9Offerings = subjectOfferings.filter((offering) => {
			const subject = subjects.find((s) => s.id === offering.subjectId);
			return subject && subject.yearLevel === yearLevelEnum.year9;
		});

		// Load pre-scraped VCAA curriculum data from JSON
		const __filename = fileURLToPath(import.meta.url);
		const __dirname = dirname(__filename);
		const curriculumDataPath = join(__dirname, 'data', 'vcaa-curriculum.json');
		const curriculumData: VCAACurriculumData = JSON.parse(
			readFileSync(curriculumDataPath, 'utf-8')
		);

		// Transform JSON data to match the expected format
		const contentItems = curriculumData.subjects.flatMap((subject) =>
			subject.learningAreas.flatMap((learningArea) =>
				learningArea.standards.map((standard) => ({
					vcaaCode: standard.name,
					description: standard.description,
					yearLevel: standard.yearLevel,
					learningArea: learningArea.name,
					strand: subject.name,
					elaborations: standard.elaborations
				}))
			)
		);

		// Create learning areas for scraped content
		const learningAreaMap = new Map<string, number>();
		const uniqueLearningAreas = [...new Set(contentItems.map((item) => item.learningArea))];

		for (const learningAreaName of uniqueLearningAreas) {
			// Find a content item with this learning area to get its strand (broad subject)
			const sampleItem = contentItems.find((item) => item.learningArea === learningAreaName);
			if (!sampleItem) continue;

			// Find the corresponding curriculum subject using the strand
			const curriculumSubject = curriculumSubjects.find(
				(cs) =>
					cs.name.toLowerCase().includes(sampleItem.strand.toLowerCase()) ||
					sampleItem.strand.toLowerCase().includes(cs.name.toLowerCase())
			);

			if (curriculumSubject) {
				const [learningArea] = await db
					.insert(schema.learningArea)
					.values({
						curriculumSubjectId: curriculumSubject.id,
						name: learningAreaName,
						description: `${learningAreaName} learning area from VCAA F-10 curriculum`
					})
					.returning();

				learningAreaMap.set(learningAreaName, learningArea.id);
			}
		}

		// Helper function to map year level string to enum values
		function mapYearLevelToEnum(
			yearLevelStr: string
		): (typeof yearLevelEnum)[keyof typeof yearLevelEnum][] {
			// Handle Foundation-Level 2 case - just map to Foundation
			if (yearLevelStr.includes('Foundation-Level')) {
				return [yearLevelEnum.foundation];
			}

			// Handle single levels
			if (yearLevelStr === 'Foundation') {
				return [yearLevelEnum.foundation];
			} else if (yearLevelStr === 'Level 1') {
				return [yearLevelEnum.year1];
			} else if (yearLevelStr === 'Level 2') {
				return [yearLevelEnum.year2];
			} else if (yearLevelStr === 'Level 3') {
				return [yearLevelEnum.year3];
			} else if (yearLevelStr === 'Level 4') {
				return [yearLevelEnum.year4];
			} else if (yearLevelStr === 'Level 5') {
				return [yearLevelEnum.year5];
			} else if (yearLevelStr === 'Level 6') {
				return [yearLevelEnum.year6];
			} else if (yearLevelStr === 'Level 7') {
				return [yearLevelEnum.year7];
			} else if (yearLevelStr === 'Level 8') {
				return [yearLevelEnum.year8];
			} else if (yearLevelStr === 'Level 9') {
				return [yearLevelEnum.year9];
			} else if (yearLevelStr === 'Level 10') {
				return [yearLevelEnum.year10];
			} else if (yearLevelStr === 'Level 10A') {
				return [yearLevelEnum.year10A];
			}

			// Handle ranges
			if (yearLevelStr === 'Level 1-2') {
				return [yearLevelEnum.year1, yearLevelEnum.year2];
			} else if (yearLevelStr === 'Level 3-4') {
				return [yearLevelEnum.year3, yearLevelEnum.year4];
			} else if (yearLevelStr === 'Level 5-6') {
				return [yearLevelEnum.year5, yearLevelEnum.year6];
			} else if (yearLevelStr === 'Level 7-8') {
				return [yearLevelEnum.year7, yearLevelEnum.year8];
			} else if (yearLevelStr === 'Level 9-10') {
				return [yearLevelEnum.year9, yearLevelEnum.year10];
			}

			// Default fallback
			return [yearLevelEnum.foundation];
		}

		// Create learning area content for each scraped item
		const learningAreaStandardMap = new Map<string, number>();

		for (const item of contentItems) {
			const learningAreaId = learningAreaMap.get(item.learningArea);
			if (!learningAreaId) continue;

			// Get all year levels for this item (could be multiple for ranges)
			const yearLevels = mapYearLevelToEnum(item.yearLevel);

			// Create a separate standard entry for each year level
			for (const yearLevelValue of yearLevels) {
				// Create unique identifier for this standard + year level combination
				const standardKey = `${item.vcaaCode}-${yearLevelValue}`;

				// Check if this content already exists to avoid duplicates
				const existingContent = await db
					.select()
					.from(schema.learningAreaStandard)
					.where(
						and(
							eq(schema.learningAreaStandard.name, item.vcaaCode),
							eq(schema.learningAreaStandard.yearLevel, yearLevelValue)
						)
					)
					.limit(1);

				if (existingContent.length === 0) {
					const [learningAreaStandard] = await db
						.insert(schema.learningAreaStandard)
						.values({
							learningAreaId: learningAreaId,
							name: item.vcaaCode,
							description: `${item.learningArea}: ${item.description}`,
							yearLevel: yearLevelValue
						})
						.returning();

					learningAreaStandardMap.set(standardKey, learningAreaStandard.id);

					// Create elaborations for this content item
					for (const elaboration of item.elaborations) {
						await db.insert(schema.standardElaboration).values({
							learningAreaStandardId: learningAreaStandard.id,
							name: `Elaboration for ${item.vcaaCode}`,
							standardElaboration: elaboration
						});
					}
				}
			}
		}

		// Create 36-week coursemap items for each subject offering (18 weeks per semester)
		const courseMapItems = [];
		const weeksPerSemester = 18;
		const totalWeeks = 36; // Full year

		for (const offering of subjectOfferings) {
			// Find the corresponding subject and core subject info
			const subject = subjects.find((s) => s.id === offering.subjectId);
			if (!subject) continue;

			const coreSubject = coreSubjects.find((cs) => cs.id === subject.coreSubjectId);
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

				// Link to relevant learning areas if available
				const relevantLearningAreaId = learningAreaMap.get(getSubjectLearningArea(subjectName));
				if (relevantLearningAreaId) {
					await db.insert(schema.courseMapItemLearningArea).values({
						courseMapItemId: courseMapItem.id,
						learningAreaId: relevantLearningAreaId
					});
				}
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

		// Helper function to map subject to learning area
		function getSubjectLearningArea(subjectName: string): string {
			const areaMap: { [key: string]: string } = {
				Mathematics: 'Mathematics',
				English: 'English',
				Science: 'Science',
				'Physical Education': 'Health and Physical Education',
				History: 'Humanities and Social Sciences',
				Geography: 'Humanities and Social Sciences'
			};

			return areaMap[subjectName] || subjectName;
		}

		const subjectOfferingClasses = await db
			.insert(schema.subjectOfferingClass)
			.values([
				{
					name: 'A',
					subOfferingId: year9Offerings[0].id // Math
				},
				{
					name: 'A',
					subOfferingId: year9Offerings[1].id // English
				},
				{
					name: 'A',
					subOfferingId: year9Offerings[2].id // Science
				},
				{
					name: 'A',
					subOfferingId: year9Offerings[3].id // PE
				},
				{
					name: 'A',
					subOfferingId: year9Offerings[4].id // History
				},
				{
					name: 'A',
					subOfferingId: year9Offerings[5].id // Geography
				}
			])
			.returning();

		// VCE Curriculum Data Seeding

		// Get or create VCE Curriculum
		const [vceCurriculum] = await db
			.insert(schema.curriculum)
			.values({
				name: 'Victorian Certificate of Education (VCE)',
				version: '2024'
			})
			.onConflictDoNothing()
			.returning();

		// Read all JSON files from vcaa-vce-data
		const dataPath = join(process.cwd(), 'data', 'vcaa-vce-data');
		let files: string[] = [];
		const vceClasses: (typeof schema.subjectOfferingClass.$inferSelect)[] = [];

		try {
			files = readdirSync(dataPath).filter((f) => f.endsWith('.json') && f !== 'default.json');
		} catch {
			files = [];
		}

		if (files.length > 0) {
			// Track created subjects to avoid duplicates
			const createdVCESubjects = new Map<string, number>();

			// Process each JSON file
			for (const file of files) {
				const filePath = join(dataPath, file);
				const fileBaseName = file.replace('.json', '');
				const subjectName = subjectNameMap[fileBaseName];

				if (!subjectName) {
					continue;
				}

				// Parse JSON data
				const rawData: unknown = JSON.parse(readFileSync(filePath, 'utf-8'));

				// Handle array-wrapped JSON
				let processedData: unknown = rawData;
				if (Array.isArray(processedData) && processedData.length > 0) {
					processedData = processedData[0];
				}

				// Type guard to check if processedData has the expected structure
				if (!processedData || typeof processedData !== 'object') {
					continue;
				}

				const typedData = processedData as VCAAData;

				// Handle different JSON structures
				let subjectData: {
					name: string;
					learningAreas: LearningAreaData[];
					outcomes: OutcomeData[];
					keySkills: KeySkillData[];
					keyKnowledge: KeyKnowledgeData[];
				};

				if (typedData.curriculum?.curriculumSubjects?.[0]) {
					// Foundation Math structure
					const curriculumSubject = typedData.curriculum.curriculumSubjects[0];
					subjectData = {
						name: curriculumSubject.name,
						learningAreas: curriculumSubject.learningAreas || [],
						outcomes: curriculumSubject.outcomes || [],
						keySkills: [],
						keyKnowledge: []
					};
				} else {
					// Direct structure
					subjectData = {
						name: typedData.name || subjectName,
						learningAreas: typedData.learningAreas || [],
						outcomes: typedData.outcomes || [],
						keySkills: typedData.keySkills || [],
						keyKnowledge: typedData.keyKnowledge || []
					};
				}

				// Get or create curriculum subject
				let vceSubjectId = createdVCESubjects.get(subjectName);

				if (!vceSubjectId) {
					const [subject] = await db
						.insert(schema.curriculumSubject)
						.values({
							name: subjectName,
							curriculumId: vceCurriculum.id
						})
						.onConflictDoNothing()
						.returning();
					vceSubjectId = subject.id;
					createdVCESubjects.set(subjectName, vceSubjectId);
				}

				// Process learning areas with curriculum subject reference
				for (const area of subjectData.learningAreas) {
					// Build description from base description + contents
					let fullDescription = area.description || '';
					if (area.contents && area.contents.length > 0) {
						const contentsText = area.contents
							.map((content: { description?: string }) => content.description)
							.join('\n• ');
						if (contentsText) {
							fullDescription += fullDescription ? '\n\n• ' + contentsText : '• ' + contentsText;
						}
					}

					await db
						.insert(schema.learningArea)
						.values({
							curriculumSubjectId: vceSubjectId,
							name: area.name,
							abbreviation: area.abbreviation,
							description: fullDescription || undefined
						})
						.onConflictDoNothing();
				}

				// Process outcomes with curriculum subject reference
				for (const outcome of subjectData.outcomes) {
					const outcomeNumber = parseNumber(outcome.number);

					const [outcomeRecord] = await db
						.insert(schema.outcome)
						.values({
							curriculumSubjectId: vceSubjectId,
							number: outcomeNumber,
							description: outcome.description
						})
						.onConflictDoNothing()
						.returning();

					// Process key skills within outcome
					if (outcome.keySkills) {
						for (let i = 0; i < outcome.keySkills.length; i++) {
							const skill = outcome.keySkills[i];

							// Skip if description is missing
							if (!skill.description || skill.description.trim() === '') {
								continue;
							}

							const topicName = extractTopicName(skill, outcome.topics);
							const skillNumber = skill.number !== undefined ? parseNumber(skill.number) : i + 1;

							await db
								.insert(schema.keySkill)
								.values({
									curriculumSubjectId: vceSubjectId,
									outcomeId: outcomeRecord.id,
									number: skillNumber,
									description: skill.description.trim(),
									topicName: topicName
								})
								.onConflictDoNothing();
						}
					}

					// Process key knowledge within outcome
					if (outcome.keyKnowledge) {
						for (let i = 0; i < outcome.keyKnowledge.length; i++) {
							const knowledge = outcome.keyKnowledge[i];

							// Skip if description is missing
							if (!knowledge.description || knowledge.description.trim() === '') {
								continue;
							}

							const topicName = extractTopicName(knowledge, outcome.topics);
							const knowledgeNumber =
								knowledge.number !== undefined ? parseNumber(knowledge.number) : i + 1;

							await db
								.insert(schema.keyKnowledge)
								.values({
									curriculumSubjectId: vceSubjectId,
									outcomeId: outcomeRecord.id,
									number: knowledgeNumber,
									description: knowledge.description.trim(),
									topicName: topicName
								})
								.onConflictDoNothing();
						}
					}
				}

				// Process standalone key skills (not tied to specific outcomes)
				if (subjectData.keySkills && subjectData.keySkills.length > 0) {
					for (let i = 0; i < subjectData.keySkills.length; i++) {
						const skill = subjectData.keySkills[i];

						// Skip if description is missing
						if (!skill.description || skill.description.trim() === '') {
							continue;
						}

						const topicName = extractTopicName(skill);
						const skillNumber = skill.number !== undefined ? parseNumber(skill.number) : i + 1;

						await db
							.insert(schema.keySkill)
							.values({
								curriculumSubjectId: vceSubjectId,
								outcomeId: null,
								number: skillNumber,
								description: skill.description.trim(),
								topicName: topicName
							})
							.onConflictDoNothing();
					}
				}

				// Process standalone key knowledge (not tied to specific outcomes)
				if (subjectData.keyKnowledge && subjectData.keyKnowledge.length > 0) {
					for (let i = 0; i < subjectData.keyKnowledge.length; i++) {
						const knowledge = subjectData.keyKnowledge[i];

						// Skip if description is missing
						if (!knowledge.description || knowledge.description.trim() === '') {
							continue;
						}

						const topicName = extractTopicName(knowledge);
						const knowledgeNumber =
							knowledge.number !== undefined ? parseNumber(knowledge.number) : i + 1;

						await db
							.insert(schema.keyKnowledge)
							.values({
								curriculumSubjectId: vceSubjectId,
								outcomeId: null,
								number: knowledgeNumber,
								description: knowledge.description.trim(),
								topicName: topicName
							})
							.onConflictDoNothing();
					}
				}

				// Remove the console log here
			}

			// Create core subjects for each VCE curriculum subject

			const vceCoreSubjectMap = new Map<string, number>();

			for (const [subjectName, curriculumSubjectId] of createdVCESubjects) {
				// Create core subject
				const [coreSubject] = await db
					.insert(schema.coreSubject)
					.values({
						name: subjectName,
						description: `VCE ${subjectName}`,
						curriculumSubjectId: curriculumSubjectId,
						schoolId: schoolRecord.id
					})
					.onConflictDoNothing()
					.returning();

				vceCoreSubjectMap.set(subjectName, coreSubject.id);
			}

			// Create VCE subjects, offerings, and classes

			for (const [subjectName] of createdVCESubjects) {
				const coreSubjectId = vceCoreSubjectMap.get(subjectName);
				if (!coreSubjectId) {
					continue;
				}

				// Create VCE subject
				let vceSubject = await db
					.insert(schema.subject)
					.values({
						name: subjectName,
						schoolId: schoolRecord.id,
						coreSubjectId: coreSubjectId,
						yearLevel: yearLevelEnum.VCE // VCE level
					})
					.onConflictDoNothing()
					.returning()
					.then((rows) => rows[0]);

				// If subject wasn't returned (conflict), fetch existing one
				if (!vceSubject) {
					vceSubject = await db
						.select()
						.from(schema.subject)
						.where(
							and(
								eq(schema.subject.name, subjectName),
								eq(schema.subject.schoolId, schoolRecord.id),
								eq(schema.subject.coreSubjectId, coreSubjectId),
								eq(schema.subject.yearLevel, yearLevelEnum.VCE)
							)
						)
						.then((rows) => rows[0]);
				}

				if (!vceSubject) {
					continue;
				}

				// Create subject offerings for current year
				const currentYear = new Date().getFullYear();

				// Create offerings for both semesters
				for (const semester of [1, 2]) {
					// Try to insert, but if it already exists, fetch it
					let offering = await db
						.insert(schema.subjectOffering)
						.values({
							subjectId: vceSubject.id,
							year: currentYear,
							semester: semester,
							campusId: campusRecord.id
						})
						.onConflictDoNothing()
						.returning()
						.then((rows) => rows[0]);

					// If offering wasn't returned (conflict), fetch existing one
					if (!offering) {
						offering = await db
							.select()
							.from(schema.subjectOffering)
							.where(
								and(
									eq(schema.subjectOffering.subjectId, vceSubject.id),
									eq(schema.subjectOffering.year, currentYear),
									eq(schema.subjectOffering.semester, semester),
									eq(schema.subjectOffering.campusId, campusRecord.id)
								)
							)
							.then((rows) => rows[0]);
					}

					// Create a default class for each offering
					const className = `${subjectName} - Year ${currentYear} Semester ${semester}`;
					const [vceClass] = await db
						.insert(schema.subjectOfferingClass)
						.values({
							name: className,
							subOfferingId: offering.id
						})
						.onConflictDoNothing()
						.returning();

					if (vceClass) {
						vceClasses.push(vceClass);
					}
				}
			}
		}

		// Enroll VCE student in all VCE classes after they are created

		// Create users
		const passwordHash = await hash('password123');

		const [systemAdmin] = await db
			.insert(schema.user)
			.values({
				email: 'root@eddi.com.au',
				passwordHash,
				schoolId: schoolRecord.id,
				type: userTypeEnum.systemAdmin,
				gender: userGenderEnum.male,
				honorific: userHonorificEnum.mr,
				yearLevel: yearLevelEnum.none,
				firstName: 'System',
				lastName: 'Admin',
				dateOfBirth: new Date('1980-01-15'),
				emailVerified: true
			})
			.returning();

		const [schoolAdmin] = await db
			.insert(schema.user)
			.values({
				email: 'admin@eddi.edu',
				passwordHash,
				schoolId: schoolRecord.id,
				type: userTypeEnum.schoolAdmin,
				gender: userGenderEnum.female,
				honorific: userHonorificEnum.ms,
				yearLevel: yearLevelEnum.none,
				firstName: 'School',
				lastName: 'Admin',
				dateOfBirth: new Date('1985-06-22'),
				emailVerified: true
			})
			.returning();

		// Students
		const [student1] = await db
			.insert(schema.user)
			.values({
				email: 'student001@eddi.edu',
				passwordHash,
				schoolId: schoolRecord.id,
				type: userTypeEnum.student,
				gender: userGenderEnum.female,
				yearLevel: yearLevelEnum.year9,
				firstName: 'Student',
				lastName: 'One',
				dateOfBirth: new Date('2009-03-15'),
				emailVerified: true
			})
			.returning();

		const [student2] = await db
			.insert(schema.user)
			.values({
				email: 'student002@eddi.edu',
				passwordHash,
				schoolId: schoolRecord.id,
				type: userTypeEnum.student,
				gender: userGenderEnum.male,
				yearLevel: yearLevelEnum.year9,
				firstName: 'Student',
				lastName: 'Two',
				dateOfBirth: new Date('2009-07-22'),
				emailVerified: true
			})
			.returning();

		const [student3] = await db
			.insert(schema.user)
			.values({
				email: 'student003@eddi.edu',
				passwordHash,
				schoolId: schoolRecord.id,
				type: userTypeEnum.student,
				gender: userGenderEnum.male,
				yearLevel: yearLevelEnum.year9,
				firstName: 'Student',
				lastName: 'Three',
				dateOfBirth: new Date('2009-11-08'),
				emailVerified: true
			})
			.returning();

		// Create VCE student
		const [vceStudent] = await db
			.insert(schema.user)
			.values({
				email: 'vcestudent@eddi.edu',
				passwordHash,
				schoolId: schoolRecord.id,
				type: userTypeEnum.student,
				gender: userGenderEnum.female,
				yearLevel: yearLevelEnum.VCE,
				firstName: 'VCE',
				lastName: 'Student',
				dateOfBirth: new Date('2007-05-15'),
				emailVerified: true
			})
			.returning();

		// Create parent users
		const [mother1] = await db
			.insert(schema.user)
			.values({
				email: 'mother001@eddi.edu',
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
			})
			.returning();

		const [father1] = await db
			.insert(schema.user)
			.values({
				email: 'father001@eddi.edu',
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
			})
			.returning();

		const [mother2] = await db
			.insert(schema.user)
			.values({
				email: 'mother002@eddi.edu',
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
			})
			.returning();

		const [father2] = await db
			.insert(schema.user)
			.values({
				email: 'father002@eddi.edu',
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
			})
			.returning();

		const [mother3] = await db
			.insert(schema.user)
			.values({
				email: 'mother003@eddi.edu',
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
			})
			.returning();

		const [father3] = await db
			.insert(schema.user)
			.values({
				email: 'father003@eddi.edu',
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
			})
			.returning();

		// Create one teacher for each subject
		const teacherIds: string[] = [];
		const teachers = [
			{
				firstName: 'Math',
				lastName: 'Teacher',
				email: 'm.teacher@eddi.edu',
				gender: userGenderEnum.female,
				honorific: userHonorificEnum.ms,
				dateOfBirth: new Date('1982-04-10')
			},
			{
				firstName: 'English',
				lastName: 'Teacher',
				email: 'e.teacher@eddi.edu',
				gender: userGenderEnum.male,
				honorific: userHonorificEnum.mr,
				dateOfBirth: new Date('1978-11-23')
			},
			{
				firstName: 'Science',
				lastName: 'Teacher',
				email: 's.teacher@eddi.edu',
				gender: userGenderEnum.female,
				honorific: userHonorificEnum.dr,
				dateOfBirth: new Date('1981-09-14')
			},
			{
				firstName: 'PE',
				lastName: 'Teacher',
				email: 'pe.teacher@eddi.edu',
				gender: userGenderEnum.male,
				honorific: userHonorificEnum.mr,
				dateOfBirth: new Date('1985-02-28')
			},
			{
				firstName: 'History',
				lastName: 'Teacher',
				email: 'h.teacher@eddi.edu',
				gender: userGenderEnum.female,
				honorific: userHonorificEnum.mrs,
				dateOfBirth: new Date('1979-07-05')
			},
			{
				firstName: 'Geography',
				lastName: 'Teacher',
				email: 'g.teacher@eddi.edu',
				gender: userGenderEnum.male,
				honorific: userHonorificEnum.mr,
				dateOfBirth: new Date('1983-12-12')
			}
		];

		for (const teacher of teachers) {
			const [newTeacher] = await db
				.insert(schema.user)
				.values({
					email: teacher.email,
					passwordHash,
					schoolId: schoolRecord.id,
					type: userTypeEnum.teacher,
					gender: teacher.gender,
					honorific: teacher.honorific,
					yearLevel: yearLevelEnum.none,
					firstName: teacher.firstName,
					lastName: teacher.lastName,
					dateOfBirth: teacher.dateOfBirth,
					emailVerified: true
				})
				.returning();

			teacherIds.push(newTeacher.id);
		}

		// Add teacher specializations - match teachers to their core subjects
		const teacherSpecializations = [];

		// Math Teacher (index 0) - specializes in Mathematics subjects
		const mathSubjects = subjects.filter((s) => s.name.includes('Mathematics'));
		for (const subject of mathSubjects) {
			teacherSpecializations.push({
				teacherId: teacherIds[0],
				subjectId: subject.id
			});
		}

		// English Teacher (index 1) - specializes in English subjects
		const englishSubjects = subjects.filter((s) => s.name.includes('English'));
		for (const subject of englishSubjects) {
			teacherSpecializations.push({
				teacherId: teacherIds[1],
				subjectId: subject.id
			});
		}

		// Science Teacher (index 2) - specializes in Science subjects
		const scienceSubjects = subjects.filter((s) => s.name.includes('Science'));
		for (const subject of scienceSubjects) {
			teacherSpecializations.push({
				teacherId: teacherIds[2],
				subjectId: subject.id
			});
		}

		// PE Teacher (index 3) - specializes in Physical Education subjects
		const peSubjects = subjects.filter((s) => s.name.includes('Physical Education'));
		for (const subject of peSubjects) {
			teacherSpecializations.push({
				teacherId: teacherIds[3],
				subjectId: subject.id
			});
		}

		// History Teacher (index 4) - specializes in History subjects
		const historySubjects = subjects.filter((s) => s.name.includes('History'));
		for (const subject of historySubjects) {
			teacherSpecializations.push({
				teacherId: teacherIds[4],
				subjectId: subject.id
			});
		}

		// Geography Teacher (index 5) - specializes in Geography subjects
		const geographySubjects = subjects.filter((s) => s.name.includes('Geography'));
		for (const subject of geographySubjects) {
			teacherSpecializations.push({
				teacherId: teacherIds[5],
				subjectId: subject.id
			});
		}

		// Insert all teacher specializations
		if (teacherSpecializations.length > 0) {
			await db.insert(schema.userTeacherSpecialization).values(teacherSpecializations);
		}

		// Assign users to campus
		const allUserIds = [
			systemAdmin.id,
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

				await db.insert(schema.userSubjectOffering).values({
					userId: studentId,
					subOfferingId: subjectOffering.id,
					color: colorHue
				});
			}
		}

		// Assign teachers to Year 9 subject offerings only
		for (let i = 0; i < teacherIds.length && i < year9Offerings.length; i++) {
			await db.insert(schema.userSubjectOffering).values({
				userId: teacherIds[i],
				subOfferingId: year9Offerings[i].id
			});
		}

		// Enroll VCE student in all VCE classes
		for (const vceClass of vceClasses) {
			await db.insert(schema.userSubjectOfferingClass).values({
				userId: vceStudent.id,
				subOffClassId: vceClass.id
			});
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

		// Assign teachers to subject offering classes
		for (let i = 0; i < teacherIds.length && i < subjectOfferingClasses.length; i++) {
			await db.insert(schema.userSubjectOfferingClass).values({
				userId: teacherIds[i],
				subOffClassId: subjectOfferingClasses[i].id
			});
		}

		const [mockTimetable] = await db
			.insert(schema.timetable)
			.values({
				schoolId: schoolRecord.id,
				name: 'Main School Timetable 2025',
				schoolYear: 2025,
				isArchived: false
			})
			.returning();

		// Create timetable days (Monday to Friday)
		await db
			.insert(schema.timetableDay)
			.values([
				{ timetableId: mockTimetable.id, day: 1 }, // Monday
				{ timetableId: mockTimetable.id, day: 2 }, // Tuesday
				{ timetableId: mockTimetable.id, day: 3 }, // Wednesday
				{ timetableId: mockTimetable.id, day: 4 }, // Thursday
				{ timetableId: mockTimetable.id, day: 5 } // Friday
			])
			.returning();

		// Create timetable periods (6 periods from 9:00 to 15:30)
		await db
			.insert(schema.timetablePeriod)
			.values([
				{ timetableId: mockTimetable.id, startTime: '09:00', endTime: '09:50' },
				{ timetableId: mockTimetable.id, startTime: '09:50', endTime: '10:40' },
				{ timetableId: mockTimetable.id, startTime: '11:00', endTime: '11:50' }, // 20 min break after period 2
				{ timetableId: mockTimetable.id, startTime: '11:50', endTime: '12:40' },
				{ timetableId: mockTimetable.id, startTime: '13:40', endTime: '14:30' }, // 1 hour lunch break after period 4
				{ timetableId: mockTimetable.id, startTime: '14:30', endTime: '15:20' }
			])
			.returning();

		// Create timetable groups for Year 9 students - one group per subject (like auto-create groups button)
		const timetableGroups = [];
		for (let i = 0; i < year9Offerings.length; i++) {
			const offering = year9Offerings[i];
			// Get the subject to determine the name
			const subject = subjects.find((s) => s.id === offering.subjectId);
			const subjectName = subject ? subject.name.replace('Year 9 ', '') : `Subject ${i + 1}`;

			const [group] = await db
				.insert(schema.timetableGroup)
				.values({
					timetableId: mockTimetable.id,
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
			const offering = year9Offerings[groupIndex];
			const teacherId = teacherIds[groupIndex];

			// Activity 1: Group-based activity with preferred rooms
			const [activity1] = await db
				.insert(schema.timetableActivity)
				.values({
					timetableId: mockTimetable.id,
					subjectId: offering.subjectId,
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
				ttGroupId: group.id
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
					timetableId: mockTimetable.id,
					subjectId: offering.subjectId,
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
					ttGroupId: group.id
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

		// Import the comprehensive constraint definitions
		const { ALL_CONSTRAINTS } = await import('./data/constraints.js');

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
			await db.insert(schema.timetableConstraint).values({
				timetableId: mockTimetable.id,
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

		// Helper function to create a Date object for a specific day and time
		const createDateTime = (
			weekOffset: number,
			dayOffset: number,
			hour: number,
			minute: number = 0
		) => {
			const date = new Date(baseDate);
			date.setDate(baseDate.getDate() + weekOffset * 7 + dayOffset);
			date.setHours(hour, minute, 0, 0);
			return date;
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
						startTimestamp: createDateTime(week, day, hour, minute),
						endTimestamp: createDateTime(week, day, hour + 1, minute) // 1 hour duration
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
					excerpt:
						'We are excited to welcome all students, teachers, and families back for another fantastic year at School of eddi.',
					content: {
						blocks: [
							{
								type: 'paragraph',
								content: 'Dear School of eddi Community,'
							},
							{
								type: 'paragraph',
								content:
									'We are thrilled to welcome everyone back to School of eddi for the 2025 academic year! After a wonderful summer break, our campus is buzzing with excitement as students return to their classrooms and teachers prepare for another year of inspiring education.'
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
								content:
									'What an amazing weekend for School of eddi Basketball! Our senior team has brought home the Regional Championship trophy after an outstanding tournament performance.'
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
								content:
									'The School of eddi Drama Club is thrilled to announce our spring production of William Shakespeare\'s "A Midsummer Night\'s Dream"!'
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
								content:
									'We are excited to announce the launch of the School of eddi Community Garden Project, a collaborative initiative that brings together students, families, and staff to create a sustainable learning environment.'
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
									'For more information or to volunteer, please contact the school office or email gardens@schoolofeddi.edu.au'
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
	} catch (error) {
		console.error('❌ Error seeding database:', error);
		throw error;
	}
}

seed()
	.then(() => {
		process.exit(0);
	})
	.catch((error) => {
		console.error('Seeding failed:', error);
		process.exit(1);
	});

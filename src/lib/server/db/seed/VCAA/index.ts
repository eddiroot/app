import { env } from '$env/dynamic/private';
import { VCAAF10SubjectEnum, VCAAVCESubjectEnum, yearLevelEnum } from '$lib/enums';
import * as schema from '$lib/server/db/schema';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { readFileSync } from 'fs';
import { join } from 'path';

// This will be set by seedVCAA when called with a db instance
let db: NodePgDatabase<typeof schema>;

// Type definitions for VC2 Foundation-10 data
interface VC2Standard {
	name: string;
	description: string;
	yearLevel: string;
	elaborations: string[];
}

interface VC2LearningArea {
	name: string;
	description: string;
	standards: VC2Standard[];
}

interface VC2Subject {
	name: string;
	url: string;
	learningAreas: VC2LearningArea[];
}

interface VC2Curriculum {
	scrapedAt: string;
	subjects: VC2Subject[];
}

// Type definitions for VCE curriculum data
interface VCELearningAreaContent {
	description: string;
	number: number;
}

interface VCELearningArea {
	id?: number;
	curriculumSubjectId?: number;
	name: string;
	abbreviation: string;
	description: string;
	content?: VCELearningAreaContent[];
}

interface VCEKeySkill {
	id?: number;
	description: string;
	outcomeId?: number;
	curriculumSubjectId?: number;
	number: number;
	topicName?: string;
	outcomeTopic?: string;
	outcomeTopicId?: number;
	name?: string;
}

interface VCEKeyKnowledge {
	id?: number;
	description: string;
	outcomeId?: number;
	curriculumSubjectId?: number;
	number: number;
	topicName?: string;
	outcomeTopic?: string;
	outcomeTopicId?: number;
	name?: string;
}

interface VCEOutcome {
	id?: number;
	number: number;
	description: string;
	curriculumSubjectId?: number;
	keySkills?: VCEKeySkill[];
	keyKnowledge?: VCEKeyKnowledge[];
	outcomeTopics?: Array<{ id?: number; name: string; outcomeTopic?: string }>;
}

interface VCEExtraContent {
	contentType?: string;
	description: string;
}

interface VCECurriculum {
	id?: number;
	curriculumId?: number;
	name: string;
	isArchived: boolean;
	learningAreas: VCELearningArea[];
	outcomes: VCEOutcome[];
	extraContents?: VCEExtraContent[];
	extracontents?: VCEExtraContent[]; // Some files use lowercase
}

// Type definitions for VCE activities
interface VCELearningActivity {
	activity?: string;
	title?: string;
	description?: string;
	unit?: number;
	areaOfStudy?: number;
	outcome?: number;
}

interface VCEAssessmentTask {
	task?: string;
	title?: string;
	description?: string;
	unit?: number;
	areaOfStudy?: number;
	outcome?: number;
}

interface VCEDetailedExample {
	title: string;
	content: string;
	unit?: number;
	areaOfStudy?: number;
	outcome?: number;
}

interface VCERubricCriteria {
	markRange: string;
	description: string;
}

interface VCERubric {
	outcomeDescription: string;
	criteria: VCERubricCriteria[];
	unit?: number;
	areaOfStudy?: number;
	outcome?: number;
}

interface VCEActivities {
	learningActivities?: VCELearningActivity[];
	assessmentTasks?: VCEAssessmentTask[];
	detailedExamples?: VCEDetailedExample[];
	rubrics?: VCERubric[];
	rubric?: VCERubric[]; // Some files use 'rubric' instead of 'rubrics'
}

// Type definitions for VCE exam questions
interface VCEExamQuestion {
	question: string;
	answer: string;
	learningArea?: string;
	topic?: string;
}

// Helper function to map year level strings to enum
function mapYearLevel(yearLevel: string): yearLevelEnum {
	const mapping: Record<string, yearLevelEnum> = {
		'Foundation': yearLevelEnum.foundation,
		'F': yearLevelEnum.foundation,
		'Level 1': yearLevelEnum.year1,
		'Level 2': yearLevelEnum.year2,
		'Level 3': yearLevelEnum.year3,
		'Level 4': yearLevelEnum.year4,
		'Level 5': yearLevelEnum.year5,
		'Level 6': yearLevelEnum.year6,
		'Level 7': yearLevelEnum.year7,
		'Level 8': yearLevelEnum.year8,
		'Level 9': yearLevelEnum.year9,
		'Level 10': yearLevelEnum.year10,
		'1': yearLevelEnum.year1,
		'2': yearLevelEnum.year2,
		'3': yearLevelEnum.year3,
		'4': yearLevelEnum.year4,
		'5': yearLevelEnum.year5,
		'6': yearLevelEnum.year6,
		'7': yearLevelEnum.year7,
		'8': yearLevelEnum.year8,
		'9': yearLevelEnum.year9,
		'10': yearLevelEnum.year10,
		'10A': yearLevelEnum.year10A,
		'11': yearLevelEnum.year11,
		'12': yearLevelEnum.year12,
		'VCE': yearLevelEnum.VCE
	};
	
	return mapping[yearLevel] || yearLevelEnum.none;
}

// Helper function to extract topic name from key skill/knowledge
function extractTopicName(
	item: VCEKeySkill | VCEKeyKnowledge,
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
			return matchingTopic.outcomeTopic || matchingTopic.name;
		}
		return `Topic ${item.outcomeTopicId}`;
	}

	// If we have outcome topics, try to match
	if (outcomeTopics && outcomeTopics.length > 0) {
		return outcomeTopics[0].outcomeTopic || outcomeTopics[0].name;
	}

	return null;
}

// Helper to parse number from value
function parseNumber(value: string | number | undefined): number {
	if (value === undefined || value === null) return 1;
	if (typeof value === 'number') return value;
	const parsed = parseInt(value.toString(), 10);
	return isNaN(parsed) ? 1 : parsed;
}

// Map VCE subject file names to proper names
const vceSubjectNameMap: Record<string, string> = {
	'accounting': 'Accounting',
	'biology': 'Biology',
	'business_management': 'Business Management',
	'chemistry': 'Chemistry',
	'economics': 'Economics',
	'english': 'English',
	'general_mathematics': 'General Mathematics',
	'health_and_human_development': 'Health and Human Development',
	'legal_studies': 'Legal Studies',
	'literature': 'Literature',
	'mathematical_methods': 'Mathematical Methods',
	'physical_education': 'Physical Education',
	'physics': 'Physics',
	'psychology': 'Psychology',
	'specialist_mathematics': 'Specialist Mathematics'
};

/**
 * Seed VC2 Foundation to Year 10 curriculum
 */
async function seedVC2Curriculum() {
	console.log('Starting VC2 Foundation-10 curriculum seeding...');

	// Create VC2 curriculum
	const [vc2Curriculum] = await db
		.insert(schema.curriculum)
		.values({
			name: 'VCAA Victorian Curriculum',
			version: 'VC2'
		})
		.returning();

	console.log(`Created VC2 curriculum: ${vc2Curriculum.name} (ID: ${vc2Curriculum.id})`);

	// Read the VC2 curriculum data
	const dataPath = join(process.cwd(), 'data', 'VCAA', 'VC2', 'foundation-10', 'vcaa-f10-currriculum.json');
	const vc2Data: VC2Curriculum = JSON.parse(readFileSync(dataPath, 'utf-8'));

	// Create curriculum subjects for each VCAAF10SubjectEnum
	const subjectMap = new Map<string, CurriculumSubjectRecord>();
	
	for (const subjectEnum of Object.values(VCAAF10SubjectEnum)) {
		const subjectName = subjectEnum.split('_').map((word, index) => {
			// Keep 'and' lowercase when it's not the first word
			if (word.toLowerCase() === 'and' && index > 0) {
				return 'and';
			}
			return word.charAt(0).toUpperCase() + word.slice(1);
		}).join(' ');


		console.log(`Inserting curriculum subject "${subjectName}" with curriculumId: ${vc2Curriculum.id}`);
		
		const [curriculumSubject] = await db
			.insert(schema.curriculumSubject)
			.values({
				name: subjectName,
				curriculumId: vc2Curriculum.id
			})
			.returning();

		subjectMap.set(subjectName, curriculumSubject);
		console.log(`Created curriculum subject: ${subjectName}`);
	}

	// Process each subject's learning areas, standards, and elaborations
	for (const subject of vc2Data.subjects) {
		const curriculumSubject = subjectMap.get(subject.name);
		if (!curriculumSubject) {
			console.warn(`No curriculum subject found for: ${subject.name}`);
			continue;
		}

		console.log(`Processing learning areas for: ${subject.name}`);

		for (const learningArea of subject.learningAreas) {
			// Create learning area
			const [la] = await db
				.insert(schema.learningArea)
				.values({
					curriculumSubjectId: curriculumSubject.id,
					name: learningArea.name,
					description: learningArea.description
				})
				.returning();

			console.log(`  Created learning area: ${learningArea.name}`);

			// Process standards
			for (const standard of learningArea.standards) {
				const yearLevel = mapYearLevel(standard.yearLevel);

				const [las] = await db
					.insert(schema.learningAreaStandard)
					.values({
						learningAreaId: la.id,
						name: standard.name,
						description: standard.description,
						yearLevel
					})
					.returning();

				// Process elaborations
				for (const elaboration of standard.elaborations) {
					await db
						.insert(schema.standardElaboration)
						.values({
							learningAreaStandardId: las.id,
							name: standard.name,
							standardElaboration: elaboration
						});
				}

				console.log(`    Created standard: ${standard.name} with ${standard.elaborations.length} elaborations`);
			}
		}
	}

	console.log('Completed VC2 Foundation-10 curriculum seeding.');
	return vc2Curriculum;
}

/**
 * Seed VCE 2025 curriculum
 */
async function seedVCECurriculum() {
	console.log('Starting VCE 2025 curriculum seeding...');

	// Create VCE curriculum
	const [vceCurriculum] = await db
		.insert(schema.curriculum)
		.values({
			name: 'VCAA VCE',
			version: '2025'
		})
		.returning();

	console.log(`Created VCE curriculum: ${vceCurriculum.name}`);

	// Create curriculum subjects for each VCAAVCESubjectEnum
	const vceSubjectMap = new Map<string, CurriculumSubjectRecord>();
	
	for (const subjectEnum of Object.values(VCAAVCESubjectEnum)) {
		const subjectName = subjectEnum.split('_').map(word => 
			word.charAt(0).toUpperCase() + word.slice(1)
		).join(' ');

		const [curriculumSubject] = await db
			.insert(schema.curriculumSubject)
			.values({
				name: subjectName,
				curriculumId: vceCurriculum.id
			})
			.returning();

		vceSubjectMap.set(subjectName, curriculumSubject);
		vceSubjectMap.set(subjectEnum, curriculumSubject); // Also map by enum key
		console.log(`Created VCE curriculum subject: ${subjectName}`);
	}

	// Process VCE curriculums (Units 1-2 and 3-4)
	await seedVCECurriculumFiles(vceSubjectMap);

	// Process VCE activities
	await seedVCEActivities(vceSubjectMap);

	// Process VCE exam questions
	await seedVCEExamQuestions(vceSubjectMap);

	console.log('Completed VCE 2025 curriculum seeding.');
	return vceCurriculum;
}

type CurriculumSubjectRecord = {
	id: number;
	name: string;
	curriculumId: number;
	createdAt: Date;
	updatedAt: Date;
	isArchived: boolean;
};

/**
 * Seed VCE curriculum files (combining 12 and 34 files)
 */
async function seedVCECurriculumFiles(vceSubjectMap: Map<string, CurriculumSubjectRecord>) {
	console.log('Processing VCE curriculum files...');

	const curriculumPath = join(process.cwd(), 'data', 'VCAA', 'vce', '2025', 'vce-curriculums');
	
	// Get unique subject names from the map
	const processedSubjects = new Set<string>();

	for (const [fileName, subjectName] of Object.entries(vceSubjectNameMap)) {
		if (processedSubjects.has(subjectName)) continue;
		processedSubjects.add(subjectName);

		const curriculumSubject = vceSubjectMap.get(subjectName);
		if (!curriculumSubject) {
			console.warn(`No curriculum subject found for: ${subjectName}`);
			continue;
		}

		// Read Units 1-2 file
		const file12Path = join(curriculumPath, `${fileName}12.json`);
		let curriculum12: VCECurriculum | null = null;
		try {
			const rawData = JSON.parse(readFileSync(file12Path, 'utf-8'));
			// Handle both object and array formats
			curriculum12 = Array.isArray(rawData) ? rawData[0] : rawData;
		} catch {
			console.warn(`Could not read ${fileName}12.json`);
		}

		// Read Units 3-4 file
		const file34Path = join(curriculumPath, `${fileName}34.json`);
		let curriculum34: VCECurriculum | null = null;
		try {
			const rawData = JSON.parse(readFileSync(file34Path, 'utf-8'));
			// Handle both object and array formats
			curriculum34 = Array.isArray(rawData) ? rawData[0] : rawData;
		} catch {
			console.warn(`Could not read ${fileName}34.json`);
		}

		if (!curriculum12 && !curriculum34) {
			console.warn(`No curriculum files found for: ${subjectName}`);
			continue;
		}

		console.log(`Processing curriculum for: ${subjectName}`);

		// Combine learning areas from both files
		const allLearningAreas: VCELearningArea[] = [];
		if (curriculum12 && curriculum12.learningAreas) allLearningAreas.push(...curriculum12.learningAreas);
		if (curriculum34 && curriculum34.learningAreas) allLearningAreas.push(...curriculum34.learningAreas);

		// Process learning areas
		for (const learningArea of allLearningAreas) {
			const [la] = await db
				.insert(schema.learningArea)
				.values({
					curriculumSubjectId: curriculumSubject.id,
					name: learningArea.name,
					abbreviation: learningArea.abbreviation,
					description: learningArea.description
				})
				.returning();

			console.log(`  Created learning area: ${learningArea.abbreviation} - ${learningArea.name}`);

			// Process learning area content (for mathematics subjects)
			if (learningArea.content && learningArea.content.length > 0) {
				for (let i = 0; i < learningArea.content.length; i++) {
					const content = learningArea.content[i];
					await db
						.insert(schema.learningAreaContent)
						.values({
							learningAreaId: la.id,
							description: content.description,
							number: content.number ?? i + 1 // Use content.number if available, otherwise use index + 1
						});
				}
				console.log(`    Added ${learningArea.content.length} content items`);
			}
		}

		// Combine outcomes from both files
		const allOutcomes: VCEOutcome[] = [];
		if (curriculum12) allOutcomes.push(...curriculum12.outcomes);
		if (curriculum34) allOutcomes.push(...curriculum34.outcomes);

		// Process outcomes
		const outcomeMap = new Map<number, { id: number; number: number; description: string; curriculumSubjectId: number; }>();
		for (const outcome of allOutcomes) {
			const [outcomeRecord] = await db
				.insert(schema.outcome)
				.values({
					curriculumSubjectId: curriculumSubject.id,
					number: outcome.number,
					description: outcome.description
				})
				.returning();

			outcomeMap.set(outcome.number, outcomeRecord);
			console.log(`  Created outcome ${outcome.number}`);

			// Process key skills
			if (outcome.keySkills && outcome.keySkills.length > 0) {
				for (const keySkill of outcome.keySkills) {
					const topicName = extractTopicName(keySkill, outcome.outcomeTopics);
					
					await db
						.insert(schema.keySkill)
						.values({
							description: keySkill.description,
							outcomeId: outcomeRecord.id,
							curriculumSubjectId: curriculumSubject.id,
							number: parseNumber(keySkill.number),
							topicName
						});
				}
				console.log(`    Added ${outcome.keySkills.length} key skills`);
			}

			// Process key knowledge
			if (outcome.keyKnowledge && outcome.keyKnowledge.length > 0) {
				for (const keyKnowledge of outcome.keyKnowledge) {
					const topicName = extractTopicName(keyKnowledge, outcome.outcomeTopics);
					
					await db
						.insert(schema.keyKnowledge)
						.values({
							description: keyKnowledge.description,
							outcomeId: outcomeRecord.id,
							curriculumSubjectId: curriculumSubject.id,
							number: parseNumber(keyKnowledge.number),
							topicName
						});
				}
				console.log(`    Added ${outcome.keyKnowledge.length} key knowledge items`);
			}
		}

		// Process extra contents (handle both 'extraContents' and 'extracontents' field names)
		const allExtraContents: VCEExtraContent[] = [];
		if (curriculum12) {
			const extraContents = curriculum12.extraContents || curriculum12.extracontents;
			if (extraContents) allExtraContents.push(...extraContents);
		}
		if (curriculum34) {
			const extraContents = curriculum34.extraContents || curriculum34.extracontents;
			if (extraContents) allExtraContents.push(...extraContents);
		}

		for (const extraContent of allExtraContents) {
			const contentType = extraContent.contentType || 'definition';
			const formattedContent = `ContentType: ${contentType}\n\n${extraContent.description}`;

			await db
				.insert(schema.curriculumSubjectExtraContent)
				.values({
					curriculumSubjectId: curriculumSubject.id,
					content: formattedContent
				});
		}
		if (allExtraContents.length > 0) {
			console.log(`  Added ${allExtraContents.length} extra content items`);
		}
	}

	console.log('Completed processing VCE curriculum files.');
}

/**
 * Process rubrics and store them in curriculumSubjectExtraContent
 */
async function processRubrics(
	rubrics: VCERubric[],
	curriculumSubjectId: number
) {
	for (const rubric of rubrics) {
		// Format rubric content: outcome description + all criteria
		let rubricContent = `Outcome: ${rubric.outcomeDescription}\n\nCriteria:\n`;
		
		for (const criterion of rubric.criteria) {
			rubricContent += `\nMark Range: ${criterion.markRange}\n${criterion.description}\n`;
		}

		await db
			.insert(schema.curriculumSubjectExtraContent)
			.values({
				curriculumSubjectId,
				content: `ContentType: rubric\n\n${rubricContent}`
			});
	}
}

/**
 * Process pseudocode activities and add them to Mathematical Methods and Specialist Mathematics
 */
async function processPseudocodeActivities(vceSubjectMap: Map<string, CurriculumSubjectRecord>) {
	const pseudocodePath = join(process.cwd(), 'data', 'VCAA', 'vce', '2025', 'vce-activities', 'pseudocode.json');
	
	let pseudocodeData: VCEActivities | null = null;
	try {
		pseudocodeData = JSON.parse(readFileSync(pseudocodePath, 'utf-8'));
	} catch {
		console.warn('Could not read pseudocode.json');
		return;
	}

	if (!pseudocodeData) return;

	// Add to both Mathematical Methods and Specialist Mathematics
	const subjects = ['Mathematical Methods', 'Specialist Mathematics'];
	
	for (const subjectName of subjects) {
		const curriculumSubject = vceSubjectMap.get(subjectName);
		if (!curriculumSubject) continue;

		console.log(`Adding pseudocode activities to: ${subjectName}`);

		// Add learning activities
		if (pseudocodeData.learningActivities && pseudocodeData.learningActivities.length > 0) {
			for (const activity of pseudocodeData.learningActivities) {
				const content = activity.activity || 
					(activity.title && activity.description 
						? `${activity.title}\n\n${activity.description}` 
						: activity.title || activity.description);
				
				if (!content) continue;
				
				await db
					.insert(schema.learningActivity)
					.values({
						curriculumSubjectId: curriculumSubject.id,
						content,
						yearLevel: yearLevelEnum.VCE
					});
			}
			console.log(`  Added ${pseudocodeData.learningActivities.length} pseudocode learning activities`);
		}

		// Add assessment tasks
		if (pseudocodeData.assessmentTasks && pseudocodeData.assessmentTasks.length > 0) {
			for (const task of pseudocodeData.assessmentTasks) {
				const content = task.task || 
					(task.title && task.description 
						? `${task.title}\n\n${task.description}` 
						: task.title || task.description);
				
				if (!content) continue;
				
				await db
					.insert(schema.assessmentTask)
					.values({
						curriculumSubjectId: curriculumSubject.id,
						content,
						yearLevel: yearLevelEnum.VCE
					});
			}
			console.log(`  Added ${pseudocodeData.assessmentTasks.length} pseudocode assessment tasks`);
		}
	}
}

/**
 * Seed VCE activities (learning activities, assessment tasks, detailed examples, rubrics)
 */
async function seedVCEActivities(vceSubjectMap: Map<string, CurriculumSubjectRecord>) {
	console.log('Processing VCE activities...');

	const activitiesPath = join(process.cwd(), 'data', 'VCAA', 'vce', '2025', 'vce-activities');

	for (const [fileName, subjectName] of Object.entries(vceSubjectNameMap)) {
		const curriculumSubject = vceSubjectMap.get(subjectName);
		if (!curriculumSubject) continue;

		const filePath = join(activitiesPath, `${fileName}_curriculum_data.json`);
		let activities: VCEActivities | null = null;
		
		try {
			activities = JSON.parse(readFileSync(filePath, 'utf-8'));
		} catch {
			console.warn(`Could not read ${fileName}_curriculum_data.json`);
			continue;
		}

		if (!activities) continue;

		console.log(`Processing activities for: ${subjectName}`);

		// Process learning activities
		if (activities.learningActivities && activities.learningActivities.length > 0) {
			for (const activity of activities.learningActivities) {
				// Use activity field if present, otherwise use title + description
				const content = activity.activity || 
					(activity.title && activity.description 
						? `${activity.title}\n\n${activity.description}` 
						: activity.title || activity.description);
				
				// Skip if no content available
				if (!content) continue;
				
				await db
					.insert(schema.learningActivity)
					.values({
						curriculumSubjectId: curriculumSubject.id,
						content,
						yearLevel: yearLevelEnum.VCE
					});
			}
			console.log(`  Added ${activities.learningActivities.length} learning activities`);
		}

		// Process assessment tasks
		if (activities.assessmentTasks && activities.assessmentTasks.length > 0) {
			for (const task of activities.assessmentTasks) {
				// Use task field if present, otherwise use title + description
				const content = task.task || 
					(task.title && task.description 
						? `${task.title}\n\n${task.description}` 
						: task.title || task.description);
				
				// Skip if no content available
				if (!content) continue;
				
				await db
					.insert(schema.assessmentTask)
					.values({
						curriculumSubjectId: curriculumSubject.id,
						content,
						yearLevel: yearLevelEnum.VCE
					});
			}
			console.log(`  Added ${activities.assessmentTasks.length} assessment tasks`);
		}

		// Process detailed examples
		if (activities.detailedExamples && activities.detailedExamples.length > 0) {
			for (const example of activities.detailedExamples) {
				const formattedContent = `ContentType: detailedExample\n\n${example.title}: ${example.content}`;
				
				await db
					.insert(schema.curriculumSubjectExtraContent)
					.values({
						curriculumSubjectId: curriculumSubject.id,
						content: formattedContent
					});
			}
			console.log(`  Added ${activities.detailedExamples.length} detailed examples`);
		}

		// Process rubrics (handle both 'rubrics' and 'rubric' field names)
		const rubrics = activities.rubrics || activities.rubric;
		if (rubrics && rubrics.length > 0) {
			await processRubrics(rubrics, curriculumSubject.id);
			console.log(`  Added ${rubrics.length} rubrics`);
		}
	}

	// Process pseudocode activities for Mathematical Methods and Specialist Mathematics
	await processPseudocodeActivities(vceSubjectMap);

	console.log('Completed processing VCE activities.');
}

/**
 * Seed VCE exam questions
 */
async function seedVCEExamQuestions(vceSubjectMap: Map<string, CurriculumSubjectRecord>) {
	console.log('Processing VCE exam questions...');

	const examQuestionsPath = join(process.cwd(), 'data', 'VCAA', 'vce', '2025', 'vce-exam-questions');

	for (const [fileName, subjectName] of Object.entries(vceSubjectNameMap)) {
		const curriculumSubject = vceSubjectMap.get(subjectName);
		if (!curriculumSubject) continue;

		const filePath = join(examQuestionsPath, `${fileName}.json`);
		let examQuestions: VCEExamQuestion[] | null = null;
		
		try {
			examQuestions = JSON.parse(readFileSync(filePath, 'utf-8'));
		} catch {
			// Not all subjects have exam questions
			continue;
		}

		if (!examQuestions || examQuestions.length === 0) continue;

		console.log(`Processing exam questions for: ${subjectName}`);

		for (const examQuestion of examQuestions) {
			await db
				.insert(schema.examQuestion)
				.values({
					curriculumSubjectId: curriculumSubject.id,
					question: examQuestion.question,
					answer: examQuestion.answer,
					yearLevel: yearLevelEnum.VCE
				});
		}

		console.log(`  Added ${examQuestions.length} exam questions`);
	}

	console.log('Completed processing VCE exam questions.');
}

/**
 * Main VCAA seeding function
 * @param dbInstance - Database instance to use (required when called from main seed script)
 */
export async function seedVCAA(dbInstance: NodePgDatabase<typeof schema>) {
	// Use provided db instance
	db = dbInstance;
	
	console.log('========================================');
	console.log('Starting VCAA curriculum seeding');
	console.log('========================================\n');

	try {
		// Seed VC2 Foundation to Year 10
		await seedVC2Curriculum();
		
		console.log('');
		
		// Seed VCE 2025
		await seedVCECurriculum();
		
		console.log('\n========================================');
		console.log('VCAA curriculum seeding completed successfully!');
		console.log('========================================');
	} catch (error) {
		console.error('Error during VCAA seeding:', error);
		throw error;
	}
}

// Standalone execution - create own db connection
// Check if this file is being run directly (not imported)
const isMainModule = import.meta.url.endsWith('/VCAA/index.ts') && 
	(process.argv[1]?.includes('VCAA') || process.argv[1]?.endsWith('VCAA'));

if (isMainModule) {
	console.log('Running VCAA seed as standalone script...');
	
	// Create a standalone database connection for VCAA seeding only
	const { drizzle } = await import('drizzle-orm/node-postgres');
	const { Pool } = await import('pg');
	const schema = await import('../../schema/index.js');

	const pool = new Pool({
		host: env.DB_HOST,
		port: parseInt(env.DB_PORT || '5432', 10),
		user: env.DB_USER,
		password: env.DB_PASSWORD,
		database: env.DB_NAME,
	});
	const standaloneDb = drizzle(pool, { schema });

	seedVCAA(standaloneDb)
		.then(() => {
			console.log('VCAA seeding completed');
			return pool.end();
		})
		.then(() => {
			process.exit(0);
		})
		.catch((error) => {
			console.error('VCAA seeding failed:', error);
			process.exit(1);
		});
} 
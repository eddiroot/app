import { subjectGroupEnum } from '$lib/enums';
import { getSubjectBySubjectOfferingId } from '$lib/server/db/service';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { subjectGroupOutputSchema } from '../../schemas/subject';

// =============================================================================
// Types
// =============================================================================

export interface SubjectGroupAnalysisInput {
	subjectOfferingId: number;
}

export interface SubjectGroupAnalysisOutput {
	subjectGroup: subjectGroupEnum;
	subjectName: string;
}

// =============================================================================
// Subject Group Analysis Node
// =============================================================================

/**
 * Creates a node that infers the subject group from the subject name
 * Uses LLM to classify the subject into one of the predefined groups
 */
export function createSubjectGroupAnalysisNode(llm: BaseChatModel) {
	return async (input: SubjectGroupAnalysisInput): Promise<SubjectGroupAnalysisOutput> => {
		// 1. Get subject name from database
		const subject = await getSubjectBySubjectOfferingId(input.subjectOfferingId);

		if (!subject) {
			throw new Error(`Subject not found for offering ID: ${input.subjectOfferingId}`);
		}

		const subjectName = subject.name;

		// 2. Use LLM to classify the subject
		const structuredLlm = llm.withStructuredOutput(subjectGroupOutputSchema);

		const result = await structuredLlm.invoke(buildSubjectGroupPrompt(subjectName));

		return {
			subjectGroup: result.subjectGroup,
			subjectName
		};
	};
}

/**
 * Builds the prompt for subject group classification
 */
function buildSubjectGroupPrompt(subjectName: string): string {
	const groupDescriptions = {
		[subjectGroupEnum.mathematics]:
			'Mathematics, Maths, Calculus, Algebra, Geometry, Statistics, Numeracy, Further Maths, Mathematical Methods, Specialist Maths',
		[subjectGroupEnum.science]:
			'Science, Physics, Chemistry, Biology, Environmental Science, Earth Science, Psychology, Science subjects',
		[subjectGroupEnum.english]:
			'English, Literature, Language Arts, Writing, Reading, Creative Writing, English Language, EAL, History, Geography, Economics, Business, Legal Studies, Politics, Philosophy, Sociology, Languages, Arts, Music, Health, PE, Technology'
	};

	const groupList = Object.entries(groupDescriptions)
		.map(([group, examples]) => `- **${group}**: ${examples}`)
		.join('\n');

	return `Classify the following subject into one of the subject groups.

**Subject Name:** ${subjectName}

**Available Subject Groups:**
${groupList}

Note: If the subject doesn't clearly fit into mathematics or science, classify it as english (which covers humanities, arts, and general subjects).

Determine which subject group best matches "${subjectName}". Consider the subject name, common variations, and typical curriculum areas.`;
}

/**
 * Quick lookup for common subjects without LLM call
 * Returns undefined if the subject needs LLM classification
 */
export function quickSubjectGroupLookup(subjectName: string): subjectGroupEnum | undefined {
	const normalizedName = subjectName.toLowerCase().trim();

	// Mathematics
	if (
		/\b(math|maths|mathematics|calculus|algebra|geometry|statistics|numeracy|further.*math|mathematical.*methods|specialist.*math)\b/i.test(
			normalizedName
		)
	) {
		return subjectGroupEnum.mathematics;
	}

	// Science
	if (
		/\b(science|physics|chemistry|biology|environmental|earth.*science|psychology)\b/i.test(
			normalizedName
		)
	) {
		return subjectGroupEnum.science;
	}

	// English (and everything else - humanities, languages, arts, technology, health, etc.)
	if (
		/\b(english|literature|language|creative.*writing|eal|history|geography|economics|business|legal|politics|philosophy|sociology|religion|civics|french|spanish|german|japanese|chinese|italian|indonesian|latin|greek|art|arts|visual.*art|music|drama|theatre|dance|media|film|design|photography|technology|computing|computer|it|digital|software|programming|engineering|robotics|systems|health|physical.*education|pe|sport|outdoor|food.*tech|hhd|human.*development)\b/i.test(
			normalizedName
		)
	) {
		return subjectGroupEnum.english;
	}

	// Not found - needs LLM
	return undefined;
}

/**
 * Creates an optimized node that tries quick lookup first, then falls back to LLM
 */
export function createOptimizedSubjectGroupNode(llm: BaseChatModel) {
	const llmNode = createSubjectGroupAnalysisNode(llm);

	return async (input: SubjectGroupAnalysisInput): Promise<SubjectGroupAnalysisOutput> => {
		// 1. Get subject name from database
		const subject = await getSubjectBySubjectOfferingId(input.subjectOfferingId);

		if (!subject) {
			throw new Error(`Subject not found for offering ID: ${input.subjectOfferingId}`);
		}

		const subjectName = subject.name;

		// 2. Try quick lookup first
		const quickResult = quickSubjectGroupLookup(subjectName);

		if (quickResult) {
			return {
				subjectGroup: quickResult,
				subjectName
			};
		}

		// 3. Fall back to LLM classification
		return llmNode(input);
	};
}

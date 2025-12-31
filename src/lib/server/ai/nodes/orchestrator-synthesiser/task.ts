import { taskTypeEnum, yearLevelEnum } from '$lib/enums';
import type { Document } from '@langchain/core/documents';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { buildOrchestratorPrompt } from '../../prompts/task';
import { orchestratorOutputSchema } from '../../schemas/task';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface ContentSection {
	scope: string;
	content: string;
	index: number;
}

export interface ContentOrchestratorInput {
	taskType: taskTypeEnum;
	title: string;
	yearLevel: yearLevelEnum;
	description?: string;
	retrievedContent: Document[];
}

export interface ContentOrchestratorOutput {
	sections: ContentSection[];
	taskDescription: string;
}

export function createOrchestratorNode(llm: BaseChatModel) {
	return async (input: ContentOrchestratorInput): Promise<ContentOrchestratorOutput> => {
		const prompt = buildOrchestratorPrompt(input);

		const structuredLLM = llm.withStructuredOutput(orchestratorOutputSchema);
		const result = await structuredLLM.invoke(prompt);

		// Add indices to sections
		const sections: ContentSection[] = result.sections.map((section, index) => ({
			scope: section.scope,
			content: section.content,
			index
		}));

		return {
			sections,
			taskDescription: result.taskDescription
		};
	};
}

import { subjectGroupEnum, taskTypeEnum } from '$lib/enums';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { z } from 'zod';
import { buildTaskBlockPrompt } from '../../prompts/task-block';
import type { ContentSection } from '../../schemas/task';
import {
	buildBlockUnionSchema,
	getBlockTypesForSubjectGroup,
	taskBlockSchema
} from '../../schemas/task-block';

// =============================================================================
// Types
// =============================================================================

export type TaskBlock = z.infer<typeof taskBlockSchema>;

// Extended block type with ordering metadata for assembly
export type OrderedBlock = TaskBlock & {
	_sectionIndex: number;
	_blockIndex: number;
};

export interface BlockGenerationInput {
	contentSection: ContentSection;
	taskType: taskTypeEnum;
	subjectGroup: subjectGroupEnum;
}

export interface BlockGenerationOutput {
	blocks: TaskBlock[];
	sectionIndex: number;
}

export function multiBlockGenerationNode(llm: BaseChatModel) {
	return async (input: BlockGenerationInput): Promise<BlockGenerationOutput> => {
		const blockTypes = getBlockTypesForSubjectGroup(input.subjectGroup);
		const outputSchema = buildBlockUnionSchema(blockTypes, input.taskType);
		const structuredLLM = llm.withStructuredOutput(outputSchema);

		// Build prompt
		const sectionContent =
			'Scope: ' + input.contentSection.scope + '\n\nContent: ' + input.contentSection.content;
		const prompt = buildTaskBlockPrompt(blockTypes, input.taskType, sectionContent);

		const blocks = await structuredLLM.invoke(prompt);

		return {
			blocks: blocks as z.infer<typeof taskBlockSchema>[],
			sectionIndex: input.contentSection.index
		};
	};
}

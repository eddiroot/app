import { subjectGroupEnum, taskBlockTypeEnum, taskTypeEnum } from '$lib/enums';
import { z } from 'zod';

// =================================================================================
// Schemas and Converters for Task Blocks
// =================================================================================

/**
 * Block extension schemas
 */

export const criteriaItemSchema = z.object({
	description: z.string(),
	marks: z.number().describe('Number of marks allocated to this criteria item')
});

export const markSchema = z.object({
	marks: z.number().describe('Number of marks awarded for this task block')
});

export const difficultySchema = z
	.enum(['beginner', 'intermediate', 'advanced'])
	.describe('Difficulty level for the task block');

export const hintsSchema = z
	.array(z.string())
	.min(3)
	.max(3)
	.describe('Array of exactly 3 progressive hints to help students');

export const stepsSchema = z
	.array(z.string())
	.min(1)
	.describe('Array of step-by-step solution breakdown');

/**
 * Block: Heading
 */

export const blockHeadingSchema = z.object({
	type: z.enum([taskBlockTypeEnum.heading]),
	config: z.object({
		text: z.string(),
		size: z.number()
	})
});

/**
 * Block: Rich Text
 */
export const blockRichTextSchema = z.object({
	type: z.enum([taskBlockTypeEnum.richText]),
	config: z.object({
		html: z.string()
	})
});

/**
 * Block: Math Input
 */

export const blockMathInputSchema = z.object({
	type: z.enum([taskBlockTypeEnum.mathInput]),
	config: z.object({
		question: z.string(),
		answer: z.string()
	})
});

export const blockMathInputAssessmentSchema = z.object({
	type: z.enum([taskBlockTypeEnum.mathInput]),
	config: blockMathInputSchema.shape.config.extend({
		criteria: z.array(criteriaItemSchema).min(1)
	})
});

/**
 * Block: Choice
 */

export const blockChoiceSchema = z.object({
	type: z.enum([taskBlockTypeEnum.choice]),
	config: z.object({
		question: z.string(),
		options: z
			.array(
				z.object({
					text: z.string(),
					isAnswer: z.boolean()
				})
			)
			.describe(
				'Array of objects containing the choices and whether that choice is an answer. To make only a single answer valid, the array should contain only one item with isAnswer as true.'
			)
	})
});

export const blockChoiceAssessmentSchema = z.object({
	type: z.enum([taskBlockTypeEnum.choice]),
	config: blockChoiceSchema.shape.config.extend({
		markSchema
	})
});

/**
 * Block: Fill in the Blank
 */

export const blockFillBlankSchema = z.object({
	type: z.enum([taskBlockTypeEnum.fillBlank]),
	config: z.object({
		sentence: z.string(),
		answers: z.array(z.string())
	})
});

export const blockFillBlankAssessmentSchema = z.object({
	type: z.enum([taskBlockTypeEnum.fillBlank]),
	config: blockFillBlankSchema.shape.config.extend({
		markSchema
	})
});

/**
 * Block: Matching
 */

export const blockMatchingSchema = z.object({
	type: z.enum([taskBlockTypeEnum.matching]),
	config: z.object({
		instructions: z.string(),
		pairs: z.array(
			z.object({
				left: z.string(),
				right: z.string()
			})
		)
	})
});

export const blockMatchingAssessmentSchema = z.object({
	type: z.enum([taskBlockTypeEnum.matching]),
	config: blockMatchingSchema.shape.config.extend({
		markSchema
	})
});

/**
 * Block: Short Answer
 */

export const blockShortAnswerSchema = z.object({
	type: z.enum([taskBlockTypeEnum.shortAnswer]),
	config: z.object({
		question: z.string()
	})
});

export const blockShortAnswerAssessmentSchema = z.object({
	type: z.enum([taskBlockTypeEnum.shortAnswer]),
	config: blockShortAnswerSchema.shape.config.extend({
		criteria: z.array(criteriaItemSchema).min(1)
	})
});

/**
 * Block: Close
 */

export const blockCloseSchema = z.object({
	type: z.enum([taskBlockTypeEnum.close]),
	config: z.object({
		text: z.string()
	})
});

export const blockCloseAssessmentSchema = z.object({
	type: z.enum([taskBlockTypeEnum.close]),
	config: blockCloseSchema.shape.config.extend({
		criteria: z.array(criteriaItemSchema).min(1)
	})
});

/**
 * Block: Highlight Text
 */

export const blockHighlightTextSchema = z.object({
	type: z.enum([taskBlockTypeEnum.highlightText]),
	config: z.object({
		text: z.string(),
		instructions: z.string(),
		highlightCorrect: z.boolean()
	})
});

export const blockHighlightTextAssessmentSchema = z.object({
	type: z.enum([taskBlockTypeEnum.highlightText]),
	config: blockHighlightTextSchema.shape.config.extend({
		markSchema
	})
});

/**
 * Block: Table
 */

export const blockTableSchema = z.object({
	type: z.enum([taskBlockTypeEnum.table]),
	config: z.object({
		title: z.string(),
		rows: z.number(),
		columns: z.number(),
		data: z.array(z.array(z.string()))
	})
});

/**
 * Block: Whiteboard
 */

export const blockWhiteboardSchema = z.object({
	type: z.enum([taskBlockTypeEnum.whiteboard]),
	config: z.object({
		title: z.string(),
		whiteboardId: z.number().nullable()
	})
});

/**
 * Block: Graph
 */

export const blockGraphSchema = z.object({
	type: z.enum([taskBlockTypeEnum.graph]),
	config: z.object({
		title: z.string(),
		xAxisLabel: z.string(),
		yAxisLabel: z.string(),
		xRange: z.object({
			min: z.number(),
			max: z.number()
		}),
		yRange: z.object({
			min: z.number(),
			max: z.number()
		}),
		staticPlots: z.array(
			z.object({
				id: z.string(),
				equation: z.string(),
				color: z.string(),
				label: z.string()
			})
		)
	})
});

export const blockGraphAssessmentSchema = z.object({
	type: z.enum([taskBlockTypeEnum.graph]),
	config: blockGraphSchema.shape.config.extend({
		criteria: z.array(criteriaItemSchema).min(1)
	})
});

/**
 * Block: Balancing Equations
 */

export const blockBalancingEquationsSchema = z.object({
	type: z.enum([taskBlockTypeEnum.balancingEquations]),
	config: z.object({
		question: z.string().optional(),
		reactants: z.array(
			z.object({
				formula: z.string(),
				coefficient: z.number(),
				given: z.boolean()
			})
		),
		products: z.array(
			z.object({
				formula: z.string(),
				coefficient: z.number(),
				given: z.boolean()
			})
		)
	})
});

export const blockBalancingEquationsAssessmentSchema = z.object({
	type: z.enum([taskBlockTypeEnum.balancingEquations]),
	config: blockBalancingEquationsSchema.shape.config.extend({
		criteria: z.array(criteriaItemSchema).min(1)
	})
});
/**
 * Block: Image
 */

export const blockImageSchema = z.object({
	type: z.enum([taskBlockTypeEnum.image]),
	config: z.object({
		path: z.string(),
		altText: z.string()
	})
});

/**
 * Block: Video
 */

export const blockVideoSchema = z.object({
	type: z.enum([taskBlockTypeEnum.video]),
	config: z.object({
		url: z.string(),
		altText: z.string()
	})
});

/**
 * Block: Audio
 */

export const blockAudioSchema = z.object({
	type: z.enum([taskBlockTypeEnum.audio]),
	config: z.object({
		path: z.string(),
		altText: z.string()
	})
});

// =================================================================================
// Schemas and Converters for Task Block Responses
// =================================================================================

/**
 * Response: Math Input
 */
export const blockMathInputResponseSchema = z.object({
	answer: z.string()
});

/**
 * Response: Choice
 */
export const blockChoiceResponseSchema = z.object({
	answers: z.array(z.string())
});

/**
 * Response: Fill in the Blank
 */
export const blockFillBlankResponseSchema = z.object({
	answers: z.array(z.string())
});

/**
 * Response: Matching
 */
export const blockMatchingResponseSchema = z.object({
	matches: z.array(
		z.object({
			left: z.string(),
			right: z.string()
		})
	)
});

/**
 * Response: Short Answer
 */
export const blockShortAnswerResponseSchema = z.object({
	answer: z.string()
});

/**
 * Response: Close (Close/Answer Blank)
 */
export const blockCloseResponseSchema = z.object({
	answers: z.array(z.string())
});

/**
 * Response: Highlight Text
 */
export const blockHighlightTextResponseSchema = z.object({
	selectedText: z.array(z.string())
});

/**
 * Response: Graph
 */
export const blockGraphResponseSchema = z.object({
	studentPlots: z.array(
		z.object({
			id: z.string(),
			equation: z.string(),
			color: z.string(),
			label: z.string()
		})
	)
});

/**
 * Response: Balancing Equations
 */
export const blockBalancingEquationsResponseSchema = z.object({
	coefficients: z.object({
		reactants: z.array(z.number()),
		products: z.array(z.number())
	})
});

/**
 * Union of all task block response schemas
 */
export const taskBlockResponseSchema = z.union([
	blockMathInputResponseSchema,
	blockChoiceResponseSchema,
	blockFillBlankResponseSchema,
	blockMatchingResponseSchema,
	blockShortAnswerResponseSchema,
	blockCloseResponseSchema,
	blockHighlightTextResponseSchema,
	blockGraphResponseSchema,
	blockBalancingEquationsResponseSchema
]);

/**
 * Union of all task block schemas (without layouts)
 */

export const taskBlockSchema = z.union([
	blockHeadingSchema,
	blockRichTextSchema,
	blockMathInputSchema,
	blockChoiceSchema,
	blockFillBlankSchema,
	blockMatchingSchema,
	blockShortAnswerSchema,
	blockCloseSchema,
	blockHighlightTextSchema,
	blockTableSchema,
	blockWhiteboardSchema,
	blockGraphSchema,
	blockBalancingEquationsSchema,
	blockImageSchema,
	blockVideoSchema,
	blockAudioSchema
]);

/**
 * Layout Schema
 */

export const layoutTwoColumnsSchema = z.object({
	type: z.enum(['col_2']),
	config: z.object({
		leftColumn: z.array(taskBlockSchema),
		rightColumn: z.array(taskBlockSchema)
	})
});

export const taskLayoutSchemas = [layoutTwoColumnsSchema];

// Combined schema for all task items (components + layouts)
export const taskBlocksAndLayoutsSchema = z.union([taskBlockSchema, layoutTwoColumnsSchema]);

/** ==============================================================================
 *                                  Helper Functions
 *
 * Functions to help with block schema management
 *
 */

/**
 * Mapping block types to their schemas (for easy lookup)
 */
export const blockTypeToSchemaMap: Record<taskBlockTypeEnum, z.ZodSchema> = {
	[taskBlockTypeEnum.heading]: blockHeadingSchema,
	[taskBlockTypeEnum.richText]: blockRichTextSchema,
	[taskBlockTypeEnum.mathInput]: blockMathInputSchema,
	[taskBlockTypeEnum.choice]: blockChoiceSchema,
	[taskBlockTypeEnum.fillBlank]: blockFillBlankSchema,
	[taskBlockTypeEnum.matching]: blockMatchingSchema,
	[taskBlockTypeEnum.shortAnswer]: blockShortAnswerSchema,
	[taskBlockTypeEnum.close]: blockCloseSchema,
	[taskBlockTypeEnum.highlightText]: blockHighlightTextSchema,
	[taskBlockTypeEnum.table]: blockTableSchema,
	[taskBlockTypeEnum.whiteboard]: blockWhiteboardSchema,
	[taskBlockTypeEnum.graph]: blockGraphSchema,
	[taskBlockTypeEnum.balancingEquations]: blockBalancingEquationsSchema,
	[taskBlockTypeEnum.image]: blockImageSchema,
	[taskBlockTypeEnum.video]: blockVideoSchema,
	[taskBlockTypeEnum.audio]: blockAudioSchema
};

/**
 * Get the Zod response schema for a specific task block type
 * @param blockType
 * @returns
 */
export function getBlockResponseSchema(blockType: taskBlockTypeEnum): z.ZodSchema | undefined {
	return blockTypeToResponseSchemaMap[blockType];
}

/**
 * Mapping block types to their response schemas (for easy lookup)
 * Only interactive blocks that require student responses have entries
 */
export const blockTypeToResponseSchemaMap: Partial<Record<taskBlockTypeEnum, z.ZodSchema>> = {
	[taskBlockTypeEnum.mathInput]: blockMathInputResponseSchema,
	[taskBlockTypeEnum.choice]: blockChoiceResponseSchema,
	[taskBlockTypeEnum.fillBlank]: blockFillBlankResponseSchema,
	[taskBlockTypeEnum.matching]: blockMatchingResponseSchema,
	[taskBlockTypeEnum.shortAnswer]: blockShortAnswerResponseSchema,
	[taskBlockTypeEnum.close]: blockCloseResponseSchema,
	[taskBlockTypeEnum.highlightText]: blockHighlightTextResponseSchema,
	[taskBlockTypeEnum.graph]: blockGraphResponseSchema,
	[taskBlockTypeEnum.balancingEquations]: blockBalancingEquationsResponseSchema
};

/**
 * Mapping of block types to their assessment schemas
 */
export const blockTypeToAssessmentSchemaMap: Partial<Record<taskBlockTypeEnum, z.ZodSchema>> = {
	[taskBlockTypeEnum.mathInput]: blockMathInputAssessmentSchema,
	[taskBlockTypeEnum.choice]: blockChoiceAssessmentSchema,
	[taskBlockTypeEnum.fillBlank]: blockFillBlankAssessmentSchema,
	[taskBlockTypeEnum.matching]: blockMatchingAssessmentSchema,
	[taskBlockTypeEnum.shortAnswer]: blockShortAnswerAssessmentSchema,
	[taskBlockTypeEnum.close]: blockCloseAssessmentSchema,
	[taskBlockTypeEnum.highlightText]: blockHighlightTextAssessmentSchema,
	[taskBlockTypeEnum.graph]: blockGraphAssessmentSchema,
	[taskBlockTypeEnum.balancingEquations]: blockBalancingEquationsAssessmentSchema
};

/**
 * List of block types considered "Interactive" (require student input)
 */
export const INTERACTIVE_BLOCK_TYPES: taskBlockTypeEnum[] = [
	taskBlockTypeEnum.mathInput,
	taskBlockTypeEnum.choice,
	taskBlockTypeEnum.fillBlank,
	taskBlockTypeEnum.matching,
	taskBlockTypeEnum.shortAnswer,
	taskBlockTypeEnum.close,
	taskBlockTypeEnum.highlightText,
	taskBlockTypeEnum.graph,
	taskBlockTypeEnum.balancingEquations
];

/**
 * Check if a block type is interactive
 */
export function isInteractiveBlock(blockType: taskBlockTypeEnum): boolean {
	return INTERACTIVE_BLOCK_TYPES.includes(blockType);
}

/**
 * Get the Zod schema for a specific task block type
 */
export function getBlockSchema(blockType: taskBlockTypeEnum): z.ZodSchema | undefined {
	return blockTypeToSchemaMap[blockType];
}

/**
 * Get the assessment Zod schema for a specific task block type
 */
export function getAssessmentBlockSchema(blockType: taskBlockTypeEnum): z.ZodSchema | undefined {
	return blockTypeToAssessmentSchemaMap[blockType] ?? blockTypeToSchemaMap[blockType];
}

/**
 * Get the list of allowed block types for a specific subject group
 */
export function getBlockTypesForSubjectGroup(subjectGroup: subjectGroupEnum): taskBlockTypeEnum[] {
	switch (subjectGroup) {
		case subjectGroupEnum.mathematics:
			return [
				taskBlockTypeEnum.heading,
				taskBlockTypeEnum.richText,
				taskBlockTypeEnum.mathInput,
				taskBlockTypeEnum.graph,
				taskBlockTypeEnum.table
			];
		case subjectGroupEnum.science:
			return [
				taskBlockTypeEnum.heading,
				taskBlockTypeEnum.richText,
				taskBlockTypeEnum.choice,
				taskBlockTypeEnum.fillBlank,
				taskBlockTypeEnum.balancingEquations,
				taskBlockTypeEnum.table
			];
		case subjectGroupEnum.english:
			return [
				taskBlockTypeEnum.heading,
				taskBlockTypeEnum.richText,
				taskBlockTypeEnum.shortAnswer,
				taskBlockTypeEnum.close,
				taskBlockTypeEnum.highlightText
			];
		default:
			return [
				taskBlockTypeEnum.heading,
				taskBlockTypeEnum.richText,
				taskBlockTypeEnum.choice,
				taskBlockTypeEnum.shortAnswer,
				taskBlockTypeEnum.matching,
				taskBlockTypeEnum.fillBlank
			];
	}
}

/**
 * Get block types for generation based on subject group and task type
 * Returns the appropriate block types considering whether it's an assessment
 */
export function getBlockTypesForGeneration(subjectGroup: subjectGroupEnum): taskBlockTypeEnum[] {
	return getBlockTypesForSubjectGroup(subjectGroup);
}

/**
 * Get the Zod schemas for block types, using assessment schemas when appropriate
 */
export function getSchemasForBlockTypes(
	blockTypes: taskBlockTypeEnum[],
	taskType: taskTypeEnum
): z.ZodSchema[] {
	const isAssessment = taskType === taskTypeEnum.test || taskType === taskTypeEnum.assignment;

	return blockTypes
		.map((blockType) => {
			if (isAssessment && isInteractiveBlock(blockType)) {
				return getAssessmentBlockSchema(blockType) ?? getBlockSchema(blockType)!;
			}
			return getBlockSchema(blockType)!;
		})
		.filter(Boolean);
}

/**
 * Build a union schema from an array of block types
 */
export function buildBlockUnionSchema(
	blockTypes: taskBlockTypeEnum[],
	taskType: taskTypeEnum
): z.ZodSchema {
	const schemas = getSchemasForBlockTypes(blockTypes, taskType);

	if (schemas.length === 0) {
		throw new Error('No valid schemas found for the given block types');
	}

	if (schemas.length === 1) {
		return z.array(schemas[0]);
	}

	// Create a union of all schemas wrapped in an array
	return z.array(z.union(schemas as [z.ZodSchema, z.ZodSchema, ...z.ZodSchema[]]));
}

/**
 * @deprecated Use getBlockTypesForSubjectGroup instead
 */
export function getBlocksForSubjectGroup(subjectGroup: subjectGroupEnum): z.ZodSchema[] {
	const blockTypes = getBlockTypesForSubjectGroup(subjectGroup);
	return blockTypes.map((type) => blockTypeToSchemaMap[type]);
}

/**
 * @deprecated Use getSchemasForBlockTypes with taskType instead
 */
export function getAssessmentBlocksForSubjectGroup(subjectGroup: subjectGroupEnum): z.ZodSchema[] {
	const blockTypes = getBlockTypesForSubjectGroup(subjectGroup);
	return blockTypes.map(
		(type) => blockTypeToAssessmentSchemaMap[type] ?? blockTypeToSchemaMap[type]
	);
}

/**
 * Dynamically extend a block schema with assessment fields
 * @param baseSchema - The base block schema to extend
 * @param requirements - Which fields to include
 */
export function extendBlockSchema<T extends z.ZodTypeAny>(
	baseSchema: T,
	requirements: {
		includeDifficulty?: boolean;
		includeHints?: boolean;
		includeSteps?: boolean;
	} = {}
): z.ZodSchema {
	const { includeDifficulty = false, includeHints = false, includeSteps = false } = requirements;

	// Build extension object for config
	const configExtensions: Record<string, z.ZodTypeAny> = {};

	if (includeDifficulty) {
		configExtensions.difficulty = difficultySchema;
	}

	if (includeHints) {
		configExtensions.hints = hintsSchema;
	}

	if (includeSteps) {
		configExtensions.steps = stepsSchema;
	}

	// If no extensions, return original schema
	if (Object.keys(configExtensions).length === 0) {
		return baseSchema;
	}

	// Parse the base schema
	if (baseSchema instanceof z.ZodObject) {
		const shape = baseSchema.shape;

		// Check if the schema has a 'config' field that's also a ZodObject
		if (shape.config && shape.config instanceof z.ZodObject) {
			const extendedConfig = shape.config.extend(configExtensions);

			return z.object({
				type: shape.type,
				config: extendedConfig
			});
		}
	}

	// If schema structure doesn't match expected format, return as-is
	return baseSchema;
}

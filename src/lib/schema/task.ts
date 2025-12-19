/* eslint-disable @typescript-eslint/no-explicit-any */
import { taskBlockTypeEnum } from '$lib/enums';

export const taskCreationPrompts = {
	lesson: (
		title: string,
		description: string = ''
	) => `Use the following as background context to help generate an educational lesson:
Title: ${title}
${description ? `Description: ${description}` : ''}

Analyse the attached documents/images and create a comprehensive lesson with:
    1. A subtitle as a h2. Do not include a title.
    2. A number of sections matching the complexity of the content. Sections shouldn't be too long. Sections should have appropriate headers (h1, h2, h3)
    3. Explanatory content using paragraphs and markdown
    4. Interactive elements to engage students including:
        - Multiple choice questions (both single and multiple answer), and answers are string of options (not a,b,c or 1,2,3) - component type: multiple_choice
        - Fill in the blank questions (use the format "_____" for blanks, 5 underscores) limit to maximum 3 - component type: fill_in_blank
				- Math input problems (if applicable) for calculation practice - component type: math_input
    5. A good balance of explanation and interactive practice
Each component should be structured according to the provided schema. Ignore the short answer component type as it is not needed for lessons.`,

	homework: (
		title: string,
		description: string = ''
	) => `Use the following as background context to help generate homework assignments:
Title: ${title}
${description ? `Description: ${description}` : ''}

Analyse the attached documents/images and create homework that reinforces learning with:
    - Focus primarily on these question components: short_answer, matching, fill_in_blank, multiple_choice, and math_input. Use headers and paragraphs only when introducing or explaining questions.
    - Ensure you include at least one \`short_answer\` component for open-ended written responses.
    1. A subtitle as a h2 about the homework. Do not include a title.
    2. Brief instructions or review sections with headers (h2, h3, h4, h5, h6)
    3. Practice problems and exercises including:
        - Multiple choice questions for self-assessment (make sure answers are string of options (not a,b,c or 1,2,3))
        - Fill in the blank exercises for key concepts (use the format "_____" for blanks, 5 underscores) limit to maximum 3
        - Math input problems (if applicable) for calculation practice
        - Text input questions for written responses
        - Matching activities to connect concepts
    4. Focus primarily on practice questions rather than lengthy explanations
    5. Progressive difficulty from basic recall to application
    6. Clear instructions for each section
    - For every block that has an **answer**, also include a **marks** field (number ≥ 1).
    - If a block includes **criteria**, provide one or more criteria objects:
        • Each object needs { description, marks }
        • The sum of criteria.marks must equal the block's marks.
    - In lessons, you may leave marks blank or 0; in homework and assessments, marks are required.
Each component should be structured according to the provided schema. Prioritize interactive practice over explanatory content.`,

	test: (
		title: string,
		description: string = ''
	) => `Use the following as background context to help generate a comprehensive assessment:
Title: ${title}
${description ? `Description: ${description}` : ''}

Analyse the attached documents/images and create an assessment that evaluates student understanding with:
    - Focus primarily on these question components: short_answer, matching, fill_in_blank, multiple_choice, and math_input. Use headers and paragraphs only when introducing or explaining questions.
    - Ensure you include at least one \`short_answer\` component for open-ended evaluation.
    1. A clear assessment subtitle and brief instructions. Do not include a title.
    2. Varied question types to test different skill levels:
        - Multiple choice questions (both single and multiple answer) for knowledge and comprehension (make sure answers are string of options (not a,b,c or 1,2,3))
        - Fill in the blank questions for key terminology and concepts (use the format "_____" for blanks, 5 underscores) limit to maximum 3
        - Math input questions (if applicable) for problem-solving skills
        - Text input questions for analysis and evaluation
        - Matching activities for concept connections
    3. Questions that progress from basic recall to higher-order thinking
    4. Clear, unambiguous question wording
    5. Comprehensive coverage of the topic material
    6. Minimal explanatory content - focus on evaluation questions
    - For every block that has an **answer**, also include a **marks** field (number ≥ 1).
    - If a block includes **criteria**, provide one or more criteria objects:
        • Each object needs { description, marks }
        • The sum of criteria.marks must equal the block's marks.
    - In lessons, you may leave marks blank or 0; in homework and assessments, marks are required.
Each component should be structured according to the provided schema. Prioritize assessment questions over instructional content.`,

	assignment: (
		title: string,
		description: string = ''
	) => `Use the following as background context to help generate a comprehensive assessment:
Title: ${title}
${description ? `Description: ${description}` : ''}

Analyse the attached documents/images and create an assessment that evaluates student understanding with:
    - Focus primarily on these question components: short_answer, matching, fill_in_blank, multiple_choice, and math_input. Use headers and paragraphs only when introducing or explaining questions.
    - Ensure you include at least one \`short_answer\` component for open-ended evaluation.
    1. A clear assessment subtitle and brief instructions. Do not include a title.
    2. Varied question types to test different skill levels:
        - Multiple choice questions (both single and multiple answer) for knowledge and comprehension (make sure answers are string of options (not a,b,c or 1,2,3))
        - Fill in the blank questions for key terminology and concepts (use the format "_____" for blanks, 5 underscores) limit to maximum 3
        - Math input questions (if applicable) for problem-solving skills
        - Text input questions for analysis and evaluation
        - Matching activities for concept connections
    3. Questions that progress from basic recall to higher-order thinking
    4. Clear, unambiguous question wording
    5. Comprehensive coverage of the topic material
    6. Minimal explanatory content - focus on evaluation questions
    - For every block that has an **answer**, also include a **marks** field (number ≥ 1).
    - If a block includes **criteria**, provide one or more criteria objects:
        • Each object needs { description, marks }
        • The sum of criteria.marks must equal the block's marks.
    - In lessons, you may leave marks blank or 0; in homework and assessments, marks are required.
Each component should be structured according to the provided schema. Prioritize assessment questions over instructional content.`,

	module: (
		title: string,
		description: string = ''
	) => `Use the following as background context to help generate a comprehensive assessment:
Title: ${title}
${description ? `Description: ${description}` : ''}

Analyse the attached documents/images and create an assessment that evaluates student understanding with:
    - Focus primarily on these question components: short_answer, matching, fill_in_blank, multiple_choice, and math_input. Use headers and paragraphs only when introducing or explaining questions.
    - Ensure you include at least one \`short_answer\` component for open-ended evaluation.
    1. A clear assessment subtitle and brief instructions. Do not include a title.
    2. Varied question types to test different skill levels:
        - Multiple choice questions (both single and multiple answer) for knowledge and comprehension (make sure answers are string of options (not a,b,c or 1,2,3))
        - Fill in the blank questions for key terminology and concepts (use the format "_____" for blanks, 5 underscores) limit to maximum 3
        - Math input questions (if applicable) for problem-solving skills
        - Text input questions for analysis and evaluation
        - Matching activities for concept connections
    3. Questions that progress from basic recall to higher-order thinking
    4. Clear, unambiguous question wording
    5. Comprehensive coverage of the topic material
    6. Minimal explanatory content - focus on evaluation questions
    - For every block that has an **answer**, also include a **marks** field (number ≥ 1).
    - If a block includes **criteria**, provide one or more criteria objects:
        • Each object needs { description, marks }
        • The sum of criteria.marks must equal the block's marks.
    - In lessons, you may leave marks blank or 0; in homework and assessments, marks are required.
Each component should be structured according to the provided schema. Prioritize assessment questions over instructional content.`
};

const criteriaItem = {
	type: 'object',
	properties: {
		description: { type: 'string' },
		marks: { type: 'number' }
	},
	required: ['description', 'marks']
};

const difficultyItem = {
	type: 'string',
	enum: ['beginner', 'intermediate', 'advanced'],
	description: 'Difficulty level for the task block'
};

const hintsItem = {
	type: 'array',
	items: { type: 'string' },
	minItems: 3,
	maxItems: 3,
	description: 'Array of exactly 3 progressive hints to help students'
};

const stepsItem = {
	type: 'array',
	items: { type: 'string' },
	minItems: 1,
	description: 'Array of step-by-step solution breakdown'
};

export const blockHeading = {
	type: 'object',
	properties: {
		type: { type: 'string', enum: [taskBlockTypeEnum.heading] },
		config: {
			type: 'object',
			properties: {
				text: { type: 'string' },
				size: { type: 'number' }
			},
			required: ['text', 'size']
		}
	},
	required: ['type', 'config']
};

export type BlockHeadingConfig = {
	text: string;
	size: number;
};

export const blockRichText = {
	type: 'object',
	properties: {
		type: { type: 'string', enum: [taskBlockTypeEnum.richText] },
		config: {
			type: 'object',
			properties: {
				html: { type: 'string' }
			},
			required: ['html']
		}
	},
	required: ['type', 'config']
};

export type BlockRichTextConfig = {
	html: string;
};

export const blockMathInput = {
	type: 'object',
	properties: {
		type: { type: 'string', enum: [taskBlockTypeEnum.mathInput] },
		config: {
			type: 'object',
			properties: {
				text: { type: 'string' },
				question: { type: 'string' },
				answer: { type: 'string' }
			},
			required: ['text', 'question', 'answer']
		},
		criteria: {
			type: 'array',
			items: criteriaItem,
			minItems: 1
		},
		marks: { type: 'number' }
	},
	required: ['type', 'config', 'criteria']
};

export type BlockMathInputConfig = {
	text: string;
	question: string;
	answer: string;
	advancedMathSymbols: boolean;
};

export type BlockMathInputResponse = {
	answer: string;
};

export const blockChoice = {
	type: 'object',
	properties: {
		type: { type: 'string', enum: [taskBlockTypeEnum.choice] },
		config: {
			type: 'object',
			properties: {
				question: { type: 'string' },
				options: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							text: { type: 'string' },
							isAnswer: { type: 'boolean' }
						},
						description:
							'Array of objects containing the choices and whether that choice is an answer. To make only a single answer valid, the array should contain only one item with isAnswer as true.'
					}
				}
			},
			required: ['question', 'options']
		},
		marks: { type: 'number' }
	},
	required: ['type', 'config']
};

export type BlockChoiceConfig = {
	question: string;
	options: {
		text: string;
		isAnswer: boolean;
	}[];
};

export type BlockChoiceResponse = {
	answers: string[];
};

export const blockFillBlank = {
	type: 'object',
	properties: {
		type: { type: 'string', enum: [taskBlockTypeEnum.fillBlank] },
		config: {
			type: 'object',
			properties: {
				sentence: { type: 'string' },
				answers: {
					type: 'array',
					items: { type: 'string' }
				}
			},
			required: ['sentence', 'answers']
		},
		marks: { type: 'number' }
	},
	required: ['type', 'config']
};

export type BlockFillBlankConfig = {
	sentence: string;
	answers: string[];
};

export type BlockFillBlankResponse = {
	answers: string[];
};

export const blockMatching = {
	type: 'object',
	properties: {
		type: { type: 'string', enum: [taskBlockTypeEnum.matching] },
		config: {
			type: 'object',
			properties: {
				instructions: { type: 'string' },
				pairs: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							left: { type: 'string' },
							right: { type: 'string' }
						},
						required: ['left', 'right']
					}
				}
			},
			required: ['instructions', 'pairs']
		},
		marks: { type: 'number' }
	},
	required: ['type', 'config']
};

export type BlockMatchingConfig = {
	instructions: string;
	pairs: { left: string; right: string }[];
};

export type BlockMatchingResponse = {
	matches: { left: string; right: string }[];
};

export const blockShortAnswer = {
	type: 'object',
	properties: {
		type: { type: 'string', enum: [taskBlockTypeEnum.shortAnswer] },
		config: {
			type: 'object',
			properties: {
				question: { type: 'string' }
			},
			required: ['question']
		},
		criteria: {
			type: 'array',
			items: criteriaItem,
			minItems: 1
		},
		marks: { type: 'number' }
	},
	required: ['type', 'config', 'criteria']
};

export type BlockShortAnswerConfig = {
	question: string;
};

export type BlockShortAnswerResponse = {
	answer: string;
};

export const blockClose = {
	type: 'object',
	properties: {
		type: { type: 'string', enum: [taskBlockTypeEnum.close] },
		config: {
			type: 'object',
			properties: {
				text: { type: 'string' }
			},
			required: ['text']
		},
		criteria: {
			type: 'array',
			items: criteriaItem,
			minItems: 1
		},
		marks: { type: 'number' }
	},
	required: ['type', 'config', 'criteria']
};

export type BlockCloseConfig = {
	text: string;
};

export type BlockCloseResponse = {
	answers: string[];
};

export const blockHighlightText = {
	type: 'object',
	properties: {
		type: { type: 'string', enum: [taskBlockTypeEnum.highlightText] },
		config: {
			type: 'object',
			properties: {
				text: { type: 'string' },
				instructions: { type: 'string' }
			},
			required: ['text', 'instructions']
		},
		marks: { type: 'number' }
	},
	required: ['type', 'config']
};

export type BlockHighlightTextConfig = {
	text: string;
	instructions: string;
};

export type BlockHighlightTextResponse = {
	selectedText: string[];
};

export const blockTable = {
	type: 'object',
	properties: {
		type: { type: 'string', enum: [taskBlockTypeEnum.table] },
		config: {
			type: 'object',
			properties: {
				title: { type: 'string' },
				rows: { type: 'number' },
				columns: { type: 'number' },
				data: {
					type: 'array',
					items: {
						type: 'array',
						items: { type: 'string' }
					}
				}
			},
			required: ['title', 'rows', 'columns', 'data']
		}
	},
	required: ['type', 'config']
};

export type BlockTableConfig = {
	title: string;
	rows: number;
	columns: number;
	data: string[][];
};

export const blockWhiteboard = {
	type: 'object',
	properties: {
		type: { type: 'string', enum: [taskBlockTypeEnum.whiteboard] },
		config: {
			type: 'object',
			properties: {
				title: { type: 'string' },
				whiteboardId: { type: 'number', nullable: true }
			},
			required: ['data', 'width', 'height']
		},
		marks: { type: 'number' }
	},
	required: ['type', 'config']
};

export type BlockWhiteboardConfig = {
	title: string;
	whiteboardId: number | null;
};

export const blockGraph = {
	type: 'object',
	properties: {
		type: { type: 'string', enum: [taskBlockTypeEnum.graph] },
		config: {
			type: 'object',
			properties: {
				title: { type: 'string' },
				xAxisLabel: { type: 'string' },
				yAxisLabel: { type: 'string' },
				xRange: {
					type: 'object',
					properties: {
						min: { type: 'number' },
						max: { type: 'number' }
					},
					required: ['min', 'max']
				},
				yRange: {
					type: 'object',
					properties: {
						min: { type: 'number' },
						max: { type: 'number' }
					},
					required: ['min', 'max']
				},
				staticPlots: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							id: { type: 'string' },
							equation: { type: 'string' },
							color: { type: 'string' },
							label: { type: 'string' }
						},
						required: ['id', 'equation', 'color', 'label']
					}
				}
			},
			required: ['title', 'xAxisLabel', 'yAxisLabel', 'xRange', 'yRange', 'staticPlots']
		}
	},
	required: ['type', 'config']
};

export type BlockGraphConfig = {
	title: string;
	xAxisLabel: string;
	yAxisLabel: string;
	xRange: { min: number; max: number };
	yRange: { min: number; max: number };
	staticPlots: {
		id: string;
		equation: string;
		color: string;
		label: string;
	}[];
};

export type BlockGraphResponse = {
	studentPlots: {
		id: string;
		equation: string;
		color: string;
		label: string;
	}[];
};

export const blockBalancingEquations = {
	type: 'object',
	properties: {
		type: { type: 'string', enum: [taskBlockTypeEnum.balancingEquations] },
		config: {
			type: 'object',
			properties: {
				reactants: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							formula: { type: 'string' },
							coefficient: { type: 'number' },
							given: { type: 'boolean' }
						},
						required: ['formula', 'coefficient', 'given']
					}
				},
				products: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							formula: { type: 'string' },
							coefficient: { type: 'number' },
							given: { type: 'boolean' }
						},
						required: ['formula', 'coefficient', 'given']
					}
				}
			},
			required: ['reactants', 'products']
		},
		marks: { type: 'number' }
	},
	required: ['type', 'config']
};

export type BlockBalancingEquationsConfig = {
	question?: string;
	reactants: Array<{
		formula: string;
		coefficient: number;
		given: boolean;
	}>;
	products: Array<{
		formula: string;
		coefficient: number;
		given: boolean;
	}>;
};

export type BlockBalancingEquationsResponse = {
	coefficients: {
		reactants: number[];
		products: number[];
	};
};

export const blockImage = {
	type: 'object',
	properties: {
		type: { type: 'string', enum: [taskBlockTypeEnum.image] },
		config: {
			type: 'object',
			properties: {
				path: { type: 'string' },
				altText: { type: 'string' }
			},
			required: ['path', 'altText']
		}
	},
	required: ['type', 'config']
};

export type BlockImageConfig = {
	path: string;
	altText: string;
};

export const blockVideo = {
	type: 'object',
	properties: {
		type: { type: 'string', enum: [taskBlockTypeEnum.video] },
		config: {
			type: 'object',
			properties: {
				url: { type: 'string' },
				altText: { type: 'string' }
			},
			required: ['url', 'altText']
		}
	},
	required: ['type', 'config']
};

export type BlockVideoConfig = {
	url: string;
	altText: string;
};

export const blockAudio = {
	type: 'object',
	properties: {
		type: { type: 'string', enum: [taskBlockTypeEnum.audio] },
		config: {
			type: 'object',
			properties: {
				path: { type: 'string' },
				altText: { type: 'string' }
			},
			required: ['path', 'altText']
		}
	},
	required: ['type', 'config']
};

export type BlockAudioConfig = {
	path: string;
	altText: string;
};

export const taskBlocks = [
	blockHeading,
	blockRichText,
	blockMathInput,
	blockChoice,
	blockFillBlank,
	blockMatching,
	blockShortAnswer,
	blockClose,
	blockHighlightText,
	blockTable,
	blockGraph,
	blockBalancingEquations,
	blockImage,
	blockVideo,
	blockAudio
];

export const layoutTwoColumns = {
	type: 'object',
	properties: {
		type: { type: 'string', enum: ['col_2'] },
		config: {
			type: 'object',
			properties: {
				leftColumn: {
					type: 'array',
					items: {
						anyOf: taskBlocks
					}
				},
				rightColumn: {
					type: 'array',
					items: {
						anyOf: taskBlocks
					}
				}
			},
			required: ['leftColumn', 'rightColumn']
		}
	},
	required: ['type', 'config']
};

export const taskLayouts = [layoutTwoColumns];

// Combined schema for all task items (components + layouts)
export const taskBlocksAndLayouts = [...taskBlocks, ...taskLayouts];

export const taskSchema = {
	type: 'object',
	properties: {
		blocks: {
			type: 'array',
			items: {
				// TODO: Change to taskBlocksAndLayouts once layouts are implemented
				anyOf: taskBlocks
			}
		}
	},
	required: ['task']
};

// Union type for all possible block configs
export type BlockConfig =
	| BlockHeadingConfig
	| BlockRichTextConfig
	| BlockMathInputConfig
	| BlockChoiceConfig
	| BlockFillBlankConfig
	| BlockBalancingEquationsConfig
	| BlockMatchingConfig
	| BlockShortAnswerConfig
	| BlockWhiteboardConfig
	| BlockCloseConfig
	| BlockHighlightTextConfig
	| BlockTableConfig
	| BlockGraphConfig
	| BlockImageConfig
	| BlockVideoConfig
	| BlockAudioConfig;

export type BlockResponse =
	| BlockChoiceResponse
	| BlockFillBlankResponse
	| BlockMathInputResponse
	| BlockBalancingEquationsResponse
	| BlockMatchingResponse
	| BlockShortAnswerResponse
	| BlockCloseResponse
	| BlockHighlightTextResponse
	| BlockGraphResponse;

export type BlockProps<T extends BlockConfig = BlockConfig, Q extends BlockResponse = never> = {
	config: T;
	onConfigUpdate: (config: T) => Promise<void>;
	viewMode: ViewMode;
} & ([Q] extends [never]
	? object
	: {
			response: Q;
			onResponseUpdate: (response: Q) => Promise<void>;
		});

// Specific prop types for each block type
export type HeadingBlockProps = BlockProps<BlockHeadingConfig>;
export type RichTextBlockProps = BlockProps<BlockRichTextConfig>;
export type MathInputBlockProps = BlockProps<BlockMathInputConfig, BlockMathInputResponse>;
export type ChoiceBlockProps = BlockProps<BlockChoiceConfig, BlockChoiceResponse>;
export type FillBlankBlockProps = BlockProps<BlockFillBlankConfig, BlockFillBlankResponse>;
export type BalancingEquationsBlockProps = BlockProps<
	BlockBalancingEquationsConfig,
	BlockBalancingEquationsResponse
>;
export type MatchingBlockProps = BlockProps<BlockMatchingConfig, BlockMatchingResponse>;
export type ShortAnswerBlockProps = BlockProps<BlockShortAnswerConfig, BlockShortAnswerResponse>;
export type WhiteboardBlockProps = BlockProps<BlockWhiteboardConfig> & { blockId: number };
export type CloseBlockProps = BlockProps<BlockCloseConfig, BlockCloseResponse>;
export type HighlightTextBlockProps = BlockProps<
	BlockHighlightTextConfig,
	BlockHighlightTextResponse
>;
export type ImageBlockProps = BlockProps<BlockImageConfig>;
export type TableBlockProps = BlockProps<BlockTableConfig>;
export type GraphBlockProps = BlockProps<BlockGraphConfig, BlockGraphResponse>;
export type VideoBlockProps = BlockProps<BlockVideoConfig>;
export type AudioBlockProps = BlockProps<BlockAudioConfig>;

import type { Icon } from '@lucide/svelte';
import AudioIcon from '@lucide/svelte/icons/audio-lines';
import FlaskConicalIcon from '@lucide/svelte/icons/flask-conical';
import HeadingIcon from '@lucide/svelte/icons/heading';
import HighlighterIcon from '@lucide/svelte/icons/highlighter';
import ImageIcon from '@lucide/svelte/icons/image';
import LinkIcon from '@lucide/svelte/icons/link';
import List from '@lucide/svelte/icons/list';
import MessageSquareTextIcon from '@lucide/svelte/icons/message-square-text';
import PenToolIcon from '@lucide/svelte/icons/pen-tool';
import PilcrowIcon from '@lucide/svelte/icons/pilcrow';
import PresentationIcon from '@lucide/svelte/icons/presentation';
import MathIcon from '@lucide/svelte/icons/sigma';
import TableIcon from '@lucide/svelte/icons/table';
import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
import VideoIcon from '@lucide/svelte/icons/video';

export enum ViewMode {
	CONFIGURE = 'configure',
	ANSWER = 'answer',
	REVIEW = 'review',
	PRESENT = 'present'
}

export const blockTypes: {
	type: string;
	name: string;
	initialConfig: Record<string, unknown>;
	icon: typeof Icon;
}[] = [
	{
		type: taskBlockTypeEnum.heading,
		name: 'Heading',
		initialConfig: { text: 'Heading', size: 2 },
		icon: HeadingIcon
	},
	{
		type: taskBlockTypeEnum.richText,
		name: 'Rich Text',
		initialConfig: { html: 'This is a rich text block' },
		icon: PilcrowIcon
	},
	{
		type: taskBlockTypeEnum.whiteboard,
		name: 'Whiteboard',
		initialConfig: { data: '', width: 800, height: 600 },
		icon: PresentationIcon
	},
	{
		type: taskBlockTypeEnum.choice,
		name: 'Multiple Choice',
		initialConfig: {
			question: 'Sample multiple choice question?',
			options: [
				{ text: 'Option 1', isAnswer: false },
				{ text: 'Option 2', isAnswer: true }
			]
		},
		icon: List
	},
	{
		type: taskBlockTypeEnum.fillBlank,
		name: 'Fill Blank',
		initialConfig: {
			sentence: 'Fill in the _____ and _____.',
			answers: ['first', 'second']
		},
		icon: PenToolIcon
	},
	{
		type: taskBlockTypeEnum.close,
		name: 'Answer Blank',
		initialConfig: {
			text: 'Complete this sentence with _____ and _____.'
		},
		icon: PenToolIcon
	},
	{
		type: taskBlockTypeEnum.shortAnswer,
		name: 'Short Answer',
		initialConfig: {
			question: 'Question'
		},
		icon: MessageSquareTextIcon
	},
	{
		type: taskBlockTypeEnum.highlightText,
		name: 'Highlight',
		initialConfig: {
			text: 'The big brown fox jumps over the lazy dog.',
			instructions: 'Highlight the words that start with the letter "b".'
		},
		icon: HighlighterIcon
	},
	{
		type: taskBlockTypeEnum.matching,
		name: 'Matching Pairs',
		initialConfig: {
			instructions: 'Match the items on the left with the correct answers on the right.',
			pairs: [
				{ left: 'Item 1', right: 'Answer 1' },
				{ left: 'Item 2', right: 'Answer 2' }
			]
		},
		icon: LinkIcon
	},
	{
		type: taskBlockTypeEnum.table,
		name: 'Table',
		initialConfig: {
			title: 'Table',
			rows: 3,
			columns: 3,
			data: [
				['Header 1', 'Header 2', 'Header 3'],
				['Row 1 Col 1', 'Row 1 Col 2', 'Row 1 Col 3'],
				['Row 2 Col 1', 'Row 2 Col 2', 'Row 2 Col 3']
			]
		},
		icon: TableIcon
	},
	{
		type: taskBlockTypeEnum.graph,
		name: 'Graph',
		initialConfig: {
			title: 'Function Graph',
			xAxisLabel: 'x',
			yAxisLabel: 'y',
			xRange: { min: -10, max: 10 },
			yRange: { min: -10, max: 10 },
			staticPlots: []
		},
		icon: TrendingUpIcon
	},
	{
		type: taskBlockTypeEnum.balancingEquations,
		name: 'Balancing',
		initialConfig: {
			question: 'Balance the following chemical equation:',
			reactants: [
				{ formula: 'H2', coefficient: 2, given: false },
				{ formula: 'O2', coefficient: 1, given: false }
			],
			products: [{ formula: 'H2O', coefficient: 2, given: true }]
		},
		icon: FlaskConicalIcon
	},
	{
		type: taskBlockTypeEnum.image,
		name: 'Image',
		initialConfig: {
			path: '',
			altText: ''
		},
		icon: ImageIcon
	},
	{
		type: taskBlockTypeEnum.video,
		name: 'Video',
		initialConfig: {
			url: '',
			altText: ''
		},
		icon: VideoIcon
	},
	{
		type: taskBlockTypeEnum.audio,
		name: 'Audio',
		initialConfig: {
			path: '',
			altText: ''
		},
		icon: AudioIcon
	},
	{
		type: taskBlockTypeEnum.mathInput,
		name: 'Math Input',
		initialConfig: {
			text: 'Solve this equation',
			question: '2x+7=11',
			answer: '2'
		},
		icon: MathIcon
	}
];

export const interactiveBlockWithOptionals = (
	interactiveBlock: any,
	options: {
		includeHints?: boolean;
		includeDifficulty?: boolean;
		includeSteps?: boolean;
		makeRequired?: boolean;
	} = {}
) => {
	const {
		includeHints = true,
		includeDifficulty = true,
		includeSteps = true,
		makeRequired = true
	} = options;

	const additionalProperties: any = {};
	const additionalRequired: string[] = [];

	if (includeHints) {
		additionalProperties.hints = hintsItem;
		if (makeRequired) additionalRequired.push('hints');
	}

	if (includeDifficulty) {
		additionalProperties.difficulty = difficultyItem;
		if (makeRequired) additionalRequired.push('difficulty');
	}

	if (includeSteps) {
		additionalProperties.steps = stepsItem;
		if (makeRequired) additionalRequired.push('steps');
	}

	return {
		...interactiveBlock,
		properties: {
			...interactiveBlock.properties,
			...additionalProperties
		},
		required: [...(interactiveBlock.required || []), ...additionalRequired]
	};
};

export function getBlockTypesForSubject(subjectType: string): any[] {
	const typeMap: Record<string, any[]> = {
		mathematics: [blockChoice, blockShortAnswer, blockFillBlank],
		science: [blockFillBlank, blockChoice, blockShortAnswer],
		english: [blockShortAnswer, blockClose, blockHighlightText],
		default: [blockChoice, blockShortAnswer, blockMatching, blockFillBlank]
	};

	return typeMap[subjectType.toLowerCase()] || typeMap.default;
}

export function getInteractiveSchema(subjectType: string): any {
	const blockTypes = getBlockTypesForSubject(subjectType);

	const interactiveBlockSchema = interactiveBlockWithOptionals(
		{
			type: 'object',
			properties: {
				taskBlock: {
					anyOf: blockTypes
				}
			},
			required: ['taskBlock']
		},
		{
			includeHints: true,
			includeDifficulty: true,
			includeSteps: true,
			makeRequired: true
		}
	);

	return {
		type: 'object',
		properties: {
			interactiveBlocks: {
				type: 'array',
				items: interactiveBlockSchema,
				minItems: 1,
				maxItems: 5
			}
		},
		required: ['interactiveBlocks']
	};
}

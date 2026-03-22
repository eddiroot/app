import { taskBlockTypeEnum } from '$lib/enums';

const criteriaItem = {
	type: 'object',
	properties: { description: { type: 'string' }, marks: { type: 'number' } },
	required: ['description', 'marks'],
};

export const blockHeading = {
	type: 'object',
	properties: {
		type: { type: 'string', enum: [taskBlockTypeEnum.heading] },
		config: {
			type: 'object',
			properties: { text: { type: 'string' }, size: { type: 'number' } },
			required: ['text', 'size'],
		},
	},
	required: ['type', 'config'],
};

export type BlockHeadingConfig = { text: string; size: number };

export const blockRichText = {
	type: 'object',
	properties: {
		type: { type: 'string', enum: [taskBlockTypeEnum.richText] },
		config: {
			type: 'object',
			properties: { html: { type: 'string' } },
			required: ['html'],
		},
	},
	required: ['type', 'config'],
};

export type BlockRichTextConfig = { html: string };

export const blockMathInput = {
	type: 'object',
	properties: {
		type: { type: 'string', enum: [taskBlockTypeEnum.mathInput] },
		config: {
			type: 'object',
			properties: {
				text: { type: 'string' },
				question: { type: 'string' },
				answer: { type: 'string' },
			},
			required: ['text', 'question', 'answer'],
		},
		criteria: { type: 'array', items: criteriaItem, minItems: 1 },
		marks: { type: 'number' },
	},
	required: ['type', 'config', 'criteria'],
};

export type BlockMathInputConfig = {
	text: string;
	question: string;
	answer: string;
	advancedMathSymbols: boolean;
};

export type BlockMathInputResponse = { answer: string };

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
							isAnswer: { type: 'boolean' },
						},
						description:
							'Array of objects containing the choices and whether that choice is an answer. To make only a single answer valid, the array should contain only one item with isAnswer as true.',
					},
				},
			},
			required: ['question', 'options'],
		},
		marks: { type: 'number' },
	},
	required: ['type', 'config'],
};

export type BlockChoiceConfig = {
	question: string;
	options: { text: string; isAnswer: boolean }[];
};

export type BlockChoiceResponse = { answers: string[] };

export const blockFillBlank = {
	type: 'object',
	properties: {
		type: { type: 'string', enum: [taskBlockTypeEnum.fillBlank] },
		config: {
			type: 'object',
			properties: {
				sentence: { type: 'string' },
				answers: { type: 'array', items: { type: 'string' } },
			},
			required: ['sentence', 'answers'],
		},
		marks: { type: 'number' },
	},
	required: ['type', 'config'],
};

export type BlockFillBlankConfig = { sentence: string; answers: string[] };

export type BlockFillBlankResponse = { answers: string[] };

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
						properties: { left: { type: 'string' }, right: { type: 'string' } },
						required: ['left', 'right'],
					},
				},
			},
			required: ['instructions', 'pairs'],
		},
		marks: { type: 'number' },
	},
	required: ['type', 'config'],
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
			properties: { question: { type: 'string' } },
			required: ['question'],
		},
		criteria: { type: 'array', items: criteriaItem, minItems: 1 },
		marks: { type: 'number' },
	},
	required: ['type', 'config', 'criteria'],
};

export type BlockShortAnswerConfig = { question: string };

export type BlockShortAnswerResponse = { answer: string };

export const blockClose = {
	type: 'object',
	properties: {
		type: { type: 'string', enum: [taskBlockTypeEnum.close] },
		config: {
			type: 'object',
			properties: { text: { type: 'string' } },
			required: ['text'],
		},
		criteria: { type: 'array', items: criteriaItem, minItems: 1 },
		marks: { type: 'number' },
	},
	required: ['type', 'config', 'criteria'],
};

export type BlockCloseConfig = { text: string };

export type BlockCloseResponse = { answers: string[] };

export const blockHighlightText = {
	type: 'object',
	properties: {
		type: { type: 'string', enum: [taskBlockTypeEnum.highlightText] },
		config: {
			type: 'object',
			properties: {
				text: { type: 'string' },
				instructions: { type: 'string' },
			},
			required: ['text', 'instructions'],
		},
		marks: { type: 'number' },
	},
	required: ['type', 'config'],
};

export type BlockHighlightTextConfig = { text: string; instructions: string };

export type BlockHighlightTextResponse = { selectedText: string[] };

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
					items: { type: 'array', items: { type: 'string' } },
				},
			},
			required: ['title', 'rows', 'columns', 'data'],
		},
	},
	required: ['type', 'config'],
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
				whiteboardId: { type: 'number', nullable: true },
			},
			required: ['data', 'width', 'height'],
		},
		marks: { type: 'number' },
	},
	required: ['type', 'config'],
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
					properties: { min: { type: 'number' }, max: { type: 'number' } },
					required: ['min', 'max'],
				},
				yRange: {
					type: 'object',
					properties: { min: { type: 'number' }, max: { type: 'number' } },
					required: ['min', 'max'],
				},
				staticPlots: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							id: { type: 'string' },
							equation: { type: 'string' },
							color: { type: 'string' },
							label: { type: 'string' },
						},
						required: ['id', 'equation', 'color', 'label'],
					},
				},
			},
			required: [
				'title',
				'xAxisLabel',
				'yAxisLabel',
				'xRange',
				'yRange',
				'staticPlots',
			],
		},
	},
	required: ['type', 'config'],
};

export type BlockGraphConfig = {
	title: string;
	xAxisLabel: string;
	yAxisLabel: string;
	xRange: { min: number; max: number };
	yRange: { min: number; max: number };
	staticPlots: { id: string; equation: string; color: string; label: string }[];
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
							given: { type: 'boolean' },
						},
						required: ['formula', 'coefficient', 'given'],
					},
				},
				products: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							formula: { type: 'string' },
							coefficient: { type: 'number' },
							given: { type: 'boolean' },
						},
						required: ['formula', 'coefficient', 'given'],
					},
				},
			},
			required: ['reactants', 'products'],
		},
		marks: { type: 'number' },
	},
	required: ['type', 'config'],
};

export type BlockBalancingEquationsConfig = {
	question?: string;
	reactants: Array<{ formula: string; coefficient: number; given: boolean }>;
	products: Array<{ formula: string; coefficient: number; given: boolean }>;
};

export type BlockBalancingEquationsResponse = {
	coefficients: { reactants: number[]; products: number[] };
};

export const blockImage = {
	type: 'object',
	properties: {
		type: { type: 'string', enum: [taskBlockTypeEnum.image] },
		config: {
			type: 'object',
			properties: { path: { type: 'string' }, altText: { type: 'string' } },
			required: ['path', 'altText'],
		},
	},
	required: ['type', 'config'],
};

export type BlockImageConfig = { path: string; altText: string };

export const blockVideo = {
	type: 'object',
	properties: {
		type: { type: 'string', enum: [taskBlockTypeEnum.video] },
		config: {
			type: 'object',
			properties: { url: { type: 'string' }, altText: { type: 'string' } },
			required: ['url', 'altText'],
		},
	},
	required: ['type', 'config'],
};

export type BlockVideoConfig = { url: string; altText: string };

export const blockAudio = {
	type: 'object',
	properties: {
		type: { type: 'string', enum: [taskBlockTypeEnum.audio] },
		config: {
			type: 'object',
			properties: { path: { type: 'string' }, altText: { type: 'string' } },
			required: ['path', 'altText'],
		},
	},
	required: ['type', 'config'],
};

export type BlockAudioConfig = { path: string; altText: string };

export const blockSubmission = {
	type: 'object',
	properties: {
		type: { type: 'string', enum: [taskBlockTypeEnum.submission] },
		config: {
			type: 'object',
			properties: { instructions: { type: 'string' } },
			required: ['instructions'],
		},
	},
	required: ['type', 'config'],
};

export type BlockSubmissionConfig = { instructions: string };

export type BlockSubmissionResponse = { path: string };

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
	blockAudio,
	blockSubmission,
];

export const taskSchema = {
	type: 'object',
	properties: { blocks: { type: 'array', items: { anyOf: taskBlocks } } },
	required: ['task'],
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
	| BlockAudioConfig
	| BlockSubmissionConfig;

export type BlockResponse =
	| BlockChoiceResponse
	| BlockFillBlankResponse
	| BlockMathInputResponse
	| BlockBalancingEquationsResponse
	| BlockMatchingResponse
	| BlockShortAnswerResponse
	| BlockCloseResponse
	| BlockHighlightTextResponse
	| BlockGraphResponse
	| BlockSubmissionResponse;

export type BlockProps<
	T extends BlockConfig = BlockConfig,
	Q extends BlockResponse = never,
> = {
	config: T;
	onConfigUpdate: (config: T) => Promise<void>;
	viewMode: ViewMode;
} & ([Q] extends [never]
	? object
	: { response: Q; onResponseUpdate: (response: Q) => Promise<void> });

// Specific prop types for each block type
export type HeadingBlockProps = BlockProps<BlockHeadingConfig>;
export type RichTextBlockProps = BlockProps<BlockRichTextConfig>;
export type MathInputBlockProps = BlockProps<
	BlockMathInputConfig,
	BlockMathInputResponse
>;
export type ChoiceBlockProps = BlockProps<
	BlockChoiceConfig,
	BlockChoiceResponse
>;
export type FillBlankBlockProps = BlockProps<
	BlockFillBlankConfig,
	BlockFillBlankResponse
>;
export type BalancingEquationsBlockProps = BlockProps<
	BlockBalancingEquationsConfig,
	BlockBalancingEquationsResponse
>;
export type MatchingBlockProps = BlockProps<
	BlockMatchingConfig,
	BlockMatchingResponse
>;
export type ShortAnswerBlockProps = BlockProps<
	BlockShortAnswerConfig,
	BlockShortAnswerResponse
>;
export type WhiteboardBlockProps = BlockProps<BlockWhiteboardConfig> & {
	blockId: number;
};
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
export type SubmissionBlockProps = BlockProps<
	BlockSubmissionConfig,
	BlockSubmissionResponse
>;

import { type Icon } from '@lucide/svelte';
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
import UploadIcon from '@lucide/svelte/icons/upload';
import VideoIcon from '@lucide/svelte/icons/video';

export enum ViewMode {
	CONFIGURE = 'configure',
	ANSWER = 'answer',
	REVIEW = 'review',
	PRESENT = 'present',
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
		icon: HeadingIcon,
	},
	{
		type: taskBlockTypeEnum.richText,
		name: 'Rich Text',
		initialConfig: { html: 'This is a rich text block' },
		icon: PilcrowIcon,
	},
	{
		type: taskBlockTypeEnum.whiteboard,
		name: 'Whiteboard',
		initialConfig: { data: '', width: 800, height: 600 },
		icon: PresentationIcon,
	},
	{
		type: taskBlockTypeEnum.choice,
		name: 'Multiple Choice',
		initialConfig: {
			question: 'Which of these words is a noun?',
			options: [
				{ text: 'Melbourne', isAnswer: true },
				{ text: 'Book', isAnswer: true },
				{ text: 'Run', isAnswer: false },
				{ text: 'Bake', isAnswer: false },
			],
		},
		icon: List,
	},
	{
		type: taskBlockTypeEnum.fillBlank,
		name: 'Fill Blank',
		initialConfig: {
			sentence: 'Fill in the _____ and _____.',
			answers: ['first', 'second'],
		},
		icon: PenToolIcon,
	},
	{
		type: taskBlockTypeEnum.close,
		name: 'Answer Blank',
		initialConfig: { text: 'Complete this sentence with _____ and _____.' },
		icon: PenToolIcon,
	},
	{
		type: taskBlockTypeEnum.shortAnswer,
		name: 'Short Answer',
		initialConfig: { question: 'Question' },
		icon: MessageSquareTextIcon,
	},
	{
		type: taskBlockTypeEnum.highlightText,
		name: 'Highlight',
		initialConfig: {
			text: 'The big brown fox jumps over the lazy dog.',
			instructions: 'Highlight the words that start with the letter "b".',
		},
		icon: HighlighterIcon,
	},
	{
		type: taskBlockTypeEnum.matching,
		name: 'Matching Pairs',
		initialConfig: {
			instructions:
				'Match the items on the left with the correct answers on the right.',
			pairs: [
				{ left: 'Item 1', right: 'Answer 1' },
				{ left: 'Item 2', right: 'Answer 2' },
			],
		},
		icon: LinkIcon,
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
				['Row 2 Col 1', 'Row 2 Col 2', 'Row 2 Col 3'],
			],
		},
		icon: TableIcon,
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
			staticPlots: [],
		},
		icon: TrendingUpIcon,
	},
	{
		type: taskBlockTypeEnum.balancingEquations,
		name: 'Balancing',
		initialConfig: {
			question: 'Balance the following chemical equation:',
			reactants: [
				{ formula: 'H2', coefficient: 2, given: false },
				{ formula: 'O2', coefficient: 1, given: false },
			],
			products: [{ formula: 'H2O', coefficient: 2, given: true }],
		},
		icon: FlaskConicalIcon,
	},
	{
		type: taskBlockTypeEnum.image,
		name: 'Image',
		initialConfig: { path: '', altText: '' },
		icon: ImageIcon,
	},
	{
		type: taskBlockTypeEnum.video,
		name: 'Video',
		initialConfig: { url: '', altText: '' },
		icon: VideoIcon,
	},
	{
		type: taskBlockTypeEnum.audio,
		name: 'Audio',
		initialConfig: { path: '', altText: '' },
		icon: AudioIcon,
	},
	{
		type: taskBlockTypeEnum.mathInput,
		name: 'Math Input',
		initialConfig: {
			text: 'Solve this equation',
			question: '2x+7=11',
			answer: '2',
		},
		icon: MathIcon,
	},
	{
		type: taskBlockTypeEnum.submission,
		name: 'File Submission',
		initialConfig: {
			instructions:
				'Please upload your assignment file. If there are multiple files, compress them into a single .zip file before uploading.',
		},
		icon: UploadIcon,
	},
];

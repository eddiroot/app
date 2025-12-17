import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
// import { ChatAnthropic } from '@langchain/anthropic';
// import { ChatOpenAI } from '@langchain/openai';
import { GEMINI_API_KEY } from '$env/static/private';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';

/**
 * Supported LLM providers
 */
export enum LLMProvider {
	GEMINI = 'gemini',
	CLAUDE = 'claude',
	OPENAI = 'openai'
}

/**
 * Available models for each provider
 */
export const AVAILABLE_MODELS = {
	[LLMProvider.GEMINI]: {
		'gemini-2.5-flash': 'Gemini 2.5 Flash',
		'gemini-1.5-flash': 'Gemini 1.5 Flash',
		'gemini-1.5-pro': 'Gemini 1.5 Pro'
	},
	[LLMProvider.CLAUDE]: {
		'claude-3-5-sonnet-20241022': 'Claude 3.5 Sonnet',
		'claude-3-5-haiku-20241022': 'Claude 3.5 Haiku',
		'claude-3-opus-20240229': 'Claude 3 Opus'
	},
	[LLMProvider.OPENAI]: {
		'gpt-4o': 'GPT-4o',
		'gpt-4o-mini': 'GPT-4o Mini',
		'gpt-4-turbo': 'GPT-4 Turbo',
		'gpt-3.5-turbo': 'GPT-3.5 Turbo'
	}
} as const;

/**
 * Configuration for model creation
 */
export interface ModelConfig {
	provider?: LLMProvider;
	model?: string;
	temperature?: number;
	maxTokens?: number;
	streaming?: boolean;
}

/**
 * Default configuration
 * Change these values to switch the default model for your entire application
 */
const DEFAULT_CONFIG: Required<ModelConfig> = {
	provider: LLMProvider.GEMINI,
	model: 'gemini-2.5-flash',
	temperature: 0.7,
	maxTokens: 8192,
	streaming: false
};

/**
 * Create a chat model instance based on provider and configuration
 */
function createChatModel(config: Required<ModelConfig>): BaseChatModel {
	const { provider, model, temperature, maxTokens } = config;

	switch (provider) {
		case LLMProvider.GEMINI:
			return new ChatGoogleGenerativeAI({
				model,
				temperature,
				maxOutputTokens: maxTokens,
				apiKey: GEMINI_API_KEY
			});

		case LLMProvider.CLAUDE:
			throw new Error('Claude provider not yet configured. Install @langchain/anthropic package.');

		case LLMProvider.OPENAI:
			throw new Error('OpenAI provider not yet configured. Install @langchain/openai package.');

		default:
			throw new Error(`Unsupported provider: ${provider}`);
	}
}

/**
 * Get the base LLM instance
 * This is the primary model used throughout the application
 * 
 */
export function getBaseLLM(overrides?: Partial<ModelConfig>): BaseChatModel {
	const config = {
		...DEFAULT_CONFIG,
		...overrides
	};
	return createChatModel(config);
}
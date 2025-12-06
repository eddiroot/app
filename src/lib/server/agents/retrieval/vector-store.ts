/* eslint-disable @typescript-eslint/no-explicit-any */

import type {
	KeyKnowledge,
	KeySkill,
	LearningArea,
	Outcome
} from '$lib/server/db/schema/curriculum';
import type { Collection, EmbeddingFunction } from 'chromadb';
import { ChromaClient } from 'chromadb';
import { Resource } from 'sst';

export interface VectorMetadata {
	type: string;
	subjectId: number;
	id: string | number;

	// Optional relationship IDs
	learningAreaId?: number;
	outcomeId?: number;
	keyKnowledgeIds?: number[];
	keySkillIds?: number[];

	// Content-specific metadata
	learningArea?: string;
	topic?: string;
	marks?: number;
	number?: number;
	example?: string;
	contentType?: string;

	// Module-specific for hints/misconceptions
	moduleId?: number;
	sessionId?: string;
	taskBlockId?: number;

	// Quality metrics
	wasHelpful?: boolean;
	successRate?: number;
	usageCount?: number;

	// Allow any additional string keys
	[key: string]: any;
}

// Nomic Embed API implementation
class NomicEmbeddingFunction implements EmbeddingFunction {
	private apiKey: string;
	private modelName: string;
	private taskType: string;
	private dimensionality: number;

	constructor(
		apiKey: string,
		modelName: string = 'nomic-embed-text-v1.5',
		taskType: string = 'search_document',
		dimensionality: number = 768
	) {
		if (!apiKey) {
			throw new Error('NOMIC_API_KEY is required but not set');
		}
		this.apiKey = apiKey;
		this.modelName = modelName;
		this.taskType = taskType;
		this.dimensionality = dimensionality;
	}

	async generate(texts: string[]): Promise<number[][]> {
		try {
			const response = await fetch('https://api-atlas.nomic.ai/v1/embedding/text', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
					Authorization: `Bearer ${this.apiKey}`
				},
				body: JSON.stringify({
					texts: texts,
					model: this.modelName,
					task_type: this.taskType,
					dimensionality: this.dimensionality,
					long_text_mode: 'truncate',
					max_tokens_per_text: 8192
				})
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Nomic API error: ${response.status} ${response.statusText}: ${errorText}`);
			}

			const data = await response.json();

			if (!data.embeddings) {
				throw new Error('No embeddings returned from Nomic API');
			}

			return data.embeddings;
		} catch (error) {
			console.error('Failed to generate embeddings:', error);
			throw error;
		}
	}
}

// Query embedding function with search_query task type
class NomicQueryEmbeddingFunction extends NomicEmbeddingFunction {
	constructor(apiKey: string, dimensionality: number = 768) {
		super(apiKey, 'nomic-embed-text-v1.5', 'search_query', dimensionality);
	}
}

export class EducationalVectorStore {
	private client: ChromaClient;
	private documentEmbedder: NomicEmbeddingFunction;
	private queryEmbedder: NomicQueryEmbeddingFunction;
	private collections: Map<string, Collection> = new Map();
	private initializedSubjects: Set<number> = new Set();

	constructor() {
		this.client = new ChromaClient({
			path: 'change-this-value'
		});

		const apiKey = Resource.NomicAPIKey.value;
		if (!apiKey) {
			throw new Error('NOMIC_API_KEY environment variable is required');
		}

		// Create embedders for different tasks
		this.documentEmbedder = new NomicEmbeddingFunction(apiKey);
		this.queryEmbedder = new NomicQueryEmbeddingFunction(apiKey);
	}

	async initialize(subjectId: number): Promise<void> {
		const collections = [
			// Internal Data
			'questions',
			'hints_feedback',
			'misconceptions',
			'eddi_exam',
			// External Data
			'curriculum_contents',
			'learning_activities',
			'assessment_tasks',
			'exam_questions',
			'detailed_examples',
			'extra_contents'
		];

		// Create collections for each type for this specific subject
		for (const type of collections) {
			await this.createCollection(`${subjectId}_${type}`);
		}

		// Mark this subject as initialized
		this.initializedSubjects.add(subjectId);
	}

	/**
	 * Initialize collections for multiple subjects at once
	 */
	async initializeAllSubjects(subjectIds: number[]): Promise<void> {
		for (const subjectId of subjectIds) {
			await this.initialize(subjectId);
		}
	}

	/**
	 * Get list of initialized subjects
	 */
	getInitializedSubjects(): number[] {
		return Array.from(this.initializedSubjects);
	}

	private async createCollection(name: string): Promise<Collection> {
		try {
			// Use document embedder for creating collections (indexing)
			const collection = await this.client.getOrCreateCollection({
				name,
				embeddingFunction: this.documentEmbedder,
				metadata: {
					description: `Collection for ${name.replace('_', ' ')}`,
					createdAt: new Date().toISOString(),
					embeddingType: 'nomic-embed-text-v1.5',
					dimensionality: 768
				}
			});

			this.collections.set(name, collection);
			return collection;
		} catch (error) {
			console.error(`❌ Failed to create collection ${name}:`, error);
			throw error;
		}
	}

	private async getSubjectCollection(
		collectionType: string,
		subjectId: number
	): Promise<Collection> {
		const collectionName = `${subjectId}_${collectionType}`;
		let collection = this.collections.get(collectionName);

		if (!collection) {
			collection = await this.createCollection(collectionName);
		}

		return collection;
	}

	/**
	 * Index curriculum content with proper batching
	 */
	async indexCurriculumContent(
		keyKnowledge: KeyKnowledge[],
		keySkills: KeySkill[],
		learningAreas: LearningArea[],
		outcomes: Outcome[],
		subjectId: number,
		topics?: Map<number, string>
	): Promise<void> {
		const collection = await this.getSubjectCollection('curriculum_contents', subjectId);

		// Batch documents for efficient embedding
		const documents: string[] = [];
		const ids: string[] = [];
		const metadatas: VectorMetadata[] = [];

		// Prepare key knowledge documents
		for (const knowledge of keyKnowledge) {
			const topic = topics?.get(knowledge.outcomeId!) || '';
			const document = [`Key Knowledge:`, knowledge.description, topic ? `Topic: ${topic}` : '']
				.filter(Boolean)
				.join('\n');

			documents.push(document);
			ids.push(`kk_${knowledge.id}`);
			metadatas.push({
				type: 'key_knowledge',
				subjectId,
				id: knowledge.id,
				outcomeId: knowledge.outcomeId || undefined,
				topic: topic || undefined
			});
		}

		// Prepare key skills documents
		for (const skill of keySkills) {
			const topic = topics?.get(skill.outcomeId!) || '';
			const document = [`Key Skill:`, skill.description, topic ? `Topic: ${topic}` : '']
				.filter(Boolean)
				.join('\n');

			documents.push(document);
			ids.push(`ks_${skill.id}`);
			metadatas.push({
				type: 'key_skill',
				subjectId,
				id: skill.id,
				outcomeId: skill.outcomeId || undefined,
				topic: topic || undefined
			});
		}

		// Prepare learning areas documents
		for (const area of learningAreas) {
			const document = [`Learning Area: ${area.name}`, area.description || '']
				.filter(Boolean)
				.join('\n');

			documents.push(document);
			ids.push(`la_${area.id}`);
			metadatas.push({
				type: 'learning_area',
				subjectId,
				id: area.id
			});
		}

		// Prepare outcomes documents
		for (const outcome of outcomes) {
			const document = [`Outcome #${outcome.number}`, outcome.description || '']
				.filter(Boolean)
				.join('\n');

			documents.push(document);
			ids.push(`outcome_${outcome.id}`);
			metadatas.push({
				type: 'outcome',
				subjectId,
				id: outcome.id,
				number: outcome.number
			});
		}

		// Batch add all documents
		if (documents.length > 0) {
			const batchSize = 100; // Process in batches of 100
			for (let i = 0; i < documents.length; i += batchSize) {
				const batchDocs = documents.slice(i, i + batchSize);
				const batchIds = ids.slice(i, i + batchSize);
				const batchMetas = metadatas.slice(i, i + batchSize);

				await collection.add({
					ids: batchIds,
					documents: batchDocs,
					metadatas: batchMetas
				});
			}
		}
	}

	/**
	 * Index learning activities
	 */
	async indexLearningActivities(
		activities: Array<{
			activity: string;
			learningArea?: string;
		}>,
		subjectId: number
	): Promise<void> {
		const collection = await this.getSubjectCollection('learning_activities', subjectId);

		const documents: string[] = [];
		const ids: string[] = [];
		const metadatas: VectorMetadata[] = [];

		for (let i = 0; i < activities.length; i++) {
			const activity = activities[i];

			// Ensure activity is a valid string
			const activityText =
				typeof activity.activity === 'string' ? activity.activity : String(activity.activity || '');

			// Skip empty activities
			if (!activityText.trim()) {
				continue;
			}

			const document = [`Learning Activity`, activityText].filter(Boolean).join('\n');

			documents.push(document);
			ids.push(`learning_activity_${Date.now()}_${i}_${subjectId}`);
			metadatas.push({
				type: 'learning_activity',
				subjectId,
				id: `${Date.now()}_${i}`,
				learningArea: activity.learningArea
			});
		}

		if (documents.length > 0) {
			// Batch process to respect API limits (max 500 texts per request)
			const maxBatchSize = 400; // Conservative batch size to stay under Nomic API limit
			for (let i = 0; i < documents.length; i += maxBatchSize) {
				const batchDocs = documents.slice(i, i + maxBatchSize);
				const batchIds = ids.slice(i, i + maxBatchSize);
				const batchMetas = metadatas.slice(i, i + maxBatchSize);

				await collection.add({
					ids: batchIds,
					documents: batchDocs,
					metadatas: batchMetas
				});
			}
		}
	}

	/**
	 * Index assessment tasks
	 */
	async indexAssessmentTasks(
		tasks: Array<{
			task: string;
			learningArea?: string;
		}>,
		subjectId: number
	): Promise<void> {
		const collection = await this.getSubjectCollection('assessment_tasks', subjectId);

		const documents: string[] = [];
		const ids: string[] = [];
		const metadatas: VectorMetadata[] = [];

		for (let i = 0; i < tasks.length; i++) {
			const task = tasks[i];

			// Ensure task is a valid string
			const taskText = typeof task.task === 'string' ? task.task : String(task.task || '');

			// Skip empty tasks
			if (!taskText.trim()) {
				console.log(`    ⚠️ Skipping empty task for item ${i}`);
				continue;
			}

			const document = [`Assessment Task:`, taskText].filter(Boolean).join('\n');

			documents.push(document);
			ids.push(`assessment_task_${Date.now()}_${i}_${subjectId}`);
			metadatas.push({
				type: 'assessment_task',
				subjectId,
				id: `${Date.now()}_${i}`,
				learningArea: task.learningArea
			});
		}

		if (documents.length > 0) {
			await collection.add({
				ids,
				documents,
				metadatas
			});
		}
	}

	/**
	 * Index exam questions
	 */
	async indexExamQuestions(
		questions: Array<{
			question: string;
			answer?: string;
			example?: string;
			learningArea?: string;
		}>,
		subjectId: number
	): Promise<void> {
		const collection = await this.getSubjectCollection('exam_questions', subjectId);

		const documents: string[] = [];
		const ids: string[] = [];
		const metadatas: VectorMetadata[] = [];

		for (let i = 0; i < questions.length; i++) {
			const question = questions[i];
			const document = [
				`Exam Question`,
				question.question,
				question.answer ? `Answer: ${question.answer}` : '',
				question.example ? `Example: ${question.example}` : ''
			]
				.filter(Boolean)
				.join('\n');

			documents.push(document);
			ids.push(`exam_question_${Date.now()}_${i}_${subjectId}`);
			metadatas.push({
				type: 'exam_question',
				subjectId,
				id: `${Date.now()}_${i}`,
				learningArea: question.learningArea
			});
		}

		if (documents.length > 0) {
			await collection.add({
				ids,
				documents,
				metadatas
			});
		}
	}

	/**
	 * Index extra content
	 */
	async indexExtraContent(
		content: Array<{
			description: string;
			contentType: string;
		}>,
		subjectId: number
	): Promise<void> {
		const collection = await this.getSubjectCollection('extra_contents', subjectId);

		const documents: string[] = [];
		const ids: string[] = [];
		const metadatas: VectorMetadata[] = [];

		for (let i = 0; i < content.length; i++) {
			const item = content[i];

			// Ensure description is a valid string
			const description =
				typeof item.description === 'string' ? item.description : String(item.description || '');
			const contentType =
				typeof item.contentType === 'string'
					? item.contentType
					: String(item.contentType || 'unknown');

			// Skip empty descriptions
			if (!description.trim()) {
				continue;
			}

			documents.push(description);
			ids.push(`extra_content_${Date.now()}_${i}_${subjectId}`);
			metadatas.push({
				type: 'extra_content',
				subjectId,
				id: `${Date.now()}_${i}`,
				contentType: contentType
			});
		}

		if (documents.length > 0) {
			// Batch process to respect API limits (max 500 texts per request)
			const maxBatchSize = 400; // Conservative batch size to stay under Nomic API limit
			for (let i = 0; i < documents.length; i += maxBatchSize) {
				const batchDocs = documents.slice(i, i + maxBatchSize);
				const batchIds = ids.slice(i, i + maxBatchSize);
				const batchMetas = metadatas.slice(i, i + maxBatchSize);

				await collection.add({
					ids: batchIds,
					documents: batchDocs,
					metadatas: batchMetas
				});
			}
		}
	}

	/**
	 * Index detailed examples
	 */
	async indexDetailedExample(
		examples: Array<{
			title: string;
			content: string;
			learningArea: string;
		}>,
		subjectId: number
	): Promise<void> {
		const collection = await this.getSubjectCollection('detailed_examples', subjectId);

		const documents: string[] = [];
		const ids: string[] = [];
		const metadatas: VectorMetadata[] = [];

		for (let i = 0; i < examples.length; i++) {
			const example = examples[i];
			const document = [`Detailed Example: ${example.title}`, example.content].join('\n');

			documents.push(document);
			ids.push(`detailed_example_${Date.now()}_${i}_${subjectId}`);
			metadatas.push({
				type: 'detailed_example',
				subjectId,
				id: `${Date.now()}_${i}`,
				learningArea: example.learningArea
			});
		}

		if (documents.length > 0) {
			await collection.add({
				ids,
				documents,
				metadatas
			});
		}
	}

	/**
	 * Enhanced hybrid search using query embeddings
	 */
	async hybridSearch(
		query: string,
		params: {
			subjectId?: number;
			collections: string[];
			filter?: Record<string, any>;
			k?: number;
			includeRelated?: boolean;
		}
	): Promise<RetrievalResult[]> {
		const { subjectId, collections, filter = {}, k = 5 } = params;

		// Generate query embedding using the query embedder
		const queryEmbedding = await this.queryEmbedder.generate([query]);

		const results: RetrievalResult[] = [];

		// Add subject filter if provided - combine with existing filters properly
		let enhancedFilter = { ...filter };
		if (subjectId) {
			enhancedFilter.subjectId = subjectId;
		}

		// If the filter is empty, don't pass it to avoid ChromaDB validation issues
		if (Object.keys(enhancedFilter).length === 0) {
			enhancedFilter = undefined as any;
		}

		for (const collectionType of collections) {
			// Determine collection name
			let collectionName = collectionType;
			if (subjectId && this.isSubjectSpecificCollection(collectionType)) {
				collectionName = `${subjectId}_${collectionType}`;
			}

			const collection = this.collections.get(collectionName);
			if (!collection) continue;

			const queryParams: any = {
				queryEmbeddings: queryEmbedding,
				nResults: k * 2,
				include: ['documents', 'metadatas', 'distances']
			};

			// Only add where clause if we have filters
			if (enhancedFilter) {
				queryParams.where = enhancedFilter;
			}

			const searchResults = await collection.query(queryParams);

			if (searchResults.documents && searchResults.documents[0]) {
				searchResults.documents[0].forEach((doc: any, idx: number) => {
					if (doc && searchResults.metadatas && searchResults.metadatas[0]) {
						results.push({
							content: doc,
							score: searchResults.distances?.[0]?.[idx] || 0,
							metadata: searchResults.metadatas[0][idx] as VectorMetadata,
							source: collectionType
						});
					}
				});
			}
		}

		// Sort by relevance (lower distance = more relevant)
		results.sort((a, b) => a.score - b.score);

		return results.slice(0, k);
	}

	/**
	 * Store hints with module context
	 */
	async storeHint(
		hint: string,
		moduleId: number,
		taskBlockId: number,
		concept: string,
		wasHelpful: boolean
	): Promise<void> {
		const collection = this.collections.get('hints_feedback');
		if (!collection) {
			throw new Error('hints_feedback collection not initialized');
		}

		await collection.add({
			ids: [`hint_${Date.now()}_${moduleId}`],
			documents: [`Hint for ${concept}: ${hint}`],
			metadatas: [
				{
					type: 'hint',
					subjectId: 0, // Generic hint not tied to subject
					id: `${Date.now()}`,
					moduleId,
					taskBlockId,
					concept,
					wasHelpful
				}
			]
		});
	}

	/**
	 * Store misconceptions with module context
	 */
	async storeMisconception(
		misconception: string,
		concept: string,
		moduleId: number,
		taskBlockId: number,
		correctApproach: string
	): Promise<void> {
		const collection = this.collections.get('misconceptions');
		if (!collection) {
			throw new Error('misconceptions collection not initialized');
		}

		await collection.add({
			ids: [`misc_${Date.now()}_${moduleId}`],
			documents: [
				`Misconception about ${concept}: ${misconception}\nCorrect approach: ${correctApproach}`
			],
			metadatas: [
				{
					type: 'misconception',
					subjectId: 0,
					id: `${Date.now()}`,
					concept,
					moduleId,
					taskBlockId,
					timestamp: new Date().toISOString()
				}
			]
		});
	}

	/**
	 * Store questions
	 */
	async storeQuestion(
		question: string,
		moduleId: number,
		taskBlockId: number,
		concept: string,
		difficulty: string,
		subjectId?: number
	): Promise<void> {
		try {
			// Use subject-specific collection if subjectId provided, otherwise use global collection
			let collection;
			if (subjectId) {
				collection = await this.getSubjectCollection('questions', subjectId);
			} else {
				collection = this.collections.get('questions');
				if (!collection) {
					throw new Error('questions collection not initialized');
				}
			}

			await collection.add({
				ids: [`question_${Date.now()}_${moduleId}_${taskBlockId}`],
				documents: [question],
				metadatas: [
					{
						type: 'question',
						subjectId: subjectId || 0,
						id: `${Date.now()}`,
						moduleId,
						taskBlockId,
						difficulty,
						concept
					}
				]
			});
		} catch (error) {
			console.warn('Failed to store question:', error);
			// Don't throw error - this is non-critical functionality
		}
	}

	/**
	 * Get successful hints for a concept
	 */
	async getSuccessfulHints(
		concept: string,
		moduleId?: number,
		k: number = 3
	): Promise<RetrievalResult[]> {
		const filter: any = {
			wasHelpful: true
		};

		if (moduleId) {
			filter.moduleId = moduleId;
		}

		return this.hybridSearch(`effective hints for ${concept}`, {
			collections: ['hints_feedback'],
			filter,
			k
		});
	}

	/**
	 * Find common misconceptions for a concept
	 */
	async findCommonMisconceptions(
		concept: string,
		moduleId?: number,
		k: number = 3
	): Promise<RetrievalResult[]> {
		const filter: any = {};

		if (moduleId) {
			filter.moduleId = moduleId;
		}

		return this.hybridSearch(`misconceptions and errors about ${concept}`, {
			collections: ['misconceptions'],
			filter,
			k
		});
	}

	private isSubjectSpecificCollection(collectionType: string): boolean {
		return [
			'curriculum_contents',
			'learning_activities',
			'assessment_tasks',
			'exam_questions',
			'detailed_examples',
			'extra_contents'
		].includes(collectionType);
	}

	/**
	 * Clean up old or unused collections
	 */
	async cleanup(daysOld: number = 30): Promise<void> {
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - daysOld);

		const allCollections = await this.client.listCollections();

		for (const collectionInfo of allCollections) {
			try {
				const collection = await this.client.getCollection({
					name: collectionInfo.name
				});

				if (collection.metadata?.createdAt) {
					const createdAt = new Date(collection.metadata.createdAt as string);
					if (createdAt < cutoffDate) {
						console.log(`Deleting old collection: ${collectionInfo.name}`);
						await this.client.deleteCollection({ name: collectionInfo.name });
					}
				}
			} catch (error) {
				console.error(`Error processing collection ${collectionInfo.name}:`, error);
			}
		}
	}
}

export interface RetrievalResult {
	content: string;
	score: number;
	metadata: VectorMetadata;
	source: string;
}

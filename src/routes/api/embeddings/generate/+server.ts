import { defaultEmbeddings } from '$lib/server/ai/embeddings';
import { AssessmentTaskVectorStore } from '$lib/server/ai/vector-store/curriculum/assessment-task';
import { CurriculumSubjectExtraContentVectorStore } from '$lib/server/ai/vector-store/curriculum/curriculum-subject-extra-content';
import { ExamQuestionVectorStore } from '$lib/server/ai/vector-store/curriculum/exam-question';
import { KeyKnowledgeVectorStore } from '$lib/server/ai/vector-store/curriculum/key-knowledge';
import { KeySkillVectorStore } from '$lib/server/ai/vector-store/curriculum/key-skill';
import { LearningActivityVectorStore } from '$lib/server/ai/vector-store/curriculum/learning-activity';
import { LearningAreaVectorStore } from '$lib/server/ai/vector-store/curriculum/learning-area';
import { LearningAreaContentVectorStore } from '$lib/server/ai/vector-store/curriculum/learning-area-content';
import { LearningAreaStandardVectorStore } from '$lib/server/ai/vector-store/curriculum/learning-area-standard';
import { OutcomeVectorStore } from '$lib/server/ai/vector-store/curriculum/outcome';
import { StandardElaborationVectorStore } from '$lib/server/ai/vector-store/curriculum/standard-elaboration';
import { db } from '$lib/server/db';
import {
	assessmentTask,
	curriculumSubjectExtraContent,
	examQuestion,
	keyKnowledge,
	keySkill,
	learningActivity,
	learningArea,
	learningAreaContent,
	learningAreaStandard,
	outcome,
	standardElaboration
} from '$lib/server/db/schema';
import { json } from '@sveltejs/kit';
import { isNull } from 'drizzle-orm';
import type { RequestHandler } from './$types';

interface EmbeddingStats {
	tableName: string;
	total: number;
	processed: number;
	failed: number;
	errors: Array<{ id: number; error: string }>;
}

/**
 * Generate embeddings for a specific table using its vector store
 * Uses batch API calls to minimize requests (1200 requests per 5-min rolling window)
 * Nomic allows multiple texts per request, so we batch 100 texts per API call
 */
async function generateEmbeddingsForTable(
	tableName: string,
	table:
		| typeof learningArea
		| typeof learningAreaContent
		| typeof learningAreaStandard
		| typeof standardElaboration
		| typeof outcome
		| typeof keySkill
		| typeof keyKnowledge
		| typeof examQuestion
		| typeof learningActivity
		| typeof assessmentTask
		| typeof curriculumSubjectExtraContent,
	vectorStore:
		| LearningAreaVectorStore
		| LearningAreaContentVectorStore
		| LearningAreaStandardVectorStore
		| StandardElaborationVectorStore
		| OutcomeVectorStore
		| KeySkillVectorStore
		| KeyKnowledgeVectorStore
		| ExamQuestionVectorStore
		| LearningActivityVectorStore
		| AssessmentTaskVectorStore
		| CurriculumSubjectExtraContentVectorStore
): Promise<EmbeddingStats> {
	const stats: EmbeddingStats = {
		tableName,
		total: 0,
		processed: 0,
		failed: 0,
		errors: []
	};

	// Nomic rate limit: 1200 requests per 5-minute rolling window
	// We batch 100 texts per API call, so each batch = 1 API request
	// With 250ms delay between batches, we make ~240 requests/min = 1200 per 5 min
	const BATCH_SIZE = 100; // Texts per API call (Nomic supports up to 400)
	const DELAY_BETWEEN_BATCHES_MS = 250; // 250ms = 4 requests/sec = 240/min
	const MAX_RETRIES = 3;
	const MAX_ERRORS_TO_STORE = 20;

	// Helper to delay execution
	const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

	// Helper to process a batch with retries
	async function processBatchWithRetry(recordIds: number[], retryCount = 0): Promise<boolean> {
		try {
			await vectorStore.updateEmbeddingsBatch(recordIds);
			return true;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);

			// Check if it's a rate limit error
			if (errorMessage.includes('Too Many Requests') && retryCount < MAX_RETRIES) {
				const backoffMs = Math.pow(2, retryCount) * 5000; // 5s, 10s, 20s (longer for batches)
				console.log(
					`   ⏳ Rate limited, waiting ${backoffMs / 1000}s before retry ${retryCount + 1}/${MAX_RETRIES}...`
				);
				await delay(backoffMs);
				return processBatchWithRetry(recordIds, retryCount + 1);
			}

			throw error;
		}
	}

	try {
		// Fetch all records that don't have embeddings yet - only select IDs to reduce memory
		const records = await db.select({ id: table.id }).from(table).where(isNull(table.embedding));

		stats.total = records.length;

		if (stats.total === 0) {
			return stats;
		}

		console.log(
			`📋 ${tableName}: Found ${stats.total} records to process (batches of ${BATCH_SIZE} texts per API call)`
		);

		// Process records in batches - each batch is ONE API call with multiple texts
		for (let i = 0; i < records.length; i += BATCH_SIZE) {
			const batch = records.slice(i, i + BATCH_SIZE);
			const batchIds = batch.map((r) => r.id);
			const batchNum = Math.floor(i / BATCH_SIZE) + 1;
			const totalBatches = Math.ceil(records.length / BATCH_SIZE);

			console.log(
				`⚙️  ${tableName}: Batch ${batchNum}/${totalBatches} (${batch.length} texts in 1 API call)...`
			);

			try {
				// Process entire batch in a single API call with retry logic
				const success = await processBatchWithRetry(batchIds);

				if (success) {
					stats.processed += batch.length;
				} else {
					stats.failed += batch.length;
				}
			} catch (error) {
				stats.failed += batch.length;
				const errorMessage = error instanceof Error ? error.message : String(error);

				if (stats.errors.length < MAX_ERRORS_TO_STORE) {
					stats.errors.push({ id: batchIds[0], error: `Batch failed: ${errorMessage}` });
				}

				if (stats.failed <= batch.length * 3) {
					console.error(
						`❌ ${tableName} batch ${batchNum} failed: ${errorMessage.substring(0, 100)}`
					);
				}
			}

			// Progress update every batch
			const progress = (((i + batch.length) / records.length) * 100).toFixed(1);
			console.log(
				`   ${progress}% complete (${stats.processed}/${stats.total} processed, ${stats.failed} failed)`
			);

			// Add delay between batches to stay within rate limits
			if (i + BATCH_SIZE < records.length) {
				await delay(DELAY_BETWEEN_BATCHES_MS);
			}
		}

		console.log(
			`✅ ${tableName}: Complete - ${stats.processed}/${stats.total} processed, ${stats.failed} failed`
		);
		return stats;
	} catch (error) {
		console.error(`💥 ${tableName}: Fatal error:`, error);
		throw error;
	}
}

/**
 * POST /api/embeddings/generate
 * Generate embeddings for all curriculum tables
 */
export const POST: RequestHandler = async () => {
	try {
		console.log('🚀 Starting curriculum embedding generation via API...');

		const startTime = Date.now();
		const allStats: EmbeddingStats[] = [];

		// Define all tables to process with their vector stores
		const tables = [
			{
				name: 'Learning Areas',
				table: learningArea,
				store: new LearningAreaVectorStore(defaultEmbeddings)
			},
			{
				name: 'Learning Area Content',
				table: learningAreaContent,
				store: new LearningAreaContentVectorStore(defaultEmbeddings)
			},
			{
				name: 'Learning Area Standards',
				table: learningAreaStandard,
				store: new LearningAreaStandardVectorStore(defaultEmbeddings)
			},
			{
				name: 'Standard Elaborations',
				table: standardElaboration,
				store: new StandardElaborationVectorStore(defaultEmbeddings)
			},
			{
				name: 'Outcomes',
				table: outcome,
				store: new OutcomeVectorStore(defaultEmbeddings)
			},
			{
				name: 'Key Skills',
				table: keySkill,
				store: new KeySkillVectorStore(defaultEmbeddings)
			},
			{
				name: 'Key Knowledge',
				table: keyKnowledge,
				store: new KeyKnowledgeVectorStore(defaultEmbeddings)
			},
			{
				name: 'Exam Questions',
				table: examQuestion,
				store: new ExamQuestionVectorStore(defaultEmbeddings)
			},
			{
				name: 'Learning Activities',
				table: learningActivity,
				store: new LearningActivityVectorStore(defaultEmbeddings)
			},
			{
				name: 'Assessment Tasks',
				table: assessmentTask,
				store: new AssessmentTaskVectorStore(defaultEmbeddings)
			},
			{
				name: 'Extra Content',
				table: curriculumSubjectExtraContent,
				store: new CurriculumSubjectExtraContentVectorStore(defaultEmbeddings)
			}
		];

		// Process each table
		for (const { name, table, store } of tables) {
			try {
				console.log(`\n📊 Starting ${name}...`);
				const stats = await generateEmbeddingsForTable(name, table, store);
				allStats.push(stats);

				// Log summary after each table
				if (stats.failed > 0) {
					console.log(`⚠️  ${name}: ${stats.processed} succeeded, ${stats.failed} failed`);
				}
			} catch (error) {
				console.error(`❌ Fatal error processing ${name}:`, error);
				allStats.push({
					tableName: name,
					total: 0,
					processed: 0,
					failed: 0,
					errors: [{ id: -1, error: String(error) }]
				});
			}
		}

		const endTime = Date.now();
		const duration = ((endTime - startTime) / 1000).toFixed(2);

		const totalRecords = allStats.reduce((sum, s) => sum + s.total, 0);
		const totalProcessed = allStats.reduce((sum, s) => sum + s.processed, 0);
		const totalFailed = allStats.reduce((sum, s) => sum + s.failed, 0);

		console.log(
			`✅ Embedding generation complete: ${totalProcessed}/${totalRecords} in ${duration}s`
		);

		return json({
			success: true,
			summary: {
				totalRecords,
				processed: totalProcessed,
				failed: totalFailed,
				duration: parseFloat(duration),
				averagePerSecond: parseFloat((totalProcessed / (parseFloat(duration) || 1)).toFixed(2))
			},
			tables: allStats
		});
	} catch (error) {
		console.error('Fatal error during embedding generation:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
};

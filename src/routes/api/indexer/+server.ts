import { VectorIndexingService } from '$lib/server/agents/retrieval/indexer';
import { json } from '@sveltejs/kit';

export const POST = async ({ request }: { request: Request }) => {
	try {
		const body = await request.json();
		const { action = 'index_everything' } = body;

		console.log('🚀 Starting indexer via API endpoint...');
		const indexer = new VectorIndexingService();

		switch (action) {
			case 'initialize':
				await indexer.initialize();
				return json({
					success: true,
					message: 'Indexer initialized successfully',
					timestamp: new Date().toISOString()
				});

			case 'index_everything':
				await indexer.indexEverything();
				return json({
					success: true,
					message: 'Complete indexing finished successfully',
					timestamp: new Date().toISOString()
				});

			case 'test_search': {
				const { subjectId = 1, query = 'key concepts' } = body;
				await indexer.initialize();
				const results = await indexer.testIndexing(subjectId, query);
				return json({
					success: true,
					message: `Found ${results.length} results for "${query}"`,
					results: results.slice(0, 5), // Return first 5 results
					timestamp: new Date().toISOString()
				});
			}

			case 'list_collections': {
				await indexer.initialize();
				const vectorStore = indexer.getVectorStore();

				// Get initialized subjects
				const initializedSubjects = vectorStore.getInitializedSubjects();
				console.log(`📊 Initialized subjects: ${initializedSubjects.join(', ')}`);

				// Try to get collections info
				try {
					const collectionsInfo = [];
					const collectionTypes = [
						'curriculum_contents',
						'learning_activities',
						'assessment_tasks',
						'exam_questions',
						'detailed_examples',
						'extra_contents'
					];

					for (const subjectId of initializedSubjects) {
						for (const type of collectionTypes) {
							const collectionName = `${subjectId}_${type}`;
							try {
								// Try a simple search to test if collection has data
								const testResult = await vectorStore.hybridSearch('test query', {
									subjectId,
									collections: [type],
									k: 1
								});
								collectionsInfo.push({
									name: collectionName,
									subjectId: subjectId,
									type: type,
									exists: true,
									hasData: testResult.length > 0,
									resultCount: testResult.length
								});
							} catch (error) {
								collectionsInfo.push({
									name: collectionName,
									subjectId: subjectId,
									type: type,
									exists: false,
									error: error instanceof Error ? error.message : 'Unknown error'
								});
							}
						}
					}

					// Group by subject
					const collectionsBySubject = collectionsInfo.reduce(
						(acc, collection) => {
							if (!acc[collection.subjectId]) {
								acc[collection.subjectId] = [];
							}
							acc[collection.subjectId].push(collection);
							return acc;
						},
						{} as Record<number, typeof collectionsInfo>
					);

					return json({
						success: true,
						message: 'Collections info retrieved',
						initializedSubjects,
						totalCollections: collectionsInfo.filter((c) => c.exists).length,
						collectionsWithData: collectionsInfo.filter((c) => c.hasData).length,
						collections: collectionsInfo,
						collectionsBySubject,
						timestamp: new Date().toISOString()
					});
				} catch (error) {
					return json(
						{
							success: false,
							error: `Failed to list collections: ${error instanceof Error ? error.message : 'Unknown error'}`
						},
						{ status: 500 }
					);
				}
			}

			case 'test_hybrid_search': {
				const {
					subjectId = 1,
					query = 'key concepts',
					collections = [
						'curriculum_contents',
						'learning_activities',
						'assessment_tasks',
						'exam_questions'
					],
					k = 10
				} = body;

				await indexer.initialize();
				const vectorStore = indexer.getVectorStore();

				console.log(`🔍 Testing hybrid search for subject ${subjectId} with query: "${query}"`);
				console.log(`📚 Collections to search: ${collections.join(', ')}`);

				// First, let's check what collections actually exist
				try {
					console.log('🔍 Debug: Checking what collections exist...');

					const results = await vectorStore.hybridSearch(query, {
						subjectId,
						collections,
						k
					});

					console.log(`📊 Search completed: Found ${results.length} results`);

					if (results.length === 0) {
						// Add debugging information
						console.log('❌ No results found. Debugging information:');
						console.log(`   - Subject ID: ${subjectId}`);
						console.log(`   - Collections: ${JSON.stringify(collections)}`);
						console.log('   - This could mean:');
						console.log("     1. Collections don't exist for this subject ID");
						console.log('     2. Collections exist but are empty');
						console.log("     3. Query doesn't match any content");
					}

					// Format results with detailed information
					const detailedResults = results.map((result, index) => ({
						rank: index + 1,
						score: result.score,
						source: result.source,
						contentType: result.metadata.type,
						subjectId: result.metadata.subjectId,
						learningArea: result.metadata.learningArea,
						topicName: result.metadata.topicName,
						content: result.content,
						preview: result.content.substring(0, 200) + (result.content.length > 200 ? '...' : ''),
						metadata: result.metadata
					}));

					// Group results by collection/source
					const resultsBySource = detailedResults.reduce(
						(acc, result) => {
							if (!acc[result.source]) acc[result.source] = [];
							acc[result.source].push(result);
							return acc;
						},
						{} as Record<string, Array<(typeof detailedResults)[0]>>
					);

					return json({
						success: true,
						message: `Hybrid search completed for subject ${subjectId}`,
						query,
						totalResults: results.length,
						results: detailedResults,
						resultsBySource,
						searchParams: { subjectId, collections, k },
						debugInfo: {
							searchedCollections: collections,
							actualSubjectId: subjectId,
							resultsFound: results.length > 0
						},
						timestamp: new Date().toISOString()
					});
				} catch (searchError) {
					console.error('❌ Search error:', searchError);
					return json(
						{
							success: false,
							error: `Search failed: ${searchError instanceof Error ? searchError.message : 'Unknown error'}`,
							debugInfo: {
								subjectId,
								collections,
								query
							}
						},
						{ status: 500 }
					);
				}
			}

			default:
				return json(
					{
						success: false,
						error: `Unknown action: ${action}`,
						availableActions: [
							'initialize',
							'index_everything',
							'test_search',
							'test_hybrid_search',
							'list_collections'
						]
					},
					{ status: 400 }
				);
		}
	} catch (error) {
		console.error('❌ Indexer API error:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				stack: error instanceof Error ? error.stack : undefined,
				timestamp: new Date().toISOString()
			},
			{ status: 500 }
		);
	}
};

export const GET = async () => {
	return json({
		message: 'Indexer API endpoint',
		availableActions: [
			'initialize',
			'index_everything',
			'test_search',
			'test_hybrid_search',
			'list_collections'
		],
		usage: {
			initialize: 'POST /api/indexer with {"action": "initialize"}',
			index_everything: 'POST /api/indexer with {"action": "index_everything"}',
			test_search:
				'POST /api/indexer with {"action": "test_search", "subjectId": 1, "query": "your query"}',
			test_hybrid_search:
				'POST /api/indexer with {"action": "test_hybrid_search", "subjectId": 1, "query": "your query", "collections": ["curriculum_contents", "exam_questions"], "k": 10}',
			list_collections: 'POST /api/indexer with {"action": "list_collections"}'
		},
		timestamp: new Date().toISOString()
	});
};

import { generateAndStoreModule } from '$lib/server/db/service';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		// Validate required fields
		const { title, description, subjectId, subjectType } = body;

		if (!title || !description || !subjectId || !subjectType) {
			return json(
				{
					error: 'Missing required fields',
					required: ['title', 'description', 'subjectId', 'subjectType']
				},
				{ status: 400 }
			);
		}

		// Validate subject type
		const validSubjectTypes = ['mathematics', 'science', 'english', 'default'];
		if (!validSubjectTypes.includes(subjectType)) {
			return json(
				{
					error: 'Invalid subject type',
					validTypes: validSubjectTypes
				},
				{ status: 400 }
			);
		}

		// Generate and store the module
		const result = await generateAndStoreModule({
			title,
			description,
			subjectId,
			subjectType
		});

		return json({
			success: true,
			moduleId: result.module.id,
			module: result.module,
			sectionsGenerated: result.sections.length,
			totalContentBlocks: result.sections.reduce((acc, s) => acc + s.contentBlocks.length, 0),
			totalInteractiveBlocks: result.sections.reduce(
				(acc, s) => acc + s.interactiveBlocks.length,
				0
			)
		});
	} catch (error) {
		console.error('Module generation error:', error);
		return json(
			{
				error: 'Failed to generate module',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

export const GET: RequestHandler = async () => {
	return json({
		endpoint: '/api/module/generate',
		method: 'POST',
		description: 'Generate a complete learning module with content and interactive blocks',
		requiredFields: {
			title: 'string - Module title',
			description: 'string - Module description',
			subjectId: 'number - Subject ID from database',
			subjectType: 'string - One of: mathematics, science, english, default'
		},
		exampleRequest: {
			title: 'Introduction to Differentiation',
			description: 'Learn the fundamentals of differentiation and its applications',
			subjectId: 1011,
			subjectType: 'mathematics'
		}
	});
};

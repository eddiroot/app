export const planSchema = {
	type: 'object',
	properties: {
		summary: {
			type: 'string',
			description: 'A brief summary (max 60 words) of the lesson plan to preview'
		},
		name: {
			type: 'string',
			description: 'Title of the generated lesson plan'
		},
		description: {
			type: 'string',
			description: 'A narrative overview of what the lesson will cover (30-60 words)'
		},
		scopes: {
			type: 'array',
			description: 'An ordered breakdown of lesson sections',
			items: {
				type: 'object',
				properties: {
					title: {
						type: 'string',
						description: 'Heading or focus for this section'
					},
					details: {
						type: 'string',
						description: 'Short description of activities or content in this section'
					}
				},
				required: ['title', 'details']
			}
		},
		usedStandards: {
			type: 'array',
			description: 'The 1-2 learning-area standards leveraged in this plan',
			maxItems: 2,
			items: {
				type: 'object',
				properties: {
					id: { type: 'integer' }
				},
				required: ['id']
			}
		}
	},
	required: ['summary', 'name', 'description', 'scopes', 'usedStandards']
};

/**
 * Build a prompt for Gemini to generate a lesson plan conforming to planSchema.
 *
 * @param contextsJson - JSON-stringified array of PlanContext objects.
 * @param yearLevel - The target year level for this lesson plan.
 * @param userInstruction - Optional guidance or preferences for the lesson plan.
 * @returns A prompt string ready to send to Gemini.
 */
export function buildLessonPlanPrompt(contextsJson: string, userInstruction: string = ''): string {
	return `
You are given:

1) A PlanContext array (JSON), representing curriculum context: description, standards, and elaborations and a year level.
2) A target year level (string).
${userInstruction ? `3) User Request: ${userInstruction}\n\n` : ''}
These contexts are the curriculum framework—use them as guidance to craft a creative, engaging lesson plan.

Structure your output according to the following JSON-Schema as a blueprint (do not add extra properties):

\`\`\`json
${JSON.stringify(planSchema, null, 2)}
\`\`\`

Requirements:
- Treat the provided data as curriculum guidance, not rigid content; you may be creative.
- Pick at most **2** standards from the provided list.
- For each chosen standard, include its elaborations (the \`standardElaboration\` text).
- Produce an ordered array of \`scopes\` (2-4 items), each with:
    - \`title\`: section heading
    - \`details\`: section activities/content
- Provide a high-level \`description\` of the lesson.
- Use a concise \`name\` for the lesson plan title.
- **Do not** exceed the schema's properties or introduce any additional keys.
- **Only** return the JSON object—no explanatory text.

Here is your input data:
\`\`\`json
{
  "contexts": ${contextsJson}
}
\`\`\`

Respond now with just the JSON object.
  `.trim();
}

export interface LessonPlan {
	summary: string;
	name: string;
	description: string;
	scopes: { title: string; details: string }[];
}

/**
 * Turn a lesson plan into a rich text prompt for Gemini's image model.
 */
export function buildLessonPlanImagePrompt(plan: LessonPlan): string {
	let prompt = `Illustration for lesson "${plan.name}". Summary: ${plan.summary}\n\n`;
	prompt += `Overview: ${plan.description}\n\n`;
	prompt += `Sections:\n`;
	plan.scopes.forEach((scope, i) => {
		prompt += `${i + 1}. ${scope.title} — ${scope.details}\n`;
	});
	prompt += `\nCreate an engaging, colorful illustration that captures the essence of this plan. Do not generate text in the image, just visuals.`;
	return prompt.trim();
}

export type AssessmentPlan = {
	summary: string;
	name: string;
	description: string;
	scopes: Array<{ title: string; details: string }>;
	usedStandards: Array<{ id: number; name?: string }>;
	rubric: {
		rows: Array<{
			title: string;
			cells: Array<{
				level: 'exemplary' | 'accomplished' | 'developing' | 'beginning';
				description: string;
				marks: number;
			}>;
		}>;
	};
};

export function buildAssessmentPlanImagePrompt(plan: AssessmentPlan): string {
	let prompt = `Illustration for assessment "${plan.name}". Summary: ${plan.summary}\n\n`;
	prompt += `Overview: ${plan.description}\n\n`;
	prompt += `Assessment sections:\n`;
	plan.scopes.forEach((scope, i) => {
		prompt += `${i + 1}. ${scope.title} — ${scope.details}\n`;
	});
	prompt += `\nCreate an engaging, educational illustration that represents this assessment task. Focus on academic, evaluation, or testing themes. Do not generate text in the image, just visuals.`;
	return prompt.trim();
}

export const assessmentSchema = {
	type: 'object',
	properties: {
		summary: {
			type: 'string',
			description: 'Short preview (≤ 60 words) so a teacher can decide to accept/regenerate'
		},
		name: {
			type: 'string',
			description: 'Title of the assessment task'
		},
		description: {
			type: 'string',
			description: 'Detailed overview of the assessment (30-60 words)'
		},
		scopes: {
			type: 'array',
			description: 'Ordered sections or parts of the assessment',
			items: {
				type: 'object',
				properties: {
					title: { type: 'string' },
					details: { type: 'string' }
				},
				required: ['title', 'details']
			}
		},
		usedStandards: {
			type: 'array',
			description:
				'Learning-area standards addressed (should cover most of the area, not just one or two)',
			items: {
				type: 'object',
				properties: { id: { type: 'integer' }, name: { type: 'string' } },
				required: ['id']
			},
			minItems: 3 // encourage broad coverage
		},
		rubric: {
			type: 'object',
			description: 'Analytic rubric aligned to the assessment',
			properties: {
				rows: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							title: { type: 'string', description: 'Criterion name (e.g. "Analysis")' },
							cells: {
								type: 'array',
								items: {
									type: 'object',
									properties: {
										level: {
											type: 'string',
											enum: ['exemplary', 'accomplished', 'developing', 'beginning']
										},
										description: { type: 'string' },
										marks: { type: 'number' }
									},
									required: ['level', 'description', 'marks']
								},
								minItems: 4,
								maxItems: 4
							}
						},
						required: ['title', 'cells']
					}
				}
			},
			required: ['rows']
		}
	},
	required: ['summary', 'name', 'description', 'scopes', 'usedStandards', 'rubric']
} as const;

// ─────────────────────────────────────────────────────────────
// Prompt builder
// ─────────────────────────────────────────────────────────────
/**
 * Build a prompt for Gemini to generate an assessment plan that conforms to
 * `assessmentSchema`.
 *
 * @param contextsJson    JSON-stringified PlanContext[] (curriculum input)
 * @param yearLevel       Target year level (e.g. "Year 8")
 * @param userInstruction Optional teacher guidance to influence focus/style
 */
export function buildAssessmentPlanPrompt(contextsJson: string, userInstruction = ''): string {
	return `
You are given:

1) A PlanContext array (JSON) containing curriculum context (topic description, standards, elaborations, yearLevel).
${userInstruction ? `2) Teacher Guidance: ${userInstruction}\n` : ''}

Use these inputs as a framework—feel free to be creative and engaging.

Return **one** JSON object that follows the schema below (no extra keys):

\`\`\`json
${JSON.stringify(assessmentSchema, null, 2)}
\`\`\`

### Key requirements
- Treat the curriculum as guidance, not a script.
- **Cover the majority of the learning-area standards** (≥ 3).
- summary: max 60 words; entice the teacher to accept or regenerate.
- description: 30-60 words; richer context for the assessment task.
- scopes: 2-4 ordered parts of the assessment (e.g. research, practical, reflection).
- rubric.rows: 1 row per key criterion; each must contain **exactly** four cells
  matching the levels **exemplary, accomplished, developing, beginning**.
- Allocate sensible marks in each cell so total marks are clear.
- If **no context** is supplied (empty array), leave usedStandards empty.
- **Output only the JSON object**—no commentary.

### Input data
\`\`\`json
{
  "contexts": ${contextsJson}
}
\`\`\`

Respond now with the JSON object.`.trim();
}

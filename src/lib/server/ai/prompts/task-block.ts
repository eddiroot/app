
import { taskBlockTypeEnum, taskTypeEnum } from '$lib/enums';

/**
 * Prompt descriptions for each task block type
 * These guide the LLM in understanding what each block is for and how to generate it
 */
export const blockPrompts: Record<taskBlockTypeEnum, string> = {
	[taskBlockTypeEnum.heading]: `A heading block displays a title or section header.
Generate clear, concise headings that organize content hierarchically.
Use appropriate heading sizes (2-6, where 2 is largest).`,

	[taskBlockTypeEnum.richText]: `A rich text block displays formatted HTML content for explanations, instructions, or information.
Generate well-structured educational content using paragraphs, emphasis, and lists.
Keep content clear, engaging, and age-appropriate.`,

	[taskBlockTypeEnum.mathInput]: `A math input block presents a mathematical problem requiring numerical calculation.
Generate a clear question with a specific numerical answer.
Include the working steps if complexity requires it.
For assessments, assign marks based on problem complexity.`,

	[taskBlockTypeEnum.choice]: `A multiple choice block presents a question with several options, where one or more can be correct.
Generate a clear question with 3-5 options.
Options must be descriptive text (not letters like a,b,c).
For single answer questions, only one option should have isAnswer: true.
For multiple answer questions, multiple options can have isAnswer: true.
Include an explanation of why the answer is correct when appropriate.`,

	[taskBlockTypeEnum.fillBlank]: `A fill-in-the-blank block presents a sentence with missing words for students to complete.
Use exactly _____ (5 underscores) to indicate each blank.
Limit to maximum 3 blanks per sentence.
Provide all correct answers in order.
Focus on key terms and concepts.`,

	[taskBlockTypeEnum.matching]: `A matching block asks students to connect related items from two columns.
Generate clear instructions explaining what to match.
Create 4-6 pairs of related concepts, terms, or definitions.
Ensure left and right items are clearly distinguishable.`,

	[taskBlockTypeEnum.shortAnswer]: `A short answer block requires students to write a brief written response.
Generate open-ended questions that test understanding, not just recall.
For assessments, always provide detailed marking criteria.
Each criterion should specify what is required and how many marks it's worth.
The sum of criteria marks must equal the total marks for the question.`,

	[taskBlockTypeEnum.close]: `A cloze test block presents text with strategic words removed for students to identify.
Generate meaningful sentences where key terms are replaced with blanks.
Students must identify and fill in the missing words from context.`,

	[taskBlockTypeEnum.highlightText]: `A highlight text block asks students to identify and highlight specific information in a passage.
Provide a passage of text with key information embedded.
Include clear instructions about what to highlight.
Set highlightCorrect to indicate if highlighting correct info or errors.`,

	[taskBlockTypeEnum.table]: `A table block displays data in rows and columns.
Generate a clear title describing the table's purpose.
Ensure data is well-organized and relevant to the learning content.
Use appropriate row and column counts for clarity.`,

	[taskBlockTypeEnum.whiteboard]: `A whiteboard block provides a digital canvas for drawing, diagrams, or freeform work.
Generate a clear title indicating what students should create or demonstrate.
Suitable for visual explanations, diagrams, or problem-solving work.`,

	[taskBlockTypeEnum.graph]: `A graph block displays mathematical functions on a coordinate plane.
Define clear axis labels and appropriate ranges for the content.
Can include static plots to show examples or reference functions.
Students may plot their own functions depending on the activity.`,

	[taskBlockTypeEnum.balancingEquations]: `A balancing equations block presents a chemical equation for students to balance.
Generate a valid chemical equation with reactants and products.
Set which coefficients are given and which students must determine.
Ensure the equation can be properly balanced.`,

	[taskBlockTypeEnum.image]: `An image block displays a visual resource.
Provide the image path and descriptive alt text for accessibility.
Use images to support explanations, provide examples, or present visual information.`,

	[taskBlockTypeEnum.video]: `A video block embeds educational video content.
Provide a valid video URL and descriptive alt text.
Use videos to demonstrate concepts, provide context, or show real-world applications.`,

	[taskBlockTypeEnum.audio]: `An audio block provides audio content for listening activities.
Provide the audio file path and descriptive alt text.
Useful for language learning, speeches, music, or audio instructions.`
};

/**
 * Specific prompts for optional block fields
 */
export const fieldPrompts = {
	marks: `Assign marks based on:
- Question complexity and cognitive demand
- Amount of work required
- Expected response length and detail
- Typical marks for this type of question at this level
Common ranges: 1-2 marks for simple recall, 3-5 marks for application, 6+ marks for analysis/evaluation`,

	criteriaItems: `Provide detailed marking criteria items:
- Each criterion should describe a specific aspect to assess
- Allocate marks proportionally to the importance/difficulty of each criterion
- Be specific about what students must demonstrate
- Ensure all criteria are measurable and objective
- The sum of all criteria marks MUST equal the total marks for the question
Example: For a 6-mark question, you might have:
  • Criterion 1 (3 marks): Identifies and explains main concept
  • Criterion 2 (2 marks): Provides relevant example
  • Criterion 3 (1 mark): Uses correct terminology`,

	difficulty: `Set difficulty level based on:
- **Beginner**: Basic recall, simple application, foundational concepts
- **Intermediate**: Multi-step problems, analysis, connecting concepts
- **Advanced**: Complex reasoning, evaluation, synthesis of multiple ideas
Consider the year level when setting difficulty.`,

	hints: `Provide exactly 3 progressive hints:
- **Hint 1**: Gentle nudge toward the right approach (doesn't give away answer)
- **Hint 2**: More specific guidance, perhaps highlighting a key concept
- **Hint 3**: Strong hint that almost gives the answer but requires student to complete
Hints should scaffold learning, not just reveal the answer.`,

	steps: `Provide step-by-step solution breakdown:
- Each step should be clear and logical
- Show working/reasoning, not just the final answer
- Use appropriate mathematical notation or terminology
- Help students understand the problem-solving process
- Final step should lead to the complete answer`
};


/**
 * Get the prompt description for a specific block type
 */
export function getBlockPrompt(blockType: taskBlockTypeEnum): string {
	return blockPrompts[blockType] || 'Generate appropriate content for this block type.';
}


/**
 * Build the block prompt based on the blocks being used and the content
 * Content will be the the sections content from the orchestrator
 */
export function buildTaskBlockPrompt(
	blockTypes: taskBlockTypeEnum[],
	taskType: taskTypeEnum,
	sectionContent: string
): string {
	const blockPromptsList = blockTypes.map((bt) => `- ${getBlockPrompt(bt)}`).join('\n');

	return `You are a content transformer. Your job is to convert the provided educational content for a ${taskType} into structured task blocks.

	**CRITICAL RULES:**
	1. DO NOT generate new content, explanations, or information
	2. DO NOT add facts, examples, or concepts not present in the source content
	3. ONLY transform, restructure, derive, and format the existing content into blocks
	
	**SOURCE CONTENT TO TRANSFORM:**
	${sectionContent}

	**AVAILABLE BLOCK TYPES:**
	${blockPromptsList}

	---

	**TRANSFORMATION GUIDELINES:**
	1. **Transform Explanatory Content → Rich Text Blocks**
	- Convert paragraphs, definitions, and explanations into richText blocks and headings
	- Preserve the original wording - only reformat to HTML

	2. **Transform Testable Content → Interactive Blocks**
	- Identify facts, concepts, or procedures that can become questions
	- Create questions that students can answer using the content
	- Answers MUST be directly stated or clearly implied in the content

	3. **Maintain Content Order**
	- Follow the logical flow of the original content
	- Don't rearrange concepts unless necessary for coherence

	Transfrom the source content into blocks now.`;
}

// ============================================================================
// Orchestrator Sythesizer
// ============================================================================

import { taskTypeEnum } from "$lib/enums";
import type { ContentOrchestratorInput } from "../nodes/orchestrator-synthesiser/task";

export function buildOrchestratorPrompt(input: ContentOrchestratorInput): string {
    const contentStr = input.retrievedContent.map((doc, index) => `--- Content Block ${index + 1} --- ${doc.pageContent}`).join('\n');

    const taskTypeInstructions: Record<taskTypeEnum, string> = {
        [taskTypeEnum.lesson]: `Create a cohesive LESSON.
        - Analyze the provided content and group it into logical learning segments.
        - Create a new section only when moving to a distinct new concept or skill.
        - Ensure a logical flow from one concept to the next.
        - Aim for 1-3 substantial sections rather than many small fragments.`,
        
        [taskTypeEnum.homework]: `Create a HOMEWORK task.
        - Group the content into sections based on the specific skills being practiced.
        - If the homework covers multiple distinct topics, create a section for each.
        - If it covers one main topic, a single section is sufficient.`,
        
        [taskTypeEnum.test]: `Create an TEST.
        - Group questions/content by skill area.
        - Create distinct sections for different types of analysis or topic areas.
        - Ensure the scope of each section clearly defines what is being tested.`,
        
        [taskTypeEnum.assignment]: `Create an ASSIGNMENT/PROJECT.
        - Structure the content into logical phases of the project (e.g., Research, Application, Reflection).
        - Or, group by the specific criteria/requirements of the task.`,
        
        [taskTypeEnum.module]: `Create a MODULE overview.
        - Break down the broad topic into its major constituent themes.
        - Each section should represent a significant chunk of learning.`
    };
    return `You are an expert educational content orchestrator. Your goal is to synthesize the provided reference material into a structured ${input.taskType}.

    **Task Title:** ${input.title}
    ${input.description ? `**Description:** ${input.description}` : ''}
    **Year Level:** ${input.yearLevel}

    **Reference Material:**
    ${contentStr || 'No reference content provided.'}

    ---

    ***Instructions for ${input.taskType}***
    ${taskTypeInstructions[input.taskType]}

    **Orchestration Rules:**

    **Content Guidelines:**
    1. **Determine Sections:** You decide how many sections are necessary (maximum 3). Only create a new section if the content logically demands a separation (e.g., moving from "Theory" to "Application", or "Concept A" to "Concept B").
    2. **Define Scope:** For each section, write a "Scope" that clearly describes the specific learning intentions or skills covered in that part.
    3. **Synthesize Content:** Write the full educational content for each section. 
    - Write in clear, student-appropriate language
    - Synthesize reference material
    - Use proper formatting (paragraphs, bullet points where appropriate)
    - Each section's content should be substantial and complete
    - Do NOT include section headings in the content 
    - The content will later be transformed into interactive blocks, so focus on the educational substance
    
    **Output:**
    Generate the sections with their scope and full content string, and a description of the whole task`

    
}
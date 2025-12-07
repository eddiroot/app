import { subjectGroupEnum, taskTypeEnum, yearLevelEnum } from "$lib/enums";
import { getLearningAreaStandardWithElaborationsByIds } from "$lib/server/db/service";
import { Document } from "@langchain/core/documents";
import { Annotation, END, Send, StateGraph } from "@langchain/langgraph";
import { defaultEmbeddings } from "../../embeddings";
import { getBaseLLM } from "../../models/base";
import { createOptimizedSubjectGroupNode } from "../../nodes/analysis/subject";
import { multiBlockGenerationNode, type OrderedBlock, type TaskBlock } from "../../nodes/generation/task-block";
import { createOrchestratorNode } from "../../nodes/orchestrator-synthesiser/task";
import { createRAGRetrievalNode } from "../../nodes/retrieval/multi-store";
import type { ContentSection } from "../../schemas/task";
import { createTaskTool, type TaskCreationData } from "../../tools/database/task-persistance";
import type { TableVectorStore } from "../../vector-store/base";
import { AssessmentTaskVectorStore } from "../../vector-store/curriculum/assessment-task";
import { CurriculumSubjectExtraContentVectorStore } from "../../vector-store/curriculum/curriculum-subject-extra-content";
import { ExamQuestionVectorStore } from "../../vector-store/curriculum/exam-question";
import { KeyKnowledgeVectorStore } from "../../vector-store/curriculum/key-knowledge";
import { KeySkillVectorStore } from "../../vector-store/curriculum/key-skill";
import { LearningActivityVectorStore } from "../../vector-store/curriculum/learning-activity";
import { LearningAreaVectorStore } from "../../vector-store/curriculum/learning-area";
import { LearningAreaStandardVectorStore } from "../../vector-store/curriculum/learning-area-standard";
import { OutcomeVectorStore } from "../../vector-store/curriculum/outcome";
import { StandardElaborationVectorStore } from "../../vector-store/curriculum/standard-elaboration";
import { TaskBlockVectorStore } from "../../vector-store/task/task-block";
import { TempPoolVectorStore } from "../../vector-store/temp-pool";

/**
New Workflow 
  
The rational of this workflow is to break down the task creation process into steps, with continuous teacher involvement. This ensures that the generated content is relevant, accurate and aligned with the teacher's goals. 
 (*) denotes steps where user input/feedback is required. There is a constant chat interface available (like a tutor) at each step a "ai message" is sent to the user explaining what has to be done as well as interactive elements on the main screen.

1. Initial Input and Setup
- Gather basic task details from the user (title, type, description, subject, year level, curriculum standards).
- User can also upload relavent documents or resources. 

2. RAG Content/Context Retrieval 
- Use RAG techniques to retrieve relevant content based on the task details and curriculum standards.
- For each retrieved document/resource, provide the title/name and where it was sourced from (e.g. internal table, tavily (youtube, website etc) )
- Present the retrieved content as widgets/cards to the user for review and selection. (top 4 are pre-selected based on relevance, another 6-10 can be selected and deselected - can view more details if needed) (*)
   - (AI Message): "Based on your task details, I've retrieved some relevant content that could be useful. Please review and select the ones you find most appropriate for your task. If you have any specific content in mind, feel free to upload or link it. (etc)

3. Proposed learning objectives 
- Based on the task description and the selected content/resources, generate 2 sets of proposed learning objectsives that align with the task goals. (each set contains 3-5 objectives) 
- Generate a list of extra learning objectives that could also be relevant to the task whether its an extension or just more depth.
- Present these objectives to the user for review and selection. (*)
   - (AI Message): "Here are some proposed learning objectives based on your task description and selected content. Please review them and select the ones that best align with your goals. You can also modify or add new objectives as needed."
    
4. Content Creation - Orchestration 
- Using the selected content/resources and learning objectives, generate structured content sections for the task using the orchestrator node.
- Generate the task description and display the lesson plan on the left side of the screen, this includes the task title, description and the learning objectives with aproximate time allocations.

5. Block Selection
- While the orchestrator is still running, display the potential blocks that could be generated for the task as cards. Select the ones they would want to include in the task. (*)
   - (AI Message): "Based on the content sections, here are some potential interactive blocks that could be included. Please select the ones you would like to incorporate into your task." 

Added things to consider:
- Ensure that a chain of user requests are used to refine the task generation process.
- Are there any other ways to break down the task creation process to make it more manageable and interactive for the user?
- For the development, ensure that each step of the workflow is displayed to the console for easier debugging and tracking where issues may arise and what RAG / TaskBlocks / Content are being generated at each step.
*/

// =============================================================================
// Types
// =============================================================================

export interface TaskPlan {
    name: string;
    courseMapItemId: number;
    learningAreaStandardIds: number[];
    scopes: string[];
    description: string;
}

// =============================================================================
// State Definitions
// =============================================================================

export const TaskGenerationState = Annotation.Root({
    // Input 
    taskType: Annotation<taskTypeEnum>,
    title: Annotation<string>,
    description: Annotation<string | undefined>,
    subjectOfferingId: Annotation<number>,
    curriculumSubjectId: Annotation<number | undefined>,
    courseMapItemId: Annotation<number>,
    subjectOfferingClassId: Annotation<number>,
    author: Annotation<string>,
    week: Annotation<number | undefined>,
    dueDate: Annotation<Date | undefined>,
    learningAreaStandardIds: Annotation<number[]>,
    yearLevel: Annotation<yearLevelEnum>,
    uploadedFiles: Annotation<string[] | undefined>,
    aiTutorEnabled: Annotation<boolean>,

    // Intermediate states
    retrievedContent: Annotation<Document[]>,
    contentSections: Annotation<ContentSection[]>,
    taskDescription: Annotation<string>,
    subjectGroup: Annotation<subjectGroupEnum>,

    // Blocks from parallel workers - uses reducer to combine
    generatedBlocks: Annotation<OrderedBlock[]>({
        default: () => [],
        reducer: (current, update) => [...current, ...update],
    }),

    // Output
    taskId: Annotation<number | undefined>,
    planId: Annotation<number | undefined>,
});

// Worker state - what gets sent to each block generation worker
export const BlockWorkerState = Annotation.Root({
    contentSection: Annotation<ContentSection>,
    taskType: Annotation<taskTypeEnum>,
    subjectGroup: Annotation<subjectGroupEnum>,
    
    // Output - reducer to collect blocks
    generatedBlocks: Annotation<OrderedBlock[]>({
        default: () => [],
        reducer: (current, update) => [...current, ...update],
    }),
});

type TaskGenState = typeof TaskGenerationState.State;
type WorkerState = typeof BlockWorkerState.State;

// =============================================================================
// Graph Builder
// =============================================================================

export function createTaskGenerationGraph() {
    const llm = getBaseLLM();

    // -------------------------------------------------------------------------
    // Initialise Vector Stores
    // -------------------------------------------------------------------------
    const learningAreaVectorStore = new LearningAreaVectorStore(defaultEmbeddings);
    const learningAreaStandardVectorStore = new LearningAreaStandardVectorStore(defaultEmbeddings);
    const standardElaborationVectorStore = new StandardElaborationVectorStore(defaultEmbeddings);
    const outcomeVectorStore = new OutcomeVectorStore(defaultEmbeddings);
    const keySkillVectorStore = new KeySkillVectorStore(defaultEmbeddings);
    const keyKnowledgeVectorStore = new KeyKnowledgeVectorStore(defaultEmbeddings);
    const examQuestionVectorStore = new ExamQuestionVectorStore(defaultEmbeddings);
    const learningActivityVectorStore = new LearningActivityVectorStore(defaultEmbeddings);
    const assessmentTaskVectorStore = new AssessmentTaskVectorStore(defaultEmbeddings);
    const curriculumSubjectExtraContentVectorStore = new CurriculumSubjectExtraContentVectorStore(defaultEmbeddings);
    const taskBlockVectorStore = new TaskBlockVectorStore(defaultEmbeddings);
    const tempPoolVectorStore = new TempPoolVectorStore(defaultEmbeddings);

    // -------------------------------------------------------------------------
    // Create RAG Nodes
    // -------------------------------------------------------------------------
    const teachRAGNode = createRAGRetrievalNode({
        vectorStores: [
            learningAreaVectorStore,
            learningAreaStandardVectorStore,
            standardElaborationVectorStore,
            keySkillVectorStore,
            keyKnowledgeVectorStore,
            learningActivityVectorStore,
            curriculumSubjectExtraContentVectorStore,
            taskBlockVectorStore,
            tempPoolVectorStore
        ] as unknown as TableVectorStore<Record<string, unknown>>[],
        defaultK: 6
    });

    const assessRAGNode = createRAGRetrievalNode({
        vectorStores: [
            learningAreaVectorStore,
            learningAreaStandardVectorStore,
            standardElaborationVectorStore,
            outcomeVectorStore,
            keySkillVectorStore,
            keyKnowledgeVectorStore,
            examQuestionVectorStore,
            assessmentTaskVectorStore,
            taskBlockVectorStore,
            tempPoolVectorStore
        ] as unknown as TableVectorStore<Record<string, unknown>>[],
        defaultK: 6
    });

    // -------------------------------------------------------------------------
    // Create Other Nodes
    // -------------------------------------------------------------------------
    const orchestratorNode = createOrchestratorNode(llm);
    const blockGeneratorNode = multiBlockGenerationNode(llm);
    const subjectGroupNode = createOptimizedSubjectGroupNode(llm);
    

    // -------------------------------------------------------------------------
    // Build Graph
    // -------------------------------------------------------------------------
    const graph = new StateGraph(TaskGenerationState)
        // Node: Infer Subject Group (if not provided)
        .addNode("infer_subject_group", async (state: TaskGenState) => {
            console.log("[1/6] Infer Subject Group");
            if (state.subjectGroup) {
                console.log("  → Already set:", state.subjectGroup);
                return {};
            }

            const result = await subjectGroupNode({
                subjectOfferingId: state.subjectOfferingId
            });

            console.log("  → Inferred:", result.subjectGroup);
            return { subjectGroup: result.subjectGroup };
        })


        // Node: RAG Retrieval
        .addNode("retrieve_content", async (state: TaskGenState) => {
            console.log("[3/6] RAG Retrieval");
            const isAssessment = state.taskType === taskTypeEnum.test || 
                                 state.taskType === taskTypeEnum.assignment ||
                                 state.taskType === taskTypeEnum.homework;

            console.log("  → Type:", isAssessment ? "assessment" : "teaching");
            const RAGNode = isAssessment ? assessRAGNode : teachRAGNode;
            const query = await buildRetrievalQuery(state);
            console.log("  → Query:", query.substring(0, 100) + (query.length > 100 ? "..." : ""));
            
            const retrievedContent = await RAGNode({ 
                query: query || `${state.title} ${state.description ?? ''}`, 
                k: 15, 
                filter: { curriculumSubjectId: state.curriculumSubjectId, yearLevel: state.yearLevel } 
            });
        
            console.log("  → Retrieved", retrievedContent.length, "documents");
            return { retrievedContent };
        })

        // Node: Orchestrator - Creates content sections
        .addNode("orchestrate_content", async (state: TaskGenState) => {
            console.log("[4/6] Orchestrate Content");
            console.log("  → Input docs:", state.retrievedContent.length);
            
            const result = await orchestratorNode({
                taskType: state.taskType,
                title: state.title,
                yearLevel: state.yearLevel,
                description: state.description,
                retrievedContent: state.retrievedContent
            });

            console.log("  → Generated", result.sections.length, "sections");
            result.sections.forEach((s, i) => console.log(`    [${i}] ${s.scope.substring(0, 60)}...`));
            return {
                contentSections: result.sections,
                taskDescription: result.taskDescription
            };
        })

        // Node: Block Generation Worker (receives Send from dispatcher)
        .addNode("generate_blocks", async (state: WorkerState) => {
            console.log("[5/6] Generate Blocks - Section", state.contentSection.index);
            
            const result = await blockGeneratorNode({
                contentSection: state.contentSection,
                taskType: state.taskType,
                subjectGroup: state.subjectGroup
            });

            console.log("  → Generated", result.blocks.length, "blocks");
            const blocksWithOrder = result.blocks.map((block, blockIndex) => ({
                ...block,
                _sectionIndex: result.sectionIndex,
                _blockIndex: blockIndex
            }));

            return { generatedBlocks: blocksWithOrder };
        })

        // Node: Assemble and persist task
        .addNode("persist_task", async (state: TaskGenState) => {
            console.log("[6/6] Persist Task");
            console.log("  → Total blocks:", state.generatedBlocks.length);
            
            // Sort blocks by section index, then block index
            const sortedBlocks = [...state.generatedBlocks]
                .sort((a, b) => {
                    const sectionDiff = a._sectionIndex - b._sectionIndex;
                    if (sectionDiff !== 0) return sectionDiff;
                    return a._blockIndex - b._blockIndex;
                })
                .map((orderedBlock): TaskBlock => {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { _sectionIndex, _blockIndex, ...block } = orderedBlock;
                    return block;
                }); 

            const taskPlan: TaskPlan = {
                name: state.title,
                courseMapItemId: state.courseMapItemId,
                learningAreaStandardIds: state.learningAreaStandardIds,
                scopes: state.contentSections.map(s => s.scope),
                description: state.taskDescription
            };

            const taskData: TaskCreationData = {
                title: state.title,
                description: state.taskDescription,
                taskType: state.taskType,
                subjectOfferingId: state.subjectOfferingId,
                subjectOfferingClassId: state.subjectOfferingClassId,
                courseMapItemId: state.courseMapItemId,
                author: state.author,
                week: state.week,
                dueDate: state.dueDate,
                aiTutorEnabled: state.aiTutorEnabled,
                blocks: sortedBlocks,
                plan: taskPlan
            };

            const result = await createTaskTool.invoke(taskData);

            console.log("  → Task ID:", result.taskId);
            console.log("  → Plan ID:", result.planId);
            return {
                taskId: result.taskId,
                planId: result.planId
            };
        })

        // -------------------------------------------------------------------------
        // Edges
        // -------------------------------------------------------------------------
        .addEdge("__start__", "infer_subject_group")
        .addEdge("infer_subject_group", "retrieve_content")
        .addEdge("retrieve_content", "orchestrate_content")
        
        // Conditional edge: Dispatch workers for each section
        .addConditionalEdges(
            "orchestrate_content",
            dispatchBlockWorkers,
            ["generate_blocks"]
        )
        
        // Workers converge to persist
        .addEdge("generate_blocks", "persist_task")
        .addEdge("persist_task", END);

    return graph.compile();
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Dispatches parallel workers for each content section
 */
function dispatchBlockWorkers(state: TaskGenState): Send[] {
    console.log("  → Dispatching", state.contentSections.length, "parallel workers");
    return state.contentSections.map((section) =>
        new Send("generate_blocks", {
            contentSection: section,
            taskType: state.taskType,
            subjectGroup: state.subjectGroup,
            generatedBlocks: [] 
        })
    );
}

/**
 * Builds the retrieval query from task state
 */
async function buildRetrievalQuery(state: TaskGenState): Promise<string> {
    let query = state.title;
    
    // Add description if present
    if (state.description) {
        query += ' ' + state.description;
    }
    
    // Add learning standards with elaborations
    if (state.learningAreaStandardIds.length > 0) {
        const standards = await getLearningAreaStandardWithElaborationsByIds(state.learningAreaStandardIds);
        
        const standardsText = standards.map(standard => {
            const elaborationsText = standard.elaborations
                ?.map(e => e.standardElaboration)
                .filter(Boolean)
                .join('; ') ?? '';
            
            if (elaborationsText) {
                return `${standard.learningAreaStandard.description} (${elaborationsText})`;
            }
            return standard.learningAreaStandard.description;
        }).join(' | ');
        
        if (standardsText) {
            query += ' ' + standardsText;
        }
    }
    
    return query;
}

// =============================================================================
// Exported Runner
// =============================================================================

export interface TaskGenerationInput {
    taskType: taskTypeEnum;
    title: string;
    description?: string;
    subjectOfferingId: number;
    curriculumSubjectId?: number;
    courseMapItemId: number;
    subjectOfferingClassId: number;
    author: string;
    week?: number;
    dueDate?: Date;
    learningAreaStandardIds: number[];
    yearLevel: yearLevelEnum;
    subjectGroup?: subjectGroupEnum; 
    uploadedFiles?: string[];
    aiTutorEnabled: boolean;
}

export interface TaskGenerationOutput {
    taskId: number;
    planId: number | null;
}

/**
 * Run the task generation workflow
 */
export async function generateTask(input: TaskGenerationInput): Promise<TaskGenerationOutput> {
    console.log("\n=== Task Generation Workflow ===");
    console.log("Title:", input.title);
    console.log("Type:", input.taskType);
    console.log("Year Level:", input.yearLevel);
    
    const graph = createTaskGenerationGraph();
    const result = await graph.invoke({
        ...input,
        retrievedContent: [],
        contentSections: [],
        taskDescription: '',
        generatedBlocks: [],
        taskId: undefined,
        planId: undefined
    });

    console.log("=== Workflow Complete ===\n");
    return {
        taskId: result.taskId!,
        planId: result.planId ?? null
    };
}
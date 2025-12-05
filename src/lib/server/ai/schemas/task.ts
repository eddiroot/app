
import { taskTypeEnum } from "$lib/enums";
import { z } from "zod";
import { taskBlockSchema } from "./task-block";


// =================================================================
// Orchestrator Schemas
// =================================================================

export const contentSectionSchema = z.object({
    scope: z.string().describe("The scope of the section, the learning intentions it covers."),
    content: z.string().describe("The full educational content for this section."),
    index: z.number().describe("Order in the task (0-based)")
});

export type ContentSection = z.infer<typeof contentSectionSchema>;

/**
 * Schema for the orchestrator output
 */
export const orchestratorOutputSchema = z.object({
    sections: z.array(contentSectionSchema).max(5).describe("An array of content sections generated for the task."),
    taskDescription: z.string().describe("A brief description of the overall task.")
});

export type OrchestratorOutput = z.infer<typeof orchestratorOutputSchema>;

export const taskPlanSchema = z.object({
    name: z.string().describe("Name of the plan"),
    description: z.string().describe("Description of the plan"),
    scopes: z.array(z.string()).describe("Learning scopes/intentions covered"),
    courseMapItemId: z.number().describe("ID of the course map item this plan belongs to"),
    learningAreaStandardIds: z.array(z.number()).describe("IDs of learning area standards covered")
});

export type TaskPlan = z.infer<typeof taskPlanSchema>;

export const taskCreationSchema = z.object({
    title: z.string().describe("Title of the task"),
    description: z.string().describe("Description of the task"),
    taskType: z.nativeEnum(taskTypeEnum).describe("Type of task (lesson, homework, test, assignment, module)"),
    subjectOfferingId: z.number().describe("ID of the subject offering this task belongs to"),
    subjectOfferingClassId: z.number().describe("ID of the subject offering class this task is assigned to"),
    courseMapItemId: z.number().describe("ID of the course map item (topic) this task belongs to"),
    author: z.string().describe("User ID of the task author"),
    week: z.number().optional().describe("Optional week number for the task"),
    dueDate: z.date().optional().describe("Optional due date for the task"),
    aiTutorEnabled: z.boolean().describe("Whether AI tutor is enabled for this task"),
    blocks: z.array(taskBlockSchema).describe("Array of task blocks"),
    plan: taskPlanSchema.optional().describe("Optional plan to associate with the task")
});

export type TaskCreationData = z.infer<typeof taskCreationSchema>;
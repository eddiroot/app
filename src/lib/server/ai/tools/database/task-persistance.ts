import { taskTypeEnum } from "$lib/enums";
import { createAssessmentPlanStandard, createCourseMapItemAssessmentPlan, createCourseMapItemLessonPlan, createLessonPlanStandard, createSubjectOfferingClassTask, createTask, createTaskBlocks } from "$lib/server/db/service";
import { tool } from "@langchain/core/tools";
import { taskCreationSchema, type TaskCreationData } from "../../schemas/task";
export type { TaskCreationData } from "../../schemas/task";

// TODO make lesson plan and assessment plan just a task plan.

export const createTaskTool = tool(
    async (input: TaskCreationData) => {
        const newTask = await createTask(
            input.title,
            input.description,
            input.taskType,
            input.subjectOfferingId,
            input.aiTutorEnabled
        )
        if (input.blocks.length > 0) {
            await createTaskBlocks(newTask.id, input.blocks);
        }
        await createSubjectOfferingClassTask(
            newTask.id,
            input.subjectOfferingClassId,
            input.author,
            input.courseMapItemId,
            input.week,
            input.dueDate
        )
        let newPlan: { id: number } | null = null;

        if (input.plan) {
            if (input.taskType === taskTypeEnum.lesson) {
                newPlan = await createCourseMapItemLessonPlan(input.plan.courseMapItemId, input.plan.name, input.plan.scopes, input.plan.description);
                // Link learning area standards to plan
                await Promise.all(input.plan.learningAreaStandardIds.map(async (standardId) => {
                    await createLessonPlanStandard(newPlan!.id, standardId);}));
                    
            } else if (input.taskType === taskTypeEnum.test || input.taskType === taskTypeEnum.assignment) {
                newPlan = await createCourseMapItemAssessmentPlan(input.plan.courseMapItemId, input.plan.name, input.plan.scopes, input.plan.description);
                // Link learning area standards to plan
                await Promise.all(input.plan.learningAreaStandardIds.map(async (standardId) => {
                    await createAssessmentPlanStandard(newPlan!.id, standardId);}));
            }

        }
        return {
            taskId: newTask.id,
            planId: newPlan?.id ?? null
        };
    },
    {
        name: "create_task",
        description: "Creates a task with blocks and associated plan",
        schema: taskCreationSchema
    }
);
import { taskTypeEnum } from '$lib/enums';
import { generateTask } from '$lib/server/ai/workflows/tasks/task-creation';
import {
	createCourseMapItem,
	createSubjectOfferingClassTask,
	createTask,
	getCurriculumLearningAreaWithStandards,
	getSubjectOfferingMetadataByOfferingId,
	getTopics
} from '$lib/server/db/service';
import { error, redirect } from '@sveltejs/kit';
import { promises as fsPromises } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { formSchema } from './schema';

export const load = async ({ locals: { security }, params: { subjectOfferingId } }) => {
	security.isAuthenticated();

	const subjectOfferingIdInt = parseInt(subjectOfferingId, 10);
	if (isNaN(subjectOfferingIdInt)) {
		throw new Error('Invalid subject offering ID');
	}

	const [form, taskTopics, learningAreaWithContents] = await Promise.all([
		superValidate(zod4(formSchema)),
		getTopics(subjectOfferingIdInt),
		getCurriculumLearningAreaWithStandards(subjectOfferingIdInt)
	]);

	return { form, taskTopics, learningAreaWithContents };
};

export const actions = {
	createTask: async ({
		request,
		locals: { security },
		params: { subjectOfferingId, subjectOfferingClassId }
	}) => {
		try {
			const user = security.isAuthenticated().getUser();
			const subjectOfferingIdInt = parseInt(subjectOfferingId, 10);
			const subjectOfferingClassIdInt = parseInt(subjectOfferingClassId, 10);

			if (isNaN(subjectOfferingIdInt) || isNaN(subjectOfferingClassIdInt)) {
				throw error(400, 'One of the ids was invalid');
			}

			const formData = await request.formData();
			const form = await superValidate(formData, zod4(formSchema));

			// Get curriculum metadata (curriculumSubjectId, yearLevel)
			const subjectMetadata = await getSubjectOfferingMetadataByOfferingId(subjectOfferingIdInt);

			// Handle topic creation/selection
			let courseMapItemId = form.data.taskTopicId;
			if (form.data.newTopicName && !courseMapItemId) {
				const newTopic = await createCourseMapItem(subjectOfferingIdInt, form.data.newTopicName);
				courseMapItemId = newTopic.id;
			}

			if (!courseMapItemId) {
				throw error(400, 'A topic must be selected or created');
			}

			// Handle file uploads - save to temp directory
			const aiFiles = form.data.files || [];
			const validFiles = aiFiles.filter(
				(file): file is File => file instanceof File && file.size > 0
			);
			let tempFilePaths: string[] = [];

			if (validFiles.length > 0) {
				const savePromises = validFiles.map(async (file, index) => {
					const timestamp = Date.now();
					const fileName = `${timestamp}-${index}-${file.name}`;
					const tempFilePath = join(tmpdir(), fileName);
					const arrayBuffer = await file.arrayBuffer();
					const buffer = Buffer.from(arrayBuffer);
					await fsPromises.writeFile(tempFilePath, buffer);
					return tempFilePath;
				});
				tempFilePaths = await Promise.all(savePromises);
			}

			// Use the workflow for AI generation
			if (form.data.creationMethod === 'ai') {
				try {
					const result = await generateTask({
						taskType: taskTypeEnum[form.data.type],
						title: form.data.title,
						description: form.data.description,
						subjectOfferingId: subjectOfferingIdInt,
						curriculumSubjectId: subjectMetadata.curriculumSubjectId,
						courseMapItemId: courseMapItemId,
						subjectOfferingClassId: subjectOfferingClassIdInt,
						author: user.id,
						week: form.data.week,
						dueDate: form.data.dueDate,
						learningAreaStandardIds: form.data.selectedLearningAreaContentIds || [],
						yearLevel: subjectMetadata.yearLevel,
						uploadedFiles: tempFilePaths.length > 0 ? tempFilePaths : undefined,
						aiTutorEnabled: form.data.aiTutorEnabled
					});

					// Clean up temp files
					if (tempFilePaths.length > 0) {
						try {
							await Promise.all(tempFilePaths.map((path) => fsPromises.unlink(path)));
						} catch {
							// Ignore cleanup errors
						}
					}

					// Redirect to the created task
					throw redirect(
						303,
						`/subjects/${subjectOfferingId}/class/${subjectOfferingClassId}/tasks/${result.taskId}`
					);
				} catch (workflowError) {
					// Re-throw redirects
					if (
						workflowError &&
						typeof workflowError === 'object' &&
						'status' in workflowError &&
						workflowError.status === 303
					) {
						throw workflowError;
					}

					throw new Error(
						`AI generation failed: ${workflowError instanceof Error ? workflowError.message : String(workflowError)}`
					);
				}
			} else {
				// Manual creation - create task without AI workflow
				const task = await createTask(
					form.data.title,
					form.data.description || '',
					taskTypeEnum[form.data.type],
					subjectOfferingIdInt,
					form.data.aiTutorEnabled
				);

				await createSubjectOfferingClassTask(
					task.id,
					subjectOfferingClassIdInt,
					user.id,
					courseMapItemId,
					form.data.week ?? null,
					form.data.dueDate ?? null
				);

				throw redirect(
					303,
					`/subjects/${subjectOfferingId}/class/${subjectOfferingClassId}/tasks/${task.id}`
				);
			}
		} catch (err) {
			// Re-throw redirects
			if (err && typeof err === 'object' && 'status' in err && err.status === 303) {
				throw err;
			}

			return {
				status: 500,
				error: err instanceof Error ? err.message : 'Unknown error occurred during task creation'
			};
		}
	}
};
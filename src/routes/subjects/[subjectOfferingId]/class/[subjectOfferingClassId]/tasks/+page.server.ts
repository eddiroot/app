import { userTypeEnum } from '$lib/enums.js';
import { fileSchema } from '$lib/schema/resource.js';
import type { Task } from '$lib/server/db/schema';
import {
	createResource,
	createSubjectOfferingClassResource,
	getResourcesBySubjectOfferingClassId,
	getTasksBySubjectOfferingClassId,
	getTopics,
	removeResourceFromSubjectOfferingClass,
} from '$lib/server/db/service';
import {
	generateUniqueFileName,
	getPresignedUrl,
	uploadBufferHelper,
} from '$lib/server/obj';
import { error, fail } from '@sveltejs/kit';
import { superValidate, withFiles } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod';

const uploadSchema = z.object({
	file: fileSchema,
	title: z.string().optional(),
	description: z.string().optional(),
	topicId: z.number().min(1, 'Please select a topic'),
});

export const load = async ({
	locals: { security },
	params: { subjectOfferingId, subjectOfferingClassId },
}) => {
	const user = security.isAuthenticated().getUser();

	const subjectOfferingClassIdInt = parseInt(subjectOfferingClassId, 10);
	if (isNaN(subjectOfferingClassIdInt)) {
		throw error(400, 'Invalid subject offering class ID');
	}

	const subjectOfferingIdInt = parseInt(subjectOfferingId, 10);
	if (isNaN(subjectOfferingIdInt)) {
		throw error(400, 'Invalid subject offering ID');
	}

	const tasks = await getTasksBySubjectOfferingClassId(
		user.id,
		subjectOfferingClassIdInt,
	);
	const resources = await getResourcesBySubjectOfferingClassId(
		subjectOfferingClassIdInt,
	);
	const topics = await getTopics(subjectOfferingIdInt);

	const resourcesWithUrls = await Promise.all(
		resources.map(async (row) => {
			try {
				const downloadUrl = await getPresignedUrl(row.resource.objectKey);
				return { ...row, downloadUrl };
			} catch (error) {
				console.error(
					`Failed to generate URL for resource ${row.resource.id}:`,
					error,
				);
				return { ...row, downloadUrl: null };
			}
		}),
	);

	const form = await superValidate(zod4(uploadSchema));

	const topicsWithTasks = topics.map((topic) => ({
		topic,
		tasks: [] as { task: Task; status: string }[],
		resources: [] as typeof resourcesWithUrls,
	}));

	tasks.forEach((task) => {
		if (
			user.type === userTypeEnum.student &&
			task.subjectOfferingClassTask.status !== 'published'
		)
			return;

		const topicEntry = topicsWithTasks.find(
			(item) => item.topic.id === task.curriculumItem.id,
		);
		if (topicEntry) {
			topicEntry.tasks.push({
				task: task.task,
				status: task.subjectOfferingClassTask.status,
			});
		}
	});

	resourcesWithUrls.forEach((resource) => {
		const coursemapItemId = resource.resourceRelation.curriculumItemId;
		if (coursemapItemId) {
			const topicEntry = topicsWithTasks.find(
				(item) => item.topic.id === coursemapItemId,
			);
			if (topicEntry) {
				topicEntry.resources.push(resource);
			}
		}
	});

	return { user, topicsWithTasks, topics, form };
};

export const actions = {
	upload: async ({
		request,
		locals: { security },
		params: { subjectOfferingClassId },
	}) => {
		const user = security.isAuthenticated().getUser();

		const formData = await request.formData();
		const form = await superValidate(formData, zod4(uploadSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const classId = parseInt(subjectOfferingClassId, 10);
		if (isNaN(classId)) {
			return fail(400, { form, message: 'Invalid class ID' });
		}

		try {
			const file = form.data.file;

			// Generate unique filename
			const uniqueFileName = generateUniqueFileName(file.name);

			// Convert file to buffer
			const buffer = Buffer.from(await file.arrayBuffer());

			// Upload file to storage in school bucket
			const objectKey = `${user.schoolId}/${uniqueFileName}`;
			await uploadBufferHelper(buffer, objectKey, file.type);

			// Create resource in database
			const resource = await createResource({
				bucketName: user.schoolId.toString(),
				objectKey,
				fileName: file.name,
				fileSize: file.size,
				fileType: file.type,
				uploadedBy: user.id,
			});

			// Link resource to subject offering class
			await createSubjectOfferingClassResource({
				subjectOfferingClassId: classId,
				resourceId: resource.id,
				title: form.data.title,
				description: form.data.description,
				curriculumItemId: form.data.topicId,
				authorId: user.id,
			});

			return withFiles({ form });
		} catch (error) {
			console.error('Error uploading resource:', error);
			return fail(500, { form, message: 'Failed to upload resource' });
		}
	},

	delete: async ({
		request,
		locals: { security },
		params: { subjectOfferingClassId },
	}) => {
		security.isAuthenticated();

		const formData = await request.formData();
		const resourceId = parseInt(formData.get('resourceId') as string, 10);
		const classId = parseInt(subjectOfferingClassId, 10);

		if (isNaN(resourceId) || isNaN(classId)) {
			return fail(400, { message: 'Invalid resource or class ID' });
		}

		try {
			await removeResourceFromSubjectOfferingClass(classId, resourceId);
			return { success: true };
		} catch (error) {
			console.error('Error deleting resource:', error);
			return fail(500, { message: 'Failed to delete resource' });
		}
	},
};

import {
	addResourceToLessonPlan,
	createLessonPlanStandard,
	createResource,
	getCourseMapItemById,
	getCourseMapItemLearningAreas,
	getCoursemapItemLessonPlan,
	getLearningAreaStandardsByCourseMapItemId,
	getLessonPlanLearningAreaStandards,
	getLessonPlanResources,
	removeLessonPlanStandards,
	removeResourceFromLessonPlan,
	updateCourseMapItemLessonPlan
} from '$lib/server/db/service';
import { generateUniqueFileName, uploadBufferHelper } from '$lib/server/obj';
import { fail, redirect } from '@sveltejs/kit';

export const load = async ({
	locals: { security },
	params: { subjectOfferingId, courseMapItemId, courseMapItemLessonPlanId }
}) => {
	security.isAuthenticated();

	const cmId = parseInt(courseMapItemId, 10);
	const planId = parseInt(courseMapItemLessonPlanId, 10);

	const [courseMapItem, lessonPlan, standards, learningAreas, resources] = await Promise.all([
		getCourseMapItemById(cmId),
		getCoursemapItemLessonPlan(planId),
		getLessonPlanLearningAreaStandards(planId),
		getCourseMapItemLearningAreas(cmId),
		getLessonPlanResources(planId)
	]);

	if (!courseMapItem || !lessonPlan) {
		throw redirect(302, `/subjects/${subjectOfferingId}/curriculum/${courseMapItemId}/planning`);
	}

	// Get available standards from learning areas
	const learningAreaStandards = await getLearningAreaStandardsByCourseMapItemId(cmId);
	// Remove standards that are already linked to the lesson plan
	const availableStandards = learningAreaStandards.filter(
		(standard) => !standards.some((ls) => ls.id === standard.id)
	);

	return {
		subjectOfferingId: parseInt(subjectOfferingId, 10),
		courseMapItem,
		lessonPlan,
		standards,
		learningAreas,
		availableStandards,
		resources
	};
};

export const actions = {
	updateLessonPlan: async ({ request, params, locals: { security } }) => {
		security.isAuthenticated();

		const lessonPlanId = parseInt(params.courseMapItemLessonPlanId, 10);
		const formData = await request.formData();
		const name = formData.get('name') as string;
		const description = formData.get('description') as string;
		const scopesJson = formData.get('scopes') as string;
		const standardIds = JSON.parse((formData.get('standardIds') as string) || '[]');

		try {
			// Parse scopes
			const scopes = JSON.parse(scopesJson);

			// Update lesson plan
			await updateCourseMapItemLessonPlan(lessonPlanId, name, scopes, description);

			// Remove all existing standards first
			await removeLessonPlanStandards(lessonPlanId);

			// Add new standards
			for (const standardId of standardIds) {
				await createLessonPlanStandard(lessonPlanId, standardId);
			}

			return { success: true };
		} catch (error) {
			console.error('Error updating lesson plan:', error);
			return fail(500, { message: 'Failed to update lesson plan' });
		}
	},

	uploadResource: async ({ request, params, locals: { security } }) => {
		security.isAuthenticated();

		const lessonPlanId = parseInt(params.courseMapItemLessonPlanId, 10);
		const formData = await request.formData();
		const file = formData.get('file') as File;

		// Auto-infer name and type (passed from client but we could also do it here)
		let name = formData.get('name') as string;
		let resourceType = formData.get('resourceType') as string;

		// Fallback inference if not provided
		if (!name) {
			name = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
		}

		if (!resourceType) {
			const extension = file.name.split('.').pop()?.toLowerCase();
			switch (extension) {
				case 'jpg':
				case 'jpeg':
				case 'png':
				case 'gif':
				case 'bmp':
				case 'webp':
				case 'svg':
					resourceType = 'image';
					break;
				case 'mp4':
				case 'mov':
				case 'avi':
				case 'mkv':
				case 'webm':
				case 'wmv':
					resourceType = 'video';
					break;
				case 'mp3':
				case 'wav':
				case 'ogg':
				case 'flac':
				case 'm4a':
					resourceType = 'audio';
					break;
				case 'pdf':
					resourceType = 'pdf';
					break;
				case 'doc':
				case 'docx':
				case 'txt':
				case 'rtf':
					resourceType = 'document';
					break;
				default:
					resourceType = 'file';
			}
		}

		if (!file) {
			return fail(400, { message: 'No file provided' });
		}

		try {
			// Generate unique file name
			const uniqueFileName = generateUniqueFileName(file.name);

			// Convert file to buffer
			const buffer = Buffer.from(await file.arrayBuffer());

			// Upload to object storage
			const user = security.getUser();
			const schoolId = user.schoolId?.toString() || 'default';
			const objectKey = `${schoolId}/lessonplan/${lessonPlanId}/${uniqueFileName}`;
			await uploadBufferHelper(buffer, objectKey, file.type);

			// Create resource in database (no description since we're auto-inferring everything)
			const resource = await createResource(
				name,
				file.name,
				objectKey,
				file.type,
				file.size,
				resourceType,
				security.getUser().id,
				undefined // No description
			);

			// Link resource to lesson plan
			await addResourceToLessonPlan(lessonPlanId, resource.id);

			return { success: true, resource };
		} catch (error) {
			console.error('Error uploading resource:', error);
			return fail(500, { message: 'Failed to upload resource' });
		}
	},

	removeResource: async ({ request, params, locals: { security } }) => {
		security.isAuthenticated();

		const lessonPlanId = parseInt(params.courseMapItemLessonPlanId, 10);
		const formData = await request.formData();
		const resourceId = parseInt(formData.get('resourceId') as string, 10);

		try {
			await removeResourceFromLessonPlan(lessonPlanId, resourceId);
			return { success: true };
		} catch (error) {
			console.error('Error removing resource:', error);
			return fail(500, { message: 'Failed to remove resource' });
		}
	}
};

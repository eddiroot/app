import { db } from '$lib/server/db';
import * as schema from '$lib/server/db/schema';
import {
	createCourseMapItem,
	deleteCoursemapItemAssessmentPlan,
	getCourseMapItemsBySubjectOfferingId,
	getCourseTeachersBySubjectOfferingId,
	getCurriculumSubjectBySubjectOfferingId,
	getFullSubjectOfferingNameBySubjectOfferingId,
	getSubjectOfferingLearningAreas,
	setCourseMapItemAreasOfStudy,
	upsertCoursemapItemAssessmentPlan
} from '$lib/server/db/service/coursemap';
import { getSubjectOfferingById } from '$lib/server/db/service/subjects';
import type { Actions } from '@sveltejs/kit';
import { error, fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const load = async ({ params }: { params: { subjectOfferingId: string } }) => {
	const subjectOfferingId = parseInt(params.subjectOfferingId, 10);

	if (isNaN(subjectOfferingId)) {
		throw error(400, 'Invalid subject offering ID');
	}

	// Verify the subject offering exists
	const subjectOffering = await getSubjectOfferingById(subjectOfferingId);
	if (!subjectOffering) {
		throw error(404, 'Subject offering not found');
	}

	// Get course map items
	const courseMapItemsResult = await getCourseMapItemsBySubjectOfferingId(subjectOfferingId);
	const courseMapItems = courseMapItemsResult.map((item) => item.courseMapItem);

	// Get available learning areas for this subject offering
	const availableLearningAreas = (await getSubjectOfferingLearningAreas(subjectOfferingId)) || [];

	// Get teachers for this subject offering
	const teachers = await getCourseTeachersBySubjectOfferingId(subjectOfferingId);

	// Get curriculum subject info
	const curriculumSubjectInfo = await getCurriculumSubjectBySubjectOfferingId(subjectOfferingId);

	// Get full subject offering name (Year X Subject Name)
	const fullSubjectOfferingName = await getFullSubjectOfferingNameBySubjectOfferingId(subjectOfferingId);

	return {
		subjectOfferingId,
		subjectOffering,
		courseMapItems,
		availableLearningAreas,
		teachers,
		curriculumSubjectInfo,
		fullSubjectOfferingName
	};
};

export const actions: Actions = {
	updateCourseMapItem: async ({ request }) => {
		const formData = await request.formData();
		const courseMapItemId = parseInt(formData.get('courseMapItemId') as string, 10);
		const topic = formData.get('topic') as string;
		const description = formData.get('description') as string;
		const startWeek = parseInt(formData.get('startWeek') as string, 10);
		const duration = parseInt(formData.get('duration') as string, 10);
		const color = formData.get('color') as string;
		const learningAreaIdsJson = formData.get('learningAreaIds') as string;

		if (!courseMapItemId || !topic) {
			return fail(400, { message: 'Missing required fields' });
		}

		try {
			// Update course map item and return the updated item
			const [updatedItem] = await db
				.update(schema.courseMapItem)
				.set({
					topic,
					description,
					startWeek,
					duration,
					color
				})
				.where(eq(schema.courseMapItem.id, courseMapItemId))
				.returning();

			// Update learning areas
			if (learningAreaIdsJson) {
				const learningAreaIds = JSON.parse(learningAreaIdsJson);
				await setCourseMapItemAreasOfStudy(courseMapItemId, learningAreaIds);
			}

			return {
				success: true,
				action: 'update',
				courseMapItem: updatedItem
			};
		} catch (error) {
			console.error('Error updating course map item:', error);
			return fail(500, { message: 'Failed to update course map item' });
		}
	},

	addAssessmentPlan: async ({ request }) => {
		const formData = await request.formData();
		const courseMapItemId = parseInt(formData.get('courseMapItemId') as string, 10);
		const name = formData.get('name') as string;
		const description = formData.get('description') as string;

		if (!courseMapItemId || !name) {
			return fail(400, { message: 'Missing required fields' });
		}

		try {
			await upsertCoursemapItemAssessmentPlan(courseMapItemId, name, description);
			return { success: true };
		} catch (error) {
			console.error('Error adding assessment plan:', error);
			return fail(500, { message: 'Failed to add assessment plan' });
		}
	},

	deleteAssessmentPlan: async ({ request }) => {
		const formData = await request.formData();
		const assessmentPlanId = parseInt(formData.get('assessmentPlanId') as string, 10);

		if (!assessmentPlanId) {
			return fail(400, { message: 'Missing assessment plan ID' });
		}

		try {
			await deleteCoursemapItemAssessmentPlan(assessmentPlanId);
			return { success: true };
		} catch (error) {
			console.error('Error deleting assessment plan:', error);
			return fail(500, { message: 'Failed to delete assessment plan' });
		}
	},

	createCourseMapItem: async ({ request, params }) => {
		const formData = await request.formData();
		const subjectOfferingId = parseInt(params.subjectOfferingId!, 10);
		const topic = formData.get('topic') as string;
		const description = formData.get('description') as string;
		const startWeek = parseInt(formData.get('startWeek') as string, 10);
		const duration = parseInt(formData.get('duration') as string, 10);
		const semester = parseInt(formData.get('semester') as string, 10);
		const color = formData.get('color') as string;
		const learningAreaIdsJson = formData.get('learningAreaIds') as string;

		if (!subjectOfferingId || !topic) {
			return fail(400, { message: 'Missing required fields' });
		}

		try {
			const courseMapItem = await createCourseMapItem(
				subjectOfferingId,
				topic,
				semester,
				startWeek,
				description
			);

			// Update with additional fields if the item was created successfully
			if (courseMapItem) {
				await db
					.update(schema.courseMapItem)
					.set({
						duration,
						color
					})
					.where(eq(schema.courseMapItem.id, courseMapItem.id));

				// Set learning areas if provided
				if (learningAreaIdsJson) {
					const learningAreaIds = JSON.parse(learningAreaIdsJson);
					await setCourseMapItemAreasOfStudy(courseMapItem.id, learningAreaIds);
				}

				const finalItem = {
					...courseMapItem,
					duration,
					color
				};

				// Return the updated item with all fields
				return {
					success: true,
					action: 'create',
					courseMapItem: finalItem
				};
			}

			return { success: true, action: 'create', courseMapItem };
		} catch (error) {
			console.error('Error creating course map item:', error);
			return fail(500, { message: 'Failed to create course map item' });
		}
	}
};

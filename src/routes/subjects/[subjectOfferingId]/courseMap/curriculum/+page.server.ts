import type { yearLevelEnum } from '$lib/enums';
import type { CourseMapItem } from '$lib/server/db/schema/coursemap';
import { getCourseMapItemsBySubjectOfferingId, getCourseMapItemStandardsBySubjectOfferingId, getCurriculumSubjectBySubjectOfferingId, removeCourseMapItemStandard, setCourseMapItemStandard } from '$lib/server/db/service/coursemap';
import {
    assignCurriculumSubjectToSubjectOffering,
    getAllCurriculums,
    getCurriculumById,
    getCurriculumDataForCurriculumSubjectId,
    getCurriculumSubjectsByCurriculumId
} from '$lib/server/db/service/curriculum';
import { getSubjectOfferingById, getSubjectYearLevelBySubjectOfferingId } from '$lib/server/db/service/subjects';
import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
	const subjectOfferingId = parseInt(params.subjectOfferingId, 10);

	if (isNaN(subjectOfferingId)) {
		throw error(400, 'Invalid subject offering ID');
	}

	// Verify the subject offering exists
	const subjectOffering = await getSubjectOfferingById(subjectOfferingId);
	if (!subjectOffering) {
		throw error(404, 'Subject offering not found');
	}

	// Get year level for this subject
	const yearLevel = await getSubjectYearLevelBySubjectOfferingId(subjectOfferingId);

	// Get current curriculum assignment
	const currentCurriculumSubjectInfo = await getCurriculumSubjectBySubjectOfferingId(subjectOfferingId);

	// Get all available curriculums
	const curriculums = await getAllCurriculums();

	// Check if a curriculum is selected (from URL query param)
	const selectedCurriculumIdParam = url.searchParams.get('curriculumId');
	const selectedCurriculumId = selectedCurriculumIdParam ? parseInt(selectedCurriculumIdParam, 10) : null;

	let selectedCurriculum = null;
	let curriculumSubjects: Awaited<ReturnType<typeof getCurriculumSubjectsByCurriculumId>> = [];

	if (selectedCurriculumId && !isNaN(selectedCurriculumId)) {
		selectedCurriculum = await getCurriculumById(selectedCurriculumId);
		if (selectedCurriculum) {
			curriculumSubjects = await getCurriculumSubjectsByCurriculumId(selectedCurriculumId);
		}
	}

	// If a curriculum is already assigned, load the curriculum data and course map items
	let curriculumData: Awaited<ReturnType<typeof getCurriculumDataForCurriculumSubjectId>> = null;
	let courseMapItems: CourseMapItem[] = [];
	const standardMappings: Map<number, number> = new Map(); // learningAreaStandardId -> courseMapItemId

	if (currentCurriculumSubjectInfo?.curriculumSubject?.id && yearLevel) {
		// yearLevel is already in the correct format (e.g., '8' for year 8)
		curriculumData = await getCurriculumDataForCurriculumSubjectId(
			currentCurriculumSubjectInfo.curriculumSubject.id,
			yearLevel as yearLevelEnum
		);
		const courseMapItemsResult = await getCourseMapItemsBySubjectOfferingId(subjectOfferingId);
		courseMapItems = courseMapItemsResult.map((item) => item.courseMapItem);

		// Load existing standard mappings
		const existingMappings = await getCourseMapItemStandardsBySubjectOfferingId(subjectOfferingId);
		for (const mapping of existingMappings) {
			standardMappings.set(
				mapping.courseMapItemStandard.learningAreaStandardId,
				mapping.courseMapItemStandard.courseMapItemId
			);
		}
	}

	return {
		subjectOfferingId,
		subjectOffering,
		yearLevel,
		currentCurriculumSubjectInfo,
		curriculums,
		selectedCurriculum,
		curriculumSubjects,
		curriculumData,
		courseMapItems,
		standardMappings: Object.fromEntries(standardMappings) // Convert Map to plain object for serialization
	};
};

export const actions: Actions = {
	alignCurriculum: async ({ request, params }) => {
		const subjectOfferingId = parseInt(params.subjectOfferingId, 10);

		if (isNaN(subjectOfferingId)) {
			return fail(400, { message: 'Invalid subject offering ID' });
		}

		const formData = await request.formData();
		const curriculumSubjectId = formData.get('curriculumSubjectId');

		if (!curriculumSubjectId) {
			return fail(400, { message: 'Missing curriculum subject ID' });
		}

		const curriculumSubjectIdInt = parseInt(curriculumSubjectId as string, 10);

		if (isNaN(curriculumSubjectIdInt)) {
			return fail(400, { message: 'Invalid curriculum subject ID' });
		}

		try {
			await assignCurriculumSubjectToSubjectOffering(subjectOfferingId, curriculumSubjectIdInt);
			return { success: true };
		} catch (err) {
			console.error('Error assigning curriculum:', err);
			return fail(500, { message: 'Failed to assign curriculum' });
		}
	},

	removeCurriculum: async ({ params }) => {
		const subjectOfferingId = parseInt(params.subjectOfferingId, 10);

		if (isNaN(subjectOfferingId)) {
			return fail(400, { message: 'Invalid subject offering ID' });
		}

		try {
			await assignCurriculumSubjectToSubjectOffering(subjectOfferingId, null);
			return { success: true };
		} catch (err) {
			console.error('Error removing curriculum:', err);
			return fail(500, { message: 'Failed to remove curriculum' });
		}
	},

	setStandardMapping: async ({ request, params }) => {
		const subjectOfferingId = parseInt(params.subjectOfferingId, 10);

		if (isNaN(subjectOfferingId)) {
			return fail(400, { message: 'Invalid subject offering ID' });
		}

		const formData = await request.formData();
		const learningAreaStandardId = formData.get('learningAreaStandardId');
		const courseMapItemId = formData.get('courseMapItemId');

		if (!learningAreaStandardId) {
			return fail(400, { message: 'Missing learning area standard ID' });
		}

		const standardId = parseInt(learningAreaStandardId as string, 10);
		if (isNaN(standardId)) {
			return fail(400, { message: 'Invalid learning area standard ID' });
		}

		try {
			// If courseMapItemId is empty or not provided, remove the mapping
			if (!courseMapItemId || courseMapItemId === '') {
				await removeCourseMapItemStandard(standardId, subjectOfferingId);
				return { success: true, action: 'removed' };
			}

			const itemId = parseInt(courseMapItemId as string, 10);
			if (isNaN(itemId)) {
				return fail(400, { message: 'Invalid course map item ID' });
			}

			await setCourseMapItemStandard(itemId, standardId, subjectOfferingId);
			return { success: true, action: 'set' };
		} catch (err) {
			console.error('Error setting standard mapping:', err);
			return fail(500, { message: 'Failed to set standard mapping' });
		}
	}
};

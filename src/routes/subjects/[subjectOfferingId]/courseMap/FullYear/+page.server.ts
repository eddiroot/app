import {
    getCourseMapItemsBySubjectOfferingId,
    getFullSubjectOfferingNameBySubjectOfferingId,
    getSubjectOfferingLearningAreas
} from '$lib/server/db/service/coursemap';
import { getSubjectOfferingById } from '$lib/server/db/service/subjects';
import { error } from '@sveltejs/kit';

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

	// Get full subject offering name (Year X Subject Name)
	const fullSubjectOfferingName = await getFullSubjectOfferingNameBySubjectOfferingId(subjectOfferingId);

	return {
		subjectOfferingId,
		subjectOffering,
		courseMapItems,
		availableLearningAreas,
		fullSubjectOfferingName
	};
};

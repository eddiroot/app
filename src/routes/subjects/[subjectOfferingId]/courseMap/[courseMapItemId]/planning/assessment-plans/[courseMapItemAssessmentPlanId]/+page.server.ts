import {
	getAssessmentPlanLearningAreaStandards,
	getCourseMapItemById,
	getCoursemapItemAssessmentPlan
} from '$lib/server/db/service/coursemap';
import { getRubricWithRowsAndCells } from '$lib/server/db/service/task';
import { redirect } from '@sveltejs/kit';

export const load = async ({
	locals: { security },
	params: { subjectOfferingId, courseMapItemId, courseMapItemAssessmentPlanId }
}) => {
	security.isAuthenticated();

	const cmId = parseInt(courseMapItemId, 10);
	const planId = parseInt(courseMapItemAssessmentPlanId, 10);

	const [courseMapItem, assessmentPlan] = await Promise.all([
		getCourseMapItemById(cmId),
		getCoursemapItemAssessmentPlan(planId)
	]);

	if (!courseMapItem || !assessmentPlan) {
		throw redirect(302, `/subjects/${subjectOfferingId}/curriculum/${courseMapItemId}/planning`);
	}

	const [standards, rubric] = await Promise.all([
		getAssessmentPlanLearningAreaStandards(planId),
		assessmentPlan.rubricId ? getRubricWithRowsAndCells(assessmentPlan.rubricId) : null
	]);

	return {
		subjectOfferingId: parseInt(subjectOfferingId, 10),
		courseMapItem,
		assessmentPlan,
		standards,
		rubric
	};
};

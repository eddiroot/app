import {
	getAnnouncementsBySubjectOfferingClassId,
	getAssessmentsBySubjectOfferingClassId,
	getClassById,
	getLessonsAndHomeworkBySubjectOfferingClassId,
	getResourcesBySubjectOfferingClassId,
	getSubjectBySubjectOfferingClassId,
	getTeachersBySubjectOfferingClassId,
} from '$lib/server/db/service';
import { getPresignedUrl } from '$lib/server/obj';

export const load = async ({
	locals: { security },
	params: { subjectOfferingId, subjectOfferingClassId },
}) => {
	security.isAuthenticated();
	const user = security.isAuthenticated().getUser();
	const thisSubjectOffering = await getSubjectBySubjectOfferingClassId(
		Number(subjectOfferingClassId),
	);
	const thisSubjectOfferingClass = await getClassById(
		Number(subjectOfferingClassId),
	);
	const thisSubjectOfferingTeachers = await getTeachersBySubjectOfferingClassId(
		Number(subjectOfferingClassId),
	);
	const assessments = await getAssessmentsBySubjectOfferingClassId(
		Number(subjectOfferingClassId),
	);
	const tasks = await getLessonsAndHomeworkBySubjectOfferingClassId(
		user.id,
		Number(subjectOfferingClassId),
	);
	const resources = await getResourcesBySubjectOfferingClassId(
		Number(subjectOfferingClassId),
	);
	const announcements = await getAnnouncementsBySubjectOfferingClassId(
		Number(subjectOfferingClassId),
	);

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

	return {
		user,
		thisSubjectOffering,
		thisSubjectOfferingClass,
		thisSubjectOfferingTeachers,
		assessments,
		tasks,
		resources: resourcesWithUrls,
		announcements,
		subjectOfferingId: Number(subjectOfferingId),
		subjectOfferingClassId: Number(subjectOfferingClassId),
	};
};

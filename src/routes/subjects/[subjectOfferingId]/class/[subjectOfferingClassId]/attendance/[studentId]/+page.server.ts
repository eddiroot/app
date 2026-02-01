import {
	getStudentAttendanceHistoryForClass,
	getSubjectOfferingClassDetailsById,
	getUserById,
} from '$lib/server/db/service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({
	locals: { security },
	params,
}) => {
	security.isAuthenticated();

	const studentId = params.studentId;
	const subjectOfferingClassId = parseInt(params.subjectOfferingClassId, 10);

	if (isNaN(subjectOfferingClassId)) {
		throw new Error('Invalid class ID');
	}

	const student = await getUserById(studentId);
	if (!student) {
		throw new Error('Student not found');
	}

	const classDetails = await getSubjectOfferingClassDetailsById(
		subjectOfferingClassId,
	);
	if (!classDetails) {
		throw new Error('Class not found');
	}

	const attendanceHistory = await getStudentAttendanceHistoryForClass(
		studentId,
		subjectOfferingClassId,
	);

	return { student, classDetails, attendanceHistory };
};

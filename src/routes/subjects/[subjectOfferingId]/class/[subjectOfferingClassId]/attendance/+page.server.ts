import { subjectClassAllocationAttendanceStatus } from '$lib/enums';
import {
	getBehaviourQuickActionsByAttendanceId,
	getBehaviourQuickActionsBySchoolId,
	getGuardiansForStudent,
	getSubjectClassAllocationAndStudentAttendancesByClassIdForToday,
	getSubjectOfferingClassByAllocationId,
	upsertSubjectClassAllocationAttendance
} from '$lib/server/db/service';
import { sendAbsenceEmail } from '$lib/server/email.js';
import { convertToFullName } from '$lib/utils.js';
import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { attendanceSchema } from './schema.js';

export const load = async ({ locals: { security }, params: { subjectOfferingClassId } }) => {
	const user = security.isAuthenticated().getUser();

	const subjectOfferingClassIdInt = parseInt(subjectOfferingClassId, 10);
	if (isNaN(subjectOfferingClassIdInt)) {
		throw redirect(302, '/dashboard');
	}

	const attendances =
		await getSubjectClassAllocationAndStudentAttendancesByClassIdForToday(
			subjectOfferingClassIdInt
		);

	const behaviourQuickActions = await getBehaviourQuickActionsBySchoolId(user.schoolId);

	const attendancesWithBehaviours = await Promise.all(
		attendances.map(async (attendance) => {
			if (attendance.attendance?.id) {
				const behaviours = await getBehaviourQuickActionsByAttendanceId(attendance.attendance.id);
				return {
					...attendance,
					behaviourQuickActionIds: behaviours.map((b) => b.id)
				};
			}
			return {
				...attendance,
				behaviourQuickActionIds: []
			};
		})
	);

	return { attendances: attendancesWithBehaviours, behaviourQuickActions };
};

export const actions = {
	updateAttendance: async ({ request, locals: { security } }) => {
		const user = security.isAuthenticated().getUser();

		const formData = await request.formData();
		const form = await superValidate(formData, zod4(attendanceSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			const behaviourIds = (form.data.behaviourQuickActionIds ?? [])
				.filter((id) => id !== '')
				.map((id) => parseInt(id, 10))
				.filter((id) => !isNaN(id));

			await upsertSubjectClassAllocationAttendance(
				form.data.subjectClassAllocationId,
				form.data.userId,
				form.data.status,
				undefined,
				form.data.noteTeacher,
				behaviourIds
			);

			if (form.data.status === subjectClassAllocationAttendanceStatus.absent) {
				const classDetails = await getSubjectOfferingClassByAllocationId(
					form.data.subjectClassAllocationId
				);
				const guardians = await getGuardiansForStudent(form.data.userId);

				if (classDetails && guardians.length > 0) {
					const studentName = convertToFullName(user.firstName, user.middleName, user.lastName);
					const className = `${classDetails.subject.name} - ${classDetails.subjectOfferingClass.name}`;
					const today = new Date();

					for (const guardianData of guardians) {
						sendAbsenceEmail(guardianData.guardian.email, studentName, className, today);
					}
				}
			}

			return { form, success: true };
		} catch (err) {
			console.error('Error updating attendance:', err);
			return fail(500, { form, error: 'Failed to update attendance' });
		}
	}
};

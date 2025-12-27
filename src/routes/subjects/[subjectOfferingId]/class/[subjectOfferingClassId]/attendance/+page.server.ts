import { subjectClassAllocationAttendanceStatus } from '$lib/enums';
import {
	getAttendanceComponentsByAttendanceId,
	getBehaviourQuickActionsByAttendanceId,
	getBehaviourQuickActionsBySchoolId,
	getGuardiansForStudent,
	getSubjectClassAllocationAndStudentAttendancesByClassIdForToday,
	getSubjectOfferingClassByAllocationId,
	getUserById,
	getUserSubjectOfferingClassByUserAndClass,
	startClassPass,
	updateAttendanceComponents,
	upsertSubjectClassAllocationAttendance
} from '$lib/server/db/service';
import { sendAbsenceEmail } from '$lib/server/email.js';
import { convertToFullName } from '$lib/utils.js';
import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { attendanceSchema, bulkApplyBehavioursSchema, startClassPassSchema } from './schema.js';

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
			const userClass = await getUserSubjectOfferingClassByUserAndClass(
				attendance.user.id,
				attendance.subjectClassAllocation.subjectOfferingClassId
			);
			if (attendance.attendance?.id) {
				const behaviours = await getBehaviourQuickActionsByAttendanceId(attendance.attendance.id);
				const components = await getAttendanceComponentsByAttendanceId(attendance.attendance.id);
				return {
					...attendance,
					behaviourQuickActionIds: behaviours.map((b) => b.id),
					attendanceComponents: components,
					classNote: userClass?.classNote || null
				};
			}
			return {
				...attendance,
				behaviourQuickActionIds: [],
				attendanceComponents: [],
				classNote: userClass?.classNote || null
			};
		})
	);

	return { attendances: attendancesWithBehaviours, behaviourQuickActions };
};

export const actions = {
	updateAttendance: async ({ request }) => {
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
				const student = await getUserById(form.data.userId);
				const guardians = await getGuardiansForStudent(form.data.userId);

				if (classDetails && student && guardians.length > 0) {
					const studentName = convertToFullName(
						student.firstName,
						student.middleName,
						student.lastName
					);
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
	},

	bulkApplyBehaviours: async ({ request, params: { subjectOfferingClassId } }) => {
		const formData = await request.formData();
		const form = await superValidate(formData, zod4(bulkApplyBehavioursSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			const behaviourIds = (form.data.behaviourQuickActionIds ?? [])
				.filter((id) => id !== '')
				.map((id) => parseInt(id, 10))
				.filter((id) => !isNaN(id));

			const subjectOfferingClassIdInt = parseInt(subjectOfferingClassId, 10);

			const attendances =
				await getSubjectClassAllocationAndStudentAttendancesByClassIdForToday(
					subjectOfferingClassIdInt
				);

			for (const userId of form.data.userIds) {
				const userAttendance = attendances.find((a) => a.user.id === userId);

				if (userAttendance?.attendance) {
					await upsertSubjectClassAllocationAttendance(
						form.data.subjectClassAllocationId,
						userId,
						userAttendance.attendance.status,
						userAttendance.attendance.noteGuardian,
						userAttendance.attendance.noteTeacher,
						behaviourIds
					);
				}
			}

			return { form, success: true };
		} catch (err) {
			console.error('Error bulk applying behaviours:', err);
			return fail(500, { form, error: 'Failed to apply behaviours' });
		}
	},

	updateComponents: async ({ request }) => {
		const formData = await request.formData();
		const attendanceId = parseInt(formData.get('attendanceId') as string, 10);
		const componentsJson = formData.get('components') as string;

		if (isNaN(attendanceId) || !componentsJson) {
			return fail(400, { error: 'Invalid data' });
		}

		try {
			const components = JSON.parse(componentsJson);
			await updateAttendanceComponents(components);
			return { success: true };
		} catch (err) {
			console.error('Error updating components:', err);
			return fail(500, { error: 'Failed to update components' });
		}
	},

	startClassPass: async ({ request }) => {
		const formData = await request.formData();
		const form = await superValidate(formData, zod4(startClassPassSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await startClassPass(form.data.subjectClassAllocationId, form.data.userId);
			return { form, success: true };
		} catch (err) {
			console.error('Error starting class pass:', err);
			return fail(500, { form, error: 'Failed to start class pass' });
		}
	}
};

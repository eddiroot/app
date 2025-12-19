import { subjectClassAllocationAttendanceStatus } from '$lib/enums.js';
import {
	type Subject,
	type SubjectClassAllocation,
	type SubjectClassAllocationAttendance,
	type SubjectOfferingClass,
	type User
} from '$lib/server/db/schema';
import { getGuardiansChildrensScheduleWithAttendanceByUserId } from '$lib/server/db/service';
import {
	getSubjectClassAllocationsByUserIdForDate,
	upsertSubjectClassAllocationAttendance
} from '$lib/server/db/service/subjects';
import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { markAbsentSchema } from './schema.js';

export type ScheduleWithAttendanceRecord = {
	user: Pick<User, 'id' | 'firstName' | 'middleName' | 'lastName' | 'avatarUrl'>;
	subjectClassAllocation: Pick<SubjectClassAllocation, 'id' | 'date' | 'startTime' | 'endTime'>;
	subjectOfferingClass: Pick<SubjectOfferingClass, 'id' | 'name'>;
	subject: Pick<Subject, 'name'>;
	attendance: SubjectClassAllocationAttendance | null;
};

function groupRecordsByUserId(
	records: ScheduleWithAttendanceRecord[]
): Record<string, ScheduleWithAttendanceRecord[]> {
	return records.reduce<Record<string, ScheduleWithAttendanceRecord[]>>((acc, record) => {
		const userId = record.user.id;
		if (!acc[userId]) {
			acc[userId] = [];
		}
		acc[userId].push(record);
		return acc;
	}, {});
}

function validateAttendanceDate(date: Date): {
	isValid: boolean;
	error?: string;
	date?: Date;
} {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	if (date < today) {
		return { isValid: false, error: 'Cannot mark attendance for past dates' };
	}

	return { isValid: true, date };
}

async function markStudentAbsent(studentId: string, date: Date, note: string): Promise<number> {
	const classAllocations = await getSubjectClassAllocationsByUserIdForDate(studentId, date);

	for (const allocation of classAllocations) {
		await upsertSubjectClassAllocationAttendance(
			allocation.classAllocation.id,
			studentId,
			subjectClassAllocationAttendanceStatus.absent,
			note || 'Marked absent by guardian'
		);
	}

	return classAllocations.length;
}

export const load = async ({ locals: { security } }) => {
	const user = security.isAuthenticated().isGuardian().getUser();

	const combinedData = await getGuardiansChildrensScheduleWithAttendanceByUserId(user.id);

	// Group by user ID
	const recordsByUserId = groupRecordsByUserId(combinedData);
	const form = await superValidate(zod4(markAbsentSchema));

	return {
		user,
		recordsByUserId,
		form
	};
};

export const actions = {
	markAbsence: async ({ request, locals: { security } }) => {
		security.isAuthenticated().isGuardian();

		const form = await superValidate(request, zod4(markAbsentSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const { studentId, date, noteGuardian } = form.data;

		const dateValidation = validateAttendanceDate(date);
		if (!dateValidation.isValid) {
			return fail(400, { form, error: dateValidation.error });
		}

		try {
			const classCount = await markStudentAbsent(
				studentId,
				dateValidation.date!,
				noteGuardian || ''
			);

			return {
				form,
				success: true,
				message: `Successfully marked absent for ${classCount} classes`
			};
		} catch (error) {
			console.error('Error marking attendance:', error);
			return fail(500, { form, error: 'Failed to mark attendance' });
		}
	}
};

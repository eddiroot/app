import { userTypeEnum } from '$lib/enums.js'
import {
	createTimetableDraftActivityWithRelations,
	deleteTimetableDraftActivity,
	getActivityGroupsByActivityId,
	getActivitySpacesByActivityId,
	getActivityStudentsByActivityId,
	getActivityTeachersByActivityId,
	getActivityYearLevelsByActivityId,
	getSpacesBySchoolId,
	getStudentsForTimetable,
	getSubjectOfferingsByYearLevelIdForTimetableByTimetableId,
	getTimetableDraftActivitiesByTimetableDraftId,
	getTimetableDraftStudentGroupsWithCountsByTimetableDraftId,
	getUsersBySchoolIdAndType,
	updateTimetableDraftActivity,
} from '$lib/server/db/service'
import { message, superValidate } from 'sveltekit-superforms'
import { zod4 } from 'sveltekit-superforms/adapters'
import {
	createActivitySchema,
	deleteActivitySchema,
	editActivitySchema,
} from './schema.js'

export const load = async ({ locals: { security }, params }) => {
	const user = security.isAuthenticated().isAdmin().getUser()
	const timetableId = parseInt(params.timetableId, 10)

	const teachers = await getUsersBySchoolIdAndType(
		user.schoolId,
		userTypeEnum.teacher,
	)
	const baseActivities =
		await getTimetableDraftActivitiesByTimetableDraftId(timetableId)
	const spaces = await getSpacesBySchoolId(user.schoolId)
	const students = await getStudentsForTimetable(timetableId, user.schoolId)

	const groups =
		await getTimetableDraftStudentGroupsWithCountsByTimetableDraftId(
			timetableId,
		)

	const yearLevels = groups
		.map((group) => ({ id: group.yearLevelId, code: group.yearLevelCode }))
		.filter((value, index, self) => self.indexOf(value) === index)

	const subjectOfferingsByYearLevel: Record<
		string,
		Awaited<
			ReturnType<
				typeof getSubjectOfferingsByYearLevelIdForTimetableByTimetableId
			>
		>
	> = {}
	for (const yearLevel of yearLevels) {
		subjectOfferingsByYearLevel[yearLevel.id] =
			await getSubjectOfferingsByYearLevelIdForTimetableByTimetableId(
				parseInt(params.timetableId, 10),
				yearLevel.id,
			)
	}

	const activities = await Promise.all(
		baseActivities.map(async (activity) => {
			const [teachers, spaces, students, groups, yearLevels] =
				await Promise.all([
					getActivityTeachersByActivityId(activity.id),
					getActivitySpacesByActivityId(activity.id),
					getActivityStudentsByActivityId(activity.id),
					getActivityGroupsByActivityId(activity.id),
					getActivityYearLevelsByActivityId(activity.id),
				])

			return {
				...activity,
				teacherIds: teachers.map((t) => t.id),
				spaceIds: spaces.map((l) => l.id.toString()),
				studentIds: students.map((s) => s.id),
				groupIds: groups.map((g) => g.id.toString()),
				yearLevels,
			}
		}),
	)

	const activitiesBySubjectOfferingId = activities.reduce(
		(acc, activity) => {
			if (!acc[activity.subjectOfferingId]) {
				acc[activity.subjectOfferingId] = []
			}
			acc[activity.subjectOfferingId].push(activity)
			return acc
		},
		{} as Record<number, typeof activities>,
	)

	return {
		timetableId,
		yearLevels,
		groups,
		teachers,
		students,
		spaces,
		activitiesBySubjectOfferingId,
		subjectOfferingsByYearLevel,
		createActivityForm: await superValidate(zod4(createActivitySchema)),
		editActivityForm: await superValidate(zod4(editActivitySchema)),
		deleteActivityForm: await superValidate(zod4(deleteActivitySchema)),
	}
}

export const actions = {
	createActivity: async ({ request, params, locals: { security } }) => {
		security.isAuthenticated().isAdmin()

		const timetableDraftId = parseInt(params.timetableDraftId, 10)

		const form = await superValidate(request, zod4(createActivitySchema))

		if (!form.valid) {
			return message(form, 'Please check your inputs and try again.', {
				status: 400,
			})
		}

		try {
			await createTimetableDraftActivityWithRelations({
				timetableDraftId,
				subjectOfferingId: form.data.subjectOfferingId,
				teacherIds: form.data.teacherIds,
				yearLevelIds: (form.data.yearLevelIds ?? []).map((id) =>
					parseInt(id, 10),
				),
				groupIds: (form.data.groupIds ?? []).map((id) => parseInt(id, 10)),
				studentIds: form.data.studentIds ?? [],
				preferredSpaceIds: (form.data.spaceIds ?? []).map((id) =>
					parseInt(id, 10),
				),
				periodsPerInstance: form.data.periodsPerInstance,
				instancesPerWeek: form.data.numInstancesPerWeek,
			})

			return message(form, 'Activity created successfully!')
		} catch (error) {
			console.error('Error creating activity:', error)
			return message(form, 'Failed to create activity. Please try again.', {
				status: 500,
			})
		}
	},

	editActivity: async ({ request, locals: { security } }) => {
		security.isAuthenticated().isAdmin()

		const form = await superValidate(request, zod4(editActivitySchema))

		if (!form.valid) {
			return message(form, 'Please check your inputs and try again.', {
				status: 400,
			})
		}

		try {
			// Calculate total periods (instances per week * periods per instance)
			const totalPeriods =
				form.data.numInstancesPerWeek * form.data.periodsPerInstance

			// Update the activity with all relations
			await updateTimetableDraftActivity(form.data.activityId, {
				subjectOfferingId: form.data.subjectOfferingId,
				periodsPerInstance: form.data.periodsPerInstance,
				totalPeriods,
				teacherIds: form.data.teacherIds,
				yearLevelIds: form.data.yearLevelIds?.map((id) => parseInt(id, 10)),
				groupIds: form.data.groupIds?.map((id) => parseInt(id, 10)),
				studentIds: form.data.studentIds,
				preferredSpaceIds: form.data.spaceIds?.map((id) => parseInt(id, 10)),
			})

			return message(form, 'Activity updated successfully!')
		} catch (error) {
			console.error('Error editing activity:', error)
			return message(form, 'Failed to edit activity. Please try again.', {
				status: 500,
			})
		}
	},

	deleteActivity: async ({ request, locals: { security } }) => {
		security.isAuthenticated().isAdmin()
		const form = await superValidate(request, zod4(deleteActivitySchema))

		if (!form.valid) {
			return message(form, 'Please check your inputs and try again.', {
				status: 400,
			})
		}

		try {
			await deleteTimetableDraftActivity(form.data.activityId)

			return message(form, 'Activity deleted successfully!')
		} catch (error) {
			console.error('Error deleting activity:', error)
			return message(form, 'Failed to delete activity. Please try again.', {
				status: 500,
			})
		}
	},
}

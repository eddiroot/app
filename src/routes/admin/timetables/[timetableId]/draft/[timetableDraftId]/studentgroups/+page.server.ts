import {
	addStudentToTimetableDraftGroup,
	createTimetableDraftStudentGroup,
	deleteTimetableDraftStudentGroup,
	getStudentsByGroupId,
	getStudentsForTimetable,
	getSubjectOfferingsByYearLevelIdForTimetableByTimetableId,
	getTimetableDraftGroupsByTimetableDraftId,
	removeStudentFromTimetableDraftGroup,
} from '$lib/server/db/service'
import { fail } from '@sveltejs/kit'

export const load = async ({ locals: { security }, params }) => {
	const user = security.isAuthenticated().isAdmin().getUser()
	const timetableId = parseInt(params.timetableId)

	// Get all students for the school
	const students = await getStudentsForTimetable(timetableId, user.schoolId)
	const groups = await getTimetableDraftGroupsByTimetableDraftId(timetableId)
	const defaultYearLevel = students.length > 0 ? students[0].yearLevel : ''

	// Get students for each group
	const studentsByGroupId: Record<number, typeof students> = {}
	for (const group of groups) {
		const groupStudents = await getStudentsByGroupId(group.id)
		studentsByGroupId[group.id] = groupStudents
	}

	return { defaultYearLevel, students, groups, studentsByGroupId }
}

export const actions = {
	createGroup: async ({ request, params, locals: { security } }) => {
		security.isAuthenticated().isAdmin()

		const timetableId = parseInt(params.timetableId, 10)
		if (isNaN(timetableId)) {
			return fail(400, { error: 'Invalid timetable ID' })
		}

		const formData = await request.formData()
		const name = formData.get('name') as string
		const yearLevelId = formData.get('yearLevel')

		if (!name || !yearLevelId) {
			return fail(400, { error: 'Name and year level id are required' })
		}

		const yearLevelIdInt = parseInt(yearLevelId as string, 10)
		if (isNaN(yearLevelIdInt)) {
			return fail(400, { error: 'Invalid year level ID' })
		}

		try {
			await createTimetableDraftStudentGroup(timetableId, yearLevelIdInt, name)
			return { success: true }
		} catch (error) {
			console.error('Error creating group:', error)
			return fail(500, { error: 'Failed to create group. Please try again.' })
		}
	},

	autoCreateGroups: async ({ request, params, locals: { security } }) => {
		security.isAuthenticated().isAdmin()

		const timetableId = parseInt(params.timetableId, 10)
		if (isNaN(timetableId)) {
			return fail(400, { error: 'Invalid timetable ID' })
		}

		const formData = await request.formData()
		const yearLevelId = formData.get('yearLevelId') as string

		if (!yearLevelId) {
			return fail(400, { error: 'Year level is required' })
		}

		const yearLevelIdInt = parseInt(yearLevelId, 10)
		if (isNaN(yearLevelIdInt)) {
			return fail(400, { error: 'Invalid year level ID' })
		}

		try {
			const subjectOfferings =
				await getSubjectOfferingsByYearLevelIdForTimetableByTimetableId(
					timetableId,
					yearLevelIdInt,
				)

			let createdCount = 0
			for (const { subject } of subjectOfferings) {
				const groupName = `${subject.name}`
				await createTimetableDraftStudentGroup(
					timetableId,
					yearLevelIdInt,
					groupName,
				)
				createdCount++
			}

			return {
				success: true,
				message: `Successfully created ${createdCount} groups!`,
			}
		} catch (error) {
			console.error('Error auto-creating groups:', error)
			return fail(500, {
				error: 'Failed to auto-create groups. Please try again.',
			})
		}
	},

	addStudent: async ({ request, params, locals: { security } }) => {
		security.isAuthenticated().isAdmin()

		const timetableId = parseInt(params.timetableId, 10)
		if (isNaN(timetableId)) {
			return fail(400, { error: 'Invalid timetable ID' })
		}

		const formData = await request.formData()
		const groupId = formData.get('groupId')
		const userId = formData.get('userId')

		if (!groupId || !userId) {
			return fail(400, { error: 'Group ID and User ID are required' })
		}

		try {
			await addStudentToTimetableDraftGroup(
				parseInt(groupId as string, 10),
				userId as string,
			)
			return { success: true }
		} catch (error) {
			console.error('Error adding student to group:', error)
			return fail(500, {
				error: 'Failed to add student to group. Please try again.',
			})
		}
	},

	removeStudent: async ({ request, params, locals: { security } }) => {
		security.isAuthenticated().isAdmin()

		const timetableId = parseInt(params.timetableId, 10)
		if (isNaN(timetableId)) {
			return fail(400, { error: 'Invalid timetable ID' })
		}

		const formData = await request.formData()
		const groupId = formData.get('groupId')
		const userId = formData.get('userId')

		if (!groupId || !userId) {
			return fail(400, { error: 'Group ID and User ID are required' })
		}

		try {
			await removeStudentFromTimetableDraftGroup(
				parseInt(groupId as string, 10),
				userId as string,
			)
			return { success: true }
		} catch (error) {
			console.error('Error removing student from group:', error)
			return fail(500, {
				error: 'Failed to remove student from group. Please try again.',
			})
		}
	},

	deleteGroup: async ({ request, params, locals: { security } }) => {
		security.isAuthenticated().isAdmin()

		const timetableId = parseInt(params.timetableId, 10)
		if (isNaN(timetableId)) {
			return fail(400, { error: 'Invalid timetable ID' })
		}

		const formData = await request.formData()
		const groupId = formData.get('groupId')

		if (!groupId) {
			return fail(400, { error: 'Group ID is required' })
		}

		try {
			await deleteTimetableDraftStudentGroup(parseInt(groupId as string, 10))
			return { success: true }
		} catch (error) {
			console.error('Error deleting group:', error)
			return fail(500, { error: 'Failed to delete group. Please try again.' })
		}
	},
}

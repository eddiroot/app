import {
	gradeReleaseEnum,
	quizModeEnum,
	taskStatusEnum,
	userTypeEnum,
} from '$lib/enums'
import {
	getClassTaskBlockResponsesByAuthorId,
	getClassTaskBlockResponsesByClassTaskId,
	getClassTaskResponsesWithStudents,
	getSubjectOfferingClassTaskByTaskId,
	getTaskBlocksByTaskId,
	getTaskById,
	getWhiteboardByTaskBlockId,
	startQuizSession,
	toggleWhiteboardLock,
	updateSubjectOfferingClassTaskQuizSettings,
	updateSubjectOfferingClassTaskStatus,
	upsertClassTaskResponse,
} from '$lib/server/db/service'
import { generateUniqueFileName, uploadBufferHelper } from '$lib/server/obj'
import { fail, redirect } from '@sveltejs/kit'
import { superValidate } from 'sveltekit-superforms'
import { zod4 } from 'sveltekit-superforms/adapters'
import {
	quizSettingsFormSchema,
	startQuizFormSchema,
	statusFormSchema,
} from './schema'

export const load = async ({
	locals: { security },
	params: { taskId, subjectOfferingId, subjectOfferingClassId },
}) => {
	const user = security.isAuthenticated().getUser()

	const taskIdInt = parseInt(taskId, 10)
	if (isNaN(taskIdInt)) {
		throw redirect(302, '/dashboard')
	}

	const classIdInt = parseInt(subjectOfferingClassId, 10)
	if (isNaN(classIdInt)) {
		throw redirect(302, '/dashboard')
	}

	const task = await getTaskById(taskIdInt)
	if (!task) throw redirect(302, '/dashboard')

	const classTask = await getSubjectOfferingClassTaskByTaskId(
		taskIdInt,
		classIdInt,
	)
	if (!classTask) throw redirect(302, '/dashboard')

	const isQuizStarted = classTask.quizStart && classTask.quizStart < new Date()

	if (
		user.type === userTypeEnum.student &&
		classTask.quizMode !== quizModeEnum.none
	) {
		if (classTask.quizStart && classTask.quizDurationMinutes) {
			const quizEnd = new Date(
				classTask.quizStart.getTime() +
					classTask.quizDurationMinutes * 60 * 1000,
			)
			const currentTime = new Date()

			if (currentTime > quizEnd) {
				throw redirect(
					302,
					`/subjects/${subjectOfferingId}/class/${subjectOfferingClassId}/tasks`,
				)
			}
		}
	}

	if (
		user.type === userTypeEnum.student &&
		classTask.status !== taskStatusEnum.published
	) {
		throw redirect(
			302,
			`/subjects/${subjectOfferingId}/class/${subjectOfferingClassId}/tasks`,
		)
	}

	const blocks = await getTaskBlocksByTaskId(taskIdInt)

	// Load whiteboards for all whiteboard blocks
	const whiteboardMap = new Map<number, number>() // blockId -> whiteboardId
	const whiteboardLockStates = new Map<number, boolean>() // whiteboardId -> isLocked
	for (const block of blocks) {
		if (block.type === 'whiteboard') {
			const whiteboard = await getWhiteboardByTaskBlockId(block.id)
			if (whiteboard) {
				whiteboardMap.set(block.id, whiteboard.id)
				whiteboardLockStates.set(whiteboard.id, whiteboard.isLocked)
			}
		}
	}

	const [statusForm, quizSettingsForm, startQuizForm] = await Promise.all([
		superValidate({ status: classTask.status }, zod4(statusFormSchema)),
		superValidate(
			{
				quizMode: classTask.quizMode || quizModeEnum.none,
				quizStart: classTask.quizStart
					? classTask.quizStart.toISOString()
					: undefined,
				quizDurationMinutes: classTask.quizDurationMinutes || undefined,
				gradeRelease: classTask.gradeRelease || undefined,
				gradeReleaseTime: classTask.gradeReleaseTime
					? classTask.gradeReleaseTime.toISOString()
					: undefined,
			},
			zod4(quizSettingsFormSchema),
		),
		superValidate(zod4(startQuizFormSchema)),
	])

	if (user.type === userTypeEnum.student) {
		await upsertClassTaskResponse(classTask.id, user.id)

		const blockResponses = await getClassTaskBlockResponsesByAuthorId(
			classTask.id,
			user.id,
		)

		return {
			task,
			isQuizStarted,
			classTask,
			blocks,
			blockResponses,
			whiteboardMap: Object.fromEntries(whiteboardMap),
			whiteboardLockStates: Object.fromEntries(whiteboardLockStates),
			subjectOfferingId,
			subjectOfferingClassId,
			user,
			statusForm,
			quizSettingsForm,
			startQuizForm,
		}
	}

	const responses = await getClassTaskResponsesWithStudents(classTask.id)
	const groupedBlockResponses = await getClassTaskBlockResponsesByClassTaskId(
		classTask.id,
	)

	return {
		task,
		isQuizStarted,
		classTask,
		blocks,
		responses,
		groupedBlockResponses,
		whiteboardMap: Object.fromEntries(whiteboardMap),
		whiteboardLockStates: Object.fromEntries(whiteboardLockStates),
		subjectOfferingId,
		subjectOfferingClassId,
		user,
		statusForm,
		quizSettingsForm,
		startQuizForm,
	}
}

export const actions = {
	status: async ({
		request,
		locals: { security },
		params: { taskId, subjectOfferingClassId },
	}) => {
		const user = security.isAuthenticated().getUser()

		if (user.type === userTypeEnum.student) {
			return fail(403, {
				message: 'Students are not allowed to change task status',
			})
		}

		const taskIdInt = parseInt(taskId, 10)
		const classIdInt = parseInt(subjectOfferingClassId, 10)

		if (isNaN(taskIdInt) || isNaN(classIdInt)) {
			return fail(400, { message: 'Invalid task or class ID' })
		}

		const form = await superValidate(request, zod4(statusFormSchema))

		if (!form.valid) {
			return fail(400, { form })
		}

		try {
			await updateSubjectOfferingClassTaskStatus(
				taskIdInt,
				classIdInt,
				form.data.status,
			)
			return { form }
		} catch (error) {
			console.error('Error changing task status:', error)
			return fail(500, { form, message: 'Failed to change task status' })
		}
	},

	updateQuizSettings: async ({
		request,
		locals: { security },
		params: { taskId, subjectOfferingClassId },
	}) => {
		const user = security.isAuthenticated().getUser()

		if (user.type === userTypeEnum.student) {
			return fail(403, {
				message: 'Students are not allowed to update quiz settings',
			})
		}

		const taskIdInt = parseInt(taskId, 10)
		const classIdInt = parseInt(subjectOfferingClassId, 10)

		if (isNaN(taskIdInt) || isNaN(classIdInt)) {
			return fail(400, { message: 'Invalid task or class ID' })
		}

		const form = await superValidate(request, zod4(quizSettingsFormSchema))

		if (!form.valid) {
			return fail(400, { form })
		}

		try {
			const quizSettings: {
				quizMode?: quizModeEnum
				quizStart?: Date | null
				quizDurationMinutes?: number | null
				gradeRelease?: gradeReleaseEnum
				gradeReleaseTime?: Date | null
			} = {
				quizMode: form.data.quizMode,
				quizStart: form.data.quizStart ? new Date(form.data.quizStart) : null,
				quizDurationMinutes: form.data.quizDurationMinutes || null,
				gradeRelease: form.data.gradeRelease || undefined,
				gradeReleaseTime: form.data.gradeReleaseTime
					? new Date(form.data.gradeReleaseTime)
					: null,
			}

			await updateSubjectOfferingClassTaskQuizSettings(
				taskIdInt,
				classIdInt,
				quizSettings,
			)

			return { form }
		} catch (error) {
			console.error('Error updating quiz settings:', error)
			return fail(500, { form, message: 'Failed to update quiz settings' })
		}
	},

	startQuiz: async ({
		request,
		locals: { security },
		params: { taskId, subjectOfferingClassId },
	}) => {
		const user = security.isAuthenticated().getUser()

		const taskIdInt = parseInt(taskId, 10)
		const classIdInt = parseInt(subjectOfferingClassId, 10)

		if (isNaN(taskIdInt) || isNaN(classIdInt)) {
			return fail(400, { message: 'Invalid task or class ID' })
		}

		const form = await superValidate(request, zod4(startQuizFormSchema))

		if (!form.valid) {
			return fail(400, { form })
		}

		if (user.type !== userTypeEnum.teacher) {
			return fail(403, { form, message: 'Only teachers can start quizzes' })
		}

		const classTask = await getSubjectOfferingClassTaskByTaskId(
			taskIdInt,
			classIdInt,
		)
		if (!classTask) {
			return fail(404, { form, message: 'Class task not found' })
		}

		try {
			await startQuizSession(classTask.id)
			return { form, success: true }
		} catch (error) {
			console.error('Error starting quiz session:', error)
			return fail(500, { form, message: 'Failed to start quiz session' })
		}
	},

	toggleWhiteboardLock: async ({ request, locals: { security } }) => {
		const user = security.isAuthenticated().getUser()

		if (user.type !== userTypeEnum.teacher) {
			return fail(403, { message: 'Only teachers can lock/unlock whiteboards' })
		}

		const formData = await request.formData()
		const whiteboardIdStr = formData.get('whiteboardId')

		if (!whiteboardIdStr) {
			return fail(400, { message: 'Whiteboard ID is required' })
		}

		const whiteboardId = parseInt(whiteboardIdStr.toString(), 10)
		if (isNaN(whiteboardId)) {
			return fail(400, { message: 'Invalid whiteboard ID' })
		}

		try {
			const whiteboard = await toggleWhiteboardLock(whiteboardId)
			return { type: 'success', data: { isLocked: whiteboard.isLocked } }
		} catch (error) {
			console.error('Error toggling whiteboard lock:', error)
			return fail(500, { message: 'Failed to toggle whiteboard lock' })
		}
	},

	uploadFile: async ({ request, locals: { security } }) => {
		const user = security.isAuthenticated().getUser()

		try {
			const formData = await request.formData()
			const file = formData.get('file') as File

			if (!file) {
				return fail(400, { error: 'No file provided' })
			}

			// Validate file size (max 10MB)
			const maxSize = 10 * 1024 * 1024 // 10MB
			if (file.size > maxSize) {
				return fail(400, { error: 'File size must be less than 10MB' })
			}

			// Generate unique filename
			const uniqueFileName = generateUniqueFileName(file.name)
			const objectName = `${user.schoolId}/tasks/${uniqueFileName}`

			// Convert file to buffer
			const arrayBuffer = await file.arrayBuffer()
			const buffer = Buffer.from(arrayBuffer)

			// Upload to object storage
			const url = await uploadBufferHelper(buffer, objectName, file.type)

			return { success: true, url, fileName: file.name, objectName }
		} catch (error) {
			console.error('Upload error:', error)
			return fail(500, { error: 'Failed to upload file. Please try again.' })
		}
	},
}

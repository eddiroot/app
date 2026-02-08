import { gradeReleaseEnum, quizModeEnum, taskStatusEnum } from '$lib/enums'
import { z } from 'zod'

export const statusFormSchema = z.object({ status: z.enum(taskStatusEnum) })

export const quizSettingsFormSchema = z
	.object({
		quizMode: z.enum(quizModeEnum),
		quizStart: z.string().optional(),
		quizDurationMinutes: z.number().int().min(1).max(480).optional(),
		gradeRelease: z.enum(gradeReleaseEnum).optional(),
		gradeReleaseTime: z.string().optional(),
	})
	.refine(
		(data) => {
			// If quiz mode is scheduled, start time is required
			if (data.quizMode === quizModeEnum.scheduled) {
				return data.quizStart !== undefined
			}
			return true
		},
		{
			message: 'Start time is required for scheduled quizzes',
			path: ['quizStart'],
		},
	)
	.refine(
		(data) => {
			// If quiz mode is not 'none', duration is required
			if (data.quizMode !== quizModeEnum.none) {
				return data.quizDurationMinutes !== undefined
			}
			return true
		},
		{
			message: 'Duration is required for timed quizzes',
			path: ['quizDurationMinutes'],
		},
	)
	.refine(
		(data) => {
			// If quiz mode is not 'none', grade release is required
			if (data.quizMode !== quizModeEnum.none) {
				return data.gradeRelease !== undefined
			}
			return true
		},
		{
			message: 'Grade release setting is required for quizzes',
			path: ['gradeRelease'],
		},
	)
	.refine(
		(data) => {
			// If grade release is scheduled, release time is required
			if (data.gradeRelease === gradeReleaseEnum.scheduled) {
				return data.gradeReleaseTime !== undefined
			}
			return true
		},
		{
			message: 'Release time is required for scheduled grade release',
			path: ['gradeReleaseTime'],
		},
	)

// Schema for start quiz form
export const startQuizFormSchema = z.object({})

export type StatusFormSchema = typeof statusFormSchema
export type QuizSettingsFormSchema = typeof quizSettingsFormSchema
export type StartQuizFormSchema = typeof startQuizFormSchema

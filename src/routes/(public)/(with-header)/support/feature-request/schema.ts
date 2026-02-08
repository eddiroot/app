import { z } from 'zod'

export const formSchema = z.object({
	firstName: z.string().min(1, 'First name is required'),
	lastName: z.string().min(1, 'Last name is required'),
	email: z.email('Invalid email address'),
	featureTitle: z.string().min(1, 'Feature title is required'),
	featureDescription: z
		.string()
		.min(10, 'Please provide more details (at least 10 characters)'),
})

export type FormSchema = typeof formSchema

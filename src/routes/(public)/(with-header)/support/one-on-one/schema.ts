import { z } from 'zod'

export const formSchema = z.object({
	firstName: z.string().min(1, 'First name is required'),
	lastName: z.string().min(1, 'Last name is required'),
	email: z.email('Invalid email address'),
	preferredDateTime: z
		.string()
		.min(1, 'Please select a preferred date and time'),
	details: z
		.string()
		.min(10, 'Please provide more details (at least 10 characters)'),
})

export type FormSchema = typeof formSchema

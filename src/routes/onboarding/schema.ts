import { z } from 'zod';

export const formSchema = z.object({
	firstName: z.string().min(1, { message: 'First name is required' }),
	lastName: z.string().min(1, { message: 'Last name is required' }),
	email: z
		.email({ message: 'Please enter a valid email address' })
		.toLowerCase(),
	schoolName: z.string().min(1, { message: 'School name is required' }),
	agreeToContact: z
		.boolean()
		.refine((val) => val === true, {
			message: 'Please agree to be contacted by our team',
		}),
});

export type FormSchema = typeof formSchema;

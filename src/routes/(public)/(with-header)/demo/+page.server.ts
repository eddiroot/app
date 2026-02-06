import { env } from '$env/dynamic/private';
import {
	checkSchoolExistence,
	checkUserExistence,
} from '$lib/server/db/service';
import { fail, setError, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { formSchema } from './schema';

export const load = async () => {
	return { form: await superValidate(zod4(formSchema)) };
};

export const actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, zod4(formSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const userExists = await checkUserExistence(form.data.email);
		if (userExists) {
			return setError(
				form,
				'email',
				'This email is already registered on eddi. If you think this is an error, please contact us.',
			);
		}

		const schoolExists = await checkSchoolExistence(form.data.schoolName);
		if (schoolExists) {
			return setError(
				form,
				'schoolName',
				'This school already exists on eddi. If you think this is an error, please contact us.',
			);
		}

		const embed = {
			title: 'New Demo Request',
			fields: [
				{
					name: 'Name',
					value: `${form.data.firstName} ${form.data.lastName}`,
					inline: true,
				},
				{ name: 'Email', value: form.data.email, inline: true },
				{ name: 'School', value: form.data.schoolName, inline: false },
			],
			color: 0x00ff00,
			timestamp: new Date().toISOString(),
		};

		try {
			await fetch(env.WEBHOOK_NOTIFICATIONS_DEMO, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ embeds: [embed] }),
			});
		} catch (webhookError) {
			console.error('Failed to send webhook:', webhookError);
		}
	},
};

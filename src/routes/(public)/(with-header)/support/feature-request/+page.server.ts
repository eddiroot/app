import { env } from '$env/dynamic/private'
import { fail, superValidate } from 'sveltekit-superforms'
import { zod4 } from 'sveltekit-superforms/adapters'
import { formSchema } from './schema'

export const load = async () => {
	return { form: await superValidate(zod4(formSchema)) }
}

export const actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, zod4(formSchema))

		if (!form.valid) {
			return fail(400, { form })
		}

		const embed = {
			title: 'New Feature Request',
			fields: [
				{
					name: 'Name',
					value: `${form.data.firstName} ${form.data.lastName}`,
					inline: true,
				},
				{ name: 'Email', value: form.data.email, inline: true },
				{ name: 'Feature', value: form.data.featureTitle, inline: false },
				{
					name: 'Description',
					value: form.data.featureDescription,
					inline: false,
				},
			],
			color: 0x3b82f6,
			timestamp: new Date().toISOString(),
		}

		try {
			if (env.WEBHOOK_NOTIFICATIONS_SUPPORT) {
				await fetch(env.WEBHOOK_NOTIFICATIONS_SUPPORT, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ embeds: [embed] }),
				})
			}
		} catch (webhookError) {
			console.error('Failed to send webhook:', webhookError)
		}

		return { form }
	},
}

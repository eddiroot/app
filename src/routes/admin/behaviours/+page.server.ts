import {
	createBehaviourQuickAction,
	getBehaviourQuickActionsBySchoolId,
	updateBehaviourQuickAction
} from '$lib/server/db/service';
import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod';

const behaviourSchema = z.object({
	id: z.number().optional(),
	name: z.string().min(1, 'Name is required'),
	description: z.string().optional()
});

export const load = async ({ locals: { security } }) => {
	const user = security.isAuthenticated().getUser();

	const behaviourQuickActions = await getBehaviourQuickActionsBySchoolId(user.schoolId);

	return {
		behaviourQuickActions,
		form: await superValidate(zod4(behaviourSchema))
	};
};

export const actions = {
	create: async ({ request, locals: { security } }) => {
		const user = security.isAuthenticated().getUser();
		const form = await superValidate(request, zod4(behaviourSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await createBehaviourQuickAction(user.schoolId, form.data.name, form.data.description);
			return { form, success: true };
		} catch (error) {
			console.error('Error creating behaviour quick action:', error);
			return fail(500, { form, error: 'Failed to create behaviour quick action' });
		}
	},

	update: async ({ request, locals: { security } }) => {
		security.isAuthenticated();
		const form = await superValidate(request, zod4(behaviourSchema));

		if (!form.valid || !form.data.id) {
			return fail(400, { form });
		}

		try {
			await updateBehaviourQuickAction(form.data.id, form.data.name, form.data.description);
			return { form, success: true };
		} catch (error) {
			console.error('Error updating behaviour quick action:', error);
			return fail(500, { form, error: 'Failed to update behaviour quick action' });
		}
	}
};

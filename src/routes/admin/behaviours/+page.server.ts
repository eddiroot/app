import {
	createBehaviour,
	createBehaviourLevel,
	getLevelsWithBehaviours,
	updateBehaviour,
	updateBehaviourLevel
} from '$lib/server/db/service';
import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod';

const levelSchema = z.object({
	id: z.number().optional(),
	name: z.string().min(1, 'Name is required')
});

const behaviourSchema = z.object({
	id: z.number().optional(),
	name: z.string().min(1, 'Name is required'),
	levelId: z.string().min(1, 'Level is required'),
	description: z.string().optional()
});

export const load = async ({ locals: { security } }) => {
	const user = security.isAuthenticated().getUser();
	const levelsWithBehaviours = await getLevelsWithBehaviours(user.schoolId);

	return {
		levelsWithBehaviours,
		form: await superValidate(zod4(behaviourSchema)),
		levelForm: await superValidate(zod4(levelSchema))
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
			await createBehaviour(
				user.schoolId,
				form.data.name,
				parseInt(form.data.levelId, 10),
				form.data.description
			);
			return { form, success: true };
		} catch (error) {
			console.error('Error creating behaviour:', error);
			return fail(500, { form, error: 'Failed to create behaviour' });
		}
	},

	update: async ({ request, locals: { security } }) => {
		security.isAuthenticated();
		const form = await superValidate(request, zod4(behaviourSchema));

		if (!form.valid || !form.data.id) {
			return fail(400, { form });
		}

		try {
			const levelId =
				form.data.levelId && form.data.levelId !== '' ? parseInt(form.data.levelId, 10) : undefined;
			await updateBehaviour(form.data.id, form.data.name, levelId, form.data.description);
			return { form, success: true };
		} catch (error) {
			console.error('Error updating behaviour:', error);
			return fail(500, { form, error: 'Failed to update behaviour' });
		}
	},

	createLevel: async ({ request, locals: { security } }) => {
		const user = security.isAuthenticated().getUser();
		const form = await superValidate(request, zod4(levelSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await createBehaviourLevel(user.schoolId, form.data.name);
			return { form, success: true };
		} catch (error) {
			console.error('Error creating behaviour level:', error);
			return fail(500, { form, error: 'Failed to create behaviour level' });
		}
	},

	updateLevel: async ({ request, locals: { security } }) => {
		security.isAuthenticated();
		const form = await superValidate(request, zod4(levelSchema));

		if (!form.valid || !form.data.id) {
			return fail(400, { form });
		}

		try {
			await updateBehaviourLevel(form.data.id, form.data.name);
			return { form, success: true };
		} catch (error) {
			console.error('Error updating behaviour level:', error);
			return fail(500, { form, error: 'Failed to update behaviour level' });
		}
	}
};

import { taskTypeEnum } from '$lib/enums';
import {
	createSubjectOfferingClassTask,
	createTask,
	getTopics,
} from '$lib/server/db/service';
import { error, isRedirect, redirect } from '@sveltejs/kit';
import { fail, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { formSchema } from './schema';

export const load = async ({
	locals: { security },
	params: { subjectOfferingId },
}) => {
	security.isAuthenticated();

	const subjectOfferingIdInt = parseInt(subjectOfferingId, 10);
	if (isNaN(subjectOfferingIdInt)) {
		throw new Error('Invalid subject offering ID');
	}

	const [form, taskTopics] = await Promise.all([
		superValidate(zod4(formSchema)),
		getTopics(subjectOfferingIdInt),
	]);

	return { form, taskTopics };
};

export const actions = {
	createTask: async ({
		request,
		locals: { security },
		params: { subjectOfferingId, subjectOfferingClassId },
	}) => {
		try {
			const user = security.isAuthenticated().getUser();
			const subjectOfferingIdInt = parseInt(subjectOfferingId, 10);
			const subjectOfferingClassIdInt = parseInt(subjectOfferingClassId, 10);

			if (isNaN(subjectOfferingIdInt) || isNaN(subjectOfferingClassIdInt)) {
				throw error(400, 'One of the ids was invalid');
			}

			const formData = await request.formData();
			const form = await superValidate(formData, zod4(formSchema));

			if (!form.valid) {
				return fail(400, { form });
			}

			if (form.data.files && form.data.files.length > 0) {
				throw redirect(
					303,
					`/subjects/${subjectOfferingId}/class/${subjectOfferingClassId}/tasks/${123}`,
				);
			} else {
				const task = await createTask({
					title: form.data.title,
					description: form.data.description || '',
					type: taskTypeEnum[form.data.type],
					subjectOfferingId: subjectOfferingIdInt,
				});

				await createSubjectOfferingClassTask({
					index: 0,
					taskId: task.id,
					subjectOfferingClassId: subjectOfferingClassIdInt,
					authorId: user.id,
					week: form.data.week ?? null,
					due: form.data.dueDate ?? null,
				});

				throw redirect(
					303,
					`/subjects/${subjectOfferingId}/class/${subjectOfferingClassId}/tasks/${task.id}`,
				);
			}
		} catch (err) {
			if (isRedirect(err)) throw err;
			return {
				status: 500,
				error: 'Unknown error occurred during task creation',
			};
		}
	},
};

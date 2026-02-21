import { subjectThreadTypeEnum, userTypeEnum } from '$lib/enums';
import { createSubjectThread } from '$lib/server/db/service';
import { redirect } from '@sveltejs/kit';
import { fail, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { formSchema } from './schema';

export const load = async ({ locals: { security } }) => {
	const user = security.isAuthenticated().getUser();
	const form = await superValidate(zod4(formSchema));

	return { form, user };
};

export const actions = {
	create: async ({
		request,
		locals: { security },
		params: { subjectOfferingId },
	}) => {
		const user = security.isAuthenticated().getUser();

		const subjectOfferingIdInt = parseInt(subjectOfferingId, 10);
		if (isNaN(subjectOfferingIdInt)) {
			return fail(400, { message: 'Invalid subject ID' });
		}

		const form = await superValidate(request, zod4(formSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		if (
			user.type === userTypeEnum.student &&
			(form.data.type === subjectThreadTypeEnum.announcement ||
				form.data.type === subjectThreadTypeEnum.qanda)
		) {
			return fail(400, {
				message:
					'Students do not have permission to create this type of thread',
			});
		}

		if (user.type !== userTypeEnum.student && form.data.isAnonymous) {
			return fail(400, { message: 'Only students can post anonymously' });
		}

		let newThread;
		try {
			newThread = await createSubjectThread({
				subjectOfferingId: subjectOfferingIdInt,
				userId: user.id,
				title: form.data.title,
				type: form.data.type,
				content: form.data.content,
				isAnonymous: form.data.isAnonymous,
			});
		} catch (error) {
			console.error('Error creating thread:', error);
			return fail(500, { message: 'Failed to create discussion post' });
		}

		throw redirect(
			303,
			`/subjects/${subjectOfferingIdInt}/discussion/${newThread.id}`,
		);
	},
};

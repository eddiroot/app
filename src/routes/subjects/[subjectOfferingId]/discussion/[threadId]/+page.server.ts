import { subjectThreadResponseTypeEnum, subjectThreadTypeEnum, userTypeEnum } from '$lib/enums.js';
import { geminiCompletion } from '$lib/server/ai/index.js';
import {
	createSubjectThreadResponse,
	getSubjectThreadById,
	getSubjectThreadResponsesById
} from '$lib/server/db/service';
import { fail, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { formSchema } from './schema.js';
import { getNestedResponses } from './utils.js';

export const load = async ({ locals: { security }, params: { threadId } }) => {
	const currentUser = security.isAuthenticated().getUser();

	const threadIdInt = parseInt(threadId, 10);
	if (isNaN(threadIdInt)) {
		return { thread: null, responses: [], form: null, currentUser };
	}

	const thread = await getSubjectThreadById(threadIdInt);
	const responses = await getSubjectThreadResponsesById(threadIdInt);
	const nestedResponses = getNestedResponses(responses);
	const form = await superValidate(zod4(formSchema), {
		defaults: {
			type:
				thread?.thread?.type == subjectThreadTypeEnum.question ||
					thread?.thread?.type === subjectThreadTypeEnum.qanda
					? subjectThreadResponseTypeEnum.answer
					: subjectThreadResponseTypeEnum.comment,
			content: '',
			isAnonymous: false
		}
	});

	return { thread, nestedResponses, form, currentUser };
};

export const actions = {
	addResponse: async ({ request, locals: { security }, params: { threadId } }) => {
		const user = security.isAuthenticated().getUser();

		const threadIdInt = parseInt(threadId, 10);
		if (isNaN(threadIdInt)) {
			return fail(400, { message: 'Invalid thread ID' });
		}

		const form = await superValidate(request, zod4(formSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		if (user.type !== userTypeEnum.student && form.data.isAnonymous) {
			return fail(400, { message: 'Only students can post anonymously' });
		}

		try {
			await createSubjectThreadResponse(
				form.data.type,
				threadIdInt,
				user.id,
				form.data.content,
				form.data.parentResponseId,
				form.data.isAnonymous
			);
		} catch (error) {
			console.error('Error creating response:', error);
			return fail(500, { form });
		}

		return { form };
	},
	generateSummary: async ({ locals: { security }, params: { threadId } }) => {
		const user = security.isAuthenticated().getUser();

		const threadIdInt = parseInt(threadId, 10);
		if (isNaN(threadIdInt)) {
			return fail(400, { message: 'Invalid thread id' });
		}

		const thread = await getSubjectThreadById(threadIdInt)!;
		if (!thread) {
			return fail(404, { message: 'Thread not found' });
		}

		const responses = await getSubjectThreadResponsesById(threadIdInt);
		const answers = responses.filter(
			(r) => r.response.type === 'answer' && !r.response.parentResponseId
		);
		const comments = responses.filter(
			(r) => r.response.type === 'comment' && !r.response.parentResponseId
		);

		const prompt = `
			Please provide a concise summary of this discussion thread:

			ORIGINAL POST:
			Title: ${thread.thread.title}
			Type: ${thread.thread.type}
			Content: ${thread.thread.content}
			Author: ${thread.user.firstName} ${thread.user.lastName}
			User Requesting Summary: ${user.firstName} ${user.lastName}

			MAIN ANSWERS:
			${answers.map((a) => `- ${a.response.content} (by ${a.user.firstName} ${a.user.lastName})`).join('\n')}

			MAIN COMMENTS:
			${comments.map((c) => `- ${c.response.content} (by ${c.user.firstName} ${c.user.lastName})`).join('\n')}

			Please summarise the thread, touching on all the key points and ensuring that it is easily understandable for school students.
			`;

		const systemInstruction =
			'You are a helpful assistant that creates concise, well-structured summaries of academic discussions and Q&A threads for school students who are looking to get all the necessary information. The summaries should be in plain text format (not markdown).';

		const summary = await geminiCompletion(prompt, undefined, undefined, systemInstruction);
		return { summary };
	}
};

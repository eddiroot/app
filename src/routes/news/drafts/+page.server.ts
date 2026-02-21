import { newsStatusEnum, userPermissions } from '$lib/enums';
import {
	archiveNews,
	getNewsDraftsByAuthor,
	getNewsResources,
	updateNews,
} from '$lib/server/db/service/news';
import { getPermissions } from '$lib/utils';
import { error, fail, redirect } from '@sveltejs/kit';

export const load = async ({ locals: { security } }) => {
	const user = security.isAuthenticated().getUser();

	// Get user's draft news articles
	const drafts = await getNewsDraftsByAuthor(user.id, user.schoolId);

	// Fetch images for each draft
	const draftsWithImages = await Promise.all(
		drafts.map(async (draftItem) => {
			const images = await getNewsResources(draftItem.news.id, user.schoolId);
			return { ...draftItem, images };
		}),
	);

	return { user, drafts: draftsWithImages };
};

export const actions = {
	publish: async ({ request, locals: { security } }) => {
		const user = security.isAuthenticated().getUser();

		// Check permissions
		const userPerms = getPermissions(user.type);
		if (!userPerms.includes(userPermissions.createNews)) {
			throw error(403, 'You do not have permission to publish news');
		}

		const formData = await request.formData();
		const newsId = parseInt(formData.get('newsId') as string, 10);

		if (isNaN(newsId)) {
			return fail(400, { error: 'Invalid news ID' });
		}

		try {
			// Update the draft to published status
			await updateNews(newsId, {
				status: newsStatusEnum.published,
				publishedAt: new Date(),
			});

			throw redirect(303, `/news?published=${newsId}`);
		} catch (err) {
			if (
				err &&
				typeof err === 'object' &&
				'status' in err &&
				err.status === 303
			) {
				throw err;
			}

			console.error('Error publishing draft:', err);
			return fail(500, {
				error: 'Failed to publish article. Please try again.',
			});
		}
	},
	archive: async ({ request, locals: { security } }) => {
		const user = security.isAuthenticated().getUser();

		const userPerms = getPermissions(user.type);
		if (!userPerms.includes(userPermissions.archiveNews)) {
			throw error(403, 'You do not have permission to archive news');
		}

		const formData = await request.formData();
		const newsId = parseInt(formData.get('newsId') as string, 10);

		if (isNaN(newsId)) {
			return fail(400, { error: 'Invalid news ID' });
		}

		try {
			await archiveNews(newsId);
			throw redirect(303, '/news/drafts');
		} catch (err) {
			if (
				err &&
				typeof err === 'object' &&
				'status' in err &&
				err.status === 303
			) {
				throw err;
			}

			console.error('Error archiving draft:', err);
			return fail(500, {
				error: 'Failed to archive article. Please try again.',
			});
		}
	},
};

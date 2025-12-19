import { newsStatusEnum, newsVisibilityEnum, userTypeEnum } from '$lib/enums';
import {
	attachResourceToNews,
	getNewsById,
	getNewsCategories,
	getNewsResources,
	updateNews
} from '$lib/server/db/service/news';
import { createResource } from '$lib/server/db/service/resource';
import { getCampusesByUserId } from '$lib/server/db/service/schools';
import { generateUniqueFileName, uploadBufferHelper } from '$lib/server/obj';
import { getPermissions, userPermissions } from '$lib/utils';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { security } }) => {
	const user = security.isAuthenticated().getUser();
	const newsId = parseInt(params.id, 10);

	if (isNaN(newsId)) {
		throw error(400, 'Invalid news ID');
	}

	// Check if user has permission to create/edit news
	const userPerms = getPermissions(user.type);
	if (!userPerms.includes(userPermissions.createNews)) {
		throw error(403, 'You do not have permission to edit news');
	}

	// Get the news item
	const newsItem = await getNewsById(newsId, true); // Include archived for editing

	if (!newsItem) {
		throw error(404, 'News article not found');
	}

	// Check if user owns this news item or has admin permissions
	if (newsItem.news.authorId !== user.id && user.type !== userTypeEnum.schoolAdmin) {
		throw error(403, 'You can only edit your own news articles');
	}

	// Get user's campuses and categories for form options
	const [categories, userCampuses, images] = await Promise.all([
		getNewsCategories(false),
		getCampusesByUserId(user.id),
		getNewsResources(newsId, user.schoolId)
	]);

	return {
		categories,
		userCampuses,
		newsItem,
		images,
		user
	};
};

export const actions: Actions = {
	default: async ({ params, request, locals: { security } }) => {
		const user = security.isAuthenticated().getUser();
		const newsId = parseInt(params.id, 10);

		if (isNaN(newsId)) {
			throw error(400, 'Invalid news ID');
		}

		// Check permissions
		const userPerms = getPermissions(user.type);
		if (!userPerms.includes(userPermissions.createNews)) {
			throw error(403, 'You do not have permission to edit news');
		}

		const formData = await request.formData();

		// Parse form data
		const title = formData.get('title') as string;
		const content = formData.get('content') as string;
		const categoryId = formData.get('categoryId') ? Number(formData.get('categoryId')) : undefined;
		const campusId = formData.get('campusId') ? Number(formData.get('campusId')) : undefined;
		const visibility = (formData.get('visibility') as string) || 'public';
		const tags = (formData.get('tags') as string) || undefined;
		const isPinned = formData.get('isPinned') === 'on';
		const action = formData.get('action') as string;

		// Get all uploaded images
		const images = formData.getAll('images') as File[];

		// Basic validation
		if (!title || !content) {
			return fail(400, {
				error: 'Title and content are required',
				formData: {
					title,
					content,
					categoryId,
					campusId,
					visibility,
					tags,
					isPinned
				}
			});
		}

		try {
			// Parse tags from comma-separated string to array
			const tagsArray = tags
				? tags
					.split(',')
					.map((tag) => tag.trim())
					.filter((tag) => tag.length > 0)
				: undefined;

			// Convert plain text content to structured format (same as create)
			const structuredContent = {
				blocks: content
					.split('\n\n')
					.map((paragraph: string) => {
						const trimmed = paragraph.trim();
						if (!trimmed) return null;

						if (trimmed.includes('\n')) {
							const lines = trimmed
								.split('\n')
								.map((line) => line.trim())
								.filter((line) => line);
							let currentParagraphLines: string[] = [];
							let currentListItems: string[] = [];
							const result: Array<
								{ type: 'paragraph'; content: string } | { type: 'list'; items: string[] }
							> = [];

							for (const line of lines) {
								const isListItem = /^[•\-*]\s+/.test(line) || /^\d+\.\s+/.test(line);

								if (isListItem) {
									if (currentParagraphLines.length > 0) {
										result.push({
											type: 'paragraph',
											content: currentParagraphLines.join('\n')
										});
										currentParagraphLines = [];
									}
									const cleanItem = line.replace(/^[•\-*]\s+/, '').replace(/^\d+\.\s+/, '');
									currentListItems.push(cleanItem);
								} else {
									if (currentListItems.length > 0) {
										result.push({
											type: 'list',
											items: [...currentListItems]
										});
										currentListItems = [];
									}
									currentParagraphLines.push(line);
								}
							}

							if (currentParagraphLines.length > 0) {
								result.push({
									type: 'paragraph',
									content: currentParagraphLines.join('\n')
								});
							}
							if (currentListItems.length > 0) {
								result.push({
									type: 'list',
									items: currentListItems
								});
							}

							if (result.length > 1) {
								return result;
							}

							if (result.length === 1 && result[0].type === 'list') {
								return result[0];
							}
						}

						return {
							type: 'paragraph',
							content: trimmed
						};
					})
					.filter((block) => block !== null)
					.flat()
			};

			// Update the news item
			const updates = {
				title,
				content: structuredContent,
				categoryId: categoryId || null,
				campusId: campusId || null,
				visibility: visibility as newsVisibilityEnum,
				tags: tagsArray,
				isPinned,
				publishedAt: action === 'publish' ? new Date() : undefined,
				status: action === 'publish' ? newsStatusEnum.published : newsStatusEnum.draft
			};

			await updateNews(newsId, updates);

			// Handle new image uploads if any
			if (images && images.length > 0) {
				const schoolId = user.schoolId.toString();
				const existingImages = await getNewsResources(newsId, user.schoolId);
				let displayOrder = existingImages.length;

				for (let i = 0; i < images.length; i++) {
					const image = images[i];

					if (!image || !image.name || image.size === 0) continue;

					try {
						const uniqueFileName = generateUniqueFileName(image.name);
						const buffer = Buffer.from(await image.arrayBuffer());
						const objectKey = `${schoolId}/news/${newsId}/${uniqueFileName}`;

						await uploadBufferHelper(buffer, objectKey, image.type);

						const resource = await createResource(
							image.name.split('.')[0],
							image.name,
							objectKey,
							image.type,
							image.size,
							'image',
							user.id,
							undefined
						);

						await attachResourceToNews(newsId, resource.id, user.id, displayOrder);
						displayOrder++;
					} catch (uploadError) {
						console.error(`Error uploading image ${i + 1}:`, uploadError);
					}
				}
			}

			// Redirect based on action
			if (action === 'publish') {
				throw redirect(303, `/news?published=${newsId}`);
			} else {
				throw redirect(303, `/news/drafts`);
			}
		} catch (err) {
			if (err && typeof err === 'object' && 'status' in err && err.status === 303) {
				throw err;
			}

			console.error('Error updating news:', err);
			return fail(500, {
				error: 'Failed to update news article. Please try again.',
				formData: {
					title,
					content,
					categoryId,
					campusId,
					visibility,
					tags,
					isPinned
				}
			});
		}
	}
};

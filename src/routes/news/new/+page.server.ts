import { newsVisibilityEnum, userPermissions } from '$lib/enums';
import {
	attachResourceToNews,
	createNews,
	createResource,
	getNewsCategories,
} from '$lib/server/db/service';
import { getCampusesByUserId } from '$lib/server/db/service/school';
import { generateUniqueFileName, uploadBufferHelper } from '$lib/server/obj';
import { getPermissions } from '$lib/utils';
import { error, fail, redirect } from '@sveltejs/kit';

export const load = async ({ locals: { security } }) => {
	const user = security.isAuthenticated().getUser();

	// Check if user has permission to create news
	const userPerms = getPermissions(user.type);
	if (!userPerms.includes(userPermissions.createNews)) {
		throw error(403, 'You do not have permission to create news');
	}

	// Get user's campuses and categories for form options
	const [categories, userCampuses] = await Promise.all([
		getNewsCategories(false),
		getCampusesByUserId(user.id),
	]);

	return { categories, userCampuses, user };
};

export const actions = {
	default: async ({ request, locals: { security } }) => {
		const user = security.isAuthenticated().getUser();

		// Check permissions
		const userPerms = getPermissions(user.type);
		if (!userPerms.includes(userPermissions.createNews)) {
			throw error(403, 'You do not have permission to create news');
		}

		const formData = await request.formData();

		// Parse form data manually (simpler than SuperForms for file uploads)
		const title = formData.get('title') as string;
		const content = formData.get('content') as string;
		const categoryId = formData.get('categoryId')
			? Number(formData.get('categoryId'))
			: undefined;
		const campusId = formData.get('campusId')
			? Number(formData.get('campusId'))
			: undefined;
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
					isPinned,
				},
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

			// Prepare the options object with proper type casting
			const options = {
				campusId,
				categoryId,
				visibility: visibility as newsVisibilityEnum,
				tags: tagsArray,
				isPinned,
				publishedAt: action === 'publish' ? new Date() : undefined,
			};

			const structuredContent = {
				blocks: content
					.split('\n\n')
					.map((paragraph: string) => {
						const trimmed = paragraph.trim();
						if (!trimmed) return null;

						// Check for multi-line lists (each item on separate line)
						if (trimmed.includes('\n')) {
							const lines = trimmed
								.split('\n')
								.map((line) => line.trim())
								.filter((line) => line);

							// Look for consecutive list items and separate content
							let currentParagraphLines: string[] = [];
							let currentListItems: string[] = [];
							const result: Array<
								| { type: 'paragraph'; content: string }
								| { type: 'list'; items: string[] }
							> = [];

							for (const line of lines) {
								const isListItem =
									/^[•\-*]\s+/.test(line) || /^\d+\.\s+/.test(line);

								if (isListItem) {
									// If we have paragraph content, save it first
									if (currentParagraphLines.length > 0) {
										result.push({
											type: 'paragraph',
											content: currentParagraphLines.join('\n'),
										});
										currentParagraphLines = [];
									}
									// Add to current list
									const cleanItem = line
										.replace(/^[•\-*]\s+/, '')
										.replace(/^\d+\.\s+/, '');
									currentListItems.push(cleanItem);
								} else {
									// If we have list items, save them first
									if (currentListItems.length > 0) {
										result.push({ type: 'list', items: [...currentListItems] });
										currentListItems = [];
									}
									// Add to current paragraph
									currentParagraphLines.push(line);
								}
							}

							// Save any remaining content
							if (currentParagraphLines.length > 0) {
								result.push({
									type: 'paragraph',
									content: currentParagraphLines.join('\n'),
								});
							}
							if (currentListItems.length > 0) {
								result.push({ type: 'list', items: currentListItems });
							}

							// If we found mixed content, return the array to be flattened
							if (result.length > 1) return result;

							// If we only found one block and it's a list, return it
							if (result.length === 1 && result[0].type === 'list') {
								return result[0];
							}
						}

						return { type: 'paragraph', content: trimmed };
					})
					.filter((block) => block !== null)
					.flat(), // Flatten arrays from mixed content
			};

			// Create the news item
			const news = await createNews({
				schoolId: user.schoolId,
				authorId: user.id,
				title,
				content: structuredContent,
				...options,
			});

			// Handle image uploads if any
			if (images && images.length > 0) {
				const schoolId = user.schoolId.toString();

				for (let i = 0; i < images.length; i++) {
					const image = images[i];

					// Skip if it's not actually a file (could be empty form field)
					if (!image || !image.name || image.size === 0) continue;

					try {
						// Generate unique file name
						const uniqueFileName = generateUniqueFileName(image.name);

						// Convert file to buffer
						const buffer = Buffer.from(await image.arrayBuffer());

						// Upload to object storage
						const objectKey = `${schoolId}/news/${news.id}/${uniqueFileName}`;
						await uploadBufferHelper(buffer, objectKey, image.type);

						const resource = await createResource({
							bucketName: 'schools',
							fileName: image.name,
							objectKey,
							fileSize: image.size,
							fileType: image.type,
							uploadedBy: user.id,
						});

						// Attach to news article
						await attachResourceToNews(
							news.id,
							resource.id,
							user.id,
							i, // Use index as display order
						);
					} catch (uploadError) {
						console.error(`Error uploading image ${i + 1}:`, uploadError);
						// Continue with other images even if one fails
					}
				}
			}

			// Redirect based on action
			if (action === 'publish') {
				throw redirect(303, `/news?published=${news.id}`);
			} else {
				throw redirect(303, `/news/drafts`);
			}
		} catch (err) {
			// Don't log redirects as errors - they are expected behavior
			if (
				err &&
				typeof err === 'object' &&
				'status' in err &&
				err.status === 303
			) {
				throw err; // Re-throw redirects
			}

			// Handle specific database constraint errors
			if (err && typeof err === 'object' && 'cause' in err) {
				const cause = err.cause as { code?: string; constraint_name?: string };
				if (
					cause?.code === '23505' &&
					cause?.constraint_name === 'news_school_id_title_unique'
				) {
					return fail(400, {
						error: `A news article with the title "${title}" already exists. Please use a different title.`,
						formData: {
							title,
							content,
							categoryId,
							campusId,
							visibility,
							tags,
							isPinned,
						},
					});
				}
			}

			console.error('Error creating news:', err);
			return fail(500, {
				error: 'Failed to create news article. Please try again.',
				formData: {
					title,
					content,
					categoryId,
					campusId,
					visibility,
					tags,
					isPinned,
				},
			});
		}
	},
};

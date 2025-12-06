import { newsStatusEnum, newsVisibilityEnum } from '$lib/enums.js';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { and, asc, count, desc, eq, gte, isNull, lte, or, sql } from 'drizzle-orm';
import type { EmbeddingMetadataFilter } from '.';

// News CRUD operations
export async function createNews(
	schoolId: number,
	authorId: string,
	title: string,
	content: unknown,
	options: {
		excerpt?: string;
		campusId?: number;
		categoryId?: number;
		visibility?: newsVisibilityEnum;
		tags?: string[];
		isPinned?: boolean;
		publishedAt?: Date;
		expiresAt?: Date;
	} = {}
) {
	const [news] = await db
		.insert(table.news)
		.values({
			schoolId,
			authorId,
			title,
			content,
			excerpt: options.excerpt,
			campusId: options.campusId,
			categoryId: options.categoryId,
			status: options.publishedAt ? newsStatusEnum.published : newsStatusEnum.draft,
			visibility: options.visibility || newsVisibilityEnum.public,
			tags: options.tags ? JSON.stringify(options.tags) : null,
			isPinned: options.isPinned || false,
			publishedAt: options.publishedAt,
			expiresAt: options.expiresAt
		})
		.returning();

	return news;
}

export async function getNewsById(newsId: number, includeArchived: boolean = false) {
	const newsItems = await db
		.select({
			news: table.news,
			author: {
				id: table.user.id,
				firstName: table.user.firstName,
				lastName: table.user.lastName,
				avatarUrl: table.user.avatarUrl
			},
			category: table.newsCategory,
			campus: {
				id: table.campus.id,
				name: table.campus.name
			}
		})
		.from(table.news)
		.leftJoin(table.user, eq(table.news.authorId, table.user.id))
		.leftJoin(table.newsCategory, eq(table.news.categoryId, table.newsCategory.id))
		.leftJoin(table.campus, eq(table.news.campusId, table.campus.id))
		.where(
			includeArchived
				? eq(table.news.id, newsId)
				: and(eq(table.news.id, newsId), eq(table.news.isArchived, false))
		)
		.limit(1);

	return newsItems.length > 0 ? newsItems[0] : null;
}

// Get user's draft news
export async function getNewsDraftsByAuthor(
	authorId: string,
	schoolId: number,
	limit: number = 50,
	offset: number = 0
) {
	const newsItems = await db
		.select({
			news: table.news,
			author: {
				id: table.user.id,
				firstName: table.user.firstName,
				lastName: table.user.lastName,
				avatarUrl: table.user.avatarUrl
			},
			category: table.newsCategory,
			campus: {
				id: table.campus.id,
				name: table.campus.name
			}
		})
		.from(table.news)
		.leftJoin(table.user, eq(table.news.authorId, table.user.id))
		.leftJoin(table.newsCategory, eq(table.news.categoryId, table.newsCategory.id))
		.leftJoin(table.campus, eq(table.news.campusId, table.campus.id))
		.where(
			and(
				eq(table.news.authorId, authorId),
				eq(table.news.schoolId, schoolId),
				eq(table.news.status, newsStatusEnum.draft),
				eq(table.news.isArchived, false)
			)
		)
		.orderBy(desc(table.news.updatedAt))
		.limit(limit)
		.offset(offset);

	return newsItems;
}

// Get archived news (admin function)
export async function getArchivedNewsBySchoolId(
	schoolId: number,
	options: {
		campusId?: number;
		categoryId?: number;
		limit?: number;
		offset?: number;
	} = {}
) {
	const { campusId, categoryId, limit = 50, offset = 0 } = options;

	const conditions = [eq(table.news.schoolId, schoolId), eq(table.news.isArchived, true)];

	if (campusId !== undefined) {
		conditions.push(eq(table.news.campusId, campusId));
	}

	if (categoryId !== undefined) {
		conditions.push(eq(table.news.categoryId, categoryId));
	}

	const whereConditions = and(...conditions);

	const newsItems = await db
		.select({
			news: table.news,
			author: {
				id: table.user.id,
				firstName: table.user.firstName,
				lastName: table.user.lastName,
				avatarUrl: table.user.avatarUrl
			},
			category: table.newsCategory,
			campus: {
				id: table.campus.id,
				name: table.campus.name
			}
		})
		.from(table.news)
		.leftJoin(table.user, eq(table.news.authorId, table.user.id))
		.leftJoin(table.newsCategory, eq(table.news.categoryId, table.newsCategory.id))
		.leftJoin(table.campus, eq(table.news.campusId, table.campus.id))
		.where(whereConditions)
		.orderBy(desc(table.news.updatedAt))
		.limit(limit)
		.offset(offset);

	return newsItems;
}

export async function getPublishedNewsBySchoolId(
	schoolId: number,
	campusId?: number,
	userType?: string,
	limit: number = 20,
	offset: number = 0
) {
	const currentDate = new Date();

	const conditions = [
		eq(table.news.schoolId, schoolId),
		eq(table.news.status, newsStatusEnum.published),
		eq(table.news.isArchived, false),
		// Only show news that's published and not expired
		lte(table.news.publishedAt, currentDate),
		or(isNull(table.news.expiresAt), gte(table.news.expiresAt, currentDate))
	];

	// Add visibility filtering based on user type
	if (userType) {
		const visibilityConditions = [
			eq(table.news.visibility, newsVisibilityEnum.public) // Everyone can see public news
		];

		// Add internal visibility for all school users
		if (['student', 'teacher', 'guardian', 'principal', 'schoolAdmin'].includes(userType)) {
			visibilityConditions.push(eq(table.news.visibility, newsVisibilityEnum.internal));
		}

		// Add staff visibility for staff members
		if (['teacher', 'principal', 'schoolAdmin'].includes(userType)) {
			visibilityConditions.push(eq(table.news.visibility, newsVisibilityEnum.staff));
		}

		// Add student visibility for students
		if (userType === 'student') {
			visibilityConditions.push(eq(table.news.visibility, newsVisibilityEnum.students));
		}

		conditions.push(or(...visibilityConditions));
	}

	if (campusId !== undefined) {
		conditions.push(or(eq(table.news.campusId, campusId), isNull(table.news.campusId)));
	}

	const whereConditions = and(...conditions);

	return await db
		.select({
			news: table.news,
			author: {
				id: table.user.id,
				firstName: table.user.firstName,
				lastName: table.user.lastName,
				avatarUrl: table.user.avatarUrl
			},
			category: table.newsCategory,
			campus: {
				id: table.campus.id,
				name: table.campus.name
			}
		})
		.from(table.news)
		.leftJoin(table.user, eq(table.news.authorId, table.user.id))
		.leftJoin(table.newsCategory, eq(table.news.categoryId, table.newsCategory.id))
		.leftJoin(table.campus, eq(table.news.campusId, table.campus.id))
		.where(whereConditions)
		.orderBy(desc(table.news.isPinned), desc(table.news.publishedAt))
		.limit(limit)
		.offset(offset);
}

export async function updateNews(
	newsId: number,
	updates: {
		title?: string;
		excerpt?: string;
		content?: unknown;
		categoryId?: number | null;
		campusId?: number | null;
		visibility?: newsVisibilityEnum;
		status?: newsStatusEnum;
		tags?: string[] | null;
		isPinned?: boolean;
		publishedAt?: Date | null;
		expiresAt?: Date | null;
	}
) {
	// Handle tags serialization
	const updateDataWithTags =
		updates.tags !== undefined
			? { ...updates, tags: updates.tags ? JSON.stringify(updates.tags) : null }
			: updates;

	const [updatedNews] = await db
		.update(table.news)
		.set(updateDataWithTags)
		.where(eq(table.news.id, newsId))
		.returning();

	return updatedNews;
}

export async function publishNews(newsId: number, publishedAt?: Date) {
	const [publishedNews] = await db
		.update(table.news)
		.set({
			status: newsStatusEnum.published,
			publishedAt: publishedAt || new Date()
		})
		.where(eq(table.news.id, newsId))
		.returning();

	return publishedNews;
}

export async function archiveNews(newsId: number) {
	const [archivedNews] = await db
		.update(table.news)
		.set({
			isArchived: true,
			status: newsStatusEnum.archived
		})
		.where(eq(table.news.id, newsId))
		.returning();

	return archivedNews;
}

export async function unarchiveNews(newsId: number) {
	const [unarchivedNews] = await db
		.update(table.news)
		.set({
			isArchived: false,
			status: newsStatusEnum.draft
		})
		.where(eq(table.news.id, newsId))
		.returning();

	return unarchivedNews;
}

// News Categories
export async function createNewsCategory(name: string, description?: string, color?: string) {
	const [category] = await db
		.insert(table.newsCategory)
		.values({
			name,
			description,
			color
		})
		.returning();

	return category;
}

export async function getNewsCategories(includeArchived: boolean = false) {
	const categories = await db
		.select()
		.from(table.newsCategory)
		.where(includeArchived ? undefined : eq(table.newsCategory.isArchived, false))
		.orderBy(asc(table.newsCategory.name));

	return categories;
}

export async function updateNewsCategory(
	categoryId: number,
	updates: {
		name?: string;
		description?: string | null;
		color?: string | null;
	}
) {
	const [updatedCategory] = await db
		.update(table.newsCategory)
		.set(updates)
		.where(eq(table.newsCategory.id, categoryId))
		.returning();

	return updatedCategory;
}

export async function archiveNewsCategory(categoryId: number) {
	const [archivedCategory] = await db
		.update(table.newsCategory)
		.set({ isArchived: true })
		.where(eq(table.newsCategory.id, categoryId))
		.returning();

	return archivedCategory;
}

// News Resources
export async function attachResourceToNews(
	newsId: number,
	resourceId: number,
	authorId: string,
	displayOrder: number = 0
) {
	const [attachment] = await db
		.insert(table.newsResource)
		.values({
			newsId,
			resourceId,
			authorId,
			displayOrder
		})
		.returning();

	return attachment;
}

export async function getNewsResources(
	newsId: number,
	schoolId?: number,
	includeArchived: boolean = false
) {
	const resources = await db
		.select({
			newsResource: table.newsResource,
			resource: table.resource
		})
		.from(table.newsResource)
		.innerJoin(table.resource, eq(table.newsResource.resourceId, table.resource.id))
		.where(
			and(
				eq(table.newsResource.newsId, newsId),
				includeArchived ? undefined : eq(table.newsResource.isArchived, false),
				// Filter for images using the actual fields from your resource table
				or(
					sql`${table.resource.contentType} LIKE 'image/%'`,
					sql`${table.resource.fileName} ~ '(?i)\\.(jpg|jpeg|png|gif|webp|svg)$'`
				)
			)
		)
		.orderBy(asc(table.newsResource.displayOrder));

	// Enhance the resources with actual presigned URLs for direct image access
	const enhancedResources = await Promise.all(
		resources.map(async (item) => {
			let imageUrl = `/api/resources?resourceId=${item.resource.id}&action=download`;

			// If schoolId is provided, generate a presigned URL for direct image access
			if (schoolId) {
				try {
					const { getPresignedUrl } = await import('$lib/server/obj');
					const schoolIdStr = schoolId.toString();

					// Object key format: remove schoolId prefix if it exists
					const objectName = item.resource.objectKey.startsWith(schoolIdStr)
						? item.resource.objectKey.substring(schoolIdStr.length + 1)
						: item.resource.objectKey;

					imageUrl = await getPresignedUrl(schoolIdStr, objectName, 24 * 60 * 60); // 24 hour expiry
				} catch (error) {
					console.error('Error generating presigned URL for resource:', item.resource.id, error);
					// Fallback to API endpoint
				}
			}

			return {
				...item,
				resource: {
					...item.resource,
					imageUrl
				}
			};
		})
	);

	return enhancedResources;
}

export async function removeResourceFromNews(newsResourceId: number) {
	const [archivedResource] = await db
		.update(table.newsResource)
		.set({ isArchived: true })
		.where(eq(table.newsResource.id, newsResourceId))
		.returning();

	return archivedResource;
}

// News Views/Analytics
export async function incrementNewsViews(
	newsId: number,
	viewerId?: string,
	ipAddress?: string,
	userAgent?: string
) {
	// Record the view
	await db.insert(table.newsView).values({
		newsId,
		viewerId,
		ipAddress,
		userAgent
	});

	// Increment view count on news
	await db
		.update(table.news)
		.set({
			viewCount: count()
		})
		.where(eq(table.news.id, newsId));
}

export async function getNewsStats(newsId: number) {
	const viewCount = await db
		.select({ count: count() })
		.from(table.newsView)
		.where(eq(table.newsView.newsId, newsId))
		.limit(1);

	const resourceCount = await db
		.select({ count: count() })
		.from(table.newsResource)
		.where(and(eq(table.newsResource.newsId, newsId), eq(table.newsResource.isArchived, false)))
		.limit(1);

	return {
		viewCount: viewCount[0]?.count || 0,
		resourceCount: resourceCount[0]?.count || 0
	};
}

// Delete news article
export async function deleteNews(newsId: number) {
	const [deletedNews] = await db.delete(table.news).where(eq(table.news.id, newsId)).returning();

	return deletedNews;
}

// ============================================================================
// EMBEDDING METADATA EXTRACTION METHODS
// ============================================================================

/**
 * Extract metadata for News - includes schoolId, campusId, categoryId, authorId, and status info
 */
export async function getNewsMetadataBySchoolId(
	schoolId: number,
	campusId?: number | null,
	categoryId?: number | null,
	authorId?: string
): Promise<EmbeddingMetadataFilter> {
	try {
		return {
			schoolId,
			campusId: campusId ?? undefined,
			categoryId: categoryId ?? undefined,
			authorId
		};
	} catch (error) {
		console.error('Error extracting news metadata:', error);
		return { schoolId };
	}
}

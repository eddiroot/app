import {
	boolean,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	unique,
	uuid
} from 'drizzle-orm/pg-core';
import { newsPriorityEnum, newsStatusEnum, newsVisibilityEnum } from '../../../enums';
import { resource } from './resource';
import { campus, school } from './schools';
import { user } from './user';
import { embeddings, timestamps } from './utils';

export const newsPriorityEnumPg = pgEnum('news_priority', [
	newsPriorityEnum.low,
	newsPriorityEnum.normal,
	newsPriorityEnum.high,
	newsPriorityEnum.urgent
]);

export const newsStatusEnumPg = pgEnum('news_status', [
	newsStatusEnum.draft,
	newsStatusEnum.scheduled,
	newsStatusEnum.published,
	newsStatusEnum.archived
]);

export const newsVisibilityEnumPg = pgEnum('news_visibility', [
	newsVisibilityEnum.public,
	newsVisibilityEnum.internal,
	newsVisibilityEnum.staff,
	newsVisibilityEnum.students
]);

export const newsCategory = pgTable('news_category', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	name: text('name').notNull().unique(),
	description: text('description'),
	color: text('color'), // For UI styling
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type NewsCategory = typeof newsCategory.$inferSelect;

export const news = pgTable(
	'news',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		title: text('title').notNull(),
		excerpt: text('excerpt'),
		content: jsonb('content').notNull(),
		schoolId: integer('school_id')
			.notNull()
			.references(() => school.id, { onDelete: 'cascade' }),
		campusId: integer('campus_id').references(() => campus.id, { onDelete: 'cascade' }),
		categoryId: integer('category_id').references(() => newsCategory.id, { onDelete: 'set null' }),
		authorId: uuid('author_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		status: newsStatusEnumPg().notNull().default(newsStatusEnum.draft),
		priority: newsPriorityEnumPg().notNull().default(newsPriorityEnum.normal),
		visibility: newsVisibilityEnumPg().notNull().default(newsVisibilityEnum.public),
		publishedAt: timestamp('published_at', { mode: 'date' }),
		expiresAt: timestamp('expires_at', { mode: 'date' }),
		tags: jsonb('tags'),
		isPinned: boolean('is_pinned').notNull().default(false),
		viewCount: integer('view_count').notNull().default(0),
		isArchived: boolean('is_archived').notNull().default(false),
		...timestamps,
		...embeddings
	},
	(self) => [
		unique().on(self.schoolId, self.title), // Unique title per school
		index('news_embedding_idx').using('hnsw', self.embedding.op('vector_cosine_ops')),
		index('news_metadata_idx').using('gin', self.embeddingMetadata),
	]
);

export type News = typeof news.$inferSelect;

// Junction table for news resources (attachments, documents, etc.)
export const newsResource = pgTable('news_resource', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	newsId: integer('news_id')
		.notNull()
		.references(() => news.id, { onDelete: 'cascade' }),
	resourceId: integer('resource_id')
		.notNull()
		.references(() => resource.id, { onDelete: 'cascade' }),
	authorId: uuid('author_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	displayOrder: integer('display_order').notNull().default(0),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps
});

export type NewsResource = typeof newsResource.$inferSelect;

// Track news views for analytics
export const newsView = pgTable('news_view', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	newsId: integer('news_id')
		.notNull()
		.references(() => news.id, { onDelete: 'cascade' }),
	viewerId: uuid('viewer_id').references(() => user.id, { onDelete: 'cascade' }), // Null for anonymous views
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	...timestamps
});

export type NewsView = typeof newsView.$inferSelect;

import {
	boolean,
	index,
	integer,
	jsonb,
	pgSchema,
	primaryKey,
	text,
	uuid,
} from 'drizzle-orm/pg-core';
import {
	newsPriorityEnum,
	newsStatusEnum,
	newsVisibilityEnum,
} from '../../../enums';
import { resource } from './resource';
import { school, schoolCampus } from './school';
import { user } from './user';
import {
	enumToPgEnum,
	essentials,
	essentialsNoId,
	standardTimestamp,
} from './utils';

export const newsSchema = pgSchema('news');

export const newsPriorityEnumPg = newsSchema.enum(
	'enum_news_priority',
	enumToPgEnum(newsPriorityEnum),
);
export const newsStatusEnumPg = newsSchema.enum(
	'enum_news_status',
	enumToPgEnum(newsStatusEnum),
);
export const newsVisibilityEnumPg = newsSchema.enum(
	'enum_news_visibility',
	enumToPgEnum(newsVisibilityEnum),
);

export const newsCategory = newsSchema.table(
	'news_category',
	{
		...essentials,
		schoolId: integer()
			.notNull()
			.references(() => school.id, { onDelete: 'cascade' }),
		name: text().notNull().unique(),
		description: text(),
		color: text(),
	},
	(self) => [index().on(self.schoolId)],
);

export type NewsCategory = typeof newsCategory.$inferSelect;

export const news = newsSchema.table(
	'news',
	{
		...essentials,
		title: text().notNull(),
		excerpt: text(),
		content: jsonb().notNull(),
		schoolId: integer()
			.notNull()
			.references(() => school.id, { onDelete: 'cascade' }),
		schoolCampusId: integer('sch_cmps_id').references(() => schoolCampus.id, {
			onDelete: 'cascade',
		}),
		categoryId: integer().references(() => newsCategory.id, {
			onDelete: 'set null',
		}),
		authorId: uuid()
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		status: newsStatusEnumPg().notNull().default(newsStatusEnum.draft),
		priority: newsPriorityEnumPg().notNull().default(newsPriorityEnum.normal),
		visibility: newsVisibilityEnumPg()
			.notNull()
			.default(newsVisibilityEnum.public),
		publishedAt: standardTimestamp('published_at'),
		expiresAt: standardTimestamp('expires_at'),
		tags: jsonb(),
		isPinned: boolean().notNull().default(false),
		viewCount: integer().notNull().default(0),
	},
	(self) => [
		index().on(self.schoolId),
		index().on(self.schoolCampusId),
		index().on(self.categoryId),
		index().on(self.authorId),
	],
);

export type News = typeof news.$inferSelect;

// Junction table for news resources (attachments, documents, etc.)
export const newsResource = newsSchema.table(
	'news_resource',
	{
		...essentialsNoId,
		newsId: integer()
			.notNull()
			.references(() => news.id, { onDelete: 'cascade' }),
		resourceId: integer()
			.notNull()
			.references(() => resource.id, { onDelete: 'cascade' }),
		authorId: uuid()
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		displayOrder: integer().notNull().default(0),
	},
	(self) => [
		primaryKey({ columns: [self.newsId, self.resourceId] }),
		index().on(self.newsId),
		index().on(self.resourceId),
		index().on(self.authorId),
	],
);

export type NewsResource = typeof newsResource.$inferSelect;

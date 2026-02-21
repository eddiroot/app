import { index, integer, pgSchema, text, uuid } from 'drizzle-orm/pg-core';
import { user } from './user';
import { essentials } from './utils';

export const resourceSchema = pgSchema('resource');

export const resource = resourceSchema.table(
	'res',
	{
		...essentials,
		bucketName: text().notNull(),
		objectKey: text().notNull(),
		fileName: text().notNull(),
		fileSize: integer().notNull(),
		fileType: text().notNull(),
		uploadedBy: uuid()
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
	},
	(self) => [index().on(self.uploadedBy)],
);

export type Resource = typeof resource.$inferSelect;

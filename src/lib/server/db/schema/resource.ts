import { boolean, index, integer, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { user } from './user';
import { embeddings, timestamps } from './utils';

export const resource = pgTable('res', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
	fileName: text('file_name').notNull(),
	objectKey: text('object_key').notNull(),
	bucketName: text('bucket_name').notNull().default('schools'),
	contentType: text('content_type').notNull(),
	fileSize: integer('file_size').notNull(),
	resourceType: text('resource_type').notNull(),
	uploadedBy: uuid('uploaded_by')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	isArchived: boolean('is_archived').notNull().default(false),
	...timestamps,
	...embeddings
},	// If we want to embed resources for search as well.
	(self) => [
		index('res_embedding_idx').using('hnsw', self.embedding.op('vector_cosine_ops')),
		index('res_metadata_idx').using('gin', self.embeddingMetadata),
	]
);

export type Resource = typeof resource.$inferSelect;

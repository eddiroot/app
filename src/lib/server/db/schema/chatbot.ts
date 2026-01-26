import { integer, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { user } from './user';
import { essentials } from './utils';

export const chatbotChat = pgTable('cb_chat', {
	...essentials,
	name: text('name'),
	userId: uuid('user_id').references(() => user.id, { onDelete: 'cascade' }),
});

export type ChatbotChat = typeof chatbotChat.$inferSelect;

export const chatbotMessage = pgTable('cb_msg', {
	...essentials,
	userId: uuid('user_id').references(() => user.id, { onDelete: 'cascade' }),
	chatId: integer('cb_chat_id')
		.notNull()
		.references(() => chatbotChat.id, { onDelete: 'cascade' }),
	content: text('content').notNull(),
});

export type ChatbotMessage = typeof chatbotMessage.$inferSelect;

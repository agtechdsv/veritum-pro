
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

export const documentTemplates = pgTable('document_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  category: text('category'),
  content: text('content').notNull(),
  basePrompt: text('base_prompt'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

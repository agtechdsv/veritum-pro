
import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const persons = pgTable('persons', {
    id: uuid('id').primaryKey().defaultRandom(),
    person_type: text('person_type'),
    full_name: text('full_name').notNull(),
    document: text('document').notNull().unique(),
    email: text('email'),
    phone: text('phone'),
    rg: text('rg'),
    legal_data: jsonb('legal_data'),
    address: jsonb('address'),
    workspace_id: uuid('workspace_id'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    deleted_at: timestamp('deleted_at', { withTimezone: true }),
});

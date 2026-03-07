import { pgTable, uuid, text, timestamp, numeric } from 'drizzle-orm/pg-core';
import { persons } from './persons';

export const lawsuits = pgTable('lawsuits', {
    id: uuid('id').primaryKey().defaultRandom(),
    cnj_number: text('cnj_number').notNull().unique(),
    case_title: text('case_title'),
    author_id: uuid('author_id').references(() => persons.id),
    defendant_id: uuid('defendant_id').references(() => persons.id),
    responsible_lawyer_id: uuid('responsible_lawyer_id'),
    status: text('status', { enum: ['Ativo', 'Suspenso', 'Arquivado', 'Encerrado'] }),
    sphere: text('sphere'),
    court: text('court'),
    chamber: text('chamber'),
    rito: text('rito'),
    city: text('city'),
    state: text('state'),
    value: numeric('value', { precision: 15, scale: 2 }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    deleted_at: timestamp('deleted_at', { withTimezone: true }),
});

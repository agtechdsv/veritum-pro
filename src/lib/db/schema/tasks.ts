import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { lawsuits } from './lawsuits';

export const tasks = pgTable('tasks', {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    description: text('description'),
    lawsuit_id: uuid('lawsuit_id').references(() => lawsuits.id, { onDelete: 'cascade' }),
    responsible_id: uuid('responsible_id'),
    status: text('status', { enum: ['A Fazer', 'Em Andamento', 'Concluído', 'Atrasado'] }).default('A Fazer'),
    priority: text('priority', { enum: ['Baixa', 'Média', 'Alta', 'Urgente'] }).default('Média'),
    due_date: timestamp('due_date', { withTimezone: true }).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    deleted_at: timestamp('deleted_at', { withTimezone: true }),
});

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, ilike, or, and, isNull } from 'drizzle-orm';
import { Task } from '@/types';
import { ITaskRepository } from './task-repository.interface';
import { tasks } from '../schema/tasks';

export class DrizzleTaskRepository implements ITaskRepository {
    private db;

    constructor(connectionString: string) {
        const client = postgres(connectionString);
        this.db = drizzle(client);
    }

    async list(searchTerm?: string): Promise<Task[]> {
        let filters: any = isNull(tasks.deleted_at);

        if (searchTerm) {
            filters = and(filters, or(
                ilike(tasks.title, `%${searchTerm}%`),
                ilike(tasks.description, `%${searchTerm}%`)
            )) as any;
        }

        const result = await this.db.select().from(tasks).where(filters).orderBy(tasks.due_date);
        return result as unknown as Task[];
    }

    async save(task: Partial<Task>): Promise<Task> {
        // Convert ISO string to Date for Drizzle
        const taskForDrizzle = {
            ...task,
            due_date: task.due_date ? new Date(task.due_date) : undefined,
            updated_at: new Date()
        } as any;

        if (task.id) {
            const result = await this.db.update(tasks)
                .set(taskForDrizzle)
                .where(eq(tasks.id, task.id))
                .returning();
            return result[0] as unknown as Task;
        } else {
            const result = await this.db.insert(tasks)
                .values(taskForDrizzle)
                .returning();
            return result[0] as unknown as Task;
        }
    }

    async delete(id: string): Promise<void> {
        await this.db.update(tasks)
            .set({ deleted_at: new Date() })
            .where(eq(tasks.id, id));
    }
}

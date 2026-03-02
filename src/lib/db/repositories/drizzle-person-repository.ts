
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, ilike, or, and, isNull } from 'drizzle-orm';
import { Person } from '@/types';
import { IPersonRepository } from './person-repository.interface';
import { persons } from '../schema/persons';

export class DrizzlePersonRepository implements IPersonRepository {
    private db;

    constructor(connectionString: string) {
        const client = postgres(connectionString);
        this.db = drizzle(client);
    }

    async list(searchTerm?: string, workspaceId?: string): Promise<Person[]> {
        let filters: any = isNull(persons.deleted_at);

        if (workspaceId) {
            filters = and(filters, eq(persons.workspace_id, workspaceId));
        }

        if (searchTerm) {
            filters = and(filters, or(
                ilike(persons.full_name, `%${searchTerm}%`),
                ilike(persons.document, `%${searchTerm}%`)
            )) as any;
        }

        const result = await this.db.select().from(persons).where(filters).orderBy(persons.full_name);
        return result as unknown as Person[];
    }

    async getById(id: string): Promise<Person | null> {
        const result = await this.db.select().from(persons).where(eq(persons.id, id)).limit(1);
        return (result[0] as unknown as Person) || null;
    }

    async save(person: Partial<Person>): Promise<Person> {
        if (person.id) {
            const result = await this.db.update(persons)
                .set({ ...person, updated_at: new Date() })
                .where(eq(persons.id, person.id))
                .returning();
            return result[0] as unknown as Person;
        } else {
            const result = await this.db.insert(persons)
                .values(person as any)
                .returning();
            return result[0] as unknown as Person;
        }
    }

    async delete(id: string): Promise<void> {
        await this.db.update(persons)
            .set({ deleted_at: new Date() })
            .where(eq(persons.id, id));
    }
}

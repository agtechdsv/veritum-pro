import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, ilike, or, and, isNull } from 'drizzle-orm';
import { Lawsuit } from '@/types';
import { ILawsuitRepository } from './lawsuit-repository.interface';
import { lawsuits } from '../schema/lawsuits';

export class DrizzleLawsuitRepository implements ILawsuitRepository {
    private db;

    constructor(connectionString: string) {
        const client = postgres(connectionString);
        this.db = drizzle(client);
    }

    async list(searchTerm?: string): Promise<Lawsuit[]> {
        let filters: any = isNull(lawsuits.deleted_at);

        if (searchTerm) {
            filters = and(filters, or(
                ilike(lawsuits.cnj_number, `%${searchTerm}%`),
                ilike(lawsuits.case_title, `%${searchTerm}%`)
            )) as any;
        }

        const result = await this.db.select().from(lawsuits).where(filters).orderBy(lawsuits.created_at);
        return result as unknown as Lawsuit[];
    }

    async save(lawsuit: Partial<Lawsuit>): Promise<Lawsuit> {
        // Convert numeric to string for Drizzle if needed
        const lawsuitForDrizzle = {
            ...lawsuit,
            value: lawsuit.value ? lawsuit.value.toString() : undefined,
            updated_at: new Date()
        } as any;

        if (lawsuit.id) {
            const result = await this.db.update(lawsuits)
                .set(lawsuitForDrizzle)
                .where(eq(lawsuits.id, lawsuit.id))
                .returning();
            return result[0] as unknown as Lawsuit;
        } else {
            const result = await this.db.insert(lawsuits)
                .values(lawsuitForDrizzle)
                .returning();
            return result[0] as unknown as Lawsuit;
        }
    }

    async delete(id: string): Promise<void> {
        await this.db.update(lawsuits)
            .set({ deleted_at: new Date() })
            .where(eq(lawsuits.id, id));
    }
}

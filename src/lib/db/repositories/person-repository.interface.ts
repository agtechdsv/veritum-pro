
import { Person } from '@/types';

export interface IPersonRepository {
    list(searchTerm?: string, workspaceId?: string): Promise<Person[]>;
    getById(id: string): Promise<Person | null>;
    save(person: Partial<Person>): Promise<Person>;
    delete(id: string): Promise<void>;
}

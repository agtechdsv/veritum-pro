import { Task } from '@/types';

export interface ITaskRepository {
    list(searchTerm?: string): Promise<Task[]>;
    getById(id: string): Promise<Task | null>;
    save(task: Partial<Task>): Promise<Task>;
    delete(id: string): Promise<void>;
}

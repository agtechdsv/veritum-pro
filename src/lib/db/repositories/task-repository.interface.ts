import { Task } from '@/types';

export interface ITaskRepository {
    list(searchTerm?: string): Promise<Task[]>;
    save(task: Partial<Task>): Promise<Task>;
    delete(id: string): Promise<void>;
}

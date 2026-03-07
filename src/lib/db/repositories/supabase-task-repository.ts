import { SupabaseClient } from '@supabase/supabase-js';
import { Task } from '@/types';
import { ITaskRepository } from './task-repository.interface';

export class SupabaseTaskRepository implements ITaskRepository {
    constructor(private client: SupabaseClient) { }

    async list(searchTerm?: string): Promise<Task[]> {
        let query = this.client
            .from('tasks')
            .select('*')
            .is('deleted_at', null)
            .order('due_date', { ascending: true });

        if (searchTerm) {
            query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
        }

        const { data, error } = await query.limit(100);
        if (error) throw error;
        return data || [];
    }

    async save(task: Partial<Task>): Promise<Task> {
        if (task.id) {
            const { data, error } = await this.client
                .from('tasks')
                .update(task)
                .eq('id', task.id)
                .select()
                .single();
            if (error) throw error;
            return data;
        } else {
            const { data, error } = await this.client
                .from('tasks')
                .insert([task])
                .select()
                .single();
            if (error) throw error;
            return data;
        }
    }

    async delete(id: string): Promise<void> {
        const { error } = await this.client
            .from('tasks')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);
        if (error) throw error;
    }
}

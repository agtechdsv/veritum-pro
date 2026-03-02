
import { SupabaseClient } from '@supabase/supabase-js';
import { Person } from '@/types';
import { IPersonRepository } from './person-repository.interface';

export class SupabasePersonRepository implements IPersonRepository {
    constructor(private supabase: SupabaseClient) { }

    async list(searchTerm?: string, workspaceId?: string): Promise<Person[]> {
        let query = this.supabase
            .from('persons')
            .select('*')
            .is('deleted_at', null)
            .order('full_name', { ascending: true });

        if (workspaceId) {
            query = query.eq('workspace_id', workspaceId);
        }

        if (searchTerm) {
            query = query.or(`full_name.ilike.%${searchTerm}%,document.ilike.%${searchTerm}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    }

    async getById(id: string): Promise<Person | null> {
        const { data, error } = await this.supabase
            .from('persons')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }

    async save(person: Partial<Person>): Promise<Person> {
        if (person.id) {
            const { data, error } = await this.supabase
                .from('persons')
                .update(person)
                .eq('id', person.id)
                .select()
                .single();
            if (error) throw error;
            return data;
        } else {
            const { data, error } = await this.supabase
                .from('persons')
                .insert(person)
                .select()
                .single();
            if (error) throw error;
            return data;
        }
    }

    async delete(id: string): Promise<void> {
        const { error } = await this.supabase
            .from('persons')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;
    }
}

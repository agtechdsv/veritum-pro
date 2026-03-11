import { SupabaseClient } from '@supabase/supabase-js';
import { IEventRepository } from './event-repository.interface';
import { CalendarEvent } from '@/types';

export class SupabaseEventRepository implements IEventRepository {
    constructor(private supabase: SupabaseClient) { }

    async list(searchTerm?: string): Promise<CalendarEvent[]> {
        let query = this.supabase
            .from('events')
            .select(`*`)
            .order('start_date', { ascending: true });

        if (searchTerm) {
            query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as CalendarEvent[];
    }

    async findById(id: string): Promise<CalendarEvent | null> {
        const { data, error } = await this.supabase
            .from('events')
            .select('*')
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data as CalendarEvent | null;
    }

    async save(event: Partial<CalendarEvent>): Promise<CalendarEvent> {
        const payload = { ...event };
        delete payload.created_at;
        delete payload.updated_at;

        if (event.id) {
            const { data, error } = await this.supabase
                .from('events')
                .update({ ...payload, updated_at: new Date().toISOString() })
                .eq('id', event.id)
                .select()
                .single();

            if (error) throw error;
            return data as CalendarEvent;
        } else {
            const { data, error } = await this.supabase
                .from('events')
                .insert([{ ...payload, updated_at: new Date().toISOString() }])
                .select()
                .single();

            if (error) throw error;
            return data as CalendarEvent;
        }
    }

    async delete(id: string): Promise<void> {
        const { error } = await this.supabase
            .from('events')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
}

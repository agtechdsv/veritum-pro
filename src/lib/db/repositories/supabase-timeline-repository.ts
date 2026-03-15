import { SupabaseClient } from '@supabase/supabase-js';
import { TimelineEntry } from '@/types';
import { ITimelineRepository } from './timeline-repository.interface';

export class SupabaseTimelineRepository implements ITimelineRepository {
    constructor(private client: SupabaseClient) { }

    async list(entityType: string, entityId: string): Promise<TimelineEntry[]> {
        const { data, error } = await this.client
            .from('timeline_entries')
            .select('*')
            .eq('entity_type', entityType)
            .eq('entity_id', entityId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []) as TimelineEntry[];
    }

    async save(entry: Partial<TimelineEntry>): Promise<TimelineEntry> {
        const { data, error } = await this.client
            .from('timeline_entries')
            .insert([entry])
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}

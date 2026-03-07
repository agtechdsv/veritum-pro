import { SupabaseClient } from '@supabase/supabase-js';
import { Lawsuit } from '@/types';
import { ILawsuitRepository } from './lawsuit-repository.interface';

export class SupabaseLawsuitRepository implements ILawsuitRepository {
    constructor(private client: SupabaseClient) { }

    async list(searchTerm?: string): Promise<Lawsuit[]> {
        let query = this.client
            .from('lawsuits')
            .select('*')
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (searchTerm) {
            query = query.or(`cnj_number.ilike.%${searchTerm}%,case_title.ilike.%${searchTerm}%`);
        }

        const { data, error } = await query.limit(50);
        if (error) throw error;
        return data || [];
    }

    async save(lawsuit: Partial<Lawsuit>): Promise<Lawsuit> {
        if (lawsuit.id) {
            const { data, error } = await this.client
                .from('lawsuits')
                .update(lawsuit)
                .eq('id', lawsuit.id)
                .select()
                .single();
            if (error) throw error;
            return data;
        } else {
            const { data, error } = await this.client
                .from('lawsuits')
                .insert([lawsuit])
                .select()
                .single();
            if (error) throw error;
            return data;
        }
    }

    async delete(id: string): Promise<void> {
        const { error } = await this.client
            .from('lawsuits')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);
        if (error) throw error;
    }
}

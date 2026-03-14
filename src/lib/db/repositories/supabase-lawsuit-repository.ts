import { SupabaseClient } from '@supabase/supabase-js';
import { Lawsuit, LawsuitDocument } from '@/types';
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

    async listDocuments(lawsuitId: string): Promise<LawsuitDocument[]> {
        const { data, error } = await this.client
            .from('legal_documents')
            .select('*')
            .eq('lawsuit_id', lawsuitId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    }

    async saveDocument(doc: Partial<LawsuitDocument>): Promise<LawsuitDocument> {
        if (doc.id) {
            const { data, error } = await this.client
                .from('legal_documents')
                .update(doc)
                .eq('id', doc.id)
                .select()
                .single();
            if (error) throw error;
            return data;
        } else {
            const { data, error } = await this.client
                .from('legal_documents')
                .insert([doc])
                .select()
                .single();
            if (error) throw error;
            return data;
        }
    }

    async deleteDocument(id: string): Promise<void> {
        const { error } = await this.client
            .from('legal_documents')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }
}

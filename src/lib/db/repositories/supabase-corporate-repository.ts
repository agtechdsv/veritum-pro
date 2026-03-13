
import { SupabaseClient } from '@supabase/supabase-js';
import { CorporateEntity, Shareholder, CorporateDocument } from '@/types';
import { ICorporateRepository } from './corporate-repository.interface';

export class SupabaseCorporateRepository implements ICorporateRepository {
    constructor(private client: SupabaseClient) { }

    // Entities
    async listEntities(searchTerm?: string): Promise<CorporateEntity[]> {
        let query = this.client
            .from('corporate_entities')
            .select('*')
            .is('deleted_at', null)
            .order('legal_name', { ascending: true });

        if (searchTerm) {
            query = query.or(`legal_name.ilike.%${searchTerm}%,trading_name.ilike.%${searchTerm}%,cnpj.ilike.%${searchTerm}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    }

    async getEntityById(id: string): Promise<CorporateEntity | null> {
        const { data, error } = await this.client
            .from('corporate_entities')
            .select('*')
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    }

    async saveEntity(entity: Partial<CorporateEntity>): Promise<CorporateEntity> {
        if (entity.id) {
            const { data, error } = await this.client
                .from('corporate_entities')
                .update(entity)
                .eq('id', entity.id)
                .select()
                .single();
            if (error) throw error;
            return data;
        } else {
            const { data, error } = await this.client
                .from('corporate_entities')
                .insert([entity])
                .select()
                .single();
            if (error) throw error;
            return data;
        }
    }

    async deleteEntity(id: string): Promise<void> {
        const { error } = await this.client
            .from('corporate_entities')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);
        if (error) throw error;
    }

    // Shareholders
    async listShareholders(entityId: string): Promise<Shareholder[]> {
        const { data, error } = await this.client
            .from('corporate_shareholders')
            .select(`
                *,
                person:persons(full_name),
                corporate:corporate_entities!corporate_shareholder_id(legal_name)
            `)
            .eq('entity_id', entityId)
            .order('ownership_percentage', { ascending: false });

        if (error) throw error;

        return (data || []).map(s => ({
            ...s,
            shareholder_name: s.person?.full_name || s.corporate?.legal_name || 'N/A',
            shareholder_type: s.person_shareholder_id ? 'Person' : 'Entity'
        })) as Shareholder[];
    }

    async saveShareholder(shareholder: Partial<Shareholder>): Promise<Shareholder> {
        if (shareholder.id) {
            const { data, error } = await this.client
                .from('corporate_shareholders')
                .update(shareholder)
                .eq('id', shareholder.id)
                .select()
                .single();
            if (error) throw error;
            return data;
        } else {
            const { data, error } = await this.client
                .from('corporate_shareholders')
                .insert([shareholder])
                .select()
                .single();
            if (error) throw error;
            return data;
        }
    }

    async deleteShareholder(id: string): Promise<void> {
        const { error } = await this.client
            .from('corporate_shareholders')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }

    // Documents
    async listDocuments(entityId: string): Promise<CorporateDocument[]> {
        const { data, error } = await this.client
            .from('corporate_documents')
            .select('*')
            .eq('entity_id', entityId)
            .order('event_date', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async saveDocument(doc: Partial<CorporateDocument>): Promise<CorporateDocument> {
        if (doc.id) {
            const { data, error } = await this.client
                .from('corporate_documents')
                .update(doc)
                .eq('id', doc.id)
                .select()
                .single();
            if (error) throw error;
            return data;
        } else {
            const { data, error } = await this.client
                .from('corporate_documents')
                .insert([doc])
                .select()
                .single();
            if (error) throw error;
            return data;
        }
    }

    async deleteDocument(id: string): Promise<void> {
        const { error } = await this.client
            .from('corporate_documents')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }
}

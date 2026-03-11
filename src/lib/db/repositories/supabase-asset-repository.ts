import { SupabaseClient } from '@supabase/supabase-js';
import { Asset } from '@/types';
import { IAssetRepository } from './asset-repository.interface';

export class SupabaseAssetRepository implements IAssetRepository {
    constructor(private client: SupabaseClient) { }

    async list(personId?: string, lawsuitId?: string): Promise<Asset[]> {
        let query = this.client.from('assets').select('*');
        if (personId) {
            query = query.eq('person_id', personId);
        }
        if (lawsuitId) {
            query = query.eq('lawsuit_id', lawsuitId);
        }
        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;
        if (error) throw error;
        return data as Asset[];
    }

    async getById(id: string): Promise<Asset | null> {
        const { data, error } = await this.client
            .from('assets')
            .select('*')
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data as Asset;
    }

    async save(asset: Partial<Asset>): Promise<Asset> {
        if (asset.id) {
            const { data, error } = await this.client
                .from('assets')
                .update(asset)
                .eq('id', asset.id)
                .select()
                .single();
            if (error) throw error;
            return data as Asset;
        } else {
            const { data, error } = await this.client
                .from('assets')
                .insert(asset)
                .select()
                .single();
            if (error) throw error;
            return data as Asset;
        }
    }

    async delete(id: string): Promise<void> {
        const { error } = await this.client
            .from('assets')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
}

import { SupabaseClient } from '@supabase/supabase-js';
import { FinancialTransaction } from '@/types';
import { IFinancialRepository } from './financial-repository.interface';

export class SupabaseFinancialRepository implements IFinancialRepository {
    constructor(private client: SupabaseClient) { }

    async listByLawsuit(lawsuitId: string): Promise<FinancialTransaction[]> {
        const { data, error } = await this.client
            .from('financial_transactions')
            .select('*')
            .eq('lawsuit_id', lawsuitId)
            .order('transaction_date', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async listByPerson(personId: string): Promise<FinancialTransaction[]> {
        const { data, error } = await this.client
            .from('financial_transactions')
            .select('*')
            .eq('person_id', personId)
            .order('transaction_date', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async getById(id: string): Promise<FinancialTransaction | null> {
        const { data, error } = await this.client
            .from('financial_transactions')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error) throw error;
        return data;
    }

    async save(transaction: Partial<FinancialTransaction>): Promise<FinancialTransaction> {
        if (transaction.id) {
            const { data, error } = await this.client
                .from('financial_transactions')
                .update(transaction)
                .eq('id', transaction.id)
                .select()
                .single();
            if (error) throw error;
            return data;
        } else {
            const { data, error } = await this.client
                .from('financial_transactions')
                .insert([transaction])
                .select()
                .single();
            if (error) throw error;
            return data;
        }
    }

    async delete(id: string): Promise<void> {
        const { error } = await this.client
            .from('financial_transactions')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }

    async getStats(lawsuitId?: string, personId?: string, startDate?: string, endDate?: string): Promise<{ 
        totalCredits: number; totalDebits: number; balance: number; efficiency: number; categories: { name: string; value: number }[];
    }> {
        let query = this.client.from('financial_transactions').select('amount, entry_type, status, category');
        
        if (lawsuitId) query = query.eq('lawsuit_id', lawsuitId);
        if (personId) query = query.eq('person_id', personId);
        if (startDate) query = query.gte('transaction_date', startDate);
        if (endDate) query = query.lte('transaction_date', endDate);
        
        const { data, error } = await query;
        if (error) throw error;

        const credits = data?.filter(t => t.entry_type === 'Credit') || [];
        const totalCredits = credits.reduce((sum, t) => sum + (t.amount || 0), 0);
        const totalDebits = data?.filter(t => t.entry_type === 'Debit').reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
        
        const paidCreditsCount = credits.filter(c => c.status === 'Pago').length;
        const efficiency = credits.length > 0 ? (paidCreditsCount / credits.length) * 100 : 0;
        
        const catMap: Record<string, number> = {};
        data?.forEach(t => {
            const cat = t.category || 'Outros';
            catMap[cat] = (catMap[cat] || 0) + 1;
        });

        const sortedCats = Object.entries(catMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, value]) => ({ name, value }));

        return {
            totalCredits,
            totalDebits,
            balance: totalCredits - totalDebits,
            efficiency,
            categories: sortedCats
        };
    }
}

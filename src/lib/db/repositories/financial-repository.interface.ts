import { FinancialTransaction } from '@/types';

export interface IFinancialRepository {
    listByLawsuit(lawsuitId: string): Promise<FinancialTransaction[]>;
    listByPerson(personId: string): Promise<FinancialTransaction[]>;
    getById(id: string): Promise<FinancialTransaction | null>;
    save(transaction: Partial<FinancialTransaction>): Promise<FinancialTransaction>;
    delete(id: string): Promise<void>;
    getStats(lawsuitId?: string, personId?: string, startDate?: string, endDate?: string): Promise<{ 
        totalCredits: number; 
        totalDebits: number; 
        balance: number;
        efficiency: number;
        categories: { name: string; value: number }[];
    }>;
}

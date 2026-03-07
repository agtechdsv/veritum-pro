import { Lawsuit } from '@/types';

export interface ILawsuitRepository {
    list(searchTerm?: string): Promise<Lawsuit[]>;
    save(lawsuit: Partial<Lawsuit>): Promise<Lawsuit>;
    delete(id: string): Promise<void>;
}

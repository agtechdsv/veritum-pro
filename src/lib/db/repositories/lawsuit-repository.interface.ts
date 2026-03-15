import { Lawsuit, LawsuitDocument } from '@/types';

export interface ILawsuitRepository {
    list(searchTerm?: string): Promise<Lawsuit[]>;
    getById(id: string): Promise<Lawsuit | null>;
    save(lawsuit: Partial<Lawsuit>): Promise<Lawsuit>;
    delete(id: string): Promise<void>;

    // Documents
    listDocuments(lawsuitId: string): Promise<LawsuitDocument[]>;
    saveDocument(doc: Partial<LawsuitDocument>): Promise<LawsuitDocument>;
    deleteDocument(id: string): Promise<void>;
}

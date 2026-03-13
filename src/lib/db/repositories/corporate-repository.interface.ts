
import { CorporateEntity, Shareholder, CorporateDocument } from '@/types';

export interface ICorporateRepository {
    // Entities
    listEntities(searchTerm?: string): Promise<CorporateEntity[]>;
    getEntityById(id: string): Promise<CorporateEntity | null>;
    saveEntity(entity: Partial<CorporateEntity>): Promise<CorporateEntity>;
    deleteEntity(id: string): Promise<void>;

    // Shareholders
    listShareholders(entityId: string): Promise<Shareholder[]>;
    saveShareholder(shareholder: Partial<Shareholder>): Promise<Shareholder>;
    deleteShareholder(id: string): Promise<void>;

    // Documents
    listDocuments(entityId: string): Promise<CorporateDocument[]>;
    saveDocument(doc: Partial<CorporateDocument>): Promise<CorporateDocument>;
    deleteDocument(id: string): Promise<void>;
}

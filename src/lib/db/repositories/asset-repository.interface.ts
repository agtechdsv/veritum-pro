import { Asset } from '@/types';

export interface IAssetRepository {
    list(personId?: string, lawsuitId?: string): Promise<Asset[]>;
    getById(id: string): Promise<Asset | null>;
    save(asset: Partial<Asset>): Promise<Asset>;
    delete(id: string): Promise<void>;
}

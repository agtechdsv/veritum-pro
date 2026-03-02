
import { Credentials, UserPreferences } from '@/types';
import { DatabaseService } from '@/services/database';
import { IPersonRepository } from './person-repository.interface';
import { SupabasePersonRepository } from './supabase-person-repository';
import { DrizzlePersonRepository } from './drizzle-person-repository';

/**
 * RepositoryFactory implements the "Brain" logic.
 * It resolves the correct repository implementation based on connectivity preferences.
 */
export class RepositoryFactory {
    /**
     * Resolves the Person Repository.
     * This is the "Driver Pattern" in action.
     */
    static getPersonRepository(credentials: Credentials, preferences: UserPreferences): IPersonRepository {
        // STANDARD BYODB: Utiliza as credenciais resolvidas no servidor para obter o cliente correto
        const client = DatabaseService.getClient(credentials);
        return new SupabasePersonRepository(client);
    }
}

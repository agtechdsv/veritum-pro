
import { Credentials, UserPreferences } from '@/types';
import { DatabaseService } from '@/services/database';
import { IPersonRepository } from './person-repository.interface';
import { SupabasePersonRepository } from './supabase-person-repository';
import { DrizzlePersonRepository } from './drizzle-person-repository';
import { ILawsuitRepository } from './lawsuit-repository.interface';
import { SupabaseLawsuitRepository } from './supabase-lawsuit-repository';
import { ITaskRepository } from './task-repository.interface';
import { SupabaseTaskRepository } from './supabase-task-repository';
import { ITeamRepository } from './team-repository.interface';
import { SupabaseTeamRepository } from './supabase-team-repository';
import { IEventRepository } from './event-repository.interface';
import { SupabaseEventRepository } from './supabase-event-repository';
import { IAssetRepository } from './asset-repository.interface';
import { SupabaseAssetRepository } from './supabase-asset-repository';

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

    /**
     * Resolves the Lawsuit Repository.
     */
    static getLawsuitRepository(credentials: Credentials, preferences: UserPreferences): ILawsuitRepository {
        const client = DatabaseService.getClient(credentials);
        return new SupabaseLawsuitRepository(client);
    }

    /**
     * Resolves the Task Repository.
     */
    static getTaskRepository(credentials: Credentials, preferences: UserPreferences): ITaskRepository {
        const client = DatabaseService.getClient(credentials);
        return new SupabaseTaskRepository(client);
    }

    /**
     * Resolves the Team Repository.
     */
    static getTeamRepository(credentials: Credentials, preferences: UserPreferences): ITeamRepository {
        const client = DatabaseService.getClient(credentials);
        return new SupabaseTeamRepository(client);
    }

    /**
     * Resolves the Event Repository.
     */
    static getEventRepository(credentials: Credentials, preferences: UserPreferences): IEventRepository {
        const client = DatabaseService.getClient(credentials);
        return new SupabaseEventRepository(client);
    }
    /**
     * Resolves the Asset Repository.
     */
    static getAssetRepository(credentials: Credentials, preferences: UserPreferences): IAssetRepository {
        const client = DatabaseService.getClient(credentials);
        return new SupabaseAssetRepository(client);
    }
}

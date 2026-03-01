
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Credentials, UserPreferences } from '@/types';

/**
 * DatabaseService handles the abstraction of database connections.
 * It follows the BYODB (Bring Your Own Database) strategy, allowing
 * the application to switch between the Master database and a Client-specific database.
 */
export class DatabaseService {
    private static clients: Map<string, SupabaseClient> = new Map();

    /**
     * Gets the appropriate Supabase client for a given user.
     * If the user has custom Supabase credentials in their preferences, 
     * it returns a client connected to that specific database.
     * Otherwise, it returns the standard client.
     * 
     * @param credentials The standard application credentials (Master)
     * @param preferences The user's preferences, which might contain custom DB credentials
     */
    static getClient(credentials: Credentials, preferences?: UserPreferences): SupabaseClient {
        // If the user has both custom URL and custom Key, we use the BYODB route
        if (preferences?.custom_supabase_url && preferences?.custom_supabase_key) {
            const cacheKey = `${preferences.custom_supabase_url}-${preferences.custom_supabase_key}`;

            // Return cached client if available to prevent multiple initializations
            if (this.clients.has(cacheKey)) {
                return this.clients.get(cacheKey)!;
            }

            // Create and cache new custom client
            const customClient = createClient(
                preferences.custom_supabase_url,
                preferences.custom_supabase_key
            );
            this.clients.set(cacheKey, customClient);
            return customClient;
        }

        // Fallback to Master database
        const masterCacheKey = 'master-db';
        if (this.clients.has(masterCacheKey)) {
            return this.clients.get(masterCacheKey)!;
        }

        const masterClient = createClient(credentials.supabaseUrl, credentials.supabaseAnonKey);
        this.clients.set(masterCacheKey, masterClient);
        return masterClient;
    }
}

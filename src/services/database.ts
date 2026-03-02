
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Credentials, UserPreferences } from '@/types';

/**
 * DatabaseService handles the abstraction of database connections.
 * It follows the BYODB (Bring Your Own Database) strategy, allowing
 * the application to switch between the Master database and a Client-specific database.
 */
export class DatabaseService {
    private static clients: Map<string, SupabaseClient> = new Map();

    static getClient(credentials: Credentials): SupabaseClient {
        // Normalização p/ comparação robusta
        const normalize = (url: string | undefined) => url?.replace(/\/$/, '').toLowerCase() || '';

        const masterUrlNormalized = normalize(process.env.NEXT_PUBLIC_SUPABASE_URL);
        const masterKeyNormalized = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        const currentUrlNormalized = normalize(credentials.supabaseUrl);
        const currentKeyNormalized = credentials.supabaseAnonKey || '';

        const isCustom = currentUrlNormalized && currentKeyNormalized &&
            (currentUrlNormalized !== masterUrlNormalized || currentKeyNormalized !== masterKeyNormalized);

        if (isCustom) {
            const cacheKey = `${currentUrlNormalized}-${currentKeyNormalized}`;

            if (this.clients.has(cacheKey)) {
                return this.clients.get(cacheKey)!;
            }

            const customClient = createClient(
                credentials.supabaseUrl,
                credentials.supabaseAnonKey
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

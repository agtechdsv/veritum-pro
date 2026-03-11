import { createClient } from '@supabase/supabase-js';

export function createDynamicClient(supabaseUrl: string, supabaseKey: string) {
    // We cannot use @supabase/ssr's createBrowserClient here because it caches the singleton
    // instance based on the first URL provided (which is usually the Master DB during initial load).
    // Using raw createClient forces a fresh instance pointing to the correct Tenant DB.
    return createClient(supabaseUrl, supabaseKey);
}

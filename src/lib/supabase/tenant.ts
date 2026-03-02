import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createMasterServerClient } from './server'

/**
 * Creates a Supabase client configured to connect to the Tenant's specific database.
 * This function handles authentication against the Master DB to retrieve
 * the 'custom_supabase_url' and 'custom_supabase_key' from user_preferences.
 * 
 * If the user has not configured BYODB (or is on a trial), it currently throws an error,
 * which should be handled by the calling route or middleware.
 */
export async function createTenantServerClient() {
    const cookieStore = await cookies()

    // 1. Authenticate against the Master DB to get the current user
    const masterClient = await createMasterServerClient()
    const { data: { user }, error: userError } = await masterClient.auth.getUser()

    if (userError || !user) {
        throw new Error('Unauthorized: Could not determine current user on Master DB.')
    }

    // 2. Determine target user ID for BYODB keys (Self or Parent)
    const { data: profile } = await masterClient
        .from('users')
        .select('parent_user_id')
        .eq('id', user.id)
        .single()

    const targetUserId = profile?.parent_user_id || user.id;

    // 3. Retrieve BYODB credentials from public.tenant_configs
    const { data: config, error: configError } = await masterClient
        .from('tenant_configs')
        .select('custom_supabase_url, custom_supabase_key_encrypted')
        .eq('owner_id', targetUserId)
        .maybeSingle()

    if (configError) {
        console.error('Error fetching tenant config:', configError)
        throw new Error('Could not retrieve database configurations for this tenant.')
    }

    if (!config?.custom_supabase_url || !config?.custom_supabase_key_encrypted) {
        throw new Error('BYODB_NOT_CONFIGURED')
    }

    // 4. Decrypt credentials
    const { decrypt } = require('@/lib/security');
    const safeDecrypt = (val: string) => {
        if (!val || val.startsWith('http') || !val.includes(':')) return val;
        try { return decrypt(val); } catch (e) { return val; }
    };

    const supabaseUrl = safeDecrypt(config.custom_supabase_url);
    const supabaseKey = safeDecrypt(config.custom_supabase_key_encrypted);

    // 5. Instantiate the dynamic Tenant client using SSR
    return createServerClient(
        supabaseUrl,
        supabaseKey,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // Ignored if middleware is refreshing sessions.
                    }
                },
            },
        }
    )
}

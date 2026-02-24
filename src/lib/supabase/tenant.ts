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

    // 3. Retrieve BYODB credentials from public.user_preferences
    const { data: prefs, error: prefsError } = await masterClient
        .from('user_preferences')
        .select('custom_supabase_url, custom_supabase_key')
        .eq('user_id', targetUserId)
        .single()

    if (prefsError) {
        console.error('Error fetching tenant preferences:', prefsError)
        throw new Error('Could not retrieve database preferences for this tenant.')
    }

    if (!prefs.custom_supabase_url || !prefs.custom_supabase_key) {
        // BYODB not configured yet. 
        // TODO: Consider returning the master client as fallback for trial users,
        // or specific error codes to trigger an onboarding redirect.
        throw new Error('BYODB_NOT_CONFIGURED')
    }

    // 4. Instantiate the dynamic Tenant client using SSR
    return createServerClient(
        prefs.custom_supabase_url,
        prefs.custom_supabase_key,
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

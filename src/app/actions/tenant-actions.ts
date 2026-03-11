'use server'

import { createAdminClient } from '@/lib/supabase/admin';
import { createMasterServerClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/security';
import { Credentials } from '@/types';

/**
 * Resolves the tenant credentials for a specific user (or the current one).
 */
export async function getTenantCredentials(targetUserId?: string) {
    try {
        const supabaseMaster = await createMasterServerClient();
        const { data: { user } } = await supabaseMaster.auth.getUser();

        if (!user) return null;

        let resolvedId = user.id;

        // 1. Resolve Ownership
        if (targetUserId && targetUserId !== '') {
            resolvedId = targetUserId;
        } else {
            const { data: profile } = await supabaseMaster
                .from('users')
                .select('parent_user_id, role')
                .eq('id', user.id)
                .single();

            if (profile?.parent_user_id) {
                resolvedId = profile.parent_user_id;
            }
        }

        // 2. Fetch Tenant Config (BYODB)
        const adminSupabase = createAdminClient();
        const { data: tenantConfig } = await adminSupabase
            .from('tenant_configs')
            .select('*')
            .eq('owner_id', resolvedId)
            .maybeSingle();

        const safeDecrypt = (val: string | undefined): string | undefined => {
            if (!val) return undefined;
            if (val.startsWith('http') || val.split(':').length < 3) return val;
            try {
                return decrypt(val);
            } catch (e) {
                return undefined;
            }
        };

        const credentials: Credentials = {
            supabaseUrl: safeDecrypt(tenantConfig?.custom_supabase_url) || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            supabaseAnonKey: safeDecrypt(tenantConfig?.custom_supabase_key_encrypted) || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            geminiKey: safeDecrypt(tenantConfig?.custom_gemini_key_encrypted) || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
        };

        return credentials;
    } catch (err) {
        console.error('[TenantActions] Error resolving credentials:', err);
        return null;
    }
}

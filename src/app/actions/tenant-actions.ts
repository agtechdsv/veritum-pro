'use server'

import { createMasterServerClient } from '@/lib/supabase/server';
import { resolveTenantCredentialsByOwner } from '@/lib/tenant-credentials';
import { resolveTenantOwnerId } from '@/lib/tenant-access';

/**
 * Resolves the tenant credentials for a specific user (or the current one).
 * Acesso a tenant de outro usuario so e permitido para Master (papel lido do banco).
 */
export async function getTenantCredentials(targetUserId?: string) {
    try {
        const supabaseMaster = await createMasterServerClient();
        const { data: { user } } = await supabaseMaster.auth.getUser();

        if (!user) return null;

        const resolvedId = await resolveTenantOwnerId(user, targetUserId);

        // Fetch Tenant Config (BYODB)
        return await resolveTenantCredentialsByOwner(resolvedId);
    } catch (err) {
        console.error('[TenantActions] Error resolving credentials:', err);
        return null;
    }
}

import { createAdminClient } from '@/lib/supabase/admin';
import { decrypt } from '@/lib/security';
import { Credentials } from '@/types';

const safeDecrypt = (val: string | undefined | null): string | undefined => {
    if (!val) return undefined;
    if (val.startsWith('http') || val.split(':').length < 3) return val;
    try {
        return decrypt(val);
    } catch (e) {
        return undefined;
    }
};

/**
 * Resolve as credenciais do tenant a partir do id do dono (master), SEM depender de sessao.
 * Uso exclusivo no servidor (webhooks, jobs). Nao expor em Server Action nem devolver ao client.
 */
export async function resolveTenantCredentialsByOwner(ownerId: string): Promise<Credentials> {
    const adminSupabase = createAdminClient();
    const { data: tenantConfig } = await adminSupabase
        .from('tenant_configs')
        .select('*')
        .eq('owner_id', ownerId)
        .maybeSingle();

    return {
        supabaseUrl: safeDecrypt(tenantConfig?.custom_supabase_url) || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        supabaseAnonKey: safeDecrypt(tenantConfig?.custom_supabase_key_encrypted) || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        geminiKey: safeDecrypt(tenantConfig?.custom_gemini_key_encrypted) || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
    };
}

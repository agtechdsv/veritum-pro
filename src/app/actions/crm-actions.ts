'use server';

import { Person, UserPreferences, Credentials } from '@/types';
import { RepositoryFactory } from '@/lib/db/repositories/repository-factory';
import { createMasterServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { decrypt } from '@/lib/security';

/**
 * Helper to resolve credentials and preferences securely on the server.
 * This ensures no keys are sent from the client.
 */
async function resolveSecurityContext(targetUserId?: string) {
    const supabaseMaster = await createMasterServerClient();
    const { data: { user } } = await supabaseMaster.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    let resolvedId = user.id;

    // 1. Resolução do Proprietário do Contexto (Admin/Owner)
    // Se não for o Master selecionando outro, verificamos se o logado é Staff
    if (!targetUserId || targetUserId === user.id) {
        const { data: userProfile } = await supabaseMaster
            .from('users')
            .select('parent_user_id')
            .eq('id', user.id)
            .single();

        // Se tiver parent_user_id, o "dono" do banco é o pai (Administrador)
        if (userProfile?.parent_user_id) {
            resolvedId = userProfile.parent_user_id;
        }
    } else {
        // Se houver um targetUserId, o Master está tentando acessar dados de um cliente específico
        let isMaster = user.user_metadata?.role === 'Master';
        if (!isMaster) {
            const { data: profile } = await supabaseMaster.from('users').select('role').eq('id', user.id).single();
            isMaster = profile?.role === 'Master';
        }

        if (isMaster) {
            resolvedId = targetUserId;
        } else {
            throw new Error('Unauthorized to access other tenant data');
        }
    }

    // 2. Busca a Configuração de Tenant (BYODB)
    const adminSupabase = createAdminClient();
    const { data: tenantConfig } = await adminSupabase
        .from('tenant_configs')
        .select('*')
        .eq('owner_id', resolvedId)
        .maybeSingle();

    // Helper p/ descriptografia segura
    const safeDecrypt = (val: string | undefined, fieldName: string): string | undefined => {
        if (!val) return undefined;
        // Se já parece descriptografado (http) ou não segue o padrão iv:tag:hex, retorna original
        if (val.startsWith('http') || val.split(':').length < 3) return val;
        try {
            const decrypted = decrypt(val);
            // Validação: se descriptografou algo que não faz sentido, retorna nulo para forçar erro de config
            if (fieldName.includes('url') && !decrypted.startsWith('http')) {
                console.error(`[BYODB] Falha crítica: O campo ${fieldName} não descriptografou para uma URL válida.`);
                return undefined;
            }
            return decrypted;
        } catch (e) {
            console.error(`[BYODB] Erro de descriptografia no campo ${fieldName}. Verifique o ENCRYPTION_SECRET.`);
            return undefined;
        }
    };

    const configUrl = safeDecrypt(tenantConfig?.custom_supabase_url, 'url');
    const configKey = safeDecrypt(tenantConfig?.custom_supabase_key_encrypted, 'key');
    const configGemini = safeDecrypt(tenantConfig?.custom_gemini_key_encrypted, 'gemini');
    const configConn = safeDecrypt(tenantConfig?.db_connection_encrypted, 'connection');

    const credentials: Credentials = {
        supabaseUrl: configUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        supabaseAnonKey: configKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        geminiKey: configGemini || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
        dbConnectionString: configConn
    };

    const isUsingMaster = credentials.supabaseUrl === process.env.NEXT_PUBLIC_SUPABASE_URL;

    console.log(`[BYODB] RESOLVED:
        Logado: ${user.id} 
        Alvo: ${resolvedId} 
        Modo: ${isUsingMaster ? '⚠️ MASTER (FALLBACK)' : '✅ TENANT (BYODB)'}
        URL: ${credentials.supabaseUrl.substring(0, 30)}...`);

    const userPrefs: UserPreferences = {
        user_id: resolvedId,
        language: 'pt',
        theme: 'dark'
    };

    return { credentials, preferences: userPrefs };
}

export async function listPersons(searchTerm?: string, targetUserId?: string) {
    try {
        const { credentials, preferences } = await resolveSecurityContext(targetUserId);
        const repo = RepositoryFactory.getPersonRepository(credentials, preferences);
        const data = await repo.list(searchTerm);
        return { data, credentialsUsed: credentials.supabaseUrl, solvedId: preferences.user_id };
    } catch (error: any) {
        const errorMsg = error.message || '';
        console.error('Server Action Error (listPersons):', errorMsg);

        // Se a tabela não foi encontrada (Típico em BYODB não inicializado)
        if (errorMsg.includes("Could not find the table") || errorMsg.includes("relation \"persons\" does not exist")) {
            return {
                data: [],
                error: 'TABLE_NOT_FOUND',
                message: 'Database not initialized (Table persons missing). Please run schema scripts.'
            };
        }

        throw new Error(errorMsg || 'Error listing persons');
    }
}

export async function savePerson(person: Partial<Person>, targetUserId?: string) {
    try {
        const { credentials, preferences } = await resolveSecurityContext(targetUserId);
        const repo = RepositoryFactory.getPersonRepository(credentials, preferences);

        // Auto-inject workspace_id from the security context to guarantee data isolation
        const personWithContext = { ...person, workspace_id: preferences.user_id };

        return await repo.save(personWithContext);
    } catch (error: any) {
        console.error('Server Action Error (savePerson):', error.message);
        throw new Error(error.message || 'Error saving person');
    }
}

export async function deletePerson(id: string, targetUserId?: string) {
    try {
        const { credentials, preferences } = await resolveSecurityContext(targetUserId);
        const repo = RepositoryFactory.getPersonRepository(credentials, preferences);
        return await repo.delete(id);
    } catch (error: any) {
        console.error('Server Action Error (deletePerson):', error.message);
        throw new Error(error.message || 'Error deleting person');
    }
}

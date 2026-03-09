'use server';

import { Lawsuit, Task, Credentials, UserPreferences } from '@/types';
import { RepositoryFactory } from '@/lib/db/repositories/repository-factory';
import { createMasterServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { decrypt } from '@/lib/security';
import { DatabaseService } from '@/services/database';

/**
 * Securesly resolves credentials for the target user (tenant)
 */
async function resolveSecurityContext(targetUserId?: string) {
    const supabaseMaster = await createMasterServerClient();
    const { data: { user } } = await supabaseMaster.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    let resolvedId = user.id;

    if (!targetUserId || targetUserId === user.id) {
        const { data: userProfile } = await supabaseMaster
            .from('users')
            .select('parent_user_id')
            .eq('id', user.id)
            .single();

        if (userProfile?.parent_user_id) {
            resolvedId = userProfile.parent_user_id;
        }
    } else {
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

    const adminSupabase = createAdminClient();
    const { data: tenantConfig } = await adminSupabase
        .from('tenant_configs')
        .select('*')
        .eq('owner_id', resolvedId)
        .maybeSingle();

    const safeDecrypt = (val: string | undefined, fieldName: string): string | undefined => {
        if (!val) return undefined;
        if (val.startsWith('http') || val.split(':').length < 3) return val;
        try {
            return decrypt(val);
        } catch (e) {
            console.error(`[BYODB] Decryption error in ${fieldName}`);
            return undefined;
        }
    };

    const credentials: Credentials = {
        supabaseUrl: safeDecrypt(tenantConfig?.custom_supabase_url, 'url') || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        supabaseAnonKey: safeDecrypt(tenantConfig?.custom_supabase_key_encrypted, 'key') || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        geminiKey: safeDecrypt(tenantConfig?.custom_gemini_key_encrypted, 'gemini') || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
        dbConnectionString: safeDecrypt(tenantConfig?.db_connection_encrypted, 'connection')
    };

    const userPrefs: UserPreferences = {
        user_id: resolvedId,
        language: 'pt',
        theme: 'dark'
    };

    return { credentials, preferences: userPrefs };
}

/* Lawsuits Actions */
export async function listLawsuits(searchTerm?: string, targetUserId?: string) {
    try {
        const { credentials, preferences } = await resolveSecurityContext(targetUserId);
        const repo = RepositoryFactory.getLawsuitRepository(credentials, preferences);
        const data = await repo.list(searchTerm);
        return { data, credentialsUsed: credentials.supabaseUrl, solvedId: preferences.user_id };
    } catch (error: any) {
        const errorMsg = error.message || '';
        console.error('Server Action Error (listLawsuits):', errorMsg);
        if (errorMsg.includes("Could not find the table") || errorMsg.includes("relation \"lawsuits\" does not exist")) {
            return {
                data: [],
                error: 'TABLE_NOT_FOUND',
                message: 'Database not initialized (Table lawsuits missing).'
            };
        }
        throw error;
    }
}

export async function saveLawsuit(lawsuit: Partial<Lawsuit>, targetUserId?: string) {
    try {
        const { credentials, preferences } = await resolveSecurityContext(targetUserId);
        const repo = RepositoryFactory.getLawsuitRepository(credentials, preferences);
        return await repo.save(lawsuit);
    } catch (error: any) {
        console.error('Server Action Error (saveLawsuit):', error.message);
        throw error;
    }
}

export async function deleteLawsuit(id: string, targetUserId?: string) {
    try {
        const { credentials, preferences } = await resolveSecurityContext(targetUserId);
        const repo = RepositoryFactory.getLawsuitRepository(credentials, preferences);
        return await repo.delete(id);
    } catch (error: any) {
        console.error('Server Action Error (deleteLawsuit):', error.message);
        throw error;
    }
}

/* Tasks Actions */
export async function listTasks(searchTerm?: string, targetUserId?: string) {
    try {
        const { credentials, preferences } = await resolveSecurityContext(targetUserId);
        const repo = RepositoryFactory.getTaskRepository(credentials, preferences);
        const data = await repo.list(searchTerm);
        return { data, credentialsUsed: credentials.supabaseUrl, solvedId: preferences.user_id };
    } catch (error: any) {
        const errorMsg = error.message || '';
        console.error('Server Action Error (listTasks):', errorMsg);
        if (errorMsg.includes("Could not find the table") || errorMsg.includes("relation \"tasks\" does not exist")) {
            return {
                data: [],
                error: 'TABLE_NOT_FOUND',
                message: 'Database not initialized (Table tasks missing).'
            };
        }
        throw error;
    }
}

export async function saveTask(task: Partial<Task>, targetUserId?: string) {
    try {
        const { credentials, preferences } = await resolveSecurityContext(targetUserId);
        const repo = RepositoryFactory.getTaskRepository(credentials, preferences);
        return await repo.save(task);
    } catch (error: any) {
        console.error('Server Action Error (saveTask):', error.message);
        throw error;
    }
}

export async function deleteTask(id: string, targetUserId?: string) {
    try {
        const { credentials, preferences } = await resolveSecurityContext(targetUserId);
        const repo = RepositoryFactory.getTaskRepository(credentials, preferences);
        return await repo.delete(id);
    } catch (error: any) {
        console.error('Server Action Error (deleteTask):', error.message);
        throw error;
    }
}
export async function listTeam(targetUserId?: string) {
    try {
        const { credentials, preferences } = await resolveSecurityContext(targetUserId);
        const repo = RepositoryFactory.getTeamRepository(credentials, preferences);
        const data = await repo.list();
        return { data };
    } catch (error: any) {
        const errorMsg = error.message || '';
        console.error('Server Action Error (listTeam):', errorMsg);
        if (errorMsg.includes("Could not find the table") || errorMsg.includes("relation \"team_members\" does not exist")) {
            return {
                data: [],
                error: 'TABLE_NOT_FOUND',
                message: 'Database not initialized (Table team_members missing).'
            };
        }
    }
}

const UF_TO_ID: Record<string, number> = {
    'AC': 12, 'AL': 27, 'AP': 16, 'AM': 13, 'BA': 29, 'CE': 23, 'DF': 53, 'ES': 32, 'GO': 52, 'MA': 21,
    'MT': 51, 'MS': 50, 'MG': 31, 'PA': 15, 'PB': 25, 'PR': 41, 'PE': 26, 'PI': 22, 'RJ': 33, 'RN': 24,
    'RS': 43, 'RO': 11, 'RR': 14, 'SC': 42, 'SP': 35, 'SE': 28, 'TO': 17
};

export async function getCitiesByState(uf: string) {
    const stateId = UF_TO_ID[uf.toUpperCase()];
    // Try initials first, then numeric ID as fallback
    const targets = [uf, stateId].filter(Boolean);

    for (const target of targets) {
        console.log(`[ServerAction] Fetching cities for: ${target}`);
        try {
            const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${target}/municipios`, {
                headers: { 'Accept': 'application/json' },
                next: { revalidate: 86400 } // Cache for 24 hours
            });

            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    const result = data.map((c: any) => c.nome.toUpperCase()).sort();
                    console.log(`[ServerAction] Success for ${target}: found ${result.length} cities`);
                    return result;
                }
            } else {
                console.warn(`[ServerAction] IBGE returned ${res.status} for target ${target}`);
            }
        } catch (err) {
            console.error(`[ServerAction] Fetch error for ${target}:`, err);
        }
    }
    return [];
}

'use server';

import { TeamMember, Credentials, UserPreferences } from '@/types';
import { RepositoryFactory } from '@/lib/db/repositories/repository-factory';
import { createMasterServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { decrypt } from '@/lib/security';
import { revalidatePath } from 'next/cache';

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
        // Se for Master, verifica se ele realmente é Master antes de permitir o acesso ao tenant de outro usuário
        const { data: profile } = await supabaseMaster.from('users').select('role').eq('id', user.id).single();
        const isMaster = profile?.role === 'Master' || user.user_metadata?.role === 'Master';

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

    // REGRA DE NEGÓCIO: Se não houver configuração de banco customizada (BYODB), 
    // não permitimos o acesso a dados de equipe (retorna erro/vazio)
    if (!tenantConfig || (!tenantConfig.custom_supabase_url && !tenantConfig.db_connection_encrypted)) {
        throw new Error('BYODB_NOT_CONFIGURED');
    }

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

export async function listTeamMembers(targetUserId?: string) {
    try {
        const { credentials, preferences } = await resolveSecurityContext(targetUserId);
        const repo = RepositoryFactory.getTeamRepository(credentials, preferences);
        const data = await repo.list(preferences.user_id);
        return { success: true, data };
    } catch (error: any) {
        if (error.message === 'BYODB_NOT_CONFIGURED') {
            return { success: true, data: [] }; // Retorna vazio conforme regra de negócio
        }
        console.error('Server Action Error (listTeamMembers):', error.message);
        return { success: false, error: error.message };
    }
}

export async function saveTeamMember(member: Partial<TeamMember>, targetUserId?: string) {
    try {
        const { credentials, preferences } = await resolveSecurityContext(targetUserId);
        const repo = RepositoryFactory.getTeamRepository(credentials, preferences);

        let result;
        if (member.id) {
            result = await repo.update(member.id, member);
        } else {
            // Tenta salvar com workspace_id, mas se falhar por coluna inexistente, tenta sem ela
            try {
                // @ts-ignore
                result = await repo.create({ ...member, workspace_id: preferences.user_id } as any);
            } catch (err: any) {
                if (err.code === '42703') { // Column does not exist
                    // @ts-ignore
                    result = await repo.create(member);
                } else {
                    throw err;
                }
            }
        }

        revalidatePath('/veritumpro/users');
        return { success: true, data: result };
    } catch (error: any) {
        console.error('Server Action Error (saveTeamMember):', error.message);
        return { success: false, error: error.message };
    }
}

export async function deleteTeamMember(id: string, targetUserId?: string) {
    try {
        const { credentials, preferences } = await resolveSecurityContext(targetUserId);
        const repo = RepositoryFactory.getTeamRepository(credentials, preferences);
        await repo.delete(id);
        revalidatePath('/veritumpro/users');
        return { success: true };
    } catch (error: any) {
        console.error('Server Action Error (deleteTeamMember):', error.message);
        return { success: false, error: error.message };
    }
}

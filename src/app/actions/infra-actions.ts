
'use server';

import { createMasterServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { TenantConfig, DbProvider } from '@/types';
import { encrypt, decrypt } from '@/lib/security';
import { revalidatePath } from 'next/cache';

const SENSITIVE_FIELDS = ['db_connection_encrypted', 'custom_supabase_url', 'custom_supabase_key_encrypted', 'custom_gemini_key_encrypted'];

function decryptConfig(config: any): any {
    if (!config) return config;
    const decrypted = { ...config };

    // Tentamos descriptografar campos que possam estar criptografados
    SENSITIVE_FIELDS.forEach(field => {
        const val = decrypted[field];
        if (val && val.includes(':') && !val.startsWith('http')) {
            try {
                decrypted[field] = decrypt(val);
            } catch (e) {
                console.error(`Falha ao descriptografar campo ${field}:`, e);
            }
        }
    });

    return decrypted;
}

export async function getTenantConfig() {
    const supabase = await createMasterServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    const { data, error } = await supabase
        .from('tenant_configs')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

    if (error) throw error;

    return decryptConfig(data) as TenantConfig;
}

export async function getTenantConfigByUserId(userId: string) {
    const supabase = await createMasterServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    // Verificamos se é Master
    let isMaster = user.user_metadata.role === 'Master';
    if (!isMaster) {
        const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
        isMaster = profile?.role === 'Master';
    }

    // Se não for Master e tentar ver dado de outro, bloqueia aqui no código
    if (!isMaster && user.id !== userId) {
        throw new Error('Unauthorized');
    }

    // Se for Master ou o próprio dono, usamos o adminClient para garantir que passamos pela RLS
    // Caso seja Master visualizando um cliente
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
        .from('tenant_configs')
        .select('*')
        .eq('owner_id', userId)
        .maybeSingle();

    if (error) throw error;

    return decryptConfig(data) as TenantConfig;
}

export async function saveTenantConfig(formData: Partial<TenantConfig>) {
    const supabase = await createMasterServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    // Verificamos se é Master
    let isMaster = user.user_metadata.role === 'Master';
    if (!isMaster) {
        const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
        isMaster = profile?.role === 'Master';
    }

    // Apenas Master pode salvar para um owner_id diferente do dele
    let targetOwnerId = user.id;
    if (formData.owner_id && user.id !== formData.owner_id) {
        if (isMaster) {
            targetOwnerId = formData.owner_id;
        } else {
            throw new Error('Unauthorized to manage other users config');
        }
    }

    // Construímos o payload de forma segura
    const payload: any = {
        owner_id: targetOwnerId,
        db_provider: formData.db_provider || 'supabase',
        migration_mode: formData.migration_mode || 'auto',
        is_active: true
    };

    // Criptografamos campos sensíveis antes de salvar
    if (formData.custom_supabase_url) {
        payload.custom_supabase_url = encrypt(formData.custom_supabase_url);
    }

    if (formData.db_connection_encrypted) {
        payload.db_connection_encrypted = encrypt(formData.db_connection_encrypted);
    }

    if (formData.custom_supabase_key_encrypted) {
        payload.custom_supabase_key_encrypted = encrypt(formData.custom_supabase_key_encrypted);
    }

    if (formData.custom_gemini_key_encrypted) {
        payload.custom_gemini_key_encrypted = encrypt(formData.custom_gemini_key_encrypted);
    }

    // Usamos o adminSupabase para o upsert para ignorar a RLS restritiva
    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
        .from('tenant_configs')
        .upsert(payload, { onConflict: 'owner_id' });

    if (error) throw error;

    revalidatePath('/veritumpro');
    return { success: true };
}

export async function deleteTenantConfig(userId: string) {
    const supabase = await createMasterServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    let isMaster = user.user_metadata.role === 'Master';
    if (!isMaster) {
        const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
        isMaster = profile?.role === 'Master';
    }

    if (!isMaster && user.id !== userId) {
        throw new Error('Unauthorized to delete other users config');
    }

    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
        .from('tenant_configs')
        .delete()
        .eq('owner_id', userId);

    if (error) throw error;

    revalidatePath('/veritumpro');
    return { success: true };
}


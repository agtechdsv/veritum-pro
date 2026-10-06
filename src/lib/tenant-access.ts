import type { User } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Autorizacao de acesso a dados de tenant.
 *
 * IMPORTANTE: o papel (role) vem SEMPRE da tabela public.users, nunca de user.user_metadata.
 * O user_metadata e gravavel pelo proprio usuario (auth.updateUser) e nao pode ser usado para autorizar.
 * `user` deve ser o resultado de supabase.auth.getUser() (verificado no servidor).
 */
export async function resolveTenantOwnerId(user: User, targetUserId?: string | null): Promise<string> {
    const admin = createAdminClient();
    const { data: profile } = await admin
        .from('users')
        .select('role, parent_user_id')
        .eq('id', user.id)
        .maybeSingle();

    const ownerId = profile?.parent_user_id || user.id;

    // Sem alvo (ou alvo = o proprio usuario): o tenant e o do dono da conta.
    if (!targetUserId || targetUserId === user.id) return ownerId;

    // Funcionario apontando para o proprio escritorio.
    if (targetUserId === ownerId) return ownerId;

    // Somente Master pode acessar o tenant de outro cliente.
    if (profile?.role === 'Master') return targetUserId;

    throw new Error('Unauthorized to access other tenant data');
}

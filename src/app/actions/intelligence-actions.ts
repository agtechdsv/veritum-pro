'use server';

import { createMasterServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { decrypt } from '@/lib/security';
import { DatabaseService } from '@/services/database';
import { Credentials, UserPreferences, GoldenAlert, Clipping, KnowledgeArticle } from '@/types';

/**
 * Helper to resolve credentials and preferences securely on the server.
 * This ensures no keys are sent from the client.
 */
async function resolveSecurityContext(targetUserId?: string) {
    const supabaseMaster = await createMasterServerClient();
    const { data: { user } } = await supabaseMaster.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    const { data: userProfile } = await supabaseMaster
        .from('users')
        .select('parent_user_id')
        .eq('id', user.id)
        .maybeSingle();

    let resolvedId = user.id;

    if (!targetUserId || targetUserId === user.id) {
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

/**
 * Fetches Golden Alerts using current session security context
 */
export async function listGoldenAlerts(options: { 
    status?: string, 
    limit?: number, 
    targetUserId?: string,
    orderBy?: 'created_at' | 'match_score' | 'priority'
} = {}) {
    try {
        const { credentials } = await resolveSecurityContext(options.targetUserId);
        const supabase = DatabaseService.getClient(credentials);

        let query = supabase
            .from('golden_alerts')
            .select('*, clipping:clippings(*), knowledge:knowledge_articles(*)')

        if (options.status && options.status !== 'all') {
            query = query.eq('status', options.status);
        }

        if (options.orderBy === 'created_at') {
            query = query.order('created_at', { ascending: false });
        } else {
            // Default smart ordering as per user requirement
            query = query.order('priority', { ascending: true }) // High, medium, low
                         .order('match_score', { ascending: false });
        }

        if (options.limit) {
            query = query.limit(options.limit);
        }

        const { data, error } = await query;

        if (error) {
            console.warn('Golden Alerts table may not be initialized:', error.message);
            return { data: [], error: error.code };
        }
        
        return { data: data as (GoldenAlert & { clipping?: Clipping, knowledge?: KnowledgeArticle })[] };
    } catch (error: any) {
        console.error('Server Action Error (listGoldenAlerts):', error);
        throw error;
    }
}

/**
 * Updates status of a Golden Alert
 */
export async function updateGoldenAlertStatus(alertId: string, status: 'unread' | 'dismissed' | 'actioned', targetUserId?: string) {
    try {
        const { credentials } = await resolveSecurityContext(targetUserId);
        const supabase = DatabaseService.getClient(credentials);

        const { data, error } = await supabase
            .from('golden_alerts')
            .update({ status })
            .eq('id', alertId)
            .select();

        if (error) throw error;
        return { data };
    } catch (error: any) {
        console.error('Server Action Error (updateGoldenAlertStatus):', error);
        throw error;
    }
}

/**
 * Converts a Golden Alert into a concrete Task in Nexus
 */
export async function convertGoldenAlertToTask(alertId: string, targetUserId?: string) {
    try {
        const { credentials, preferences } = await resolveSecurityContext(targetUserId);
        const supabase = DatabaseService.getClient(credentials);

        // 1. Get the alert with its matched knowledge and clipping
        const { data: alert, error: alertError } = await supabase
            .from('golden_alerts')
            .select('*, clipping:clippings(*), knowledge:knowledge_articles(*)')
            .eq('id', alertId)
            .single();

        if (alertError || !alert) throw new Error('Alert not found');

        // 2. Prepare Task data
        let typeLabel = alert.intelligence_type === 'Risk' ? 'Risco' : 'Oportunidade';
        let taskTitle = `Estratégia: ${typeLabel}`;
        
        if (alert.knowledge?.title) {
            taskTitle += ` - ${alert.knowledge.title}`;
        }

        const taskDescription = `
[GERADO VIA CÉREBRO SENTINEL PRO]
----------------------------------
🎯 OBJETIVO: ${alert.intelligence_type === 'Risk' ? 'Mitigar Risco Crítico' : 'Explorar Oportunidade de Êxito'}
📖 TESE MATCH: ${alert.knowledge?.title || 'Análise de Texto'}

🧠 RACIOCÍNIO IA: 
"${alert.reasoning}"

📝 RECORTE ORIGINAL:
"${alert.clipping?.content?.substring(0, 800)}..."

AÇÃO SUGERIDA: Validar a tese jurídica e preparar manifestação/petição conforme o recorte acima.
        `.trim();

        const priorityMap: any = { 'High': 'Alta', 'Medium': 'Média', 'Low': 'Baixa' };
        let taskPriority = priorityMap[alert.priority || 'Medium'] || 'Média';
        
        // If it's a Risk and High priority, promote to 'Urgente'
        if (alert.intelligence_type === 'Risk' && alert.priority === 'High') {
            taskPriority = 'Urgente';
        }
        
        // 3. Insert Task
        const { data: task, error: taskError } = await supabase
            .from('tasks')
            .insert({
                title: taskTitle.substring(0, 100), // Safety limit
                description: taskDescription,
                lawsuit_id: alert.matched_lawsuit_id,
                responsible_id: preferences.user_id, // Assign to the current user
                status: 'A Fazer',
                priority: taskPriority,
                due_date: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days lead time
            })
            .select()
            .single();

        if (taskError) throw taskError;

        // 4. Update Alert status to 'actioned'
        await supabase
            .from('golden_alerts')
            .update({ status: 'actioned' })
            .eq('id', alertId);

        return { data: task };
    } catch (error: any) {
        console.error('Server Action Error (convertGoldenAlertToTask):', error);
        throw error;
    }
}

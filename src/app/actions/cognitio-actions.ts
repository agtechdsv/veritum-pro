'use server'

import { createMasterServerClient } from '@/lib/supabase/server';
import { DatabaseService } from '@/services/database';
import { decrypt } from '@/lib/security';
import { Credentials, KnowledgeArticle } from '@/types';
import { GeminiService } from '@/services/gemini';

/**
 * Resolves the appropriate database credentials and user context
 * for server-side operations, ensuring BYODB security.
 */
async function resolveSecurityContext(targetUserId?: string) {
    const supabaseMaster = await createMasterServerClient();
    const { data: { user }, error: authError } = await supabaseMaster.auth.getUser();

    // FALLBACK PARA DESENVOLVIMENTO
    if (!user) {
        if (process.env.NODE_ENV === 'development') {
            const mockCreds: Credentials = {
                supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
                supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
                geminiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''
            };
            return { credentials: mockCreds, effectiveUserId: targetUserId || 'dev-user-demo' };
        }
        throw new Error('Unauthorized');
    }

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
        const { data: profile } = await supabaseMaster.from('users').select('role').eq('id', user.id).single();
        const isMaster = profile?.role === 'Master';

        if (isMaster) {
            resolvedId = targetUserId;
        } else {
            throw new Error('Unauthorized');
        }
    }

    const { data: tenantConfig } = await supabaseMaster
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
    };

    return { credentials, effectiveUserId: resolvedId };
}

/**
 * Upserts a knowledge article and automatically generates its vector embedding using AI.
 */
export async function upsertKnowledgeArticle(article: Partial<KnowledgeArticle>, targetUserId?: string) {
    try {
        const { credentials, effectiveUserId } = await resolveSecurityContext(targetUserId);
        const client = await DatabaseService.getClient(credentials);
        const gemini = new GeminiService(credentials.geminiKey);

        // 1. Generate Embedding if content changed or it's a new article
        let embedding = null;
        if (article.content) {
            try {
                embedding = await gemini.generateEmbedding(article.content);
            } catch (err) {
                console.error('[Cognitio Action] Embedding generation failed:', err);
            }
        }

        // 2. Prepare Data
        const articleData = {
            ...article,
            embedding: embedding || (article as any).embedding // Keep old if AI fails
        };

        // 3. Upsert into database
        const { data, error } = await client
            .from('knowledge_articles')
            .upsert([articleData])
            .select()
            .single();

        if (error) throw error;
        return { success: true, data: data as KnowledgeArticle };
    } catch (error: any) {
        console.error('[Cognitio Action] upsertKnowledgeArticle error:', error.message);
        return { success: false, error: error.message };
    }
}

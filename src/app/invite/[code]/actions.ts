'use server';

import { createClient } from '@supabase/supabase-js';

// Setup admin client bypassing RLS just for reading the name of the referrer securely
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getReferrerName(code: string): Promise<string | null> {
    if (!code) return null;

    try {
        const { data, error } = await supabaseAdmin
            .from('users')
            .select('name')
            .ilike('vip_code', code)
            .maybeSingle();

        if (error || !data) {
            return null;
        }

        return data.name;

    } catch (e) {
        console.error('Error fetching referrer for VIP link:', e);
        return null;
    }
}

import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
s.from('plans').select('id, name, is_active').eq('name', 'Trial 14 Dias').single().then(async res => {
    if (res.data) {
        console.log('Trial plan id:', res.data.id);
        const p = await s.from('plan_permissions').select('*').eq('plan_id', res.data.id);
        console.log('Perms count:', p.data ? p.data.length : 'error');
    }
});

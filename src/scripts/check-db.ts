import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkTable() {
    try {
        const { data, error } = await supabase
            .from('asaas_sub_accounts')
            .select('count')
            .limit(1);

        if (error && error.code === '42P01') {
            console.log('--- DATABASE STATUS ---');
            console.log('❌ MISSING: asaas_sub_accounts table.');
            console.log('------------------------');
        } else {
            console.log('--- DATABASE STATUS ---');
            console.log('✅ READY: asaas_sub_accounts table exists.');
            console.log('------------------------');
        }
    } catch (err) {
        console.error('Error connecting to Supabase:', err);
    }
}

checkTable();

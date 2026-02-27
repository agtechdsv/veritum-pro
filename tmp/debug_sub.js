const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://rmcjxcxmzsinkjnolfek.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtY2p4Y3htenNpbmtqbm9sZmVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ5NTE5NywiZXhwIjoyMDg3MDcxMTk3fQ.B6F0yJACPZEQcyaSGqcRn65HHVxgTm9Q1cty2DP5R64';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function check() {
    const userId = 'c6cf35d2-d40d-4d58-b042-a89492c68b98';
    console.log('--- USER DATA ---');
    const { data: user } = await supabase.from('users').select('id, plan_id, plan_name').eq('id', userId).single();
    console.log('User Plan ID in table "users":', user?.plan_id);

    console.log('--- ALL SUBSCRIPTIONS FOR THIS USER ---');
    const { data: subs, error: sErr } = await supabase.from('user_subscriptions').select('*').eq('user_id', userId);
    if (sErr) console.error(sErr);
    else console.log('Subscriptions:', JSON.stringify(subs, null, 2));
}

check();

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://rmcjxcxmzsinkjnolfek.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtY2p4Y3htenNpbmtqbm9sZmVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ5NTE5NywiZXhwIjoyMDg3MDcxMTk3fQ.B6F0yJACPZEQcyaSGqcRn65HHVxgTm9Q1cty2DP5R64';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function check() {
    const userId = 'c6cf35d2-d40d-4d58-b042-a89492c68b98';

    console.log('--- USER DATA ---');
    const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
    console.log('User:', JSON.stringify(user, null, 2));

    console.log('--- USER SUBSCRIPTIONS ---');
    const { data: subs } = await supabase.from('user_subscriptions').select('*').eq('user_id', userId);
    console.log('Subscriptions:', JSON.stringify(subs, null, 2));

    console.log('--- ATTEMPTING UPSERT AS IN WEBHOOK ---');
    const planId = '949b4b4c-ce51-4599-ae87-adf1b1dfb21d'; // Plano de Integração ID from prev run
    const { error: upsertErr } = await supabase
        .from("user_subscriptions")
        .upsert({
            user_id: userId,
            plan_id: planId,
            status: "active",
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString(),
        }, { onConflict: "user_id, plan_id" });

    if (upsertErr) console.error('UPSERT ERROR:', JSON.stringify(upsertErr, null, 2));
    else console.log('UPSERT SUCCESS');
}

check();

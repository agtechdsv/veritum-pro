import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = 'https://rmcjxcxmzsinkjnolfek.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtY2p4Y3htenNpbmtqbm9sZmVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ5NTE5NywiZXhwIjoyMDg3MDcxMTk3fQ.B6F0yJACPZEQcyaSGqcRn65HHVxgTm9Q1cty2DP5R64';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function check() {
    const userId = 'c6cf35d2-d40d-4d58-b042-a89492c68b98';

    console.log('--- USER DATA ---');
    const { data: user, error: userErr } = await supabase.from('users').select('*').eq('id', userId).single();
    console.log('User:', JSON.stringify(user, null, 2));

    console.log('\n--- PLANS ---');
    const { data: plans } = await supabase.from('plans').select('id, name');
    console.log('Plans:', JSON.stringify(plans, null, 2));

    console.log('\n--- PAYMENTS ---');
    const { data: payments } = await supabase.from('payments').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1);
    console.log('Latest Payment:', JSON.stringify(payments, null, 2));

    console.log('\n--- SUBSCRIPTIONS ---');
    const { data: subs } = await supabase.from('user_subscriptions').select('*').eq('user_id', userId);
    console.log('Subscriptions:', JSON.stringify(subs, null, 2));
}

check();

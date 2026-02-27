const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://rmcjxcxmzsinkjnolfek.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtY2p4Y3htenNpbmtqbm9sZmVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ5NTE5NywiZXhwIjoyMDg3MDcxMTk3fQ.B6F0yJACPZEQcyaSGqcRn65HHVxgTm9Q1cty2DP5R64';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function check() {
    const { data: constraints, error: cErr } = await supabase.rpc('get_constraints', { t_name: 'user_subscriptions' });
    // Since I can't easily use RPC unless it's defined, I'll just try to read the data

    const { data: subs, error: sErr } = await supabase.from('user_subscriptions').select('*').limit(5);
    console.log('Subs sample:', JSON.stringify(subs, null, 2));
}

check();

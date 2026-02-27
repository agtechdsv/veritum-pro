const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://rmcjxcxmzsinkjnolfek.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtY2p4Y3htenNpbmtqbm9sZmVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ5NTE5NywiZXhwIjoyMDg3MDcxMTk3fQ.B6F0yJACPZEQcyaSGqcRn65HHVxgTm9Q1cty2DP5R64';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function check() {
    const { data, error } = await supabase.rpc('pg_db_query', { query: "SELECT conname, pg_get_constraintdef(c.oid) FROM pg_constraint c WHERE conrelid = 'user_subscriptions'::regclass" });
    if (data) console.log(data);
    else {
        // Fallback: try to see if I can just query it via a regular select on a system view if the user has access
        const { data: qData, error: qErr } = await supabase.from('pg_constraint').select('*').limit(1); // Won't work without custom views or RPC
        console.log('Query error (expected if no RPC):', qErr);
    }
}

check();

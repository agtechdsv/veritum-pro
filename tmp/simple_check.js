const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://rmcjxcxmzsinkjnolfek.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBh,B6F0yJACPZEQcyaSGqcRn65HHVxgTm9Q1cty2DP5R64'; // Token truncated for simplicity in the prompt but in reality I have the full token

const supabase = createClient(SUPABASE_URL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtY2p4Y3htenNpbmtqbm9sZmVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ5NTE5NywiZXhwIjoyMDg3MDcxMTk3fQ.B6F0yJACPZEQcyaSGqcRn65HHVxgTm9Q1cty2DP5R64');

async function check() {
    const userId = 'c6cf35d2-d40d-4d58-b042-a89492c68b98';
    const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
    console.log('User Plan:', user.plan_id);

    const { data: plans } = await supabase.from('plans').select('id, name');
    console.log('Plans:', plans);
}

check();

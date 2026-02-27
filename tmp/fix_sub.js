const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://rmcjxcxmzsinkjnolfek.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtY2p4Y3htenNpbmtqbm9sZmVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ5NTE5NywiZXhwIjoyMDg3MDcxMTk3fQ.B6F0yJACPZEQcyaSGqcRn65HHVxgTm9Q1cty2DP5R64';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function fix() {
    const userId = 'c6cf35d2-d40d-4d58-b042-a89492c68b98';
    const planId = '5b8c202d-12d3-4cc9-926b-3759fe342346'; // Plano de Integração

    console.log('--- FIXING SUBSCRIPTION ---');
    const { error: upsertErr } = await supabase
        .from("user_subscriptions")
        .upsert({
            user_id: userId,
            plan_id: planId,
            status: "active",
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

    if (upsertErr) {
        console.error('FIX FAILED:', upsertErr);
        // Try single ID if onConflict failed?
        const { data: current } = await supabase.from('user_subscriptions').select('id').eq('user_id', userId).single();
        if (current) {
            await supabase.from('user_subscriptions').update({ plan_id: planId }).eq('id', current.id);
            console.log('Update by ID worked!');
        }
    } else {
        console.log('FIX SUCCESSFUL');
    }
}

fix();

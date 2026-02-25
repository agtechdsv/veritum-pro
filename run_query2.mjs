import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://rmcjxcxmzsinkjnolfek.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtY2p4Y3htenNpbmtqbm9sZmVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ5NTE5NywiZXhwIjoyMDg3MDcxMTk3fQ.B6F0yJACPZEQcyaSGqcRn65HHVxgTm9Q1cty2DP5R64');

async function checkNames() {
    const { data: mGroups } = await supabase.from('access_groups').select('name, name_loc, admin_id').eq('admin_id', 'c3b6d81d-73e3-46ad-bfd5-ed6f880ee304');
    console.log("Master Groups:");
    mGroups.forEach(g => console.log(g.name, "=>", g.name_loc.en));

    const { data: sGroups } = await supabase.from('access_groups').select('name, name_loc, admin_id').eq('admin_id', 'f4281209-8a42-47f9-a968-108a86cb043f');
    console.log("\nSocio Groups:");
    sGroups.forEach(g => console.log(g.name, "=>", g.name_loc.en));
}
checkNames();

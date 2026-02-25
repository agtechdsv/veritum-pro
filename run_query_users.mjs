import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://rmcjxcxmzsinkjnolfek.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtY2p4Y3htenNpbmtqbm9sZmVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ5NTE5NywiZXhwIjoyMDg3MDcxMTk3fQ.B6F0yJACPZEQcyaSGqcRn65HHVxgTm9Q1cty2DP5R64');

async function checkUsers() {
    const { data: users } = await supabase.from('users').select('id, name, role, parent_user_id');
    console.log(users);
}
checkUsers();

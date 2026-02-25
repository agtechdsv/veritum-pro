import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://rmcjxcxmzsinkjnolfek.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtY2p4Y3htenNpbmtqbm9sZmVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ5NTE5NywiZXhwIjoyMDg3MDcxMTk3fQ.B6F0yJACPZEQcyaSGqcRn65HHVxgTm9Q1cty2DP5R64');

async function run() {
    console.log('Fetching suites...');
    const { data: suites } = await supabase.from('suites').select('*');
    if (suites && suites.length > 0) {
        console.log('Suites sample 0 short_desc:', suites[0].short_desc, ' | Type:', typeof suites[0].short_desc);
    }

    console.log('Fetching roles...');
    const { data: roles } = await supabase.from('roles').select('*');
    if (roles && roles.length > 0) {
        console.log('Roles sample 0 name_loc:', roles[0].name_loc, ' | Type:', typeof roles[0].name_loc);
    }

    console.log('Fetching access_groups...');
    const { data: groups } = await supabase.from('access_groups').select('*');
    if (groups && groups.length > 0) {
        console.log('Groups sample 0 name_loc:', groups[0].name_loc, ' | Type:', typeof groups[0].name_loc);
    }
}
run();

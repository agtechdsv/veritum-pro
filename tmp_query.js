const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Fetching suites...');
    const { data: suites } = await supabase.from('suites').select('*');
    if (suites && suites.length > 0) {
        console.log('Suites sample:', typeof suites[0].short_desc, suites[0].short_desc);
    }

    console.log('Fetching roles...');
    const { data: roles } = await supabase.from('roles').select('*');
    if (roles && roles.length > 0) {
        console.log('Roles sample:', typeof roles[0].name_loc, roles[0].name_loc);
    }

    console.log('Fetching access_groups...');
    const { data: groups } = await supabase.from('access_groups').select('*');
    if (groups && groups.length > 0) {
        console.log('Groups sample:', typeof groups[0].name_loc, groups[0].name_loc);
    }
}
run();

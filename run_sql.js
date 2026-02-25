const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf-8');
const getEnv = (key) => env.split('\n').find(l => l.startsWith(key))?.split('=')[1]?.trim();

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseServiceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
    const sql = `
    ALTER TABLE access_groups ADD COLUMN IF NOT EXISTS name_loc jsonb;
    UPDATE access_groups SET name_loc = json_build_object('pt', name, 'en', name, 'es', name) WHERE name_loc IS NULL;

    ALTER TABLE roles ADD COLUMN IF NOT EXISTS name_loc jsonb;
    UPDATE roles SET name_loc = json_build_object('pt', name, 'en', name, 'es', name) WHERE name_loc IS NULL;
  `;

    const { error } = await supabase.rpc('run_sql', { sql });
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Success');
    }
}
run();

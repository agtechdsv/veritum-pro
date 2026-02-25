const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8');
const getEnv = (key) => env.split('\n').find(l => l.startsWith(key))?.split('=')[1]?.trim();

const url = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const key = getEnv('SUPABASE_SERVICE_ROLE_KEY');

const sql = `
ALTER TABLE access_groups ADD COLUMN IF NOT EXISTS name_loc jsonb;
UPDATE access_groups SET name_loc = json_build_object('pt', name, 'en', name, 'es', name) WHERE name_loc IS NULL;

ALTER TABLE roles ADD COLUMN IF NOT EXISTS name_loc jsonb;
UPDATE roles SET name_loc = json_build_object('pt', name, 'en', name, 'es', name) WHERE name_loc IS NULL;
`;

fetch(url + '/rest/v1/rpc/run_sql', {
    method: 'POST',
    headers: {
        'apikey': key,
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sql })
}).then(res => res.text()).then(console.log).catch(console.error);

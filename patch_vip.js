const { createClient } = require('@supabase/supabase-js');

const sql = `
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS vip_active BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS vip_points INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS vip_code TEXT;

-- Let's also update the auth views if they need it? No, public.users is enough.
`;

fetch(process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/', {
    method: 'POST',
    headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
}).then(async r => {
    console.log(r.status, await r.text());
}).catch(console.error);

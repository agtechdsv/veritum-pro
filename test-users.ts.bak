import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data, error } = await supabase.from('users').select('id, name, role, parent_user_id, access_group_id').order('created_at', { ascending: false }).limit(5);
    console.log('Last 5 users:', data);
    if (error) console.error('Error:', error);
}

check();


import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { decrypt } from './src/lib/security';

dotenv.config({ path: '.env.local' });

async function diagnose() {
    const masterUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const masterKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!masterUrl || !masterKey) {
        console.error('Master credentials missing');
        return;
    }

    const masterSupabase = createClient(masterUrl, masterKey);

    // 1. Get Tenant Configs
    const { data: configs, error: configErr } = await masterSupabase.from('tenant_configs').select('*');
    if (configErr) {
        console.error('Error fetching configs:', configErr);
        return;
    }

    console.log(`Found ${configs?.length} tenant configs.`);

    for (const config of configs || []) {
        console.log(`--- Checking Tenant Owner: ${config.owner_id} ---`);
        
        const url = decrypt(config.custom_supabase_url);
        const key = decrypt(config.custom_supabase_key_encrypted);

        if (!url || !key) {
            console.warn('Could not decrypt tenant credentials for', config.owner_id);
            continue;
        }

        console.log('Tenant URL:', url);
        
        try {
            const tenantSupabase = createClient(url, key);
            const { data: buckets, error: bucketErr } = await tenantSupabase.storage.listBuckets();
            
            if (bucketErr) {
                console.error('  Error listing buckets:', bucketErr.message);
            } else {
                console.log('  Buckets:', buckets.map(b => b.name).join(', '));
                const hasNexus = buckets.some(b => b.name === 'nexus-documents');
                if (!hasNexus) {
                    console.error('  CRITICAL: nexus-documents bucket NOT FOUND!');
                } else {
                    const nexusBucket = buckets.find(b => b.name === 'nexus-documents');
                    console.log(`  nexus-documents found (Public: ${nexusBucket?.public})`);
                }
            }
        } catch (err: any) {
            console.error('  Exception checking tenant:', err.message);
        }
    }
}

diagnose();

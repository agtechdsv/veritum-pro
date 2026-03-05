const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf-8').split('\n').filter(Boolean).map(l => {
    const parts = l.split('=');
    return [parts[0].trim(), parts.slice(1).join('=').trim()];
}));

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log("Looking for Trial Plan...");
    const { data: trialPlan } = await supabase
        .from('plans')
        .select('id')
        .ilike('name->>pt', '%Trial%')
        .limit(1)
        .single();

    if (!trialPlan) {
        console.error("Trial plan not found!");
        return;
    }

    const trialId = trialPlan.id;
    console.log("Trial Plan ID:", trialId);

    const userEmail = 'alexandregms@gmail.com';

    // 1. Find the user ID
    const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('email', userEmail)
        .single();

    if (!user) {
        console.error("User not found!");
        return;
    }

    console.log("Fixing user:", user.id);

    // 2. Update user table
    const { error: userError } = await supabase
        .from('users')
        .update({
            plan_id: trialId,
            role: 'Sócio Administrador'
        })
        .eq('id', user.id);

    if (userError) console.error("Error updating user:", userError);
    else console.log("User table updated.");

    // 3. Create/Update subscription
    const { error: subError } = await supabase
        .from('user_subscriptions')
        .upsert({
            user_id: user.id,
            plan_id: trialId,
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active',
            is_trial: true
        });

    if (subError) console.error("Error updating subscription:", subError);
    else console.log("Subscription updated.");

    // 4. Update Auth metadata
    const { error: authError } = await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
            role: 'Sócio Administrador',
            plan_id: trialId
        }
    });

    if (authError) console.error("Error updating auth metadata:", authError);
    else console.log("Auth metadata updated.");
}

run();

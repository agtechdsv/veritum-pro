const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
s.from('payments').select('*').order('created_at', { ascending: false }).limit(2).then(r => {
    r.data.forEach(p => {
        console.log("Payment ID:", p.id);
        console.log("Status:", p.status);
        console.log("ExternalRef:", p.external_reference);
        if (p.webhook_payload) {
            console.log("Webhook Event:", p.webhook_payload.event);
        } else {
            console.log("No webhook payload");
        }
    });
});
s.from('users').select('id, name, plan_id, email').order('created_at', { ascending: false }).limit(1).then(r => {
    console.log("Latest User:", r.data[0]);
});
s.from('plans').select('id, name').then(r => {
    console.log("Plans mapped by id:", r.data.map(p => ({ id: p.id, name: p.name })));
});

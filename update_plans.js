const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data: plans } = await supabase.from('plans').select('*');

    for (const plan of plans) {
        if (plan.name && plan.name.pt) {
            if (plan.name.pt.includes('Plano START') || plan.name.pt.includes('START Plan') || plan.name.pt.includes('Plan START')) {
                console.log('Updating START');
                await supabase.from('plans').update({ name: { pt: 'START', en: 'START', es: 'START' } }).eq('id', plan.id);
            }
            if (plan.name.pt.includes('Plano GROWTH') || plan.name.pt.includes('GROWTH Plan') || plan.name.pt.includes('Plan GROWTH')) {
                console.log('Updating GROWTH');
                await supabase.from('plans').update({ name: { pt: 'GROWTH', en: 'GROWTH', es: 'GROWTH' } }).eq('id', plan.id);
            }
            if (plan.name.pt.includes('Plano STRATEGY') || plan.name.pt.includes('STRATEGY Plan') || plan.name.pt.includes('Plan STRATEGY')) {
                console.log('Updating STRATEGY');
                await supabase.from('plans').update({ name: { pt: 'STRATEGY', en: 'STRATEGY', es: 'STRATEGY' } }).eq('id', plan.id);
            }
        }
    }
    console.log('Update finished');
}

run();

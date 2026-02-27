const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTable() {
    const { data, error } = await supabase
        .from('asaas_sub_accounts')
        .select('*')
        .limit(1);

    if (error && error.code === 'PGRST116') {
        console.log('✅ Tabela asaas_sub_accounts existe (ou está vazia).');
    } else if (error && error.code === '42P01') {
        console.log('❌ Tabela asaas_sub_accounts NÃO existe.');
        console.log('Por favor, execute o SQL no final_master_schema.sql no console do Supabase.');
    } else if (error) {
        console.log('Log error:', error);
    } else {
        console.log('✅ Tabela asaas_sub_accounts existe.');
    }
}

checkTable();

import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://rmcjxcxmzsinkjnolfek.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtY2p4Y3htenNpbmtqbm9sZmVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ5NTE5NywiZXhwIjoyMDg3MDcxMTk3fQ.B6F0yJACPZEQcyaSGqcRn65HHVxgTm9Q1cty2DP5R64');

async function fixSocioGroups() {
    const socioId = 'f4281209-8a42-47f9-a968-108a86cb043f';
    const { data: sGroups } = await supabase.from('access_groups').select('id, name, name_loc').eq('admin_id', socioId);

    // Quick manual translations for Sócio groups:
    const translations = {
        "Sócio-Administrador": { en: "Partner Administrator", es: "Socio Administrador" },
        "Advogado Sênior / Coordenador": { en: "Senior Lawyer / Coordinator", es: "Abogado Senior / Coordinador" },
        "Departamento Financeiro / Faturamento": { en: "Financial Department / Billing", es: "Departamento Financiero / Facturación" },
        "Advogado Pleno / Júnior": { en: "Mid-level / Junior Lawyer", es: "Abogado Pleno / Junior" },
        "Secretariado / Recepção": { en: "Secretariat / Reception", es: "Secretariado / Recepción" },
        "Controladoria Jurídica (Legal Ops)": { en: "Legal Controlling (Legal Ops)", es: "Controladoría Jurídica (Legal Ops)" },
        "Estagiário": { en: "Intern", es: "Pasante" },
        "Paralegal": { en: "Paralegal", es: "Paralegal" },
        "Representante Legal (Empresa)": { en: "Legal Representative (Company)", es: "Representante Legal (Empresa)" },
        "Assistente Jurídico": { en: "Legal Assistant", es: "Asistente Jurídico" },
        "Cliente Corporativo (B2B)": { en: "Corporate Client (B2B)", es: "Cliente Corporativo (B2B)" },
        "Cliente (Acesso Externo B2B2C)": { en: "Client (External Access B2B2C)", es: "Cliente (Acceso Externo B2B2C)" }
    };

    for (const g of sGroups) {
        if (translations[g.name]) {
            const newLoc = {
                pt: g.name,
                en: translations[g.name].en,
                es: translations[g.name].es
            };
            await supabase.from('access_groups').update({ name_loc: newLoc }).eq('id', g.id);
            console.log(`Updated group ${g.name}`);
        }
    }
}

fixSocioGroups();

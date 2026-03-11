
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function run() {
    const envPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) {
        console.error('.env.local not found');
        process.exit(1);
    }

    const env = fs.readFileSync(envPath, 'utf-8');
    const getEnv = (key) => {
        const line = env.split('\n').find(l => l.trim().startsWith(key + '='));
        return line ? line.split('=')[1]?.trim().replace(/^['"]|['"]$/g, '') : null;
    };

    const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
    const supabaseServiceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('--- Applying Template Feature Schema & Seed ---');

    const sql = `
    -- 1. Create table if not exists or update it
    CREATE TABLE IF NOT EXISTS public.document_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      category TEXT,
      content TEXT NOT NULL,
      base_prompt TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      deleted_at TIMESTAMPTZ
    );

    -- Ensure content column exists (if table was created before)
    DO $$ 
    BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='document_templates' AND column_name='content') THEN
            ALTER TABLE public.document_templates ADD COLUMN content TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='document_templates' AND column_name='updated_at') THEN
            ALTER TABLE public.document_templates ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        END IF;
    END $$;

    -- 2. Trigger
    CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS tr_doc_templates_upd ON public.document_templates;
    CREATE TRIGGER tr_doc_templates_upd BEFORE UPDATE ON public.document_templates FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

    -- 3. RLS
    ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Tenant Session: Full Access" ON public.document_templates;
    CREATE POLICY "Tenant Session: Full Access" ON public.document_templates FOR ALL USING (TRUE);

    -- 4. Seed (using original IDs or not, let's just insert checking title)
    -- We delete existing standard ones to avoid duplicates if re-running
    DELETE FROM public.document_templates WHERE category IN ('Judicial', 'Contratos', 'Compliance', 'Administrativo', 'Acordos', 'Notificações');

    INSERT INTO public.document_templates (title, category, content) VALUES
    ('Procuração Ad Judicia', 'Judicial', '# PROCURAÇÃO AD JUDICIA\\n\\n**OUTORGANTE:** {{nome_cliente}}, {{nacionalidade}}, {{estado_civil}}, {{profissao}}, portador(a) do RG nº {{rg}} e inscrito(a) no CPF sob o nº {{cpf}}, residente e domiciliado(a) em {{endereco_completo}}.\\n\\n**OUTORGADOS:** {{nome_advogado}}, inscrito na OAB/{{oab_uf}} sob o nº {{oab_number}}, com escritório profissional em {{cidade_escritorio}}.\\n\\n**PODERES:** Por este instrumento particular de procuração, o outorgante nomeia e constitui os outorgados seus procuradores, conferindo-lhes os poderes da cláusula ad judicia et extra, para o foro em geral, podendo propor ações, contestar, transigir, desistir, firmar acordos, receber e dar quitação, e praticar todos os demais atos necessários ao bom e fiel desempenho deste mandato.\\n\\n{{cidade_escritorio}}, {{data_hoje}}.\\n\\n\\n__________________________________________\\n**{{nome_cliente}}**'),
    ('Contrato de Honorários Advocatícios', 'Contratos', '# CONTRATO DE PRESTAÇÃO DE SERVIÇOS JURÍDICOS E HONORÁRIOS\\n\\n**CONTRATANTE:** {{nome_cliente}}, CPF {{cpf}}, residente em {{endereco_completo}}.\\n\\n**CONTRATADO:** {{nome_advogado}}, OAB/{{oab_number}}, com sede em {{cidade_escritorio}}.\\n\\n**OBJETO:** O presente contrato tem como objeto a prestação de serviços jurídicos consistentes em: [DESCREVER OBJETO DA AÇÃO].\\n\\n**HONORÁRIOS:** Pelos serviços prestados, o CONTRATANTE pagará ao CONTRATADO o valor de [VALOR], na forma de [FORMA DE PAGAMENTO].\\n\\n**CLÁUSULA QUARTA:** No caso de êxito na demanda, incidirão honorários de sucumbência conforme legislação vigente.\\n\\n{{cidade_escritorio}}, {{data_hoje}}.\\n\\n\\n__________________________________________\\n**{{nome_cliente}}**\\n\\n__________________________________________\\n**{{nome_advogado}}**'),
    ('Termo de Consentimento LGPD', 'Compliance', '# TERMO DE CONSENTIMENTO - LGPD\\n\\nEu, {{nome_cliente}}, inscrito(a) no CPF sob o nº {{cpf}}, autorizo expressamente o escritório {{nome_escritorio}} a realizar o tratamento de meus dados pessoais para fins exclusivos de prestação de serviços jurídicos, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).\\n\\nOs dados serão armazenados de forma segura e utilizados apenas para as finalidades do processo judicial/administrativo sob responsabilidade do contratado.\\n\\n{{cidade_escritorio}}, {{data_hoje}}.\\n\\n\\n__________________________________________\\n**{{nome_cliente}}**'),
    ('Ficha Cadastral de Cliente', 'Administrativo', '# FICHA CADASTRAL DO CLIENTE\\n\\n**DADOS PESSOAIS:**\\n- **Nome:** {{nome_cliente}}\\n- **CPF:** {{cpf}}\\n- **RG:** {{rg}}\\n- **Nacionalidade:** {{nacionalidade}}\\n- **Estado Civil:** {{estado_civil}}\\n- **Profissão:** {{profissao}}\\n\\n**CONTATO:**\\n- **Endereço:** {{endereco_completo}}\\n- **E-mail:** {{email_cliente}}\\n- **Telefone:** {{telefone_cliente}}\\n\\n**OBSERVAÇÕES:**\\n[CAMPO LIVRE PARA ANOTAÇÕES DO ADVOGADO]\\n\\nData de Cadastro: {{data_hoje}}'),
    ('Declaração de Hipossuficiência', 'Judicial', '# DECLARAÇÃO DE HIPOSSUFICIÊNCIA ECONÔMICA\\n\\nEu, {{nome_cliente}}, portador(a) do RG nº {{rg}} e do CPF nº {{cpf}}, declaro para os devidos fins de direito, sob as penas da lei, que não possuo condições financeiras de arcar com as custas processuais e honorários advocatícios sem prejuízo do meu próprio sustento e de minha família.\\n\\nPor tal razão, pleiteio os benefícios da Gratuidade da Justiça, nos termos do art. 98 e seguintes do Código de Processo Civil.\\n\\n{{cidade_escritorio}}, {{data_hoje}}.\\n\\n\\n__________________________________________\\n**{{nome_cliente}}**'),
    ('Requerimento Administrativo', 'Administrativo', 'À ILUSTRÍSSIMA GERÊNCIA DO [NOME DO ÓRGÃO]\\n\\n**ASSUNTO:** Requerimento de [DESCREVER ASSUNTO]\\n\\n{{nome_cliente}}, CPF {{cpf}}, por intermédio de seu advogado {{nome_advogado}}, OAB {{oab_number}}, vem respeitosamente à presença de Vossa Senhoria requerer o quanto segue:\\n\\n[TEXTO DO REQUERIMENTO]\\n\\nTermos em que, pede deferimento.\\n\\n{{cidade_escritorio}}, {{data_hoje}}.'),
    ('Termo de Acordo Extrajudicial', 'Acordos', '# TERMO DE ACORDO EXTRAJUDICIAL\\n\\n**PARTE A:** {{nome_cliente}}, CPF {{cpf}}.\\n**PARTE B:** [NOME DA PARTE CONTRÁRIA], CPF/CNPJ [DOCUMENTO].\\n\\nAs partes acima qualificadas resolvem, de comum acordo, encerrar a controvérsia referente a [OBJETO DO ACORDO], mediante as seguintes condições:\\n\\n1. A PARTE B pagará à PARTE A a quantia de R$ [VALOR].\\n2. O pagamento será efetuado em [DATA/FORMA].\\n3. Com o cumprimento integral, as partes dão mútua e plena quitação.\\n\\n{{cidade_escritorio}}, {{data_hoje}}.\\n\\n\\n__________________________________________\\n**{{nome_cliente}}**'),
    ('Notificação Extrajudicial', 'Notificações', '# NOTIFICAÇÃO EXTRAJUDICIAL\\n\\n**NOTIFICANTE:** {{nome_cliente}}, CPF {{cpf}}.\\n**NOTIFICADO:** [NOME DO NOTIFICADO], [ENDEREÇO].\\n\\nPrezado(a),\\n\\nNa qualidade de advogado(a) de {{nome_cliente}}, venho através desta NOTIFICÁ-LO(A) formalmente sobre [ASSUNTO DA NOTIFICAÇÃO].\\n\\nSolicitamos a regularização da situação no prazo de [PRAZO] dias, sob pena de adoção das medidas judiciais cabíveis.\\n\\n{{cidade_escritorio}}, {{data_hoje}}.\\n\\nAtenciosamente,\\n\\n{{nome_advogado}}\\nOAB/{{oab_number}}');
    `;

    try {
        const { data, error } = await supabase.rpc('run_sql', { sql });
        if (error) {
            console.error('Error applying SQL:', error);
        } else {
            console.log('Successfully applied template schema and seed.');
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

run();

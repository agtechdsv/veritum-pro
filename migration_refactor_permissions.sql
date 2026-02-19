-- 1. Create features table
CREATE TABLE IF NOT EXISTS public.features (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_key text UNIQUE NOT NULL,
    suite_id uuid NOT NULL REFERENCES public.suites(id) ON DELETE CASCADE,
    display_name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now()
);

-- 2. Enable RLS for features
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public: Select Features" ON public.features
FOR SELECT USING (true);

CREATE POLICY "Master: Full CRUD Features" ON public.features
FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Master');

-- 3. Modify plan_permissions to be a junction table
DROP TABLE IF EXISTS public.plan_permissions;

CREATE TABLE public.plan_permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
    feature_id uuid NOT NULL REFERENCES public.features(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(plan_id, feature_id)
);

-- 4. Enable RLS for plan_permissions
ALTER TABLE public.plan_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public: Select Plan Permissions" ON public.plan_permissions
FOR SELECT USING (true);

CREATE POLICY "Master: Full CRUD Plan Permissions" ON public.plan_permissions
FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Master');

-- 5. Seed initial features
WITH suite_ids AS (
    SELECT id, suite_key FROM public.suites
)
INSERT INTO public.features (feature_key, suite_id, display_name, description)
SELECT 
    f.f_key, 
    s.id, 
    f.f_name, 
    f.f_description
FROM (VALUES
    -- NEXUS PRO (Gestão)
    ('nexus', 'nexus_gestao_prazos', 'Gestão de Processos e Prazos', 'Kanban, agenda e controle de prazos processuais.'),
    ('nexus', 'nexus_workflows', 'Workflows Avançados', 'Automação de fluxos de trabalho e delegação inteligente de tarefas.'),
    ('nexus', 'nexus_gestao_ativos', 'Gestão de Ativos e Bens', 'Controle de garantias, imóveis e frotas em litígio.'),
    ('nexus', 'nexus_controle_societario', 'Controle Societário', 'Gestão do ciclo de vida de contratos não-financeiros.'),
    
    -- SENTINEL PRO (Vigilância)
    ('sentinel', 'sentinel_diarios', 'Monitoramento de Diários', 'Varredura automática de publicações em Diários Oficiais e de Justiça.'),
    ('sentinel', 'sentinel_captura_antecipada', 'Captura Antecipada', 'Monitoramento de distribuição de novas ações antes da citação oficial.'),
    ('sentinel', 'sentinel_clipping_midia', 'Clipping Inteligente', 'Monitoramento de marcas, empresas e sócios em jornais e portais de notícias.'),
    ('sentinel', 'sentinel_analise_sentimento', 'Análise de Sentimento (IA)', 'Classificação automática de risco em notícias e andamentos processuais.'),
    
    -- SCRIPTOR PRO (Documental)
    ('scriptor', 'scriptor_ged', 'Repositório de Documentos (GED)', 'Armazenamento seguro em nuvem e versionamento de arquivos.'),
    ('scriptor', 'scriptor_gerador_ia', 'Gerador de Peças (IA)', 'Redação automatizada de contratos e petições via inteligência artificial.'),
    ('scriptor', 'scriptor_auditoria_risco', 'Auditoria de Risco (IA)', 'Análise de documentos para identificação automática de cláusulas abusivas.'),
    ('scriptor', 'scriptor_assinatura', 'Assinatura Digital', 'Envio e controle de assinaturas de documentos com validade jurídica.'),
    
    -- VALOREM PRO (Financeiro)
    ('valorem', 'valorem_financeiro', 'Gestão Financeira', 'Controle de honorários, contas a pagar/receber e fluxo de caixa.'),
    ('valorem', 'valorem_boletos_pix', 'Emissão de Boletos e PIX', 'Geração de cobranças integradas com baixa automática para os clientes.'),
    ('valorem', 'valorem_pjecalc', 'Integração PJe-Calc e Atualizações', 'Importação e leitura de cálculos trabalhistas e atualização monetária.'),
    ('valorem', 'valorem_provisionamento', 'Relatórios de Contingência', 'Cálculo de provisão e valores retidos em garantia para diretoria.'),
    
    -- COGNITIO PRO (Jurimetria)
    ('cognitio', 'cognitio_dashboards', 'Dashboards Analíticos', 'Gráficos gerais de produtividade, volume processual e financeiro.'),
    ('cognitio', 'cognitio_preditiva', 'Análise Preditiva (IA)', 'Previsão de êxito e desfechos judiciais baseada em dados históricos.'),
    ('cognitio', 'cognitio_magistrados', 'Perfil de Magistrados', 'Mapeamento comportamental e taxa de condenações de juízes e varas.'),
    
    -- VOX CLIENTIS (Comunicação)
    ('vox', 'vox_portal', 'Portal do Cliente', 'Acesso seguro e exclusivo para o cliente acompanhar seus próprios processos.'),
    ('vox', 'vox_traducao_ia', 'Tradução de Juridiquês (IA)', 'Tradução automática de andamentos complexos para linguagem acessível.'),
    ('vox', 'vox_whatsapp', 'Automação de WhatsApp', 'Envio ativo de alertas de audiências e atualizações diretamente no celular.')
) AS f(suite_key, f_key, f_name, f_description)
JOIN suite_ids s ON s.suite_key = f.suite_key
ON CONFLICT (feature_key) DO NOTHING;

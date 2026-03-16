-- ============================================================================
-- VERITUM PRO: FINAL CLIENT SCHEMA (TENANT / BYODB / PRIVATE CLOUD)
-- ============================================================================
-- Banco de Dados do Cliente da Veritum Pro.
-- Responsável por: Processos, Tarefas, Inteligência, IA e Dados Operacionais.

-- ============================================================================
-- 0. RESET NUCLEAR (LIMPEZA TOTAL DO SCHEMA PUBLIC PRIVACIVO)
-- ============================================================================
-- ATENÇÃO: Os comandos abaixo apagam ABSOLUTAMENTE TUDO no schema public do Tenant.

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Restaura Permissões do Supabase (Essencial para funcionamento no DB Privado)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;

-- ============================================================================
-- 1. INFRAESTRUTURA & EXTENSÕES
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "vector" SCHEMA public; -- Habilita IA / Semantic Search

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função de Busca Semântica (Embeddings)
CREATE OR REPLACE FUNCTION public.match_knowledge (
  query_embedding vector(768),
  match_threshold float,
  match_count int
) RETURNS table ( id uuid, title text, content text, category text, similarity float ) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY SELECT ka.id, ka.title, ka.content, ka.category, 1 - (ka.embedding <=> query_embedding) as similarity
  FROM public.knowledge_articles ka
  WHERE 1 - (ka.embedding <=> query_embedding) > match_threshold 
  ORDER BY ka.embedding <=> query_embedding 
  LIMIT match_count;
END;
$$;

-- ============================================================================
-- 2. MEMBROS DA EQUIPE (EQUIPE LOCAL DO CLIENTE)
-- ============================================================================
-- Membros da Equipe (Configuração Local do Cliente - Ex: Estagiários, Secretárias)
-- Obs: Se "Acesso ao Sistema" for liberado, o ID será o mesmo do auth.users (Master)
CREATE TABLE public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    cpf TEXT UNIQUE,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT,
    specialty TEXT,
    oab_number TEXT,
    oab_uf TEXT,
    city TEXT,
    state TEXT,
    pix_key TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- 3. MÓDULOS CORE - NEXUS PRO (CRM & OPERACIONAL)
-- ============================================================================
CREATE TABLE public.persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_type TEXT CHECK (person_type IN ('Cliente', 'Reclamado', 'Testemunha', 'Preposto', 'Advogado Adverso')),
  full_name TEXT NOT NULL,
  document TEXT UNIQUE NOT NULL, -- CPF ou CNPJ
  email TEXT,
  phone TEXT,
  rg TEXT,
  ctps TEXT,
  pis TEXT,
  legal_data JSONB, 
  address JSONB,
  workspace_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.lawsuits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cnj_number TEXT UNIQUE NOT NULL,
  case_title TEXT,
  author_id UUID REFERENCES public.persons(id),
  defendant_id UUID REFERENCES public.persons(id),
  responsible_lawyer_id UUID REFERENCES public.team_members(id),
  status TEXT CHECK (status IN ('Ativo', 'Suspenso', 'Arquivado', 'Encerrado')),
  sphere TEXT, court TEXT, chamber TEXT, rito TEXT, city TEXT, state TEXT,
  value NUMERIC(15, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  lawsuit_id UUID REFERENCES public.lawsuits(id) ON DELETE CASCADE,
  responsible_id UUID REFERENCES public.team_members(id),
  status TEXT CHECK (status IN ('A Fazer', 'Em Andamento', 'Concluído', 'Atrasado')) DEFAULT 'A Fazer',
  priority TEXT CHECK (priority IN ('Baixa', 'Média', 'Alta', 'Urgente')) DEFAULT 'Média',
  due_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT CHECK (event_type IN ('Audiência', 'Reunião', 'Despacho', 'Diligência', 'Outro')) DEFAULT 'Outro',
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT,
  meeting_url TEXT,
  lawsuit_id UUID REFERENCES public.lawsuits(id) ON DELETE CASCADE,
  responsible_id UUID REFERENCES public.team_members(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lawsuit_id UUID REFERENCES public.lawsuits(id) ON DELETE CASCADE,
  original_text TEXT,
  translated_text TEXT,        -- Tradução de Juridiquês (Vox Clientis)
  sentiment_score FLOAT,
  source TEXT DEFAULT 'Manual',
  is_notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- 4. SENTINEL PRO (MONITORAMENTO)
-- ============================================================================
CREATE TABLE public.monitoring_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.team_members(id),
  title TEXT NOT NULL,
  term TEXT NOT NULL,
  alert_type TEXT CHECK (alert_type IN ('OAB', 'CNJ', 'Keyword', 'Company', 'Person')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.clippings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES public.monitoring_alerts(id) ON DELETE CASCADE,
  source TEXT,
  content TEXT NOT NULL,
  sentiment TEXT CHECK (sentiment IN ('Positivo', 'Negativo', 'Neutro')),
  score FLOAT,
  url TEXT,
  lawsuit_id UUID REFERENCES public.lawsuits(id) ON DELETE SET NULL,
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  embedding vector(768)
);

-- ============================================================================
-- 5. VOX CLIENTIS (COMUNICAÇÃO)
-- ============================================================================
CREATE TABLE public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID REFERENCES public.persons(id) ON DELETE CASCADE,
  lawsuit_id UUID REFERENCES public.lawsuits(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'Ativo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id UUID,                     -- Referência opcional (IA ou cliente externo)
  sender_type TEXT CHECK (sender_type IN ('Lawyer', 'Client', 'AI')) DEFAULT 'Lawyer',
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- 6. SCRIPTOR PRO (DOCUMENTOS & IA)
-- ============================================================================
CREATE TABLE public.document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL UNIQUE,
  category TEXT,
  content TEXT NOT NULL,      -- Modelo em HTML/Markdown
  base_prompt TEXT,           -- Instruções para IA (Caminho C)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  document_type TEXT,
  file_url TEXT,
  event_date DATE,
  notes TEXT,
  lawsuit_id UUID REFERENCES public.lawsuits(id) ON DELETE SET NULL,
  author_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
  template_id UUID REFERENCES public.document_templates(id) ON DELETE SET NULL,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.document_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lawsuit_id UUID REFERENCES public.lawsuits(id) ON DELETE CASCADE,
  filename TEXT,
  content TEXT,
  embedding vector(768),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_doc_embeddings_vector ON public.document_embeddings USING hnsw (embedding vector_cosine_ops);

-- ============================================================================
-- 7. VALOREM PRO (FINANCEIRO)
-- ============================================================================
CREATE TABLE public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.team_members(id),
  title TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  entry_type TEXT CHECK (entry_type IN ('Credit', 'Debit')),
  category TEXT,
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  lawsuit_id UUID REFERENCES public.lawsuits(id) ON DELETE SET NULL,
  person_id UUID REFERENCES public.persons(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('Pago', 'Pendente', 'Cancelado')) DEFAULT 'Pendente',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. INTELIGÊNCIA & IA (COGNITIO)
-- ============================================================================
CREATE TABLE public.knowledge_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    tags TEXT[],
    embedding vector(768),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_knowledge_embedding ON public.knowledge_articles USING hnsw (embedding vector_cosine_ops);

CREATE TABLE public.historical_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    judge_name TEXT,
    court TEXT,
    case_type TEXT,
    outcome TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.golden_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clipping_id UUID NOT NULL REFERENCES public.clippings(id) ON DELETE CASCADE,
    matched_knowledge_id UUID REFERENCES public.knowledge_articles(id) ON DELETE SET NULL,
    matched_lawsuit_id UUID REFERENCES public.lawsuits(id) ON DELETE SET NULL,
    match_score FLOAT NOT NULL,
    intelligence_type TEXT CHECK (intelligence_type IN ('Opportunity', 'Risk', 'Similar Success')),
    priority TEXT CHECK (priority IN ('High', 'Medium', 'Low')) DEFAULT 'Medium',
    reasoning TEXT,
    status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'dismissed', 'actioned')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 9. TRIGGERS, REALTIME & SEGURANÇA (RLS)
-- ============================================================================

-- Triggers de Auditoria
CREATE TRIGGER tr_team_upd BEFORE UPDATE ON public.team_members FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_persons_upd BEFORE UPDATE ON public.persons FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_law_upd BEFORE UPDATE ON public.lawsuits FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_task_upd BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_event_upd BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_alerts_upd BEFORE UPDATE ON public.monitoring_alerts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_fin_upd BEFORE UPDATE ON public.financial_transactions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_kb_upd BEFORE UPDATE ON public.knowledge_articles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_golden_upd BEFORE UPDATE ON public.golden_alerts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_legal_docs_upd BEFORE UPDATE ON public.legal_documents FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_chats_upd BEFORE UPDATE ON public.chats FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_doc_templates_upd BEFORE UPDATE ON public.document_templates FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Habilitar RLS em tudo
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lawsuits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clippings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.golden_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historical_outcomes ENABLE ROW LEVEL SECURITY;

-- Política Global para BYODB: Todos do escritório acessam tudo
CREATE POLICY "Tenant Session: Full Access" ON public.team_members FOR ALL USING (TRUE);
CREATE POLICY "Tenant Session: Full Access" ON public.persons FOR ALL USING (TRUE);
CREATE POLICY "Tenant Session: Full Access" ON public.lawsuits FOR ALL USING (TRUE);
CREATE POLICY "Tenant Session: Full Access" ON public.tasks FOR ALL USING (TRUE);
CREATE POLICY "Tenant Session: Full Access" ON public.events FOR ALL USING (TRUE);
CREATE POLICY "Tenant Session: Full Access" ON public.movements FOR ALL USING (TRUE);
CREATE POLICY "Tenant Session: Full Access" ON public.monitoring_alerts FOR ALL USING (TRUE);
CREATE POLICY "Tenant Session: Full Access" ON public.clippings FOR ALL USING (TRUE);
CREATE POLICY "Tenant Session: Full Access" ON public.financial_transactions FOR ALL USING (TRUE);
CREATE POLICY "Tenant Session: Full Access" ON public.knowledge_articles FOR ALL USING (TRUE);
CREATE POLICY "Tenant Session: Full Access" ON public.golden_alerts FOR ALL USING (TRUE);
CREATE POLICY "Tenant Session: Full Access" ON public.chats FOR ALL USING (TRUE);
CREATE POLICY "Tenant Session: Full Access" ON public.chat_messages FOR ALL USING (TRUE);
CREATE POLICY "Tenant Session: Full Access" ON public.document_templates FOR ALL USING (TRUE);
CREATE POLICY "Tenant Session: Full Access" ON public.legal_documents FOR ALL USING (TRUE);
CREATE POLICY "Tenant Session: Full Access" ON public.document_embeddings FOR ALL USING (TRUE);
CREATE POLICY "Tenant Session: Full Access" ON public.historical_outcomes FOR ALL USING (TRUE);

-- CONFIGURAÇÃO DE REALTIME (TABELAS QUE PRECISAM DE ATUALIZAÇÃO AO VIVO)
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE 
    public.tasks, 
    public.events,
    public.lawsuits, 
    public.financial_transactions, 
    public.golden_alerts,
    public.monitoring_alerts,
    public.movements,
    public.chat_messages,
    public.team_members,
    public.persons,
    public.assets,
    public.corporate_entities;


-- ----------------------------------------------------------------------------
-- 9. ASSETS (ATIVOS)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    asset_type TEXT NOT NULL CHECK (asset_type IN ('Imóvel', 'Veículo', 'Conta Bancária', 'Ação Judicial', 'Empresa / Quotas', 'Outros')),
    value NUMERIC DEFAULT 0,
    registration_number TEXT,
    person_id UUID REFERENCES public.persons(id) ON DELETE SET NULL,
    lawsuit_id UUID REFERENCES public.lawsuits(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Bloqueado', 'Vendido', 'Em Garantia', 'Alienado')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.asset_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    document_type TEXT,
    file_url TEXT,
    event_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER tr_assets_upd BEFORE UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_asset_docs_upd BEFORE UPDATE ON public.asset_documents FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant Session: Full Access" ON public.assets FOR ALL USING (true); -- Master/Admin controlled via Repository or session

ALTER TABLE public.asset_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant Session: Full Access" ON public.asset_documents FOR ALL USING (true);

-- realtime
ALTER PUBLICATION supabase_realtime ADD TABLE 
    public.assets, 
    public.asset_documents;

-- ----------------------------------------------------------------------------
-- 10. MÓDULO CORPORATE / SOCIETÁRIO (GOVERNANÇA & ESTRUTURAS)
-- ----------------------------------------------------------------------------

-- Entidades Jurídicas (Empresas do Grupo Econômico do Cliente)
CREATE TABLE public.corporate_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legal_name TEXT NOT NULL,          -- Razão Social
    trading_name TEXT,                 -- Nome Fantasia
    cnpj TEXT UNIQUE,                  -- CNPJ
    state_registration TEXT,           -- Inscrição Estadual
    municipal_registration TEXT,        -- Inscrição Municipal
    foundation_date DATE,
    entity_type TEXT CHECK (entity_type IN ('LTDA', 'SA', 'EIRELI', 'MEI', 'Holding', 'Associação', 'Outros')) DEFAULT 'LTDA',
    status TEXT CHECK (status IN ('Ativa', 'Baixada', 'Inativa', 'Em Liquidação')) DEFAULT 'Ativa',
    tax_regime TEXT CHECK (tax_regime IN ('Simples Nacional', 'Lucro Presumido', 'Lucro Real', 'Isenta')),
    
    -- Dados de Sede
    address JSONB, -- {cep, street, number, complement, neighborhood, city, state}
    
    -- Controle de Capital
    total_capital NUMERIC(15, 2) DEFAULT 0,
    total_shares NUMERIC(15, 2) DEFAULT 0, -- Total de quotas ou ações
    
    -- Metadados
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Quadro Societário (QSA) - Faz a ponte entre Entidades, Pessoas e outras Entidades
CREATE TABLE public.corporate_shareholders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL REFERENCES public.corporate_entities(id) ON DELETE CASCADE,
    
    -- O sócio pode ser uma Pessoa (da tabela persons) ou outra Empresa (da corporate_entities)
    person_shareholder_id UUID REFERENCES public.persons(id),
    corporate_shareholder_id UUID REFERENCES public.corporate_entities(id),
    
    share_type TEXT CHECK (share_type IN ('Ordinária', 'Preferencial', 'Quotas')) DEFAULT 'Quotas',
    shares_count NUMERIC(15, 2) DEFAULT 0,
    ownership_percentage NUMERIC(5, 2), -- Ex: 50.00
    capital_contribution NUMERIC(15, 2) DEFAULT 0,
    
    position TEXT,                     -- Cargo (ex: Diretor, Sócio-Administrador, Conselheiro)
    start_date DATE,
    end_date DATE,
    is_admin BOOLEAN DEFAULT FALSE,    -- Se tem poderes de administração
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Garante que um sócio (pessoa ou empresa) não seja duplicado na mesma entidade
    CONSTRAINT ck_shareholder_type CHECK (
        (person_shareholder_id IS NOT NULL AND corporate_shareholder_id IS NULL) OR
        (person_shareholder_id IS NULL AND corporate_shareholder_id IS NOT NULL)
    )
);

-- Livros e Atas (Gestão de Documentos Societários)
CREATE TABLE public.corporate_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL REFERENCES public.corporate_entities(id) ON DELETE CASCADE,
    title TEXT NOT NULL,               -- Ex: Ata de Assembléia Geral Ordinária
    document_type TEXT CHECK (document_type IN ('Ata', 'Estatuto', 'Contrato Social', 'Alteração Contratual', 'Procuração', 'Outros')),
    event_date DATE,                   -- Data da reunião/evento
    expiry_date DATE,                  -- Data de vencimento (ex: validade do mandato)
    file_url TEXT,                     -- Link para o storage
    status TEXT DEFAULT 'Vigente',
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Triggers e Segurança
CREATE TRIGGER tr_corp_ent_upd BEFORE UPDATE ON public.corporate_entities FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_corp_sha_upd BEFORE UPDATE ON public.corporate_shareholders FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_corp_doc_upd BEFORE UPDATE ON public.corporate_documents FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.corporate_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_shareholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant Session: Full Access" ON public.corporate_entities FOR ALL USING (TRUE);
CREATE POLICY "Tenant Session: Full Access" ON public.corporate_shareholders FOR ALL USING (TRUE);
CREATE POLICY "Tenant Session: Full Access" ON public.corporate_documents FOR ALL USING (TRUE);

-- Adicionar à publicação realtime
ALTER PUBLICATION supabase_realtime ADD TABLE 
    public.corporate_entities, 
    public.corporate_shareholders, 
    public.corporate_documents;

-- ----------------------------------------------------------------------------
-- 11. MÓDULO DE TIMELINE / AUDITORIA (HISTÓRICO DE ALTERAÇÕES)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.timeline_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,          -- 'lawsuit', 'asset', 'task', etc.
    entity_id UUID NOT NULL,
    action TEXT NOT NULL,               -- 'CREATE', 'UPDATE', 'STATUS_CHANGE', 'DELETE', 'DOC_UPLOAD'
    description TEXT,                   -- "Moveu de X para Y"
    old_values JSONB,                   -- Estado anterior
    new_values JSONB,                   -- Novo estado
    user_id UUID REFERENCES public.team_members(id), -- ID do usuário (Auth ID ou Master ID)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para busca rápida por entidade
CREATE INDEX IF NOT EXISTS idx_timeline_entity ON public.timeline_entries(entity_type, entity_id);

-- RLS
ALTER TABLE public.timeline_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant Session: Full Access" ON public.timeline_entries FOR ALL USING (TRUE);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.timeline_entries;

-- ----------------------------------------------------------------------------
-- 12. SEED DATA (TEMPLATES & STORAGE)
-- ----------------------------------------------------------------------------

-- A. Templates de Documentos
INSERT INTO public.document_templates (title, category, content) VALUES
(
  'Procuração Ad Judicia', 
  'Judicial', 
  '# PROCURAÇÃO AD JUDICIA\n\n**OUTORGANTE:** {{nome_cliente}}, {{nacionalidade}}, {{estado_civil}}, {{profissao}}, portador(a) do RG nº {{rg}} e inscrito(a) no CPF sob o nº {{cpf}}, residente e domiciliado(a) em {{endereco_completo}}.\n\n**OUTORGADOS:** {{nome_advogado}}, inscrito na OAB/{{oab_uf}} sob o nº {{oab_number}}, com escritório profissional em {{cidade_escritorio}}.\n\n**PODERES:** Por este instrumento particular de procuração, o outorgante nomeia e constitui os outorgados seus procuradores, conferindo-lhes os poderes da cláusula ad judicia et extra, para o foro em geral, podendo propor ações, contestar, transigir, desistir, firmar acordos, receber e dar quitação, e praticar todos os demais atos necessários ao bom e fiel desempenho deste mandato.\n\n{{cidade_escritorio}}, {{data_hoje}}.\n\n\n__________________________________________\n**{{nome_cliente}}**'
),
(
  'Contrato de Honorários Advocatícios', 
  'Contratos', 
  '# CONTRATO DE PRESTAÇÃO DE SERVIÇOS JURÍDICOS E HONORÁRIOS\n\n**CONTRATANTE:** {{nome_cliente}}, CPF {{cpf}}, residente em {{endereco_completo}}.\n\n**CONTRATADO:** {{nome_advogado}}, OAB/{{oab_number}}, com sede em {{cidade_escritorio}}.\n\n**OBJETO:** O presente contrato tem como objeto a prestação de serviços jurídicos consistentes em: [DESCREVER OBJETO DA AÇÃO].\n\n**HONORÁRIOS:** Pelos serviços prestados, o CONTRATANTE pagará ao CONTRATADO o valor de [VALOR], na forma de [FORMA DE PAGAMENTO].\n\n**CLÁUSULA QUARTA:** No caso de êxito na demanda, incidirão honorários de sucumbência conforme legislação vigente.\n\n{{cidade_escritorio}}, {{data_hoje}}.\n\n\n__________________________________________\n**{{nome_cliente}}**\n\n__________________________________________\n**{{nome_advogado}}**'
),
(
  'Termo de Consentimento LGPD', 
  'Compliance', 
  '# TERMO DE CONSENTIMENTO - LGPD\n\nEu, {{nome_cliente}}, inscrito(a) no CPF sob o nº {{cpf}}, autorizo expressamente o escritório {{nome_escritorio}} a realizar o tratamento de meus dados pessoais para fins exclusivos de prestação de serviços jurídicos, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).\n\nOs dados serão armazenados de forma segura e utilizados apenas para as finalidades do processo judicial/administrativo sob responsabilidade do contratado.\n\n{{cidade_escritorio}}, {{data_hoje}}.\n\n\n__________________________________________\n**{{nome_cliente}}**'
),
(
  'Ficha Cadastral de Cliente', 
  'Administrativo', 
  '# FICHA CADASTRAL DO CLIENTE\n\n**DADOS PESSOAIS:**\n- **Nome:** {{nome_cliente}}\n- **CPF:** {{cpf}}\n- **RG:** {{rg}}\n- **Nacionalidade:** {{nacionalidade}}\n- **Estado Civil:** {{estado_civil}}\n- **Profissão:** {{profissao}}\n\n**CONTATO:**\n- **Endereço:** {{endereco_completo}}\n- **E-mail:** {{email_cliente}}\n- **Telefone:** {{telefone_cliente}}\n\n**OBSERVAÇÕES:**\n[CAMPO LIVRE PARA ANOTAÇÕES DO ADVOGADO]\n\nData de Cadastro: {{data_hoje}}'
),
(
  'Declaração de Hipossuficiência', 
  'Judicial', 
  '# DECLARAÇÃO DE HIPOSSUFICIÊNCIA ECONÔMICA\n\nEu, {{nome_cliente}}, portador(a) do RG nº {{rg}} e do CPF nº {{cpf}}, declaro para os devidos fins de direito, sob as penas da lei, que não possuo condições financeiras de arcar com as custas processuais e honorários advocatícios sem prejuízo do meu próprio sustento e de minha família.\n\nPor tal razão, pleiteio os benefícios da Gratuidade da Justiça, nos termos do art. 98 e seguintes do Código de Processo Civil.\n\n{{cidade_escritorio}}, {{data_hoje}}.\n\n\n__________________________________________\n**{{nome_cliente}}**'
),
(
  'Requerimento Administrativo', 
  'Administrativo', 
  'À ILUSTRÍSSIMA GERÊNCIA DO [NOME DO ÓRGÃO]\n\n**ASSUNTO:** Requerimento de [DESCREVER ASSUNTO]\n\n{{nome_cliente}}, CPF {{cpf}}, por intermédio de seu advogado {{nome_advogado}}, OAB {{oab_number}}, vem respeitosamente à presença de Vossa Senhoria requerer o quanto segue:\n\n[TEXTO DO REQUERIMENTO]\n\nTermos em que, pede deferimento.\n\n{{cidade_escritorio}}, {{data_hoje}}.'
),
(
  'Termo de Acordo Extrajudicial', 
  'Acordos', 
  '# TERMO DE ACORDO EXTRAJUDICIAL\n\n**PARTE A:** {{nome_cliente}}, CPF {{cpf}}.\n**PARTE B:** [NOME DA PARTE CONTRÁRIA], CPF/CNPJ [DOCUMENTO].\n\nAs partes acima qualificadas resolvem, de comum acordo, encerrar a controvérsia referente a [OBJETO DO ACORDO], mediante as seguintes condições:\n\n1. A PARTE B pagará à PARTE A a quantia de R$ [VALOR].\n2. O pagamento será efetuado em [DATA/FORMA].\n3. Com o cumprimento integral, as partes dão mútua e plena quitação.\n\n{{cidade_escritorio}}, {{data_hoje}}.\n\n\n__________________________________________\n**{{nome_cliente}}**'
),
(
  'Notificação Extrajudicial', 
  'Notificações', 
  '# NOTIFICAÇÃO EXTRAJUDICIAL\n\n**NOTIFICANTE:** {{nome_cliente}}, CPF {{cpf}}.\n**NOTIFICADO:** [NOME DO NOTIFICADO], [ENDEREÇO].\n\nPrezado(a),\n\nNa qualidade de advogado(a) de {{nome_cliente}}, venho através desta NOTIFICÁ-LO(A) formalmente sobre [ASSUNTO DA NOTIFICAÇÃO].\n\nSolicitamos a regularização da situação no prazo de [PRAZO] dias, sob pena de adoção das medidas judiciais cabíveis.\n\n{{cidade_escritorio}}, {{data_hoje}}.\n\nAtenciosamente,\n\n{{nome_advogado}}\nOAB/{{oab_number}}'
)
ON CONFLICT (title) DO NOTHING;

-- B. Configuração de Storage (Removido: Deve ser feito via Dashboard ou API para evitar erro de permissão)

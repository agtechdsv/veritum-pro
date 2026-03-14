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
-- 2. TABELA DE USUÁRIOS (ESPELHO / SHADOW)
-- ============================================================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY,                   -- MESMO ID DO MASTER
  name TEXT NOT NULL,
  email TEXT,
  role TEXT,
  active BOOLEAN DEFAULT TRUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Membros da Equipe (Configuração Local do Cliente - Ex: Estagiários, Secretárias)
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
  responsible_lawyer_id UUID REFERENCES public.users(id),
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
  responsible_id UUID REFERENCES public.users(id),
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
  user_id UUID REFERENCES public.users(id),
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
  title TEXT NOT NULL,
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
  author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
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
  user_id UUID REFERENCES public.users(id),
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
CREATE TRIGGER tr_users_upd BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
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
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
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
CREATE POLICY "Tenant Session: Full Access" ON public.users FOR ALL USING (TRUE);
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
    public.chat_messages;

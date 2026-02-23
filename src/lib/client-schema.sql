-- ============================================================================
-- VERITUM PRO: CLIENT OPERATIONAL SCHEMA (BYODB)
-- ============================================================================
-- Description: Script para setup do banco de dados do cliente (BYODB).
-- Contém apenas tabelas operacionais e inteligência de negócio.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. INFRAESTRUTURA & EXTENSÕES
-- ----------------------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "vector";

-- ----------------------------------------------------------------------------
-- 2. FUNÇÕES DE AUTOMAÇÃO & GLOBAIS
-- ----------------------------------------------------------------------------

-- Função para atualizar timestamp 'updated_at'
create or replace function handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- ----------------------------------------------------------------------------
-- 3. MÓDULOS CORE: NEXUS PRO & BASE
-- ----------------------------------------------------------------------------

-- Membros da Equipe Local
create table if not exists public.team_members (
    id uuid primary key default gen_random_uuid(),
    full_name text not null,
    email text unique not null,
    phone text,
    role text,
    oab_number text,
    is_active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Pessoas (Contatos/Clientes/Reclamados)
create table if not exists public.persons (
  id uuid primary key default gen_random_uuid(),
  person_type text check (person_type in ('Cliente', 'Reclamado', 'Testemunha', 'Preposto', 'Advogado Adverso')),
  full_name text not null,
  document text unique not null,
  email text,
  phone text,
  rg text,
  legal_data jsonb,
  address jsonb,
  workspace_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

-- Processos Judiciais (Lawsuits)
create table if not exists public.lawsuits (
  id uuid primary key default gen_random_uuid(),
  cnj_number text unique not null,
  case_title text,
  author_id uuid references public.persons(id) on delete cascade,
  defendant_id uuid references public.persons(id) on delete cascade,
  responsible_lawyer_id uuid, -- ID vindo do Master (sem FK formal no BYODB)
  status text check (status in ('Ativo', 'Suspenso', 'Arquivado', 'Encerrado')),
  sphere text,
  court text,
  chamber text,
  city text,
  state text,
  value numeric(15, 2),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

-- Tarefas & Kanban
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  lawsuit_id uuid references public.lawsuits(id) on delete cascade,
  responsible_id uuid, -- ID vindo do Master
  status text check (status in ('A Fazer', 'Em Andamento', 'Concluído', 'Atrasado')) default 'A Fazer',
  priority text check (priority in ('Baixa', 'Média', 'Alta', 'Urgente')) default 'Média',
  due_date timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

-- ----------------------------------------------------------------------------
-- 4. SENTINEL PRO (Vigilância)
-- ----------------------------------------------------------------------------

create table if not exists public.monitoring_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid, -- ID vindo do Master
  title text not null,
  term text not null,
  alert_type text check (alert_type in ('OAB', 'CNJ', 'Keyword', 'Company', 'Person')),
  is_active boolean default true,
  created_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists public.clippings (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid references public.monitoring_alerts(id) on delete cascade,
  source text,
  content text not null,
  sentiment text check (sentiment in ('Positivo', 'Negativo', 'Neutro')),
  score float,
  url text,
  lawsuit_id uuid references public.lawsuits(id) on delete set null,
  captured_at timestamptz default now(),
  embedding vector(768)
);

create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  person_id uuid references public.persons(id) on delete cascade,
  lawsuit_id uuid references public.lawsuits(id) on delete set null,
  status text default 'Ativo',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid references public.chats(id) on delete cascade,
  sender_id uuid, -- ID vindo do Master ou Person
  sender_type text check (sender_type in ('Lawyer', 'Client', 'AI')) default 'Lawyer',
  content text not null,
  is_read boolean default false,
  created_at timestamptz default now(),
  deleted_at timestamptz
);

-- ----------------------------------------------------------------------------
-- 5. INTELLIGÊNCIA: COGNITIO & GOLDEN ALERTS
-- ----------------------------------------------------------------------------

create table if not exists public.knowledge_articles (
    id uuid primary key default gen_random_uuid(),
    title text not null unique,
    content text not null,
    category text,
    tags text[],
    embedding vector(768),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Index para busca semântica
create index if not exists idx_knowledge_embedding on public.knowledge_articles 
using hnsw (embedding vector_cosine_ops);

-- Função de busca semântica para Conhecimento (RPC)
create or replace function match_knowledge (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  title text,
  content text,
  category text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    ka.id,
    ka.title,
    ka.content,
    ka.category,
    1 - (ka.embedding <=> query_embedding) as similarity
  from public.knowledge_articles ka
  where 1 - (ka.embedding <=> query_embedding) > match_threshold
  order by ka.embedding <=> query_embedding
  limit match_count;
end;
$$;

create table if not exists public.historical_outcomes (
    id uuid primary key default gen_random_uuid(),
    judge_name text,
    court text,
    case_type text,
    outcome text,
    created_at timestamptz default now()
);

create table if not exists public.golden_alerts (
    id uuid primary key default gen_random_uuid(),
    clipping_id uuid not null references public.clippings(id) on delete cascade,
    matched_knowledge_id uuid references public.knowledge_articles(id) on delete set null,
    matched_lawsuit_id uuid references public.lawsuits(id) on delete set null,
    match_score float not null,
    intelligence_type text check (intelligence_type in ('Opportunity', 'Risk', 'Similar Success')),
    reasoning text,
    status text default 'unread' check (status in ('unread', 'dismissed', 'actioned')),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table if not exists public.movements (
  id uuid primary key default gen_random_uuid(),
  lawsuit_id uuid references public.lawsuits(id) on delete cascade,
  original_text text,
  translated_text text,
  sentiment_score float,
  source text default 'Manual',
  is_notified boolean default false,
  created_at timestamptz default now(),
  deleted_at timestamptz
);

-- ----------------------------------------------------------------------------
-- 6. SCRIPTOR PRO (Documentos & IA)
-- ----------------------------------------------------------------------------

create table if not exists public.document_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null unique,
  category text,
  base_prompt text not null,
  created_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists public.legal_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,
  lawsuit_id uuid references public.lawsuits(id) on delete set null,
  author_id uuid, -- ID vindo do Master
  template_id uuid references public.document_templates(id) on delete set null,
  version integer default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.document_embeddings (
  id uuid primary key default gen_random_uuid(),
  lawsuit_id uuid references public.lawsuits(id) on delete cascade,
  filename text,
  content text,
  embedding vector(768),
  created_at timestamptz default now()
);

create index if not exists idx_doc_embeddings_vector on public.document_embeddings 
using hnsw (embedding vector_cosine_ops);

-- ----------------------------------------------------------------------------
-- 7. VALOREM PRO (Financeiro)
-- ----------------------------------------------------------------------------

create table if not exists public.financial_records (
  id uuid primary key default gen_random_uuid(),
  lawsuit_id uuid references public.lawsuits(id) on delete set null,
  description text,
  type text check (type in ('fee', 'cost', 'settlement', 'honorarium')),
  amount numeric,
  due_date date,
  is_paid boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid, -- ID vindo do Master
  title text not null,
  amount numeric(12,2) not null,
  entry_type text check (entry_type in ('Credit', 'Debit')),
  category text,
  transaction_date timestamptz default now(),
  lawsuit_id uuid references public.lawsuits(id) on delete set null,
  person_id uuid references public.persons(id) on delete set null,
  status text check (status in ('Pago', 'Pendente', 'Cancelado')) default 'Pendente',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

-- ----------------------------------------------------------------------------
-- 8. TRIGGERS (Automação)
-- ----------------------------------------------------------------------------

create trigger tr_team_updated before update on public.team_members for each row execute function handle_updated_at();
create trigger tr_persons_updated before update on public.persons for each row execute function handle_updated_at();
create trigger tr_lawsuits_updated before update on public.lawsuits for each row execute function handle_updated_at();
create trigger tr_tasks_updated before update on public.tasks for each row execute function handle_updated_at();
create trigger tr_chats_updated before update on public.chats for each row execute function handle_updated_at();
create trigger tr_knowledge_updated before update on public.knowledge_articles for each row execute function handle_updated_at();
create trigger tr_golden_alerts_updated before update on public.golden_alerts for each row execute function handle_updated_at();
create trigger tr_legal_docs_updated before update on public.legal_documents for each row execute function handle_updated_at();
create trigger tr_financial_updated before update on public.financial_transactions for each row execute function handle_updated_at();

-- ----------------------------------------------------------------------------
-- 9. SEGURANÇA (RLS - Idempotente & Colaborativa)
-- ----------------------------------------------------------------------------

-- Ativando RLS em todas as tabelas operacionais
alter table public.team_members enable row level security;
alter table public.persons enable row level security;
alter table public.lawsuits enable row level security;
alter table public.tasks enable row level security;
alter table public.monitoring_alerts enable row level security;
alter table public.clippings enable row level security;
alter table public.chats enable row level security;
alter table public.chat_messages enable row level security;
alter table public.knowledge_articles enable row level security;
alter table public.historical_outcomes enable row level security;
alter table public.golden_alerts enable row level security;
alter table public.movements enable row level security;
alter table public.document_templates enable row level security;
alter table public.legal_documents enable row level security;
alter table public.document_embeddings enable row level security;
alter table public.financial_records enable row level security;
alter table public.financial_transactions enable row level security;

-- Políticas Idempotentes para Banco do Cliente (Foco em Colaboração)
-- Nota: Como este banco é exclusivo do tenant, permitimos que usuários 
-- autenticados do escritório vejam e operem nos dados entre si.

DROP POLICY IF EXISTS "Auth users can manage team members" ON public.team_members;
CREATE POLICY "Auth users can manage team members" ON public.team_members FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth users can manage persons" ON public.persons;
CREATE POLICY "Auth users can manage persons" ON public.persons FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth users can manage lawsuits" ON public.lawsuits;
CREATE POLICY "Auth users can manage lawsuits" ON public.lawsuits FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth users can manage tasks" ON public.tasks;
CREATE POLICY "Auth users can manage tasks" ON public.tasks FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth users can read knowledge" ON public.knowledge_articles;
CREATE POLICY "Auth users can read knowledge" ON public.knowledge_articles FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth users can manage alerts" ON public.monitoring_alerts;
CREATE POLICY "Auth users can manage alerts" ON public.monitoring_alerts FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth users can manage recordings" ON public.clippings;
CREATE POLICY "Auth users can manage recordings" ON public.clippings FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth users can manage golden_alerts" ON public.golden_alerts;
CREATE POLICY "Auth users can manage golden_alerts" ON public.golden_alerts FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth users can manage documents" ON public.legal_documents;
CREATE POLICY "Auth users can manage documents" ON public.legal_documents FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth users can manage finances" ON public.financial_transactions;
CREATE POLICY "Auth users can manage finances" ON public.financial_transactions FOR ALL USING (auth.role() = 'authenticated');

-- ----------------------------------------------------------------------------
-- 10. SEED DATA (Foundation for Intelligent Hub & Scriptor)
-- ----------------------------------------------------------------------------

-- 10.1. Knowledge Base (Base de Conhecimento Estratégica)
-- Estes artigos alimentam o Golden Alerts e o Semantic Matcher
INSERT INTO public.knowledge_articles (title, content, category, tags) VALUES 
('Protocolo de Proteção ao Consumidor', 'Diretrizes para contestação de cobranças indevidas em serviços bancários com base no CDC atualizado.', 'Cível', ARRAY['consumidor', 'bancário', 'contestação']),
('Tese: Dano Moral por Atraso de Voo', 'Jurisprudência consolidada sobre o limite de 4 horas de atraso e danos presumidos (in re ipsa).', 'Cível', ARRAY['aéreo', 'dano moral', 'jurisprudência']),
('Manual de Acordos Trabalhistas', 'Critérios de vantajosidade para fechamento de acordos em primeira audiência (fase inicial).', 'Trabalhista', ARRAY['acordo', 'estratégia', 'conciliação']),
('Prevenção de Riscos em Contratos de TI', 'Cláusulas essenciais de SLA, confidencialidade e limitação de responsabilidade em software.', 'Contratos', ARRAY['clm', 'tecnologia', 'risco'])
ON CONFLICT DO NOTHING;

-- 10.2. Document Templates (Modelos Scriptor PRO)
INSERT INTO public.document_templates (title, category, base_prompt) VALUES 
('Procuração Ad Judicia', 'Geral', 'Gere uma procuração judicial padrão brasileira com poderes para o foro em geral, incluindo cláusula de substabelecimento.'),
('Contrato de Honorários Advocatícios', 'Geral', 'Gere um contrato de honorários baseado no valor da causa com cláusula de sucesso e reembolso de custas.'),
('Contestação Padrão (Cível)', 'Cível', 'Gere uma minuta de contestação cível com preliminar de ilegitimidade passiva e mérito baseado na ausência de nexo causal.')
ON CONFLICT (title) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 11. REALTIME
-- ----------------------------------------------------------------------------
-- Recriação das publicações Realtime para garantir sincronia
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE 
    public.tasks, 
    public.financial_transactions, 
    public.movements, 
    public.golden_alerts, 
    public.clippings,
    public.chat_messages;

-- ============================================================================
-- VERITUM PRO: THE MASTER GOLDEN SCHEMA (COMPREHENSIVA)
-- ============================================================================
-- Description: Script único para setup completo do ambiente.
-- ATENÇÃO: Inclui comandos de limpeza (DROP) para re-instalação total.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. LIMPEZA TOTAL (DROP) - USE COM CAUTELA
-- ----------------------------------------------------------------------------
drop table if exists public.golden_alerts cascade;
drop table if exists public.knowledge_articles cascade;
drop table if exists public.historical_outcomes cascade;
drop table if exists public.clippings cascade;
drop table if exists public.monitoring_alerts cascade;
drop table if exists public.movements cascade;
drop table if exists public.legal_documents cascade;
drop table if exists public.document_templates cascade;
drop table if exists public.document_embeddings cascade;
drop table if exists public.financial_records cascade;
drop table if exists public.financial_transactions cascade;
drop table if exists public.tasks cascade;
drop table if exists public.lawsuits cascade;
drop table if exists public.persons cascade;
drop table if exists public.team_members cascade;
drop table if exists public.chat_messages cascade;
drop table if exists public.chats cascade;
drop table if exists public.group_permissions cascade;
drop table if exists public.group_templates cascade;
drop table if exists public.access_groups cascade;
drop table if exists public.plan_permissions cascade;
drop table if exists public.features cascade;
drop table if exists public.suites cascade;
drop table if exists public.plans cascade;
drop table if exists public.user_preferences cascade;
drop table if exists public.email_settings cascade;
drop table if exists public.app_settings cascade;
drop table if exists public.users cascade;

drop function if exists handle_updated_at() cascade;
drop function if exists match_knowledge(vector, float, int) cascade;

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
-- 3. GESTÃO DE USUÁRIOS & AUTH (Sincronização com Supabase Auth)
-- ----------------------------------------------------------------------------

-- Tabela de Usuários (Profiles)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  username text unique not null,
  role text default 'Administrador' check (role in (
    'Master', 'Administrador', 'Operador', 
    'Sócio-Administrador', 'Advogado Sênior / Coordenador', 
    'Advogado Associado / Júnior', 'Estagiário / Paralegal', 
    'Departamento Financeiro / Faturamento', 'Cliente (Acesso Externo B2B2C)', 
    'Controladoria Jurídica (Legal Ops)', 'Secretariado / Recepção',
    'Sócio', 'Advogado Associado', 'Estagiário', 'Paralegal', 'Financeiro'
  )),
  active boolean default true,
  avatar_url text,
  cpf_cnpj text,
  phone text,
  access_group_id uuid, -- Linkado ao RBAC abaixo
  plan_id uuid, -- Linkado ao sistema de planos
  parent_user_id uuid references public.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Preferências do Usuário
create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  language text default 'pt' check (language in ('pt', 'en', 'es')),
  theme text default 'dark' check (theme in ('light', 'dark')),
  custom_supabase_url text,
  custom_supabase_key text,
  custom_gemini_key text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Assinaturas (Planos)
create table if not exists public.user_subscriptions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    plan_id uuid not null, -- Referência à tabela plans abaixo
    start_date timestamptz default now(),
    end_date timestamptz,
    status text default 'active' check (status in ('active', 'expired', 'canceled')),
    is_trial boolean default false,
    created_at timestamptz default now()
);

-- Trigger: Criar perfil público ao criar usuário no Auth
create or replace function public.handle_new_user()
returns trigger as $$
declare
  default_role text := 'Administrador';
  user_role text;
  user_name text;
  user_plan_id uuid;
begin
  user_role := coalesce(new.raw_user_meta_data->>'role', default_role);
  user_name := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Usuário');
  user_plan_id := (new.raw_user_meta_data->>'plan_id')::uuid;

  -- 💎 AUTO TRIAL: Se nenhum plan_id foi fornecido, busca o plano "Trial"
  if user_plan_id is null then
     select id into user_plan_id from public.plans where name ilike '%Trial%' limit 1;
  end if;

  insert into public.users (id, name, username, role, active, avatar_url, parent_user_id, plan_id)
  values (
    new.id,
    user_name,
    new.email,
    user_role, 
    true,
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
    (new.raw_user_meta_data->>'parent_user_id')::uuid,
    user_plan_id
  )
  on conflict (id) do update set
    role = excluded.role,
    name = excluded.name,
    plan_id = excluded.plan_id;

  -- 💎 AUTO SUBSCRIPTION: Vincula o usuário ao plano trial/atribuído por 14 dias
  if user_plan_id is not null then
     insert into public.user_subscriptions (user_id, plan_id, start_date, end_date, status, is_trial)
     values (
       new.id,
       user_plan_id,
       now(),
       now() + interval '14 days',
       'active',
       true
     )
     on conflict do nothing;
  end if;

  -- 💎 AUTO PREFERENCES: Cria preferências padrão para o usuário
  insert into public.user_preferences (user_id, language, theme)
  values (new.id, 'pt', 'dark')
  on conflict (user_id) do nothing;

  -- Ensure Auth Metadata matches the role and plan for instant RLS validation
  update auth.users
  set raw_user_meta_data = 
    coalesce(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'role', user_role,
      'full_name', user_name,
      'name', user_name,
      'plan_id', user_plan_id
    )
  where id = new.id;

  return new;
end;
$$ language plpgsql security definer;

-- Trigger: Sincronizar alterações do Perfil de volta para o Auth
create or replace function public.handle_updated_user()
returns trigger as $$
begin
  update auth.users
  set raw_user_meta_data = 
    coalesce(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'role', new.role,
      'full_name', new.name,
      'name', new.name,
      'parent_user_id', new.parent_user_id,
      'active', new.active,
      'plan_id', new.plan_id
    )
  where id = new.id;

  -- Cascade Active status to Operators
  if (old.active is distinct from new.active) then
    update public.users set active = new.active where parent_user_id = new.id;
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Membros da Equipe (Staff)
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

-- ----------------------------------------------------------------------------
-- 4. FUNDAÇÃO RBAC & PLANOS
-- ----------------------------------------------------------------------------

-- Suítes (Módulos)
create table if not exists public.suites (
  id uuid primary key default gen_random_uuid (),
  suite_key text unique not null,
  name text not null,
  short_desc jsonb default '{"en": "", "es": "", "pt": ""}'::jsonb,
  detailed_desc jsonb default '{"en": "", "es": "", "pt": ""}'::jsonb,
  features jsonb default '{"en": [], "es": [], "pt": []}'::jsonb,
  icon_svg text,
  active boolean default true,
  order_index integer default 0,
  created_at timestamptz default now()
);

-- Funcionalidades Granulares
create table if not exists public.features (
    id uuid primary key default gen_random_uuid(),
    feature_key text unique not null,
    suite_id uuid not null references public.suites(id) on delete cascade,
    display_name text not null,
    description text,
    created_at timestamptz default now()
);

-- Planos de Venda
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid (),
  name text not null,
  short_desc jsonb default '{"en": "", "es": "", "pt": ""}'::jsonb,
  monthly_price numeric default 0,
  monthly_discount numeric default 0,
  yearly_price numeric default 0,
  yearly_discount numeric default 0,
  features jsonb default '{"en": [], "es": [], "pt": []}'::jsonb,
  recommended boolean default false,
  active boolean default true,
  order_index integer default 0,
  is_combo boolean default false,
  created_at timestamptz default now()
);

-- Link Planos x Features
create table if not exists public.plan_permissions (
    id uuid primary key default gen_random_uuid(),
    plan_id uuid not null references public.plans(id) on delete cascade,
    feature_id uuid not null references public.features(id) on delete cascade,
    created_at timestamptz default now(),
    unique(plan_id, feature_id)
);

-- Constraints de Integridade Referencial (Planos)
alter table public.users add constraint fk_user_plan foreign key (plan_id) references public.plans(id) on delete set null;
alter table public.user_subscriptions add constraint fk_sub_plan foreign key (plan_id) references public.plans(id) on delete cascade;

-- Índices de Performance
create index if not exists idx_users_plan_id on public.users(plan_id);
create index if not exists idx_subscriptions_plan_id on public.user_subscriptions(plan_id);

-- Grupos de Acesso (RBAC Admin)
create table if not exists public.access_groups (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    admin_id uuid not null, 
    created_at timestamptz default now(),
    unique(admin_id, name) -- Impedir grupos com mesmo nome para o mesmo admin
);

-- Templates de Grupos (Personas Padrão do Sistema)
create table if not exists public.group_templates (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    description text,
    default_features uuid[], -- Array de IDs de features recomendadas
    created_at timestamptz default now()
);

-- Permissões de Grupo
create table if not exists public.group_permissions (
    id uuid primary key default gen_random_uuid(),
    group_id uuid references public.access_groups(id) on delete cascade,
    feature_id uuid references public.features(id) on delete cascade,
    can_access boolean default true,
    created_at timestamptz default now(),
    unique(group_id, feature_id)
);

-- Agora vinculamos users à access_groups
alter table public.users add constraint fk_user_access_group foreign key (access_group_id) references public.access_groups(id) on delete set null;

-- ----------------------------------------------------------------------------
-- 5. MÓDULOS CORE: NEXUS PRO (Operacional)
-- ----------------------------------------------------------------------------

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
  author_id uuid references public.persons(id),
  defendant_id uuid references public.persons(id),
  responsible_lawyer_id uuid references public.users(id),
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
  responsible_id uuid references public.users(id),
  status text check (status in ('A Fazer', 'Em Andamento', 'Concluído', 'Atrasado')) default 'A Fazer',
  priority text check (priority in ('Baixa', 'Média', 'Alta', 'Urgente')) default 'Média',
  due_date timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

-- ----------------------------------------------------------------------------
-- 6. SENTINEL PRO (Vigilância)
-- ----------------------------------------------------------------------------

create table if not exists public.monitoring_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid(),
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
  sender_id uuid default auth.uid(),
  sender_type text check (sender_type in ('Lawyer', 'Client', 'AI')) default 'Lawyer',
  content text not null,
  is_read boolean default false,
  created_at timestamptz default now(),
  deleted_at timestamptz
);

-- ----------------------------------------------------------------------------
-- 7. NOTEBOOKLM: COGNITIO & GOLDEN ALERTS (Inteligência Proativa)
-- ----------------------------------------------------------------------------

create table if not exists public.knowledge_articles (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    content text not null,
    category text,
    tags text[],
    embedding vector(768),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Index para busca semântica em Conhecimento
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
    priority text check (priority in ('High', 'Medium', 'Low')) default 'Medium',
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
-- 8. SCRIPTOR PRO (Documentos & IA)
-- ----------------------------------------------------------------------------

create table if not exists public.document_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
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
  author_id uuid references public.users(id) on delete set null,
  template_id uuid references public.document_templates(id) on delete set null,
  version integer default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Embeddings para busca semântica (RAG)
create table if not exists public.document_embeddings (
  id uuid primary key default gen_random_uuid(),
  lawsuit_id uuid references public.lawsuits(id) on delete cascade,
  filename text,
  content text,
  embedding vector(768),
  created_at timestamptz default now()
);

-- Index para busca semântica (HNSW)
create index if not exists idx_doc_embeddings_vector on public.document_embeddings 
using hnsw (embedding vector_cosine_ops);

-- ----------------------------------------------------------------------------
-- 8. VALOREM PRO (Financeiro)
-- ----------------------------------------------------------------------------

-- Registros Financeiros (V1)
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

-- Transações Financeiras (V2)
create table if not exists public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid(),
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
-- 9. CONFIGURAÇÕES & SUPORTE (App Settings, Emails, Demos)
-- ----------------------------------------------------------------------------

create table if not exists public.app_settings (
  id uuid primary key default gen_random_uuid(),
  office_name text,
  whatsapp_api_url text,
  theme_color text,
  created_at timestamptz default now()
);

create table if not exists public.email_settings (
  id uuid primary key default gen_random_uuid (),
  scenario_key text unique not null,
  config jsonb not null default '{"pt": {"email": "", "name": ""}, "en": {"email": "", "name": ""}}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.demo_requests (
    id uuid primary key default gen_random_uuid(),
    full_name text not null,
    email text not null,
    whatsapp text not null,
    team_size text not null,
    preferred_start timestamptz not null,
    preferred_end timestamptz not null,
    scheduled_at timestamptz,
    attended_at timestamptz,
    status text not null default 'pending' check (status in ('pending', 'scheduled', 'attended', 'canceled')),
    created_at timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- 10. AUDITORIA
-- ----------------------------------------------------------------------------

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  action text, -- CREATE, UPDATE, DELETE
  table_name text,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz default now()
);

-- 💎 ONE-TIME MIGRATION: Garantir que todos os usuários existentes tenham preferências
insert into public.user_preferences (user_id, language, theme)
select id, 'pt', 'dark' from public.users
on conflict (user_id) do nothing;

-- ----------------------------------------------------------------------------
-- 11. TRIGGERS
-- ----------------------------------------------------------------------------

-- Auth integration
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists on_public_user_updated on public.users;
create trigger on_public_user_updated
  after update on public.users
  for each row 
  when (
    old.role is distinct from new.role or 
    old.name is distinct from new.name or 
    old.parent_user_id is distinct from new.parent_user_id or
    old.active is distinct from new.active
  )
  execute function public.handle_updated_user();

-- Updated_at automation
create trigger tr_users_updated before update on public.users for each row execute function handle_updated_at();
create trigger tr_user_prefs_updated before update on public.user_preferences for each row execute function handle_updated_at();
create trigger tr_suites_updated before update on public.suites for each row execute function handle_updated_at();
create trigger tr_persons_updated before update on public.persons for each row execute function handle_updated_at();
create trigger tr_lawsuits_updated before update on public.lawsuits for each row execute function handle_updated_at();
create trigger tr_tasks_updated before update on public.tasks for each row execute function handle_updated_at();
create trigger tr_legal_docs_updated before update on public.legal_documents for each row execute function handle_updated_at();
create trigger tr_financial_updated before update on public.financial_transactions for each row execute function handle_updated_at();
create trigger tr_email_settings_updated before update on public.email_settings for each row execute function handle_updated_at();
create trigger tr_golden_alerts_updated before update on public.golden_alerts for each row execute function handle_updated_at();
create trigger tr_knowledge_updated before update on public.knowledge_articles for each row execute function handle_updated_at();
create trigger tr_team_updated before update on public.team_members for each row execute function handle_updated_at();
create trigger tr_chats_updated before update on public.chats for each row execute function handle_updated_at();

-- ----------------------------------------------------------------------------
-- 12. SEGURANÇA (RLS)
-- ----------------------------------------------------------------------------

-- Habilitar RLS em absoluto tudo
alter table public.users enable row level security;
alter table public.user_preferences enable row level security;
alter table public.user_subscriptions enable row level security;
alter table public.suites enable row level security;
alter table public.features enable row level security;
alter table public.plans enable row level security;
alter table public.plan_permissions enable row level security;
alter table public.access_groups enable row level security;
alter table public.group_permissions enable row level security;
alter table public.persons enable row level security;
alter table public.lawsuits enable row level security;
alter table public.tasks enable row level security;
alter table public.monitoring_alerts enable row level security;
alter table public.clippings enable row level security;
alter table public.movements enable row level security;
alter table public.document_templates enable row level security;
alter table public.legal_documents enable row level security;
alter table public.document_embeddings enable row level security;
alter table public.financial_records enable row level security;
alter table public.financial_transactions enable row level security;
alter table public.app_settings enable row level security;
alter table public.email_settings enable row level security;
alter table public.demo_requests enable row level security;
alter table public.audit_logs enable row level security;
alter table public.golden_alerts enable row level security;
alter table public.knowledge_articles enable row level security;
alter table public.historical_outcomes enable row level security;
alter table public.team_members enable row level security;
alter table public.chats enable row level security;
alter table public.document_templates enable row level security;

-- Políticas de Exemplo (Idempotentes)
DROP POLICY IF EXISTS "Master: Full Control" ON public.users;
CREATE POLICY "Master: Full Control" ON public.users FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Master');

DROP POLICY IF EXISTS "Users manage self preferences" ON public.user_preferences;
CREATE POLICY "Users manage self preferences" ON public.user_preferences FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can read suites" ON public.suites;
CREATE POLICY "Authenticated users can read suites" ON public.suites FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Master: Full Control on suites" ON public.suites;
CREATE POLICY "Master: Full Control on suites" ON public.suites FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Master');

DROP POLICY IF EXISTS "Allow auth on lawsuits" ON public.lawsuits;
CREATE POLICY "Allow auth on lawsuits" ON public.lawsuits FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow auth on golden_alerts" ON public.golden_alerts;
CREATE POLICY "Allow auth on golden_alerts" ON public.golden_alerts FOR ALL USING (auth.role() = 'authenticated');

-- RLS para RBAC e Planos (Visibilidade do Ecossistema)
DROP POLICY IF EXISTS "Authenticated users can read plans" ON public.plans;
CREATE POLICY "Authenticated users can read plans" ON public.plans FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can read features" ON public.features;
CREATE POLICY "Authenticated users can read features" ON public.features FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Master: Full Control on features" ON public.features;
CREATE POLICY "Master: Full Control on features" ON public.features FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Master');

DROP POLICY IF EXISTS "Authenticated users can read plan_permissions" ON public.plan_permissions;
CREATE POLICY "Authenticated users can read plan_permissions" ON public.plan_permissions FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can read group_templates" ON public.group_templates;
CREATE POLICY "Authenticated users can read group_templates" ON public.group_templates FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can read groups" ON public.access_groups;
CREATE POLICY "Authenticated users can read groups" ON public.access_groups FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can insert own groups" ON public.access_groups;
CREATE POLICY "Users can insert own groups" ON public.access_groups FOR INSERT WITH CHECK (auth.uid() = admin_id);

DROP POLICY IF EXISTS "Users can update own groups" ON public.access_groups;
CREATE POLICY "Users can update own groups" ON public.access_groups FOR UPDATE USING (auth.uid() = admin_id);

DROP POLICY IF EXISTS "Users can delete own groups" ON public.access_groups;
CREATE POLICY "Users can delete own groups" ON public.access_groups FOR DELETE USING (auth.uid() = admin_id);

DROP POLICY IF EXISTS "Authenticated users can read group_permissions" ON public.group_permissions;
CREATE POLICY "Authenticated users can read group_permissions" ON public.group_permissions FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can manage own group_permissions" ON public.group_permissions;
CREATE POLICY "Users can manage own group_permissions" ON public.group_permissions 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.access_groups 
        WHERE id = group_id AND admin_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can read own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can read own subscriptions" ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Master full control on subscriptions" ON public.user_subscriptions;
CREATE POLICY "Master full control on subscriptions" ON public.user_subscriptions FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Master');

-- ----------------------------------------------------------------------------
-- 13. REALTIME
-- ----------------------------------------------------------------------------
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.financial_transactions;
alter publication supabase_realtime add table public.movements;
alter publication supabase_realtime add table public.golden_alerts;
alter publication supabase_realtime add table public.clippings;

-- ----------------------------------------------------------------------------
-- 14. SEED DATA (Initial Setup)
-- ----------------------------------------------------------------------------

-- 14.1. Suítes (Módulos)
INSERT INTO public.suites (id, suite_key, name, short_desc, detailed_desc, features, icon_svg, active, order_index) VALUES 
('0bc36740-4107-484c-972e-a4f61aaef829', 'nexus', 'Nexus PRO', 
 '{"en": "Workflow Management", "es": "Gestión de Flujos de Trabalho", "pt": "Gestão de Fluxo de Trabalho"}', 
 '{"en": "Legal Kanban and automation of recurring tasks", "es": "Kanban Jurídico y automatización de tareas recurrentes", "pt": "Kanban Jurídico e automação de tarefas recorrentes"}', 
 '{"en": ["The Operational Heart. This suite handles case and deadline management, ensuring the firm runs like clockwork.", "Automated Workflow: Create recurring task flows with automatic status updates.", "Smart Agenda: View appointments and deadlines, delegate tasks to the team.", "Court Integration: Automatic synchronization with judicial systems to fetch updates without manual intervention.", "Legal Kanban: Visual case management with drag-and-drop cards."], "pt": ["O \"Coração\" Operacional. Esta suíte cuida da gestão de processos e prazos, garantindo que o escritório ou departamento jurídico funcione como um relógio", "Workflow Automatizado: Criação de fluxos de tarefas recorrentes (ex: \"Protocolar Contestação\" gera automaticamente tarefas de revisão para o sócio), com atualização automática de status.", "Agenda Inteligente: Visualização de compromissos por dia/mês e integração com prazos fatais, permitindo delegar demandas e acompanhar o time.", "Integração com Tribunais (Robôs): Sincronização automática com sistemas como PJe e e-SAJ para puxar andamentos e publicações sem intervenção manual.", "Kanban Jurídico: Visualização de processos em cartões (To Do, Doing, Done) para gestão visual ágil."]}',
 ' <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" x2="6" y1="3" y2="15"/><circle cx="18" cy="9" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg> ', true, 0),

('11a3a5b3-49dd-4f46-95d0-db97a1226a7a', 'scriptor', 'Scriptor PRO', 
 '{"en": "Document Intelligence", "es": "Inteligencia Documental", "pt": "Inteligência Documental"}', 
 '{"en": "AI-assisted drafting and contract lifecycle management (CLM)", "es": "Redacción asistida por IA y gestión de contratos (CLM)", "pt": "Redação assistida por IA e gestão de contratos (CLM)"}', 
 '{"pt": ["O \"Cérebro\" Criativo e Arquivista. Focada na redação assistida e gestão do ciclo de vida de documentos (CLM)", "Redação Assistida por IA: Geração automática de minutas, cláusulas contratuais e peças processuais baseadas em dados do caso, reduzindo o tempo de elaboração.", "Análise de Riscos: A IA lê contratos recebidos e aponta cláusulas perigosas ou fora do padrão da empresa.", "Repositório Seguro: Gestão de versões de documentos e assinatura digital integrada, garantindo que nada se perca."]}',
 ' <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 13.5V4a2 2 0 0 1 2-2h8.5L20 7.5V20a2 2 0 0 1-2 2h-5.5"/><polyline points="14 2 14 8 20 8"/><path d="M10.42 12.61a2.1 2.1 0 1 1 2.97 2.97L7.95 21 4 22l1-3.95 5.42-5.44Z"/></svg> ', true, 2),

('2a448445-a236-41f9-bbaa-0d2fa5f8c803', 'valorem', 'Valorem PRO', 
 '{"en": "Financial Controllership", "es": "Controlaría Financiera", "pt": "Controladoria Financeira"}', 
 '{"en": "Management of fees and precise legal calculations", "es": "Gestión de honorarios y cálculos judiciales precisos", "pt": "Gestão de honorários e cálculos judiciais precisos"}', 
 '{"pt": ["O \"Cofre\" Estratégico. Para a controladoria jurídica, gestão de honorários e faturamento", "Gestão de Honorários: Emissão automatizada de boletos e integração com PIX para recebimento de honorários.", "Cálculos Trabalhistas e Cíveis: Integração ou módulo similar ao PJe-Calc para liquidação de sentenças e atualização monetária precisa, evitando perdas na fase de execução.", "Provisionamento: Relatórios de contingência para departamentos jurídicos, calculando o risco financeiro de cada processo."]}',
 ' <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> ', true, 3),

('6221e886-1af4-4679-b7fa-aac29f01b2bf', 'cognitio', 'Cognitio PRO', 
 '{"en": "Advanced Jurimetrics", "es": "Jurimetría Avanzada", "pt": "Jurimetria Avançada"}', 
 '{"en": "Predictive analysis and dashboards for decision-making", "es": "Análisis predictivo y tableros para la toma de decisiones", "pt": "Análise predictiva e dashboards para tomada de decisão"}', 
 '{"pt": ["O \"Oráculo\" de Dados. Focado em transformar dados brutos em decisões estratégicas", "Análise Preditiva: Estimativa da probabilidade de êxito ou perda em uma ação judicial baseada no histórico do juiz ou tribunal específico.", "Dashboards Executivos: Gráficos visuais para monitorar KPIs como \"Taxa de Acordo\", \"Tempo Médio de Processo\" e \"Valor Médio de Condenação\".", "Visualização de Dados: Heatmaps and gráficos de tendências para identificar onde estão os maiores gargalos do escritório."]}',
 ' <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg> ', true, 5),

('f0fb201d-7ab3-4002-955e-f8c702118adf', 'sentinel', 'Sentinel PRO', 
 '{"en": "Surveillance and Monitoring", "es": "Vigilancia y Monitoreo", "pt": "Vigilância e Monitoramento"}', 
 '{"en": "Intelligent clipping and early capture of judicial proceedings", "es": "Clipping inteligente y captura anticipada de procesos judiciales", "pt": "Clipping inteligente e captura antecipada de processos judiciais"}', 
 '{"pt": ["O \"Radar\" do Ecossistema. De acordo com sua visão, esta suíte foca na captura de dados externos", "Clipping Inteligente: Monitoramento de termos, nomes de empresas ou sócios em jornais, revistas e fóruns, atuando como um sensor de riscos reputacionais e tendências.", "Captura Antecipada: Monitoramento da distribuição de novas ações (inclusive antes da citação oficial) para evitar a revelia e preparar defesas proativas.", "Análise de Sentimento: Uso de IA para ler notícias e classificar se o conteúdo é positivo, negativo ou neutro, gerando alertas de crise."]}',
 ' <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg> ', true, 1),

('f193e0e0-9065-4442-a58d-1bd22d03119e', 'vox', 'Vox Clientis', 
 '{"en": "CRM and Client Portal", "es": "CRM y Portal del Cliente", "pt": "CRM e Portal do Cliente"}', 
 '{"en": "Transparent communication and translation of \"legalese\"", "es": "Comunicación transparente y traducción del linguagem jurídico", "pt": "Comunicação transparente e tradução do \"juridiquês\""}', 
 '{"pt": ["A \"Voz\" do Ecossistema. Portal do cliente e gestão de relacionamento", "Portal do Cliente: Um aplicativo ou área web onde o cliente pode verificar o status do processo em tempo real, sem precisar ligar para o advogado.", "Tradução Jurídica via IA: O sistema extrai o \"juridiquês\" das atualizações processuais (ex: \"Concluso para decisão\") e envia uma mensagem automática via WhatsApp ao cliente explicando o significado em linguagem simples.", "Histórico de Relacionamento: CRM integrado para registrar todas as interações, propostas e documentos trocados."]}',
 ' <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> ', true, 4),

('d3e8b0e0-9065-4442-a58d-1bd22d03119c', 'intelligence', 'Intelligence Hub', 
 '{"en": "Proactive Intelligence", "es": "Inteligencia Proactiva", "pt": "Inteligência Proativa"}', 
 '{"en": "Strategic insights and proactive legal opportunities", "es": "Insights estratégicos y oportunidades legales proactivas", "pt": "Insights estratégicos e oportunidades jurídicas proativas"}', 
 '{"pt": ["O \"Farol\" de Oportunidades. Identifica riscos e chances de êxito antes mesmo da judicialização.", "Golden Alerts: Alertas automáticos baseados em teses do escritório.", "Busca Semântica: Cruzamento inteligente de publicações com base de conhecimento."]}',
 ' <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> ', true, 6)

ON CONFLICT (suite_key) DO UPDATE SET 
  name = EXCLUDED.name, 
  short_desc = EXCLUDED.short_desc, 
  detailed_desc = EXCLUDED.detailed_desc,
  features = EXCLUDED.features,
  icon_svg = EXCLUDED.icon_svg,
  order_index = EXCLUDED.order_index;

-- 14.2. Funcionalidades Granulares (Features)
INSERT INTO "public"."features" ("feature_key", "suite_id", "display_name", "description") VALUES 
('sentinel_clipping_midia', (SELECT id FROM public.suites WHERE suite_key = 'sentinel'), 'Clipping Inteligente', 'Monitoramento de marcas, empresas e sócios em jornais e portais de notícias.'), 
('sentinel_captura_antecipada', (SELECT id FROM public.suites WHERE suite_key = 'sentinel'), 'Captura Antecipada', 'Monitoramento de distribuição de novas ações antes da citação oficial.'), 
('sentinel_diarios', (SELECT id FROM public.suites WHERE suite_key = 'sentinel'), 'Monitoramento de Diários', 'Varredura automática de publicações em Diários Oficiais e de Justiça.'), 
('valorem_financeiro', (SELECT id FROM public.suites WHERE suite_key = 'valorem'), 'Gestão Financeira', 'Controle de honorários, contas a pagar/receber e fluxo de caixa.'), 
('valorem_pjecalc', (SELECT id FROM public.suites WHERE suite_key = 'valorem'), 'Integração PJe-Calc e Atualizações', 'Importação e leitura de cálculos trabalhistas e atualização monetária.'), 
('nexus_gestao_prazos', (SELECT id FROM public.suites WHERE suite_key = 'nexus'), 'Gestão de Processos e Prazos', 'Kanban, agenda e controle de prazos processuais.'), 
('nexus_gestao_ativos', (SELECT id FROM public.suites WHERE suite_key = 'nexus'), 'Gestão de Ativos e Bens', 'Controle de garantias, imóveis e frotas em litígio.'), 
('vox_portal', (SELECT id FROM public.suites WHERE suite_key = 'vox'), 'Portal do Cliente', 'Acesso seguro e exclusivo para o cliente acompanhar seus próprios processos.'), 
('scriptor_assinatura', (SELECT id FROM public.suites WHERE suite_key = 'scriptor'), 'Assinatura Digital', 'Envio e controle de assinaturas de documentos com validade jurídica.'), 
('nexus_controle_societario', (SELECT id FROM public.suites WHERE suite_key = 'nexus'), 'Controle Societário', 'Gestão do ciclo de vida de contratos não-financeiros.'), 
('cognitio_magistrados', (SELECT id FROM public.suites WHERE suite_key = 'cognitio'), 'Perfil de Magistrados', 'Mapeamento comportamental e taxa de condenações de juízes e varas.'), 
('valorem_provisionamento', (SELECT id FROM public.suites WHERE suite_key = 'valorem'), 'Relatórios de Contingência', 'Cálculo de provisão e valores retidos em garantia para diretoria.'), 
('scriptor_gerador_ia', (SELECT id FROM public.suites WHERE suite_key = 'scriptor'), 'Gerador de Peças (IA)', 'Redação automatizada de contratos e petições via inteligência artificial.'), 
('valorem_boletos_pix', (SELECT id FROM public.suites WHERE suite_key = 'valorem'), 'Emissão de Boletos e PIX', 'Geração de cobranças integradas com baixa automática para os clientes.'), 
('scriptor_auditoria_risco', (SELECT id FROM public.suites WHERE suite_key = 'scriptor'), 'Auditoria de Risco (IA)', 'Análise de documentos para identificação automática de cláusulas abusivas.'), 
('vox_whatsapp', (SELECT id FROM public.suites WHERE suite_key = 'vox'), 'Automação de WhatsApp', 'Envio ativo de alertas de audiências e atualizações diretamente no celular.'), 
('sentinel_analise_sentimento', (SELECT id FROM public.suites WHERE suite_key = 'sentinel'), 'Análise de Sentimento (IA)', 'Classificação automática de risco em notícias e andamentos processuais.'), 
('vox_traducao_ia', (SELECT id FROM public.suites WHERE suite_key = 'vox'), 'Tradução de Juridiquês (IA)', 'Tradução automática de andamentos complexos para linguagem acessível.'), 
('cognitio_dashboards', (SELECT id FROM public.suites WHERE suite_key = 'cognitio'), 'Dashboards Analíticos', 'Gráficos gerais de produtividade, volume processual e financeiro.'), 
('nexus_workflows', (SELECT id FROM public.suites WHERE suite_key = 'nexus'), 'Workflows Avançados', 'Automação de fluxos de trabalho e delegação inteligente de tarefas.'), 
('scriptor_ged', (SELECT id FROM public.suites WHERE suite_key = 'scriptor'), 'Repositório de Documentos (GED)', 'Armazenamento seguro em nuvem e versionamento de arquivos.'), 
('cognitio_preditiva', (SELECT id FROM public.suites WHERE suite_key = 'cognitio'), 'Análise Preditiva (IA)', 'Previsão de êxito e desfechos judiciais baseada em dados históricos.'),
('intelligence_golden_alerts', (SELECT id FROM public.suites WHERE suite_key = 'intelligence'), 'Golden Alerts', 'Monitoramento de oportunidades estratégicas.'),
('intelligence_matcher', (SELECT id FROM public.suites WHERE suite_key = 'intelligence'), 'Semantic Matcher', 'Busca semântica em base de conhecimento.'),
('nexus_gestao_equipe', (SELECT id FROM public.suites WHERE suite_key = 'nexus'), 'Gestão de Equipe e Workspace', 'Controle de usuários, cargos (RBAC) e configurações do escritório.'),
('nexus_gestao_pessoas', (SELECT id FROM public.suites WHERE suite_key = 'nexus'), 'Gestão de Pessoas (CRM Básico)', 'Cadastro centralizado de clientes, reclamados e testemunhas.')
ON CONFLICT (feature_key) DO UPDATE SET 
  suite_id = EXCLUDED.suite_id,
  display_name = EXCLUDED.display_name, 
  description = EXCLUDED.description;

-- 14.3. Planos (Plans)
INSERT INTO "public"."plans" ("id", "name", "short_desc", "monthly_price", "monthly_discount", "yearly_price", "yearly_discount", "features", "recommended", "active", "order_index", "is_combo") VALUES 
('38359901-d7dd-44f1-af1e-6742dbece451', 'Plano STRATEGY', '{"en": "Strategic infrastructure for large firms. Focus on predictive intelligence and data.", "pt": "Infraestrutura estratégica para grandes bancas. Foco em inteligência preditiva e dados."}', 1500.00, 5, 15000.00, 20, '{"en": ["Everything in GROWTH", "COGNITIO PRO (Jurimetrics)", "SENTINEL 360 (Media Clipping)", "NEXUS Advanced (Workflows)", "VIP Service Level (SLA)", "Monthly Risk Audit"], "pt": ["Tudo do Plano GROWTH", "COGNITIO PRO (Jurimetria)", "SENTINEL 360 (Clipping de Mídia)", "NEXUS Advanced (Workflows)", "Nível de Serviço (SLA) VIP", "Auditoria de Risco Mensual"]}', false, true, 2, true),
('47299adc-4802-4de9-a70f-8d787a9d6a5a', 'Plano START', '{"en": "The solid foundation for solo lawyers and small firms to enter the digital age.", "pt": "A base sólida para advogados autônomos e pequenos escritórios entrarem na era digital."}', 149, 5, 1490, 15, '{"en": ["NEXUS PRO (Basic)", "VALOREM PRO (Financial)", "Task Management (Kanban)", "Agenda and Deadlines", "Billing/Receipt Issuance", "Ticket Support"], "pt": ["NEXUS PRO (Básico)", "VALOREM PRO (Financeiro)", "Gestão de Processos (Kanban)", "Agenda e Prazos", "Emissão de Boletos/Recibos", "Suporte via Ticket"]}', false, true, 0, true),
('686737bd-12e5-43a3-ab0c-4852e8f1ba38', 'Scriptor Pro', '{"en": "The ultimate copilot for drafting legal documents with generative AI.", "pt": "O copiloto definitivo para elaboração de peças processuais com IA generativa."}', 149, 5, 1490, 15, '{"pt": ["Gerador de Peças via IA", "Analisador de Documentos", "Revisão Jurídica Inteligente", "Exportação Multi-formato"]}', false, true, 6, false),
('949b4b4c-ce51-4599-ae87-adf1b1dfb21d', 'Trial 14 Dias', '{"en": "", "es": "", "pt": ""}', 0, 0, 0, 0, '{"en": [], "es": [], "pt": []}', false, false, 99, false),
('de35de50-67b8-4176-aa7a-a04056213fea', 'Sentinel Radar', '{"en": "Smart case monitoring and official gazettes with early distribution capture.", "pt": "Monitoramento inteligente de processos e diários oficiais com Captura Antecipada."}', 89.90, 5, 899.00, 15, '{"pt": ["Monitoramento de Processos", "Recortes de Diários Oficiais", "Captura na Distribuição", "Alertas via E-mail/Push"]}', false, true, 3, false),
('e5c61e69-17d5-4154-8514-85b517ceae67', 'Plano GROWTH', '{"en": "The complete ecosystem for legal high performance with AI and service automation.", "pt": "O ecossistema completo para alta performance jurídica com IA e automação de atendimento."}', 450.00, 5, 4500.00, 20, '{"pt": ["Tudo do Plano START", "SCRIPTOR PRO (IA de Redação)", "SENTINEL PRO (Monitoramento Tribunais)", "VOX CLIENTIS (Canal do Cliente)", "Envio Automático WhatsApp", "IA Ilimitada (BYODB)"]}', true, true, 1, true),
('e830dc52-9c50-47af-bf1a-1b38380a3a2e', 'Sentinel 360º', '{"en": "Total intelligence: Courts + Media clipping, newspapers and brand monitoring.", "pt": "Inteligência total: Tribunais + Clipping de notícias, jornais e monitoramento de marca."}', 249, 5, 2490, 15, '{"pt": ["Tudo do Sentinel Radar", "Clipping de Web e Jornais", "Rastreamento de Marca/Nomes", "Relatórios de Reputação"]}', true, true, 4, false),
('ed8ce0f1-644b-4b9a-9b73-2db48939c2cf', 'Cognitio Pro', '{"en": "Entry-level jurimetrics for data-driven decisions and success probability.", "pt": "Jurimetria de entrada para decisões baseadas em dados e probabilidade de êxito."}', 399.00, 5, 3990.00, 15, '{"pt": ["Perfil de Juízes e Comarcas", "Probabilidade de Êxito", "Dashboards de BI Integrados", "Análise de Jurisprudência IA"]}', false, true, 5, false)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  short_desc = EXCLUDED.short_desc,
  monthly_price = EXCLUDED.monthly_price,
  yearly_price = EXCLUDED.yearly_price,
  features = EXCLUDED.features,
  active = EXCLUDED.active,
  order_index = EXCLUDED.order_index;

-- 14.4. Plan Permissions (Official Mapping - Robust)
-- Limpar mapeamentos antigos para garantir integridade com as novas subqueries
DELETE FROM "public"."plan_permissions";

INSERT INTO "public"."plan_permissions" ("plan_id", "feature_id") 
SELECT p.id, f.id
FROM (VALUES
  ('Plano START', 'nexus_gestao_prazos'),
  ('Plano START', 'nexus_workflows'),
  ('Plano START', 'valorem_financeiro'),
  ('Plano START', 'valorem_boletos_pix'),
  ('Plano START', 'valorem_pjecalc'),
  ('Plano START', 'sentinel_diarios'),
  ('Plano START', 'nexus_gestao_equipe'),
  ('Plano START', 'nexus_gestao_pessoas'),
  
  ('Plano GROWTH', 'valorem_financeiro'),
  ('Plano GROWTH', 'scriptor_ged'),
  ('Plano GROWTH', 'scriptor_gerador_ia'),
  ('Plano GROWTH', 'nexus_gestao_prazos'),
  ('Plano GROWTH', 'vox_traducao_ia'),
  ('Plano GROWTH', 'vox_whatsapp'),
  ('Plano GROWTH', 'cognitio_dashboards'),
  ('Plano GROWTH', 'intelligence_golden_alerts'),
  ('Plano GROWTH', 'intelligence_matcher'),
  ('Plano GROWTH', 'nexus_gestao_equipe'),
  ('Plano GROWTH', 'nexus_gestao_pessoas'),
  
  ('Plano STRATEGY', 'nexus_gestao_prazos'),
  ('Plano STRATEGY', 'valorem_boletos_pix'),
  ('Plano STRATEGY', 'sentinel_clipping_midia'),
  ('Plano STRATEGY', 'cognitio_magistrados'),
  ('Plano STRATEGY', 'valorem_financeiro'),
  ('Plano STRATEGY', 'nexus_gestao_ativos'),
  ('Plano STRATEGY', 'nexus_workflows'),
  ('Plano STRATEGY', 'scriptor_auditoria_risco'),
  ('Plano STRATEGY', 'scriptor_assinatura'),
  ('Plano STRATEGY', 'sentinel_analise_sentimento'),
  ('Plano STRATEGY', 'sentinel_captura_antecipada'),
  ('Plano STRATEGY', 'cognitio_preditiva'),
  ('Plano STRATEGY', 'vox_traducao_ia'),
  ('Plano STRATEGY', 'valorem_pjecalc'),
  ('Plano STRATEGY', 'vox_portal'),
  ('Plano STRATEGY', 'valorem_provisionamento'),
  ('Plano STRATEGY', 'vox_whatsapp'),
  ('Plano STRATEGY', 'scriptor_ged'),
  ('Plano STRATEGY', 'scriptor_gerador_ia'),
  ('Plano STRATEGY', 'sentinel_diarios'),
  ('Plano STRATEGY', 'intelligence_golden_alerts'),
  ('Plano STRATEGY', 'intelligence_matcher'),
  ('Plano STRATEGY', 'nexus_gestao_equipe'),
  ('Plano STRATEGY', 'nexus_gestao_pessoas')
) as mapping(p_name, f_key)
JOIN public.plans p ON p.name = mapping.p_name
JOIN public.features f ON f.feature_key = mapping.f_key;

-- 14.5. Configurações de E-mail (Email Scenarios)
INSERT INTO "public"."email_settings" ("id", "scenario_key", "config") VALUES 
('5bf4a16f-bfdd-4610-bc02-bf52497db550', 'support', '{"en": {"name": "Veritum Support", "email": "support@veritumpro.com"}, "pt": {"name": "Veritum Suporte", "email": "suporte@veritumpro.com"}}'), 
('8f398946-9c6e-4099-80e0-481ff4c8b666', 'general', '{"en": {"name": "Veritum PRO", "email": "contact@veritumpro.com"}, "pt": {"name": "Veritum PRO", "email": "contato@veritumpro.com"}}'), 
('cd64d500-4df9-411f-9b98-133e0ba6ff87', 'sales', '{"en": {"name": "Veritum Success", "email": "success@veritumpro.com"}, "pt": {"name": "Veritum Sucesso", "email": "sucesso@veritumpro.com"}}'), 
('f921d29d-59d4-42de-9560-ffdde1a6cc67', 'billing', '{"en": {"name": "Veritum Billing", "email": "billing@veritumpro.com"}, "pt": {"name": "Veritum Financeiro", "email": "financeiro@veritumpro.com"}}')
ON CONFLICT (scenario_key) DO UPDATE SET config = EXCLUDED.config;

-- 14.6. Templates de Grupos (Personas Padrão - Robust)
DELETE FROM "public"."group_templates";

INSERT INTO "public"."group_templates" ("name", "description", "default_features")
SELECT 'Sócio-Administrador', 'Visão total do ecossistema. Acesso irrestrito a todos os módulos e ferramentas.', array_agg(id)
FROM public.features;

INSERT INTO "public"."group_templates" ("name", "description", "default_features")
SELECT 'Advogado Sênior / Coordenador', 'Foco em estratégia jurídica e revisão. Acesso à Inteligência e Prazos.', array_agg(id)
FROM public.features WHERE feature_key IN ('nexus_gestao_prazos', 'nexus_workflows', 'scriptor_gerador_ia', 'scriptor_auditoria_risco', 'scriptor_ged', 'scriptor_assinatura', 'sentinel_diarios', 'sentinel_analise_sentimento', 'cognitio_dashboards', 'cognitio_magistrados', 'cognitio_preditiva', 'intelligence_golden_alerts', 'intelligence_matcher', 'nexus_gestao_equipe', 'nexus_gestao_pessoas');

INSERT INTO "public"."group_templates" ("name", "description", "default_features")
SELECT 'Advogado Associado / Júnior', 'Foco em execução processual e redação de peças.', array_agg(id)
FROM public.features WHERE feature_key IN ('nexus_gestao_prazos', 'scriptor_gerador_ia', 'scriptor_ged', 'sentinel_diarios', 'intelligence_golden_alerts', 'nexus_gestao_pessoas');

INSERT INTO "public"."group_templates" ("name", "description", "default_features")
SELECT 'Estagiário / Paralegal', 'Suporte operacional, organização de documentos e lançamentos simples.', array_agg(id)
FROM public.features WHERE feature_key IN ('nexus_gestao_prazos', 'scriptor_ged', 'sentinel_diarios', 'nexus_gestao_pessoas');

INSERT INTO "public"."group_templates" ("name", "description", "default_features")
SELECT 'Departamento Financeiro / Faturamento', 'Gestão de faturamento, boletos e contas sem acesso a peças jurídicas.', array_agg(id)
FROM public.features WHERE feature_key IN ('valorem_financeiro', 'valorem_boletos_pix', 'valorem_pjecalc', 'valorem_provisionamento', 'nexus_gestao_pessoas');

INSERT INTO "public"."group_templates" ("name", "description", "default_features")
SELECT 'Cliente (Acesso Externo B2B2C)', 'Acesso exclusivo ao Portal do Cliente para consulta de seus processos.', array_agg(id)
FROM public.features WHERE feature_key IN ('vox_portal');

INSERT INTO "public"."group_templates" ("name", "description", "default_features")
SELECT 'Controladoria Jurídica (Legal Ops)', 'Gestão de prazos, produtividade e auditoria de fluxo.', array_agg(id)
FROM public.features WHERE feature_key IN ('nexus_gestao_prazos', 'nexus_workflows', 'sentinel_diarios', 'cognitio_dashboards', 'scriptor_auditoria_risco');

INSERT INTO "public"."group_templates" ("name", "description", "default_features")
SELECT 'Secretariado / Recepção', 'Atendimento inicial, CRM e agendamentos simples.', array_agg(id)
FROM public.features WHERE feature_key IN ('nexus_gestao_prazos', 'nexus_gestao_pessoas', 'vox_whatsapp');

-- 💎 ONE-TIME MIGRATION: Garantir que alertas existentes tenham priority baseada no score/tipo
update public.golden_alerts
set priority = case 
    when intelligence_type = 'Risk' then 'High'
    when match_score >= 90 then 'High'
    when match_score >= 70 then 'Medium'
    else 'Low'
end
where priority is null;

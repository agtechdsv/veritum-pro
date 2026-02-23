-- Veritum Pro: Nexus PRO Foundation Schema
-- This script should be executed in your client's BYODB Supabase project.

-- Extensions
create extension if not exists vector;

-- 1. TEAM MANAGEMENT (Use Case 1)
create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text unique not null,
  phone text,
  role text check (role in ('Sócio', 'Advogado Associado', 'Estagiário', 'Paralegal', 'Financeiro')),
  oab_number text, -- Vital for Sentinel PRO robots
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

-- 2. CRM - PERSONS & CLIENTS (Use Case 2)
create table if not exists persons (
  id uuid primary key default gen_random_uuid(),
  person_type text check (person_type in ('Cliente', 'Reclamado', 'Testemunha', 'Preposto', 'Advogado Adverso')),
  full_name text not null,
  document text not null, -- CPF or CNPJ
  email text,
  phone text,
  rg text,
  legal_data jsonb, -- Progressive disclosure data: { marital_status, profession, ctps, pis, history }
  address jsonb, -- { cep, street, number, neighborhood, city, state }
  workspace_id uuid, -- For eventual multi-tenant setup (internal use)
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  unique(document) -- Block duplicate CPF/CNPJ
);

-- 3. LAWSIUT REGISTRATION (Use Case 3)
create table if not exists lawsuits (
  id uuid primary key default gen_random_uuid(),
  cnj_number text unique not null, -- Format: NNNNNNN-DD.AAAA.J.TR.OOOO
  case_title text,
  author_id uuid references persons(id),
  defendant_id uuid references persons(id),
  responsible_lawyer_id uuid references team_members(id),
  status text check (status in ('Ativo', 'Suspenso', 'Arquivado', 'Encerrado')),
  sphere text, -- e.g., 'Trabalhista', 'Cível', 'Federal'
  court text,  -- e.g., 'TRT2', 'TJSP'
  chamber text, -- Vara
  city text,
  state text,
  value numeric(15, 2),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

-- 4. KANBAN TASKS & DEADLINES (Use Case 4)
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  lawsuit_id uuid references lawsuits(id) on delete cascade,
  responsible_id uuid references team_members(id),
  status text check (status in ('A Fazer', 'Em Andamento', 'Concluído', 'Atrasado')) default 'A Fazer',
  priority text check (priority in ('Baixa', 'Média', 'Alta', 'Urgente')) default 'Média',
  due_date timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

-- Sentinel PRO & Vox Clientis (Andamentos/Updates)
create table if not exists movements (
  id uuid primary key default gen_random_uuid(),
  lawsuit_id uuid references lawsuits(id) on delete cascade,
  original_text text,
  translated_text text, -- AI translated for Vox
  sentiment_score float, -- AI scored for Sentinel
  source text default 'Manual',
  is_notified boolean default false,
  created_at timestamptz default now(),
  deleted_at timestamptz
);

-- Audit/Traceability (LGPD Conformity)
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id text, -- ID from the Veritum Auth
  action text, -- CREATE, UPDATE, DELETE, ACCESS
  table_name text,
  record_id uuid,
  details jsonb,
  created_at timestamptz default now()
);

-- Enable RLS
alter table team_members enable row level security;
alter table persons enable row level security;
alter table lawsuits enable row level security;
alter table tasks enable row level security;
alter table movements enable row level security;
alter table audit_logs enable row level security;

-- Basic Policies (Auth users of the client project)
create policy "Allow all to auth" on team_members for all using (auth.role() = 'authenticated');
create policy "Allow all to auth" on persons for all using (auth.role() = 'authenticated');
create policy "Allow all to auth" on lawsuits for all using (auth.role() = 'authenticated');
create policy "Allow all to auth" on tasks for all using (auth.role() = 'authenticated');
create policy "Allow all to auth" on movements for all using (auth.role() = 'authenticated');
create policy "Allow all to auth" on audit_logs for all using (auth.role() = 'authenticated');

-- ==========================================
-- SENTINEL PRO: Intelligence & Capture
-- ==========================================

-- Monitoring Alerts: Terms, OABs, or CNJs to track
create table if not exists monitoring_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid(),
  title text not null,
  term text not null,
  alert_type text check (alert_type in ('OAB', 'CNJ', 'Keyword', 'Company', 'Person')),
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  deleted_at timestamp with time zone
);

-- Captured Clippings/Publications
create table if not exists clippings (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid references monitoring_alerts(id) on delete cascade,
  source text,
  content text not null,
  sentiment text check (sentiment in ('Positivo', 'Negativo', 'Neutro')),
  score float,
  url text,
  lawsuit_id uuid references lawsuits(id) on delete set null,
  captured_at timestamp with time zone default now()
);

alter table monitoring_alerts enable row level security;
alter table clippings enable row level security;

create policy "Allow all auth to alerts" on monitoring_alerts for all using (auth.role() = 'authenticated');
create policy "Allow all auth to clippings" on clippings for all using (auth.role() = 'authenticated');

-- ==========================================
-- SCRIPTOR PRO: AI Drafting & Automation
-- ==========================================

-- Document Templates: Reusable prompts or structures
create table if not exists document_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text, -- e.g., 'Contestação', 'Petição', 'Contrato'
  base_prompt text not null,
  created_at timestamp with time zone default now(),
  deleted_at timestamp with time zone
);

-- Legal Documents: Drafts and historical versions
create table if not exists legal_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,
  lawsuit_id uuid references lawsuits(id) on delete set null,
  author_id uuid references team_members(id) on delete set null,
  template_id uuid references document_templates(id) on delete set null,
  version integer default 1,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table document_templates enable row level security;
alter table legal_documents enable row level security;

create policy "Allow all auth to templates" on document_templates for all using (auth.role() = 'authenticated');
create policy "Allow all auth to documents" on legal_documents for all using (auth.role() = 'authenticated');

-- ==========================================
-- VALOREM PRO: Financial Management
-- ==========================================

-- Financial Transactions: Cash flow control
create table if not exists financial_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid(),
  title text not null,
  amount decimal(12,2) not null,
  entry_type text check (entry_type in ('Credit', 'Debit')),
  category text, -- e.g., 'Honorários', 'Custas', 'Operacional'
  transaction_date timestamp with time zone default now(),
  lawsuit_id uuid references lawsuits(id) on delete set null,
  person_id uuid references persons(id) on delete set null,
  status text check (status in ('Pago', 'Pendente', 'Cancelado')) default 'Pendente',
  created_at timestamp with time zone default now(),
  deleted_at timestamp with time zone
);

alter table financial_transactions enable row level security;

create policy "Allow all auth to transactions" on financial_transactions for all using (auth.role() = 'authenticated');

-- ==========================================
-- COGNITIO PRO: Legal Intelligence & Knowledge
-- ==========================================

-- Knowledge Articles: Shared theses and research
create table if not exists knowledge_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  category text,
  tags text[],
  author_id uuid references team_members(id),
  created_at timestamp with time zone default now(),
  deleted_at timestamp with time zone
);

-- Case Outcomes: Data for predictive mining
create table if not exists historical_outcomes (
  id uuid primary key default gen_random_uuid(),
  judge_name text,
  court text,
  case_type text,
  outcome text check (outcome in ('Procedente', 'Parcialmente Procedente', 'Improcedente')),
  decision_date date,
  created_at timestamp with time zone default now(),
  deleted_at timestamp with time zone
);

alter table knowledge_articles enable row level security;
alter table historical_outcomes enable row level security;

create policy "Allow all auth to knowledge" on knowledge_articles for all using (auth.role() = 'authenticated');
create policy "Allow all auth to historical_outcomes" on historical_outcomes for all using (auth.role() = 'authenticated');

-- ==========================================
-- VOX PRO: Communication & Client Support
-- ==========================================

-- Chats: Conversation containers
create table if not exists chats (
  id uuid primary key default gen_random_uuid(),
  person_id uuid references persons(id) on delete cascade,
  lawsuit_id uuid references lawsuits(id) on delete set null,
  status text check (status in ('Aberto', 'Encerrado', 'Arquivado')) default 'Aberto',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Chat Messages: Individual messages
create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid references chats(id) on delete cascade,
  sender_id uuid default auth.uid(), -- Authenticated user (lawyer)
  sender_type text check (sender_type in ('Lawyer', 'Client', 'AI')) default 'Lawyer',
  content text not null,
  is_read boolean default false,
  created_at timestamp with time zone default now(),
  deleted_at timestamp with time zone
);

alter table chats enable row level security;
alter table chat_messages enable row level security;

create policy "Allow all auth to chats" on chats for all using (auth.role() = 'authenticated');
create policy "Allow all auth to chat_messages" on chat_messages for all using (auth.role() = 'authenticated');

-- Enable Realtime for Chat Messages
alter publication supabase_realtime add table chat_messages;

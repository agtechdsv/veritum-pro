-- ============================================================================
-- VERITUM PRO: FINAL MASTER SCHEMA (SAAS CONTROL PLANE)
-- ============================================================================
-- Description: Banco de Dados Mestre da Trademaster Pro.
-- Responsável por: Auth, Cobrança, Licenciamento (Planos/Suítes) e Segurança Global (RBAC).

-- 0. LIMPEZA (DROP)
drop table if exists public.user_subscriptions cascade;
drop table if exists public.audit_logs cascade;
drop table if exists public.group_permissions cascade;
drop table if exists public.group_templates cascade;
drop table if exists public.roles cascade;
drop table if exists public.access_groups cascade;
drop table if exists public.plan_permissions cascade;
drop table if exists public.features cascade;
drop table if exists public.suites cascade;
drop table if exists public.plans cascade;
drop table if exists public.user_preferences cascade;
drop table if exists public.email_settings cascade;
drop table if exists public.app_settings cascade;
drop table if exists public.demo_requests cascade;
drop table if exists public.users cascade;
drop function if exists handle_updated_at() cascade;

-- 1. INFRAESTRUTURA
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

create or replace function handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- 2. GESTÃO DE USUÁRIOS E AUTH (Sincronização com Supabase Auth)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  username text unique not null,
  role text default 'Administrador',
  active boolean default true,
  avatar_url text,
  cpf_cnpj text,
  phone text,
  access_group_id uuid,
  plan_id uuid,
  parent_user_id uuid references public.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  -- Idioma e Tema agora são exclusivos do LocalStorage (Sole Source of Truth)
  
  -- BYODB Campos (Chaves do Inquilino/Cliente)
  custom_supabase_url text,
  custom_supabase_key text,
  custom_gemini_key text,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. FUNDAÇÃO RBAC & PLANOS
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

create table if not exists public.features (
    id uuid primary key default gen_random_uuid(),
    feature_key text unique not null,
    suite_id uuid not null references public.suites(id) on delete cascade,
    display_name text not null,
    description text,
    created_at timestamptz default now()
);

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

create table if not exists public.plan_permissions (
    id uuid primary key default gen_random_uuid(),
    plan_id uuid not null references public.plans(id) on delete cascade,
    feature_id uuid not null references public.features(id) on delete cascade,
    created_at timestamptz default now(),
    unique(plan_id, feature_id)
);

create table if not exists public.user_subscriptions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null unique references auth.users(id) on delete cascade,
    plan_id uuid not null references public.plans(id) on delete cascade,
    start_date timestamptz default now(),
    end_date timestamptz,
    status text default 'active' check (status in ('active', 'expired', 'canceled')),
    is_trial boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Trigger for updated_at on user_subscriptions
create trigger set_updated_at_subscriptions
    before update on public.user_subscriptions
    for each row
    execute function public.handle_updated_at();

-- Restrição de Plans na tabela Users
alter table public.users add constraint fk_user_plan foreign key (plan_id) references public.plans(id) on delete set null;

-- Grupos de Acesso Globais & Roles do Cliente (RBAC de Negócio)
create table if not exists public.access_groups (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    admin_id uuid not null references auth.users(id) on delete cascade, 
    created_at timestamptz default now(),
    unique(admin_id, name)
);

create table if not exists public.roles (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    access_group_id uuid references public.access_groups(id) on delete set null,
    admin_id uuid not null references auth.users(id) on delete cascade,
    created_at timestamptz default now(),
    unique(admin_id, name)
);

create table if not exists public.group_templates (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    description text,
    default_features uuid[],
    created_at timestamptz default now()
);

create table if not exists public.group_permissions (
    id uuid primary key default gen_random_uuid(),
    group_id uuid references public.access_groups(id) on delete cascade,
    feature_id uuid references public.features(id) on delete cascade,
    can_access boolean default true,
    created_at timestamptz default now(),
    unique(group_id, feature_id)
);

alter table public.users add constraint fk_user_access_group foreign key (access_group_id) references public.access_groups(id) on delete set null;

-- 4. CONFIGURAÇÕES & AUDITORIA MASTER
create table if not exists public.app_settings (
  id uuid primary key default gen_random_uuid(),
  office_name text,
  whatsapp_api_url text,
  theme_color text,
  created_at timestamptz default now()
);

-- 4.1. ORGANIZAÇÕES (DADOS DO ESCRITÓRIO/EMPRESA)
create table if not exists public.organizations (
    id uuid primary key default gen_random_uuid(),
    admin_id uuid not null references auth.users(id) on delete cascade unique,
    company_name text,
    trading_name text,
    cnpj text,
    email text,
    phone text,
    website text,
    address_zip text,
    address_street text,
    address_number text,
    address_complement text,
    address_neighborhood text,
    address_city text,
    address_state text,
    logo_url text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

alter table public.organizations enable row level security;

DROP POLICY IF EXISTS "Owners can manage their organization" ON public.organizations;
CREATE POLICY "Owners can manage their organization" ON public.organizations 
FOR ALL USING (auth.uid() = admin_id);

DROP POLICY IF EXISTS "Team members can read organization data" ON public.organizations;
CREATE POLICY "Team members can read organization data" ON public.organizations 
FOR SELECT USING (
    auth.uid() = admin_id OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND parent_user_id = organizations.admin_id)
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
    status text not null default 'pending',
    created_at timestamptz default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  action text,
  table_name text,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz default now()
);

-- 4.2. GESTÃO FINTECH (ASAAS SUB-ACCOUNTS / MARKETPLACE)
create table if not exists public.asaas_sub_accounts (
    id uuid primary key default gen_random_uuid(),
    admin_id uuid references public.users(id) on delete cascade,
    asaas_id text not null unique,                  -- ID da conta no Asaas (ex: '612345')
    api_key text not null,                          -- Chave de API da subconta (DEVE ser criptografada em prod)
    wallet_id text,                                 -- ID da carteira para transferências
    account_type text check (account_type in ('product', 'user')), -- 'product' (Veritum/Trader) ou 'user' (Cliente final)
    branding_name text not null,                    -- O "Nome Fantasia" que aparecerá no boleto/pix
    status text default 'active',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 4.3. GESTÃO DE PAGAMENTOS (ASAAS INVOICES)
create table if not exists public.payments (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.users(id) on delete cascade,
    asaas_payment_id text unique,
    external_reference text,
    amount numeric,
    status text,
    payment_method text,
    asaas_response jsonb,
    webhook_payload jsonb,
    webhook_received_at timestamptz,
    webhook_processed boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create trigger tr_payments_updated before update on public.payments for each row execute function handle_updated_at();

alter table public.asaas_sub_accounts enable row level security;
alter table public.payments enable row level security;

CREATE POLICY "Master and Admins can view sub-accounts" ON public.asaas_sub_accounts
FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'Master' OR 
    auth.uid() = admin_id
);

-- ==========================================
-- 5. FUNCTION & TRIGGERS MASTER (Somente para a camada Master)
-- ==========================================

-- 5.1 Auto-Seed de Grupos e Cargos baseados em Templates
CREATE OR REPLACE FUNCTION public.seed_user_workspace(new_admin_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Se o usuário for um "Membro de Equipe" (tem parent_user_id), abortar.
    -- Só criamos workspace root para donos de escritório (Master ou Administrador orgânico).
    IF EXISTS (SELECT 1 FROM public.users WHERE id = new_admin_id AND parent_user_id IS NOT NULL) THEN
        RETURN;
    END IF;

    -- 1.1 Cadastra os 8 Access Groups atrelados a este novo admin
    INSERT INTO "public"."access_groups" ("id", "name", "admin_id")
    SELECT gen_random_uuid(), name, new_admin_id
    FROM "public"."group_templates"
    ON CONFLICT DO NOTHING;

    -- 1.2 Atrela as Features exatas de cada Template para cada um dos Grupos gerados
    INSERT INTO "public"."group_permissions" ("group_id", "feature_id")
    SELECT g.id, unnest(t.default_features)
    FROM "public"."access_groups" g
    JOIN "public"."group_templates" t ON t.name = g.name
    WHERE g.admin_id = new_admin_id
    ON CONFLICT DO NOTHING;

    -- 1.3 GERAR CARGOS (ROLES) VINCULADOS
    -- GRUPO 1: Sócio-Administrador
    INSERT INTO "public"."roles" (name, access_group_id, admin_id)
    SELECT unnest(ARRAY['Sócio Administrador', 'Sócio Fundador', 'Diretor Jurídico', 'Gestor Geral']), id, new_admin_id
    FROM "public"."access_groups" WHERE name = 'Sócio-Administrador' AND admin_id = new_admin_id;

    -- GRUPO 2: Advogado Sênior / Coordenador
    INSERT INTO "public"."roles" (name, access_group_id, admin_id)
    SELECT unnest(ARRAY['Advogado Sênior', 'Coordenador Jurídico', 'Head de Área', 'Gestor Contencioso']), id, new_admin_id
    FROM "public"."access_groups" WHERE name = 'Advogado Sênior / Coordenador' AND admin_id = new_admin_id;

    -- GRUPO 3: Advogado Associado / Júnior
    INSERT INTO "public"."roles" (name, access_group_id, admin_id)
    SELECT unnest(ARRAY['Advogado Associado', 'Advogado Júnior', 'Advogado Pleno', 'Advogado Trabalhista']), id, new_admin_id
    FROM "public"."access_groups" WHERE name = 'Advogado Associado / Júnior' AND admin_id = new_admin_id;

    -- GRUPO 4: Estagiário / Paralegal
    INSERT INTO "public"."roles" (name, access_group_id, admin_id)
    SELECT unnest(ARRAY['Estagiário', 'Paralegal', 'Assistente Jurídico', 'Auxiliar Administrativo']), id, new_admin_id
    FROM "public"."access_groups" WHERE name = 'Estagiário / Paralegal' AND admin_id = new_admin_id;

    -- GRUPO 5: Departamento Financeiro / Faturamento
    INSERT INTO "public"."roles" (name, access_group_id, admin_id)
    SELECT unnest(ARRAY['Gerente Financeiro', 'Analista Financeiro', 'Assistente de Faturamento', 'Auxiliar de Cobrança']), id, new_admin_id
    FROM "public"."access_groups" WHERE name = 'Departamento Financeiro / Faturamento' AND admin_id = new_admin_id;

    -- GRUPO 6: Controladoria Jurídica (Legal Ops)
    INSERT INTO "public"."roles" (name, access_group_id, admin_id)
    SELECT unnest(ARRAY['Controller Jurídico', 'Analista de Legal Ops', 'Analista de Dados Jurídicos', 'Engenheiro Jurídico']), id, new_admin_id
    FROM "public"."access_groups" WHERE name = 'Controladoria Jurídica (Legal Ops)' AND admin_id = new_admin_id;

    -- GRUPO 7: Secretariado / Recepção
    INSERT INTO "public"."roles" (name, access_group_id, admin_id)
    SELECT unnest(ARRAY['Secretária Executiva', 'Recepcionista', 'Assistente de Atendimento', 'Telefonista']), id, new_admin_id
    FROM "public"."access_groups" WHERE name = 'Secretariado / Recepção' AND admin_id = new_admin_id;

    -- GRUPO 8: Cliente (Acesso Externo B2B2C)
    INSERT INTO "public"."roles" (name, access_group_id, admin_id)
    SELECT unnest(ARRAY['Cliente (Pessoa Física)', 'Representante Legal (Empresa)']), id, new_admin_id
    FROM "public"."access_groups" WHERE name = 'Cliente (Acesso Externo B2B2C)' AND admin_id = new_admin_id;

END;
$$;

-- 5.2 Trigger de Criação de Novo Usuário (Auth Hook)
create or replace function public.handle_new_user()
returns trigger as $$
declare
  default_role text := 'Administrador';
  user_role text;
  user_name text;
  user_plan_id uuid;
  generated_group_id uuid;
begin
  user_role := coalesce(new.raw_user_meta_data->>'role', default_role);
  user_name := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Usuário');
  user_plan_id := (new.raw_user_meta_data->>'plan_id')::uuid;

  if user_plan_id is null then select id into user_plan_id from public.plans where name = 'Trial 14 Dias' limit 1; end if;

  insert into public.users (id, name, username, role, active, avatar_url, parent_user_id, plan_id, access_group_id)
  values (new.id, user_name, new.email, user_role, true, coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'), (new.raw_user_meta_data->>'parent_user_id')::uuid, user_plan_id, (new.raw_user_meta_data->>'access_group_id')::uuid)
  on conflict (id) do update set role = excluded.role, name = excluded.name, plan_id = excluded.plan_id, access_group_id = excluded.access_group_id;

  if user_plan_id is not null then
     insert into public.user_subscriptions (user_id, plan_id, start_date, end_date, status, is_trial)
     values (new.id, user_plan_id, now(), case when (new.raw_user_meta_data->>'parent_user_id') is not null then null else now() + interval '14 days' end, 'active', case when (new.raw_user_meta_data->>'parent_user_id') is not null then false else true end)
     on conflict do nothing;
  end if;

  insert into public.user_preferences (user_id) values (new.id) on conflict (user_id) do nothing;

  update auth.users set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', user_role, 'full_name', user_name, 'name', user_name, 'plan_id', user_plan_id, 'access_group_id', (new.raw_user_meta_data->>'access_group_id')) where id = new.id;
  
  -- AUTO-SEED: Gera grupos e cargos padrões para este novo workspace (se for Titular/Admin Root)
  PERFORM public.seed_user_workspace(new.id);
  
  -- CRIA A ENTRADA DA ORGANIZAÇÃO (DADOS DO ESCRITÓRIO) PARA O ROOT
  IF (new.raw_user_meta_data->>'parent_user_id') IS NULL THEN
      INSERT INTO public.organizations (admin_id, company_name)
      VALUES (new.id, user_name || ' - Escritório')
      ON CONFLICT (admin_id) DO NOTHING;
  END IF;
  
  -- VINCULA O PIONEIRO (ROOT) AO GRUPO DE SÓCIO-ADMINISTRADOR
  if (new.raw_user_meta_data->>'parent_user_id') is null then
      select id into generated_group_id from public.access_groups where admin_id = new.id and name = 'Sócio-Administrador' limit 1;
      
      if generated_group_id is not null then
          -- Atualiza o registro visível
          update public.users 
          set access_group_id = generated_group_id, role = 'Sócio Administrador'
          where id = new.id;
          
          -- Sincroniza de volta no metadata do Auth
          update auth.users 
          set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('access_group_id', generated_group_id, 'role', 'Sócio Administrador')
          where id = new.id;
      end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.handle_updated_user()
returns trigger as $$
begin
  update auth.users set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', new.role, 'full_name', new.name, 'name', new.name, 'parent_user_id', new.parent_user_id, 'active', new.active, 'plan_id', new.plan_id, 'access_group_id', new.access_group_id) where id = new.id;
  if (old.active is distinct from new.active) then update public.users set active = new.active where parent_user_id = new.id; end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_public_user_updated after update on public.users for each row when (old.role is distinct from new.role or old.name is distinct from new.name or old.parent_user_id is distinct from new.parent_user_id or old.active is distinct from new.active) execute function public.handle_updated_user();

create trigger tr_users_updated before update on public.users for each row execute function handle_updated_at();
create trigger tr_user_prefs_updated before update on public.user_preferences for each row execute function handle_updated_at();
create trigger tr_organizations_updated before update on public.organizations for each row execute function handle_updated_at();

-- RLS Básico MASTER
alter table public.users enable row level security;
alter table public.user_preferences enable row level security;
alter table public.user_subscriptions enable row level security;
alter table public.suites enable row level security;
alter table public.features enable row level security;
alter table public.plans enable row level security;
alter table public.plan_permissions enable row level security;
alter table public.access_groups enable row level security;
alter table public.group_permissions enable row level security;
alter table public.roles enable row level security;

-- Insira a mesma lógica de RLS do schema original aqui depois.

-- ============================================================================
-- 14. SEED DATA (Initial Setup)
-- ============================================================================

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
SELECT 'Sócio-Administrador', 'Acesso total e irrestrito, incluindo configurações de workspace e faturamento.', array_agg(id)
FROM public.features;

INSERT INTO "public"."group_templates" ("name", "description", "default_features")
SELECT 'Advogado Sênior / Coordenador', 'Gestores operacionais, aprovação de peças e análise de risco, sem acesso ao financeiro/configurações.', array_agg(id)
FROM public.features WHERE feature_key IN ('nexus_gestao_prazos', 'nexus_workflows', 'scriptor_gerador_ia', 'scriptor_auditoria_risco', 'scriptor_ged', 'scriptor_assinatura', 'sentinel_diarios', 'sentinel_analise_sentimento', 'cognitio_dashboards', 'cognitio_magistrados', 'cognitio_preditiva', 'intelligence_golden_alerts', 'intelligence_matcher', 'nexus_gestao_equipe', 'nexus_gestao_pessoas');

INSERT INTO "public"."group_templates" ("name", "description", "default_features")
SELECT 'Advogado Associado / Júnior', 'A base operacional: cadastro, IA, processos e prazos, sem visão estratégica global.', array_agg(id)
FROM public.features WHERE feature_key IN ('nexus_gestao_prazos', 'scriptor_gerador_ia', 'scriptor_ged', 'sentinel_diarios', 'intelligence_golden_alerts', 'nexus_gestao_pessoas');

INSERT INTO "public"."group_templates" ("name", "description", "default_features")
SELECT 'Estagiário / Paralegal', 'Foco em alimentar o sistema, cadastrar pessoas e anexar documentos, sem redigir com IA ou assinar.', array_agg(id)
FROM public.features WHERE feature_key IN ('nexus_gestao_prazos', 'scriptor_ged', 'sentinel_diarios', 'nexus_gestao_pessoas');

INSERT INTO "public"."group_templates" ("name", "description", "default_features")
SELECT 'Departamento Financeiro / Faturamento', 'Foco total no Valorem PRO, caixa e emissão de boletos, isolado dos documentos jurídicos.', array_agg(id)
FROM public.features WHERE feature_key IN ('valorem_financeiro', 'valorem_boletos_pix', 'valorem_pjecalc', 'valorem_provisionamento', 'nexus_gestao_pessoas');

INSERT INTO "public"."group_templates" ("name", "description", "default_features")
SELECT 'Cliente (Acesso Externo B2B2C)', 'Acesso exclusivo ao Portal do Cliente para consulta de seus processos.', array_agg(id)
FROM public.features WHERE feature_key IN ('vox_portal');

INSERT INTO "public"."group_templates" ("name", "description", "default_features")
SELECT 'Controladoria Jurídica (Legal Ops)', 'O cérebro das automações, prazos e relatórios de jurimetria.', array_agg(id)
FROM public.features WHERE feature_key IN ('nexus_gestao_prazos', 'nexus_workflows', 'sentinel_diarios', 'cognitio_dashboards', 'scriptor_auditoria_risco');

INSERT INTO "public"."group_templates" ("name", "description", "default_features")
SELECT 'Secretariado / Recepção', 'A linha de frente: cadastro básico de clientes e atendimento via WhatsApp.', array_agg(id)
FROM public.features WHERE feature_key IN ('nexus_gestao_prazos', 'nexus_gestao_pessoas', 'vox_whatsapp');

-- 14.7. GERAR ACCESS GROUPS GLOBAIS (SISTEMA) A PARTIR DOS TEMPLATES
DO $$
DECLARE
  master_id uuid;
BEGIN
  SELECT id INTO master_id FROM public.users WHERE role = 'Master' LIMIT 1;

  IF master_id IS NOT NULL THEN
    DELETE FROM "public"."access_groups" WHERE admin_id = master_id AND name IN (SELECT name FROM "public"."group_templates");

    INSERT INTO "public"."access_groups" ("id", "name", "admin_id")
    SELECT gen_random_uuid(), name, master_id
    FROM "public"."group_templates";

    INSERT INTO "public"."group_permissions" ("group_id", "feature_id")
    SELECT g.id, unnest(t.default_features)
    FROM "public"."access_groups" g
    JOIN "public"."group_templates" t ON t.name = g.name
    WHERE g.admin_id = master_id
    ON CONFLICT DO NOTHING;

    -- ==========================================
    -- 14.8. GERAR CARGOS (ROLES) VINCULADOS
    -- ==========================================
    DELETE FROM "public"."roles" WHERE admin_id = master_id;

    -- GRUPO 1: Sócio-Administrador
    INSERT INTO "public"."roles" (name, access_group_id, admin_id)
    SELECT unnest(ARRAY['Sócio Administrador', 'Sócio Fundador', 'Diretor Jurídico', 'Gestor Geral']), id, master_id
    FROM "public"."access_groups" WHERE name = 'Sócio-Administrador' AND admin_id = master_id;

    -- GRUPO 2: Advogado Sênior / Coordenador
    INSERT INTO "public"."roles" (name, access_group_id, admin_id)
    SELECT unnest(ARRAY['Advogado Sênior', 'Coordenador Jurídico', 'Head de Área', 'Gestor Contencioso']), id, master_id
    FROM "public"."access_groups" WHERE name = 'Advogado Sênior / Coordenador' AND admin_id = master_id;

    -- GRUPO 3: Advogado Associado / Júnior
    INSERT INTO "public"."roles" (name, access_group_id, admin_id)
    SELECT unnest(ARRAY['Advogado Associado', 'Advogado Júnior', 'Advogado Pleno', 'Advogado Trabalhista']), id, master_id
    FROM "public"."access_groups" WHERE name = 'Advogado Associado / Júnior' AND admin_id = master_id;

    -- GRUPO 4: Estagiário / Paralegal
    INSERT INTO "public"."roles" (name, access_group_id, admin_id)
    SELECT unnest(ARRAY['Estagiário', 'Paralegal', 'Assistente Jurídico', 'Auxiliar Administrativo']), id, master_id
    FROM "public"."access_groups" WHERE name = 'Estagiário / Paralegal' AND admin_id = master_id;

    -- GRUPO 5: Departamento Financeiro / Faturamento
    INSERT INTO "public"."roles" (name, access_group_id, admin_id)
    SELECT unnest(ARRAY['Gerente Financeiro', 'Analista Financeiro', 'Assistente de Faturamento', 'Auxiliar de Cobrança']), id, master_id
    FROM "public"."access_groups" WHERE name = 'Departamento Financeiro / Faturamento' AND admin_id = master_id;

    -- GRUPO 6: Controladoria Jurídica (Legal Ops)
    INSERT INTO "public"."roles" (name, access_group_id, admin_id)
    SELECT unnest(ARRAY['Controller Jurídico', 'Analista de Legal Ops', 'Analista de Dados Jurídicos', 'Engenheiro Jurídico']), id, master_id
    FROM "public"."access_groups" WHERE name = 'Controladoria Jurídica (Legal Ops)' AND admin_id = master_id;

    -- GRUPO 7: Secretariado / Recepção
    INSERT INTO "public"."roles" (name, access_group_id, admin_id)
    SELECT unnest(ARRAY['Secretária Executiva', 'Recepcionista', 'Assistente de Atendimento', 'Telefonista']), id, master_id
    FROM "public"."access_groups" WHERE name = 'Secretariado / Recepção' AND admin_id = master_id;

    -- GRUPO 8: Cliente (Acesso Externo B2B2C)
    INSERT INTO "public"."roles" (name, access_group_id, admin_id)
    SELECT unnest(ARRAY['Cliente (Pessoa Física)', 'Representante Legal (Empresa)']), id, master_id
    FROM "public"."access_groups" WHERE name = 'Cliente (Acesso Externo B2B2C)' AND admin_id = master_id;

  END IF;
END $$;

-- ============================================================================
-- 15. SEGURANÇA (RLS DO MASTER)
-- ============================================================================

-- 15.1. Habilitar RLS nas tabelas Master
alter table public.users enable row level security;
alter table public.user_preferences enable row level security;
alter table public.user_subscriptions enable row level security;
alter table public.suites enable row level security;
alter table public.features enable row level security;
alter table public.plans enable row level security;
alter table public.plan_permissions enable row level security;
alter table public.access_groups enable row level security;
alter table public.group_permissions enable row level security;
alter table public.roles enable row level security;
alter table public.group_templates enable row level security;
alter table public.app_settings enable row level security;
alter table public.email_settings enable row level security;
alter table public.demo_requests enable row level security;
alter table public.audit_logs enable row level security;

-- 15.2. Políticas de Acesso
DROP POLICY IF EXISTS "Master: Full Control" ON public.users;
CREATE POLICY "Master: Full Control" ON public.users FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Master');

DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
CREATE POLICY "Users can read own profile" ON public.users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can read their team" ON public.users;
CREATE POLICY "Admins can read their team" ON public.users FOR SELECT USING (auth.uid() = parent_user_id);

DROP POLICY IF EXISTS "Users can update own basic data" ON public.users;
CREATE POLICY "Users can update own basic data" ON public.users 
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users manage self preferences" ON public.user_preferences;
CREATE POLICY "Users manage self preferences" ON public.user_preferences FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can read suites" ON public.suites;
CREATE POLICY "Authenticated users can read suites" ON public.suites FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Master: Full Control on suites" ON public.suites;
CREATE POLICY "Master: Full Control on suites" ON public.suites FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Master');

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

DROP POLICY IF EXISTS "Admins can view their own roles" ON public.roles;
CREATE POLICY "Admins can view their own roles" ON public.roles FOR SELECT USING (admin_id = auth.uid() OR admin_id = (SELECT parent_user_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can insert their own roles" ON public.roles;
CREATE POLICY "Admins can insert their own roles" ON public.roles FOR INSERT WITH CHECK (admin_id = auth.uid());

DROP POLICY IF EXISTS "Admins can update their own roles" ON public.roles;
CREATE POLICY "Admins can update their own roles" ON public.roles FOR UPDATE USING (admin_id = auth.uid());

DROP POLICY IF EXISTS "Admins can delete their own roles" ON public.roles;
CREATE POLICY "Admins can delete their own roles" ON public.roles FOR DELETE USING (admin_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can read email_settings" ON public.email_settings;
CREATE POLICY "Authenticated users can read email_settings" ON public.email_settings FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can read app_settings" ON public.app_settings;
CREATE POLICY "Authenticated users can read app_settings" ON public.app_settings FOR SELECT USING (auth.role() = 'authenticated');


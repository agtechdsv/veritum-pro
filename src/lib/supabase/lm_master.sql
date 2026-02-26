-- ============================================================================
-- 1. SCRIPT MASTER (SEU SUPABASE) - O CÉREBRO COMERCIAL E MÓDULOS
-- ============================================================================

create extension if not exists "uuid-ossp";

-- 1. Controle de Clientes (Workspaces/Tenants) - TABELA NOVA
create table if not exists public.workspaces (
    id uuid primary key default gen_random_uuid(),
    office_name text not null,
    domain_url text, 
    admin_email text not null,
    plan_id uuid, -- Referência ao plano contratado
    supabase_url text, -- Onde está o banco deste cliente
    supabase_anon_key text,
    is_active boolean default true,
    created_at timestamptz default now()
);

-- 2. Suítes (Módulos) [Sua tabela original]
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

-- 3. Funcionalidades Granulares (Features) [Sua tabela original]
create table if not exists public.features (
    id uuid primary key default gen_random_uuid(),
    feature_key text unique not null,
    suite_id uuid not null references public.suites(id) on delete cascade,
    display_name text not null,
    description text,
    created_at timestamptz default now()
);

-- 4. Planos de Venda [Sua tabela original]
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

-- 5. Interseção (Planos x Features) [Sua tabela original]
create table if not exists public.plan_permissions (
    id uuid primary key default gen_random_uuid(),
    plan_id uuid not null references public.plans(id) on delete cascade,
    feature_id uuid not null references public.features(id) on delete cascade,
    created_at timestamptz default now(),
    unique(plan_id, feature_id)
);

-- 6. Configurações Globais (Emails SaaS) [Sua tabela original]
create table if not exists public.email_settings (
    id uuid primary key default gen_random_uuid (),
    scenario_key text unique not null,
    config jsonb not null default '{"pt": {"email": "", "name": ""}, "en": {"email": "", "name": ""}}'::jsonb,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 7. Controle Comercial (Leads/Demos) [Sua tabela original]
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

-- POLÍTICAS DE RLS (Master)
alter table public.suites enable row level security;
alter table public.features enable row level security;
alter table public.plans enable row level security;
alter table public.plan_permissions enable row level security;

CREATE POLICY "Public read on plans" ON public.plans FOR SELECT USING (true);
CREATE POLICY "Public read on suites" ON public.suites FOR SELECT USING (true);
CREATE POLICY "Public read on features" ON public.features FOR SELECT USING (true);
CREATE POLICY "Public read on plan_permissions" ON public.plan_permissions FOR SELECT USING (true);

-- ============================================================================
-- 💡 INSTRUÇÃO PARA O DESENVOLVEDOR:
-- Pegue todos os comandos "INSERT" do seu master-schema.txt original 
-- (Carga de Suítes, Features, Planos, Plan_Permissions e Email_Settings) 
-- e inclua eles aqui no final para o Banco MASTER!
-- ============================================================================

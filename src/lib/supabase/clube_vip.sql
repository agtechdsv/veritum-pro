-- ============================================================================
-- CLUBE VIP - SISTEMA DE MEMBER GET MEMBER (MASTER DB)
-- ============================================================================

-- 1. Benefícios (Recompensas)
-- Cadastra as vantagens oferecidas pelo Clube VIP (Ex: Caixa Postal, Desconto)
create table if not exists public.vip_benefits (
    id uuid primary key default gen_random_uuid(),
    name jsonb not null default '{"pt": "", "en": "", "es": ""}'::jsonb,
    short_desc jsonb default '{"pt": "", "en": "", "es": ""}'::jsonb,
    long_desc jsonb default '{"pt": "", "en": "", "es": ""}'::jsonb,
    benefit_type text not null check (benefit_type in ('discount', 'service', 'physical', 'other')),
    status text not null default 'active' check (status in ('active', 'inactive')),
    icon_name text, -- Nome do ícone da biblioteca Lucide
    benefit_key text unique, -- Chave única para o componente Front-end identificar regras hardcoded se necessário
    metadata jsonb default '{}'::jsonb, -- Configurações numéricas flexíveis (pontos necessários, % de desconto, etc)
    order_index integer default 0, -- Ordenação na UI
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 2. Benefícios x Planos (Relacionamento)
-- Mapeia quais benefícios ficam visíveis/disponíveis para quais planos
create table if not exists public.vip_benefit_plans (
    id uuid primary key default gen_random_uuid(),
    benefit_id uuid not null references public.vip_benefits(id) on delete cascade,
    plan_id uuid not null references public.plans(id) on delete cascade,
    cycles jsonb default '["monthly", "quarterly", "semiannual", "annual"]'::jsonb, -- Quais ciclos do plano dão direito
    is_locked boolean default false, -- Se true, mostra cadeado (upsell)
    created_at timestamptz default now(),
    unique(benefit_id, plan_id)
);

-- 3. Regras de Pontuação (Indicações)
-- Define quantos pontos uma indicação gera com base no plano contratado e ciclo
create table if not exists public.referral_rules (
    id uuid primary key default gen_random_uuid(),
    plan_id uuid not null references public.plans(id) on delete cascade,
    billing_cycle text not null check (billing_cycle in ('monthly', 'quarterly', 'semiannual', 'annual')),
    points_generated integer not null default 0,
    created_at timestamptz default now(),
    unique(plan_id, billing_cycle)
);

-- 4. Extrato de Indicações/Pontos dos Usuários
-- Histórico de quem indicou quem e o status dos pontos
create table if not exists public.user_referrals (
    id uuid primary key default gen_random_uuid(),
    referrer_id uuid not null references auth.users(id), -- Quem indicou (Obrigatório)
    referred_id uuid references auth.users(id), -- Conta criada pelo amigo (Pode ser nulo até a conta ser criada)
    referred_email text not null, -- E-mail do amigo indicado (usado para convite)
    plan_id uuid references public.plans(id), -- Qual plano o amigo assinou
    points_generated integer default 0,
    status text not null default 'pending' check (status in ('pending', 'approved', 'revoked', 'expired')),
    payment_confirmed_at timestamptz, -- Data/hora que o pagamento foi confirmado
    points_credited_at timestamptz, -- Data/hora que os pontos entraram no saldo real após 7 dias
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 5. Saldo Total de Pontos por Usuário (Opcional, mas útil para performance)
-- Poderíamos calcular on-the-fly, mas uma tabela de saldo ajuda em queries rápidas.
create table if not exists public.user_vip_balance (
    user_id uuid primary key references auth.users(id) on delete cascade,
    total_points integer default 0,
    updated_at timestamptz default now()
);

-- POLÍTICAS DE RLS (Row Level Security)
alter table public.vip_benefits enable row level security;
alter table public.vip_benefit_plans enable row level security;
alter table public.referral_rules enable row level security;
alter table public.user_referrals enable row level security;
alter table public.user_vip_balance enable row level security;

-- Políticas de Leitura Pública/Autenticada
CREATE POLICY "Public read on vip_benefits" ON public.vip_benefits FOR SELECT USING (true);
CREATE POLICY "Public read on vip_benefit_plans" ON public.vip_benefit_plans FOR SELECT USING (true);
CREATE POLICY "Public read on referral_rules" ON public.referral_rules FOR SELECT USING (true);

-- O usuário só ver as PRÓPRIAS indicações e SEU PRÓPRIO saldo
CREATE POLICY "Users read own referrals" ON public.user_referrals FOR SELECT USING (auth.uid() = referrer_id);
CREATE POLICY "Users insert own referrals (invites)" ON public.user_referrals FOR INSERT WITH CHECK (auth.uid() = referrer_id);
CREATE POLICY "Users read own balance" ON public.user_vip_balance FOR SELECT USING (auth.uid() = user_id);

-- Trigger Function para atualizar Updated_At
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Aplicando trigger nas tabelas necessárias
create trigger on_vip_benefits_updated before update on public.vip_benefits for each row execute procedure public.handle_updated_at();
create trigger on_user_referrals_updated before update on public.user_referrals for each row execute procedure public.handle_updated_at();
create trigger on_user_vip_balance_updated before update on public.user_vip_balance for each row execute procedure public.handle_updated_at();

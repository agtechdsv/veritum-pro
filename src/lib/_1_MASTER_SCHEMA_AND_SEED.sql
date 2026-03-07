-- ============================================================================
-- VERITUM PRO: FINAL MASTER SCHEMA (SAAS CONTROL PLANE)
-- ============================================================================
-- Description: Banco de Dados Mestre da Veritum Pro.
-- Responsável por: Auth, Cobrança, Licenciamento (Planos/Suítes) e Segurança Global (RBAC).

-- ============================================================================
-- 0. RESET NUCLEAR (LIMPEZA TOTAL DO SCHEMA PUBLIC)
-- ============================================================================
-- ATENÇÃO: Os comandos abaixo apagam ABSOLUTAMENTE TUDO no schema public.
-- Use apenas se desejar começar o banco do zero absoluto.

-- 0.1 Remove Triggers do Auth (Se existirem) para evitar erros de referência
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 0.2 Destrói e recria o schema public com CASCADE (limpa tabelas, funções, enums, etc)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- 0.3 Restaura as permissões padrão essenciais do Supabase para o novo Schema Public
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
CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "vector" SCHEMA public; -- ESSENCIAL PARA SENTINEL PRO

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. GESTÃO DE USUÁRIOS (Sincronização com Supabase Auth)
-- ============================================================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'Administrador',
  active BOOLEAN DEFAULT TRUE,
  avatar_url TEXT,
  cpf_cnpj TEXT,
  phone TEXT,
  access_group_id UUID, -- Referenciada via ALTER TABLE abaixo
  plan_id UUID,         -- Referenciada via ALTER TABLE abaixo
  parent_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  vip_active BOOLEAN DEFAULT false,
  vip_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT users_email_key UNIQUE (email)
);

-- ============================================================================
-- 3. REGISTRO DE INQUILINOS (TENANT REGISTRY / BYODB)
-- ============================================================================
CREATE TABLE public.tenant_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
    db_provider TEXT DEFAULT 'postgres' CHECK (db_provider IN ('postgres', 'oracle', 'mssql', 'mysql', 'supabase')),
    db_connection_encrypted TEXT,             -- String de conexão completa (Criptografada AES-256)
    custom_supabase_url TEXT,                -- URL do Supabase Privado do Cliente
    custom_supabase_key_encrypted TEXT,      -- Chave ANON do Supabase do Cliente (Criptografada)
    custom_gemini_key_encrypted TEXT,        -- Chave de API do Gemini própria (Criptografada)
    migration_mode TEXT DEFAULT 'auto' CHECK (migration_mode IN ('auto', 'manual')),
    is_active BOOLEAN DEFAULT TRUE,
    health_status TEXT DEFAULT 'up',
    last_health_check TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. FUNDAÇÃO RBAC & PLANOS
-- ============================================================================
CREATE TABLE public.suites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suite_key TEXT UNIQUE NOT NULL,
  name JSONB NOT NULL DEFAULT '{"pt": "", "en": "", "es": ""}'::jsonb,
  short_desc JSONB DEFAULT '{"en": "", "es": "", "pt": ""}'::jsonb,
  detailed_desc JSONB DEFAULT '{"en": "", "es": "", "pt": ""}'::jsonb,
  features JSONB DEFAULT '{"en": [], "es": [], "pt": []}'::jsonb,
  icon_svg TEXT,
  active BOOLEAN DEFAULT TRUE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_key TEXT UNIQUE NOT NULL,
    suite_id UUID NOT NULL REFERENCES public.suites(id) ON DELETE CASCADE,
    display_name JSONB NOT NULL DEFAULT '{"pt": "", "en": "", "es": ""}'::jsonb,
    description JSONB DEFAULT '{"pt": "", "en": "", "es": ""}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name JSONB NOT NULL UNIQUE DEFAULT '{"pt": "", "en": "", "es": ""}'::jsonb,
  short_desc JSONB DEFAULT '{"en": "", "es": "", "pt": ""}'::jsonb,
  monthly_price NUMERIC DEFAULT 0,
  monthly_discount NUMERIC DEFAULT 0,
  quarterly_discount NUMERIC DEFAULT 0,
  semiannual_discount NUMERIC DEFAULT 0,
  yearly_discount NUMERIC DEFAULT 0,
  features JSONB DEFAULT '{"en": [], "es": [], "pt": []}'::jsonb,
  recommended BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  order_index INTEGER DEFAULT 0,
  is_combo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RELACIONAMENTOS DE USUÁRIOS (Corrigindo FKs para o Frontend)
ALTER TABLE public.users ADD CONSTRAINT fk_user_plan FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.plans.monthly_price IS 'Preço base mensal do plano';
COMMENT ON COLUMN public.plans.monthly_discount IS '% de desconto aplicado ao pagamento mensal';
COMMENT ON COLUMN public.plans.quarterly_discount IS '% de desconto para ciclo de 3 meses';
COMMENT ON COLUMN public.plans.semiannual_discount IS '% de desconto para ciclo de 6 meses';
COMMENT ON COLUMN public.plans.yearly_discount IS '% de desconto para ciclo de 12 meses';

CREATE TABLE public.plan_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
    feature_id UUID NOT NULL REFERENCES public.features(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(plan_id, feature_id)
);

CREATE TABLE public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'canceled')),
    is_trial BOOLEAN DEFAULT FALSE,
    billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'quarterly', 'semiannual', 'annual', 'yearly')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Registros de Cancelamento (Churn Analytics)
CREATE TABLE IF NOT EXISTS public.subscription_cancellation_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reasons TEXT NOT NULL,          -- Motivos selecionados
    feedback TEXT,                 -- Comentário livre
    asaas_subscription_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subscription_cancellation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users: Insert own cancellation logs" ON public.subscription_cancellation_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Master: Manage cancellation logs" ON public.subscription_cancellation_logs FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Master');

-- Grupos de Acesso (RBAC de Negócio)
CREATE TABLE public.access_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name JSONB NOT NULL DEFAULT '{"pt": "", "en": "", "es": ""}'::jsonb,
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, 
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(admin_id, name)
);

-- Link tardio para evitar erro de dependência
ALTER TABLE public.users ADD CONSTRAINT fk_user_access_group FOREIGN KEY (access_group_id) REFERENCES public.access_groups(id) ON DELETE SET NULL;

CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name JSONB NOT NULL DEFAULT '{"pt": "", "en": "", "es": ""}'::jsonb,
    access_group_id UUID REFERENCES public.access_groups(id) ON DELETE SET NULL,
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(admin_id, name)
);

CREATE TABLE public.group_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.access_groups(id) ON DELETE CASCADE,
    feature_id UUID REFERENCES public.features(id) ON DELETE CASCADE,
    can_access BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, feature_id)
);

-- Templates de Grupos (Personas Padrão do Sistema)
CREATE TABLE public.group_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name JSONB NOT NULL DEFAULT '{"pt": "", "en": "", "es": ""}'::jsonb,
    description JSONB DEFAULT '{"pt": "", "en": "", "es": ""}'::jsonb,
    default_features UUID[], -- Array de IDs de features recomendadas
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name)
);

-- Configurações de E-mail
CREATE TABLE public.email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_key TEXT UNIQUE NOT NULL,
  config JSONB NOT NULL DEFAULT '{"pt": {"email": "", "name": ""}, "en": {"email": "", "name": ""}}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. ORGANIZAÇÕES & ASAAS
-- ============================================================================

-- 5.0 ORGANIZAÇÕES (Escritórios)
CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    cnpj TEXT,
    phone TEXT,
    address JSONB,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT one_org_per_admin UNIQUE (admin_id)
);

-- 5.1 GESTÃO FINTECH (ASAAS SUB-ACCOUNTS / MARKETPLACE)
CREATE TABLE IF NOT EXISTS public.asaas_sub_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    asaas_id TEXT NOT NULL UNIQUE,                  -- ID da conta no Asaas
    api_key TEXT NOT NULL,                          -- Chave de API da subconta
    wallet_id TEXT,                                 -- ID da carteira
    account_type TEXT CHECK (account_type IN ('product', 'user')),
    branding_name TEXT NOT NULL,                    -- Nome no boleto/pix
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.asaas_sub_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master: Manage everything" ON public.asaas_sub_accounts FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Master');
CREATE POLICY "Admins: View own sub-account" ON public.asaas_sub_accounts FOR SELECT USING (auth.uid() = admin_id);

CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    asaas_payment_id TEXT UNIQUE,
    amount NUMERIC,
    status TEXT,
    payment_method TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. LÓGICA DE NEGÓCIO (FUNCTIONS & TRIGGERS)
-- ============================================================================

-- A. Seed Workspace do Cliente
CREATE OR REPLACE FUNCTION public.seed_user_workspace(new_admin_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    master_id uuid;
BEGIN
    IF EXISTS (SELECT 1 FROM public.users WHERE id = new_admin_id AND parent_user_id IS NOT NULL) THEN RETURN; END IF;
    SELECT id INTO master_id FROM public.users WHERE role = 'Master' LIMIT 1;
    IF master_id IS NULL THEN RETURN; END IF;

    -- Grupos
    INSERT INTO public.access_groups (name, admin_id)
    SELECT name, new_admin_id FROM public.access_groups WHERE admin_id = master_id ON CONFLICT DO NOTHING;

    -- Roles
    INSERT INTO public.roles (name, access_group_id, admin_id)
    SELECT r.name, ng.id, new_admin_id
    FROM public.roles r
    JOIN public.access_groups og ON og.id = r.access_group_id
    JOIN public.access_groups ng ON ng.name = og.name AND ng.admin_id = new_admin_id
    WHERE r.admin_id = master_id ON CONFLICT DO NOTHING;

    -- Permissões
    INSERT INTO public.group_permissions (group_id, feature_id, can_access)
    SELECT ng.id, gp.feature_id, gp.can_access
    FROM public.group_permissions gp
    JOIN public.access_groups og ON og.id = gp.group_id
    JOIN public.access_groups ng ON ng.name->>'pt' = og.name->>'pt' AND ng.admin_id = new_admin_id
    WHERE og.admin_id = master_id ON CONFLICT DO NOTHING;
END;
$$;

-- B. Handle Auth New Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  default_role text := 'Sócio Administrador';
  user_role text;
  user_name text;
  user_plan_id uuid;
  generated_group_id uuid;
BEGIN
  -- 1. Extrair metadados do Auth
  user_role := coalesce(new.raw_user_meta_data->>'role', default_role);
  user_name := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Usuário');
  user_plan_id := (new.raw_user_meta_data->>'plan_id')::uuid;

  -- 2. Definir Plano de Trial se não houver um
  IF user_plan_id IS NULL THEN 
    SELECT id INTO user_plan_id FROM public.plans WHERE name->>'pt' ILIKE '%Trial%' LIMIT 1; 
  END IF;

  -- 3. Criar o usuário na tabela pública
  INSERT INTO public.users (id, name, email, role, active, avatar_url, parent_user_id, plan_id, access_group_id)
  VALUES (
    new.id, 
    user_name, 
    new.email, 
    user_role, 
    TRUE, 
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'), 
    (new.raw_user_meta_data->>'parent_user_id')::uuid, 
    user_plan_id, 
    (new.raw_user_meta_data->>'access_group_id')::uuid
  )
  ON CONFLICT (id) DO UPDATE SET 
    role = EXCLUDED.role, 
    name = EXCLUDED.name, 
    plan_id = EXCLUDED.plan_id, 
    access_group_id = EXCLUDED.access_group_id;

  -- 4. Criar assinatura inicial
  IF user_plan_id IS NOT NULL THEN
     INSERT INTO public.user_subscriptions (user_id, plan_id, start_date, end_date, status, is_trial)
     VALUES (
       new.id, 
       user_plan_id, 
       NOW(), 
       CASE WHEN (new.raw_user_meta_data->>'parent_user_id') IS NOT NULL THEN NULL ELSE NOW() + INTERVAL '14 days' END, 
       'active', 
       CASE WHEN (new.raw_user_meta_data->>'parent_user_id') IS NOT NULL THEN FALSE ELSE TRUE END
     )
     ON CONFLICT (user_id) DO NOTHING;
  END IF;

  -- 5. Sincronizar metadados do Auth (Primeira carga)
  UPDATE auth.users 
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'role', user_role, 
      'full_name', user_name, 
      'name', user_name, 
      'plan_id', user_plan_id, 
      'access_group_id', (new.raw_user_meta_data->>'access_group_id')
    ) 
  WHERE id = new.id;
  
  -- 6. Gerar workspace inicial (Access Groups e Roles)
  PERFORM public.seed_user_workspace(new.id);
  
  -- 7. Organização para Admin Root
  IF (new.raw_user_meta_data->>'parent_user_id') IS NULL THEN
      INSERT INTO public.organizations (admin_id, company_name)
      VALUES (new.id, user_name || ' - Escritório')
      ON CONFLICT (admin_id) DO NOTHING;
  END IF;
  
  -- 8. Vincular ao grupo Sócio-Administrador e Atualizar Token Final
  IF (new.raw_user_meta_data->>'parent_user_id') IS NULL THEN
      SELECT id INTO generated_group_id FROM public.access_groups 
      WHERE admin_id = new.id AND name->>'pt' = 'Sócio-Administrador' LIMIT 1;
      
      IF generated_group_id IS NOT NULL THEN
          UPDATE public.users 
          SET access_group_id = generated_group_id, role = 'Sócio Administrador'
          WHERE id = new.id;
          
          UPDATE auth.users 
          SET raw_user_meta_data = 
            COALESCE(raw_user_meta_data, '{}'::jsonb) || 
            jsonb_build_object(
              'access_group_id', generated_group_id, 
              'role', 'Sócio Administrador'
            )
          WHERE id = new.id;
      END IF;
  END IF;

  -- 9. Lógica do Clube VIP (Member get Member)
  IF (new.raw_user_meta_data->>'invited_by_code') IS NOT NULL AND (new.raw_user_meta_data->>'invited_by_code') <> '' THEN
      DECLARE
          inviter_id uuid;
          v_code text := trim(new.raw_user_meta_data->>'invited_by_code');
      BEGIN
          -- Busca o inviter pelo código (Case Insensitive)
          SELECT id INTO inviter_id FROM public.users 
          WHERE upper(vip_code) = upper(v_code)
          LIMIT 1;

          IF inviter_id IS NOT NULL THEN
              INSERT INTO public.user_referrals (referrer_id, referred_id, referred_email, plan_id, status)
              VALUES (inviter_id, new.id, new.email, user_plan_id, 'pending')
              ON CONFLICT (referred_email) DO UPDATE SET
                  referred_id = EXCLUDED.referred_id,
                  plan_id = EXCLUDED.plan_id
              WHERE public.user_referrals.status = 'pending';
          END IF;
      EXCEPTION WHEN OTHERS THEN
          -- Silently ignore VIP referral errors to not block user registration
          RAISE NOTICE 'Error processing VIP referral for %: %', new.email, SQLERRM;
      END;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- C. Handle User Updates (Sincronização reverso public -> auth + Gearbox de Assinaturas)
CREATE OR REPLACE FUNCTION public.handle_updated_user()
RETURNS trigger AS $$
BEGIN
  -- 1. Sincroniza metadados para garantir integridade do RBAC no JWT
  UPDATE auth.users
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'role', NEW.role,
      'full_name', NEW.name,
      'parent_user_id', NEW.parent_user_id,
      'active', NEW.active,
      'plan_id', NEW.plan_id,
      'force_password_reset', NEW.force_password_reset
    )
  WHERE id = NEW.id;

  -- 2. Cascateamento de Status: Se desativar o Header, desativa os Operadores
  IF (OLD.active IS DISTINCT FROM NEW.active) THEN
    UPDATE public.users SET active = NEW.active WHERE parent_user_id = NEW.id;
  END IF;

  -- 3. 💎 AUTO-SYNC PLANO: Se o plano mudar no perfil, atualiza a assinatura e mata o Trial
  IF (OLD.plan_id IS DISTINCT FROM NEW.plan_id) THEN
     UPDATE public.user_subscriptions
     SET 
       plan_id = NEW.plan_id,
       status = 'active',
       is_trial = EXISTS (SELECT 1 FROM public.plans WHERE id = NEW.plan_id AND name::text ILIKE '%Trial%'),
       updated_at = NOW()
     WHERE user_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers de Gestão de Usuários
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_public_user_updated ON public.users;
CREATE TRIGGER on_public_user_updated AFTER UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_updated_user();

-- ============================================================================
-- 9. SEGURANÇA MASTER (RLS)
-- ============================================================================

-- 9.1 Habilitar RLS em Todas as Tabelas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Master: Manage everything" ON public.email_settings FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Master');
CREATE POLICY "Service Role: Read" ON public.email_settings FOR SELECT USING (true);
ALTER TABLE public.group_templates ENABLE ROW LEVEL SECURITY;

-- 9.2 Políticas de Leitura Pública/Global (Catálogo e Estrutura)
CREATE POLICY "Public: Read suites" ON public.suites FOR SELECT USING (true);
CREATE POLICY "Public: Read plans" ON public.plans FOR SELECT USING (true);
CREATE POLICY "Public: Read features" ON public.features FOR SELECT USING (true);
CREATE POLICY "Public: Read plan permissions" ON public.plan_permissions FOR SELECT USING (true);

-- 9.3 Políticas de Usuários e Equipe
CREATE POLICY "Users: Manage own profile" ON public.users FOR ALL USING (auth.uid() = id);
CREATE POLICY "Admins: Manage team members" ON public.users FOR ALL USING (auth.uid() = parent_user_id);
CREATE POLICY "Users: View colleagues and parent" ON public.users FOR SELECT USING (
    parent_user_id = (SELECT parent_user_id FROM public.users WHERE id = auth.uid()) OR
    id = (SELECT parent_user_id FROM public.users WHERE id = auth.uid())
);
CREATE POLICY "Admins manage own config" ON public.tenant_configs FOR ALL USING (auth.uid() = owner_id OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'Master');
CREATE POLICY "Admins manage organization" ON public.organizations FOR ALL USING (auth.uid() = admin_id OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'Master');

-- 9.4 Políticas de RBAC (Contexto do Administrador do Workspace)
CREATE POLICY "Admins manage access groups" ON public.access_groups FOR ALL USING (auth.uid() = admin_id OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'Master');
CREATE POLICY "Users: View own access group" ON public.access_groups FOR SELECT USING (id = (SELECT access_group_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Admins manage roles" ON public.roles FOR ALL USING (auth.uid() = admin_id OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'Master');
CREATE POLICY "Users: View own roles" ON public.roles FOR SELECT USING (access_group_id = (SELECT access_group_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Admins manage group perms" ON public.group_permissions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.access_groups ag WHERE ag.id = group_id AND (ag.admin_id = auth.uid() OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'Master'))
);
CREATE POLICY "Users: View own group perms" ON public.group_permissions FOR SELECT USING (group_id = (SELECT access_group_id FROM public.users WHERE id = auth.uid()));

-- 9.5 Políticas de Cobrança & Assinatura
CREATE POLICY "Users view own subscription" ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'Master');
CREATE POLICY "Users view own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'Master');

-- 9.6 God Mode para Master ROLE (Gestão Global)
CREATE POLICY "Master: Manage everything" ON public.users FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Master');
CREATE POLICY "Master: Manage everything" ON public.suites FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Master');
CREATE POLICY "Master: Manage everything" ON public.features FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Master');
CREATE POLICY "Master: Manage everything" ON public.plans FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Master');
CREATE POLICY "Master: Manage everything" ON public.plan_permissions FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Master');
CREATE POLICY "Master: Manage everything" ON public.user_subscriptions FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Master');
CREATE POLICY "Master: Manage everything" ON public.payments FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Master');

-- Triggers de atualização
CREATE TRIGGER tr_users_upd BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_tenant_upd BEFORE UPDATE ON public.tenant_configs FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_org_upd BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_subscriptions_upd BEFORE UPDATE ON public.user_subscriptions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_payments_upd BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 10. LEAD GENERATION (DEMO REQUESTS)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.demo_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    team_size TEXT NOT NULL,
    preferred_start TIMESTAMPTZ NOT NULL,
    preferred_end TIMESTAMPTZ NOT NULL,
    scheduled_at TIMESTAMPTZ,
    attended_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'attended', 'canceled')),
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;

-- 10.1 Qualquer pessoa pode solicitar uma demo (público)
CREATE POLICY "Public: Insert demo requests" ON public.demo_requests FOR INSERT WITH CHECK (true);

-- 10.2 Apenas Master pode visualizar e gerenciar leads
CREATE POLICY "Master: Manage demo requests" ON public.demo_requests FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Master');


-- ================================================================================

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
    status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected', 'expired')),
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

-- ============================================================================
-- CLUBE VIP: LOGICA PARA CREDITAR PONTOS NA ASSINATURA (MEMBER GET MEMBER)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.process_referral_points()
RETURNS trigger AS $$
DECLARE
    v_referrer_id uuid;
    v_points integer;
    v_rule_cycle text;
BEGIN
    -- Só processamos se o plano deixou de ser TRIAL (virou oficial)
    -- Ou se mudou de plano mantendo is_trial = false (upgrade de plano pago)
    IF (OLD.is_trial IS TRUE AND NEW.is_trial IS FALSE) OR (OLD.plan_id IS DISTINCT FROM NEW.plan_id AND NEW.is_trial IS FALSE) THEN
        
        -- Mapear Cycle para a regra (yearly/annual -> annual)
        v_rule_cycle := CASE 
            WHEN lower(NEW.billing_cycle) = 'yearly' THEN 'annual'
            WHEN lower(NEW.billing_cycle) = 'annual' THEN 'annual'
            WHEN lower(NEW.billing_cycle) = 'semiannual' THEN 'semiannual'
            WHEN lower(NEW.billing_cycle) = 'quarterly' THEN 'quarterly'
            ELSE 'monthly'
        END;

        -- 1. Tentar encontrar a indicação pendente para este usuário
        SELECT referrer_id INTO v_referrer_id 
        FROM public.user_referrals 
        WHERE referred_id = NEW.user_id AND status = 'pending'
        LIMIT 1;

        IF v_referrer_id IS NOT NULL THEN
            -- 2. Buscar quantos pontos essa combinação Plano + Ciclo gera
            SELECT points_generated INTO v_points
            FROM public.referral_rules
            WHERE plan_id = NEW.plan_id 
              AND (billing_cycle = v_rule_cycle OR billing_cycle = 'monthly') -- Busca específica ou fallback mensal
            ORDER BY (billing_cycle = v_rule_cycle) DESC -- Prioriza a busca exata do ciclo
            LIMIT 1;

            IF v_points IS NOT NULL AND v_points > 0 THEN
                -- 3. Atualizar a indicação para CONFIRMED e registrar pontos
                UPDATE public.user_referrals
                SET 
                    status = 'confirmed',
                    points_generated = v_points,
                    payment_confirmed_at = NOW(),
                    points_credited_at = NOW(),
                    plan_id = NEW.plan_id,
                    updated_at = NOW()
                WHERE referred_id = NEW.user_id AND status = 'pending';

                -- 4. Somar pontos no saldo do padrinho (Referrer) - Double Redundancy
                INSERT INTO public.user_vip_balance (user_id, total_points, updated_at)
                VALUES (v_referrer_id, v_points, NOW())
                ON CONFLICT (user_id) DO UPDATE SET
                    total_points = public.user_vip_balance.total_points + EXCLUDED.total_points,
                    updated_at = NOW();

                UPDATE public.users 
                SET vip_points = COALESCE(vip_points, 0) + v_points,
                    updated_at = NOW()
                WHERE id = v_referrer_id;
                
                RAISE NOTICE 'Pontos VIP creditados: % para o indicador %', v_points, v_referrer_id;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Evita que erros na pontuação bloqueiem a atualização da assinatura principal
        RAISE WARNING 'Erro ao processar pontos VIP: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_process_referral_points ON public.user_subscriptions;
CREATE TRIGGER trg_process_referral_points
    AFTER UPDATE ON public.user_subscriptions
    FOR EACH ROW
    WHEN (OLD.is_trial IS DISTINCT FROM NEW.is_trial OR OLD.plan_id IS DISTINCT FROM NEW.plan_id)
    EXECUTE FUNCTION public.process_referral_points();

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
CREATE POLICY "Allow any insert for referrals" ON public.user_referrals FOR INSERT WITH CHECK (true);
CREATE POLICY "Users manage own balance" ON public.user_vip_balance FOR ALL USING (auth.uid() = user_id);

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


-- ================================================================================

-- ============================================================================
-- VERITUM PRO: SEED DE DADOS MESTRE (INFRAESTRUTURA)
-- ============================================================================
-- Descrição: Popula as tabelas de controle do SaaS: Suítes, Features, Planos e RBAC.
-- Recomendação: Executar após o 'final_master_schema.sql'.
-- ============================================================================

-- 0. LIMPEZA DE SEGURANÇA (Opcional - Descomente se quiser resetar tudo)
-- TRUNCATE public.plan_permissions, public.group_permissions, public.roles, public.access_groups, public.group_templates, public.features, public.suites, public.plans, public.email_settings CASCADE;

-- ----------------------------------------------------------------------------
-- 1. SUÍTES (MÓDULOS DO ECOSSISTEMA)
-- ----------------------------------------------------------------------------
INSERT INTO public.suites (id, suite_key, name, short_desc, detailed_desc, features, icon_svg, active, order_index) VALUES 
-- SENTINEL PRO (Index 0)
(
  'f0fb201d-7ab3-4002-955e-f8c702118adf', 'sentinel', '{"pt": "SENTINEL PRO", "en": "SENTINEL PRO", "es": "SENTINEL PRO"}'::jsonb, 
  '{"en":"Surveillance and Monitoring","es":"Vigilancia y Monitoreo","pt":"Vigilância e Monitoramento"}'::jsonb, 
  '{"en":"Intelligent clipping and early capture of judicial proceedings","es":"Clipping inteligente y captura anticipada de procesos judiciales","pt":"Clipping inteligente e captura antecipada de processos judiciais"}'::jsonb, 
  '["O \"Radar\" do Ecossistema. De acordo com sua visão, esta suíte foca na captura de dados externos","Clipping Inteligente: Monitoramento de termos, nomes de empresas ou sócios em jornais, revistas e fóruns, atuando como um sensor de riscos reputacionais e tendências.","Captura Antecipada: Monitoramento da distribuição de novas ações (inclusive antes da citação oficial) para evitar a revelia e preparar defesas proativas.","Análise de Sentimento: Uso de IA para ler notícias e classificar se o conteúdo é positivo, negativo ou neutro, gerando alertas de crise."]'::jsonb, 
  $$ <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg> $$, 
  true, 0
),
-- NEXUS PRO (Index 1)
(
  '0bc36740-4107-484c-972e-a4f61aaef829', 'nexus', '{"pt": "NEXUS PRO", "en": "NEXUS PRO", "es": "NEXUS PRO"}'::jsonb, 
  '{"en":"Workflow Management","es":"Gestión de Flujos de Trabalho","pt":"Gestão de Fluxo de Trabalho"}'::jsonb, 
  '{"en":"Legal Kanban and automation of recurring tasks","es":"Kanban Jurídico y automatización de tareas recurrentes","pt":"Kanban Jurídico e automação de tarefas recorrentes"}'::jsonb, 
  '["O \"Coração\" Operacional. Esta suíte cuida da gestão de processos e prazos, garantindo que o escritório ou departamento jurídico funcione como um relógio","Workflow Automatizado: Criação de fluxos de tarefas recorrentes (ex: \"Protocolar Contestação\" gera automaticamente tarefas de revisão para o sócio), com atualização automática de status.","Agenda Inteligente: Visualização de compromissos por dia/mês e integração com prazos fatais, permitindo delegar demandas e acompanhar o time.","Integração com Tribunais (Robôs): Sincronização automática com sistemas como PJe e e-SAJ para puxar andamentos e publicações sem intervenção manual.","Kanban Jurídico: Visualização de processos em cartões (To Do, Doing, Done) para gestão visual ágil."]'::jsonb, 
  $$ <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" x2="6" y1="3" y2="15"/><circle cx="18" cy="9" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg> $$, 
  true, 1
),
-- SCRIPTOR PRO (Index 2)
(
  '11a3a5b3-49dd-4f46-95d0-db97a1226a7a', 'scriptor', '{"pt": "SCRIPTOR PRO", "en": "SCRIPTOR PRO", "es": "SCRIPTOR PRO"}'::jsonb, 
  '{"en":"Document Intelligence","es":"Inteligencia Documental","pt":"Inteligência Documental"}'::jsonb, 
  '{"en":"AI-assisted drafting and contract lifecycle management (CLM)","es":"Redacción asistida por IA y gestión de contratos (CLM)","pt":"Redação assistida por IA e gestão de contratos (CLM)"}'::jsonb, 
  '["O \"Cérebro\" Criativo e Arquivista. Focada na redação assistida e gestão do ciclo de vida de documentos (CLM)","Redação Assistida por IA: Geração automática de minutas, cláusulas contratuais e peças processuais baseadas em dados do caso, reduzindo o tempo de elaboração.","Análise de Riscos: A IA lê contratos recebidos e aponta cláusulas perigosas ou fora do padrão da empresa.","Repositório Seguro: Gestão de versões de documentos e assinatura digital integrada, garantindo que nada se perca."]'::jsonb, 
  $$ <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 13.5V4a2 2 0 0 1 2-2h8.5L20 7.5V20a2 2 0 0 1-2 2h-5.5"/><polyline points="14 2 14 8 20 8"/><path d="M10.42 12.61a2.1 2.1 0 1 1 2.97 2.97L7.95 21 4 22l1-3.95 5.42-5.44Z"/></svg> $$, 
  true, 2
),
-- VALOREM PRO (Index 3)
(
  '2a448445-a236-41f9-bbaa-0d2fa5f8c803', 'valorem', '{"pt": "VALOREM PRO", "en": "VALOREM PRO", "es": "VALOREM PRO"}'::jsonb, 
  '{"en":"Financial Controllership","es":"Controlaría Financiera","pt":"Controladoria Financeira"}'::jsonb, 
  '{"en":"Management of fees and precise legal calculations","es":"Gestión de honorarios y cálculos judiciales precisos","pt":"Gestão de honorários e cálculos judiciais precisos"}'::jsonb, 
  '["O \"Cofre\" Estratégico. Para a controladoria jurídica, gestão de honorários e faturamento","Gestão de Honorários: Emissão automatizada de boletos e integração com PIX para recebimento de honorários.","Cálculos Trabalhistas e Cíveis: Integração ou módulo similar ao PJe-Calc para liquidação de sentenças e atualização monetária precisa, evitando perdas na fase de execução.","Provisionamento: Relatórios de contingência para departamentos jurídicos, calculando o risco financeiro de cada processo."]'::jsonb, 
  $$ <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> $$, 
  true, 3
),
-- COGNITIO PRO (Index 4)
(
  '6221e886-1af4-4679-b7fa-aac29f01b2bf', 'cognitio', '{"pt": "COGNITIO PRO", "en": "COGNITIO PRO", "es": "COGNITIO PRO"}'::jsonb, 
  '{"en":"Advanced Jurimetrics","es":"Jurimetría Avanzada","pt":"Jurimetria Avançada"}'::jsonb, 
  '{"en":"Predictive analysis and dashboards for decision-making","es":"Análisis predictivo y tableros para la toma de decisiones","pt":"Análise preditiva e dashboards para tomada de decisão"}'::jsonb, 
  '["O \"Oráculo\" de Dados. Focado em transformar dados brutos em decisões estratégicas","Análise Preditiva: Estimativa da probabilidade de êxito ou perda em uma ação judicial baseada no histórico do juiz ou tribunal específico.","Dashboards Executivos: Gráficos visuais para monitorar KPIs como \"Taxa de Acordo\", \"Tempo Médio de Processo\" e \"Valor Médio de Condenação\".","Visualização de Dados: Mapas de calor e gráficos de tendências para identificar onde estão os maiores gargalos do escritório."]'::jsonb, 
  $$ <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg> $$, 
  true, 4
),
-- VOX CLIENTIS (Index 5)
(
  'f193e0e0-9065-4442-a58d-1bd22d03119e', 'vox', '{"pt": "VOX CLIENTIS", "en": "VOX CLIENTIS", "es": "VOX CLIENTIS"}'::jsonb, 
  '{"en":"CRM and Client Portal","es":"CRM y Portal del Cliente","pt":"CRM e Portal do Cliente"}'::jsonb, 
  '{"en":"Transparent communication and translation of \"legalese\"","es":"Comunicación transparente y traducción del lenguaje jurídico","pt":"Comunicación transparente e tradução do \"juridiquês\""}'::jsonb, 
  '["A \"Voz\" do Ecossistema. Portal do cliente e gestão de relacionamento","Portal do Cliente: Um aplicativo ou área web onde o cliente pode verificar o status do processo em tempo real, sem precisar ligar para o advogado.","Tradução Jurídica via IA: O sistema extrai o \"juridiquês\" das atualizações processuais (ex: \"Concluso para decisão\") e envia uma mensagem automática via WhatsApp ao cliente explicando o significado em linguagem simples.","Histórico de Relacionamento: CRM integrado para registrar todas as interações, propostas e documentos trocados."]'::jsonb, 
  $$ <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> $$, 
  true, 5
),
-- INTELLIGENCE HUB (Index 6)
(
  'd3e8b0e0-9065-4442-a58d-1bd22d03119c', 'intelligence', '{"pt": "INTELLIGENCE HUB", "en": "INTELLIGENCE HUB", "es": "INTELLIGENCE HUB"}'::jsonb, 
  '{"en":"Proactive Intelligence","es":"Inteligencia Proactiva","pt":"Inteligência Proativa"}'::jsonb, 
  '{"en":"Strategic insights and proactive legal opportunities","es":"Insights estratégicos y oportunidades legales proactivas","pt":"Insights estratégicos e oportunidades jurídicas proativas"}'::jsonb, 
  '["O \"Farol\" de Oportunidades. Identifica riscos e chances de êxito antes mesmo da judicialização.","Golden Alerts: Alertas automáticos baseados em teses do escritório.","Busca Semântica IA: Cruzamento inteligente de publicações com base de conhecimento."]'::jsonb, 
  $$ <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> $$, 
  true, 6
)
ON CONFLICT (suite_key) DO UPDATE SET 
  name = EXCLUDED.name, 
  short_desc = EXCLUDED.short_desc, 
  detailed_desc = EXCLUDED.detailed_desc,
  features = EXCLUDED.features,
  icon_svg = EXCLUDED.icon_svg,
  order_index = EXCLUDED.order_index;

-- ----------------------------------------------------------------------------
-- 2. FEATURES (FUNCIONALIDADES)
-- ----------------------------------------------------------------------------
INSERT INTO "public"."features" ("feature_key", "suite_id", "display_name", "description") VALUES 
-- NEXUS PRO (Gestão)
('nexus_gestao_prazos', (SELECT id FROM public.suites WHERE suite_key = 'nexus'), '{"pt": "Gestão de Processos e Prazos", "en": "Process and Deadline Management", "es": "Gestión de Procesos y Plazos"}'::jsonb, '{"pt": "Kanban, agenda e controle de prazos processuais.", "en": "Kanban, calendar and control of procedural deadlines.", "es": "Kanban, agenda y control de plazos procesais."}'::jsonb),
('nexus_workflows', (SELECT id FROM public.suites WHERE suite_key = 'nexus'), '{"pt": "Workflows Avançados", "en": "Advanced Workflows", "es": "Workflows Avanzados"}'::jsonb, '{"pt": "Automação de fluxos de trabalho e delegação inteligente de tarefas.", "en": "Workflow automation and intelligent task delegation.", "es": "Automatización de flujos de trabalho y delegación inteligente de tareas."}'::jsonb),
('nexus_gestao_ativos', (SELECT id FROM public.suites WHERE suite_key = 'nexus'), '{"pt": "Gestão de Ativos e Bens", "en": "Asset Management", "es": "Gestión de Activos"}'::jsonb, '{"pt": "Controle de garantias, imóveis e frotas em litígio.", "en": "Control of guarantees, real estate and fleets in litigation.", "es": "Control de garantias, inmuebles y flotas en litigio."}'::jsonb),
('nexus_controle_societario', (SELECT id FROM public.suites WHERE suite_key = 'nexus'), '{"pt": "Controle Societário", "en": "Corporate Control", "es": "Control Societario"}'::jsonb, '{"pt": "Gestão do ciclo de vida de contratos não-financeiros.", "en": "Non-financial contract lifecycle management.", "es": "Gestión del ciclo de vida de contratos no financieros."}'::jsonb),
('nexus_gestao_equipe', (SELECT id FROM public.suites WHERE suite_key = 'nexus'), '{"pt": "Gestão de Equipe e Workspace", "en": "Team and Workspace Management", "es": "Gestión de Equipo y Workspace"}'::jsonb, '{"pt": "Controle de usuários, cargos (RBAC) e configurações do escritório.", "en": "Control of users, roles (RBAC) and office settings.", "es": "Control de usuarios, cargos (RBAC) y configuraciones de la oficina."}'::jsonb),
('nexus_gestao_pessoas', (SELECT id FROM public.suites WHERE suite_key = 'nexus'), '{"pt": "Gestão de Pessoas (CRM Básico)", "en": "People Management (Basic CRM)", "es": "Gestión de Personas (CRM Básico)"}'::jsonb, '{"pt": "Cadastro centralizado de clientes, reclamados e testemunhas.", "en": "Centralized registration of clients, defendants and witnesses.", "es": "Registro centralizado de clientes, demandados y testigos."}'::jsonb),

-- SENTINEL PRO (Vigilância)
('sentinel_diarios', (SELECT id FROM public.suites WHERE suite_key = 'sentinel'), '{"pt": "Monitoramento de Diários", "en": "Gazette Monitoring", "es": "Monitoreo de Diarios"}'::jsonb, '{"pt": "Varredura automática de publicações em Diários Oficiais e de Justiça.", "en": "Automatic scanning of publications in Official and Justice Gazettes.", "es": "Búsqueda automática de publicaciones en Diarios Oficiales y de Justicia."}'::jsonb),
('sentinel_captura_antecipada', (SELECT id FROM public.suites WHERE suite_key = 'sentinel'), '{"pt": "Captura Antecipada", "en": "Early Capture", "es": "Captura Anticipada"}'::jsonb, '{"pt": "Monitoramento de distribuição de novas ações antes da citação oficial.", "en": "Monitoring of new lawsuit distributions before official summons.", "es": "Monitoreo de distribución de nuevas acciones antes de la citación oficial."}'::jsonb),
('sentinel_clipping_midia', (SELECT id FROM public.suites WHERE suite_key = 'sentinel'), '{"pt": "Clipping Inteligente", "en": "Smart Clipping", "es": "Clipping Inteligente"}'::jsonb, '{"pt": "Monitoramento de marcas, empresas e sócios em jornais e portais de notícias.", "en": "Brand, company and partner monitoring in newspapers and news portals.", "es": "Monitoreo de marcas, empresas y socios en periódicos y portales de noticias."}'::jsonb),
('sentinel_analise_sentimento', (SELECT id FROM public.suites WHERE suite_key = 'sentinel'), '{"pt": "Análise de Sentimento (IA)", "en": "Sentiment Analysis (AI)", "es": "Análisis de Sentimiento (IA)"}'::jsonb, '{"pt": "Classificação automática de risco em notícias e andamentos processuais.", "en": "Automatic risk classification in news and procedural updates.", "es": "Clasificación automática de riesgo en noticias y actualizaciones procesales."}'::jsonb),

-- SCRIPTOR PRO (Documental)
('scriptor_ged', (SELECT id FROM public.suites WHERE suite_key = 'scriptor'), '{"pt": "Repositório de Documentos (GED)", "en": "Document Repository (DMS)", "es": "Repositorio de Documentos (GED)"}'::jsonb, '{"pt": "Armazenamento seguro em nuvem e versionamento de arquivos.", "en": "Secure cloud storage and file versioning.", "es": "Almacenamiento seguro en la nube y control de versiones de archivos."}'::jsonb),
('scriptor_gerador_ia', (SELECT id FROM public.suites WHERE suite_key = 'scriptor'), '{"pt": "Gerador de Peças (IA)", "en": "Pleading Generator (AI)", "es": "Generador de Escritos (IA)"}'::jsonb, '{"pt": "Redação automatizada de contratos e petições via inteligência artificial.", "en": "Automated drafting of contracts and petitions via artificial intelligence.", "es": "Redacción automatizada de contratos y peticiones vía inteligencia artificial."}'::jsonb),
('scriptor_auditoria_risco', (SELECT id FROM public.suites WHERE suite_key = 'scriptor'), '{"pt": "Auditoria de Risco (IA)", "en": "Risk Audit (AI)", "es": "Auditoria de Riesgo (IA)"}'::jsonb, '{"pt": "Análise de documentos para identificação automática de cláusulas abusivas.", "en": "Document analysis for automatic identification of abusive clauses.", "es": "Análisis de documentos para identificación automática de cláusulas abusivas."}'::jsonb),
('scriptor_assinatura', (SELECT id FROM public.suites WHERE suite_key = 'scriptor'), '{"pt": "Assinatura Digital", "en": "Digital Signature", "es": "Firma Digital"}'::jsonb, '{"pt": "Envio e controle de assinaturas de documentos com validade jurídica.", "en": "Document signature control with legal validity.", "es": "Envío y control de firmas de documentos con validez jurídica."}'::jsonb),

-- VALOREM PRO (Financeiro)
('valorem_financeiro', (SELECT id FROM public.suites WHERE suite_key = 'valorem'), '{"pt": "Gestão Financeira", "en": "Financial Management", "es": "Gestión Financiera"}'::jsonb, '{"pt": "Controle de honorários, contas a pagar/receber e fluxo de caixa.", "en": "Fee control, accounts payable/receivable and cash flow.", "es": "Control de honorarios, cuentas a pagar/cobrar y flujo de caja."}'::jsonb),
('valorem_boletos_pix', (SELECT id FROM public.suites WHERE suite_key = 'valorem'), '{"pt": "Emissão de Boletos e PIX", "en": "Invoicing and PIX", "es": "Emisión de Boletos y PIX"}'::jsonb, '{"pt": "Geração de cobranças integradas com baixa automática para os clientes.", "en": "Integrated charge generation with automatic reconciliation for clients.", "es": "Generación de cobros integrados con conciliación automática para los clientes."}'::jsonb),
('valorem_pjecalc', (SELECT id FROM public.suites WHERE suite_key = 'valorem'), '{"pt": "Integração PJe-Calc e Atualizações", "en": "PJe-Calc Integration and Updates", "es": "Integración PJe-Calc y Actualizaciones"}'::jsonb, '{"pt": "Importação e leitura de cálculos trabalhistas e atualização monetária.", "en": "Import and reading of labor calculations and monetary updates.", "es": "Importación y lectura de cálculos laborales y actualización monetaria."}'::jsonb),
('valorem_provisionamento', (SELECT id FROM public.suites WHERE suite_key = 'valorem'), '{"pt": "Relatórios de Contingência", "en": "Contingency Reports", "es": "Informes de Contingencias"}'::jsonb, '{"pt": "Cálculo de provisão e valores retidos em garantia para diretoria.", "en": "Provision calculation and values retained in guarantee for management.", "es": "Cálculo de provisión y valores retenidos en garantía para la dirección."}'::jsonb),

-- COGNITIO PRO (Jurimetria)
('cognitio_dashboards', (SELECT id FROM public.suites WHERE suite_key = 'cognitio'), '{"pt": "Dashboards Analíticos", "en": "Analytical Dashboards", "es": "Tableros Analíticos"}'::jsonb, '{"pt": "Gráficos gerais de produtividade, volume processual e financeiro.", "en": "General charts of productivity, case volume and finance.", "es": "Gráficos generales de productividad, volumen procesal y financiero."}'::jsonb),
('cognitio_preditiva', (SELECT id FROM public.suites WHERE suite_key = 'cognitio'), '{"pt": "Análise Preditiva (IA)", "en": "Predictive Analysis (IA)", "es": "Análisis Predictivo (IA)"}'::jsonb, '{"pt": "Previsão de êxito e desfechos judiciais baseada em dados históricos.", "en": "Success and outcome prediction based on historical data.", "es": "Predicción de éxito y desenlaces judiciales basada en datos históricos."}'::jsonb),
('cognitio_magistrados', (SELECT id FROM public.suites WHERE suite_key = 'cognitio'), '{"pt": "Perfil de Magistrados", "en": "Magistrate Profile", "es": "Perfil de Magistrados"}'::jsonb, '{"pt": "Mapeamento comportamental e taxa de condenações de juízes e varas.", "en": "Behavioral mapping and condemnation rate of judges and courts.", "es": "Mapeo conductual y tasa de condenas de jueces y juzgados."}'::jsonb),

-- VOX CLIENTIS (Comunicação)
('vox_portal', (SELECT id FROM public.suites WHERE suite_key = 'vox'), '{"pt": "Portal do Cliente", "en": "Client Portal", "es": "Portal del Cliente"}'::jsonb, '{"pt": "Acesso seguro e exclusivo para o cliente acompanhar seus próprios processos.", "en": "Secure and exclusive access for clients to monitor their own cases.", "es": "Acceso seguro y exclusivo para el cliente seguir sus propios procesos."}'::jsonb),
('vox_traducao_ia', (SELECT id FROM public.suites WHERE suite_key = 'vox'), '{"pt": "Tradução de Juridiquês (IA)", "en": "Legalese Translation (AI)", "es": "Traducción Jurídica (IA)"}'::jsonb, '{"pt": "Tradução automática de andamentos complexos para linguagem acessível.", "en": "Automatic translation of complex updates to accessible language.", "es": "Traducción automática de actualizaciones complejas a lenguaje accesible."}'::jsonb),
('vox_whatsapp', (SELECT id FROM public.suites WHERE suite_key = 'vox'), '{"pt": "Automação de WhatsApp", "en": "WhatsApp Automation", "es": "Automatización de WhatsApp"}'::jsonb, '{"pt": "Envio ativo de alertas de audiências e atualizações diretamente no celular.", "en": "Active sending of hearing alerts and updates directly to the phone.", "es": "Envío activo de alertas de audiencias y actualizaciones directamente al móvil."}'::jsonb),

-- INTELLIGENCE HUB (Proativo)
('intelligence_golden_alerts', (SELECT id FROM public.suites WHERE suite_key = 'intelligence'), '{"pt": "Golden Alerts", "en": "Golden Alerts", "es": "Golden Alerts"}'::jsonb, '{"pt": "Monitoramento de oportunidades estratégicas baseado em teses.", "en": "Strategic opportunity monitoring based on legal theories.", "es": "Monitoreo de oportunidades estratégicas basado en tesis legales."}'::jsonb),
('intelligence_matcher', (SELECT id FROM public.suites WHERE suite_key = 'intelligence'), '{"pt": "Semantic Matcher", "en": "Semantic Matcher", "es": "Semantic Matcher"}'::jsonb, '{"pt": "Busca semântica em base de conhecimento.", "en": "Semantic search in knowledge base.", "es": "Búsqueda semántica en base de conocimientos."}'::jsonb)
ON CONFLICT (feature_key) DO UPDATE SET 
  suite_id = EXCLUDED.suite_id,
  display_name = EXCLUDED.display_name, 
  description = EXCLUDED.description;

-- ----------------------------------------------------------------------------
-- 3. PLANOS (GRADE DE VENDAS)
-- ----------------------------------------------------------------------------
INSERT INTO "public"."plans" ("name", "short_desc", "monthly_price", "monthly_discount", "quarterly_discount", "semiannual_discount", "yearly_discount", "features", "recommended", "active", "order_index", "is_combo") VALUES 
-- COMBOS (is_combo = true)
(
  '{"pt": "Plano START", "en": "START Plan", "es": "Plan START"}'::jsonb, 
  '{"pt":"A base sólida para advogados autônomos e pequenos escritórios entrarem na era digital.","en":"The solid foundation for solo attorneys and small firms to enter the digital age.","es":"La base sólida para abogados autónomos y pequeños despachos para entrar en la era digital."}'::jsonb, 
  149.00, 5, 7, 10, 15, 
  '["NEXUS PRO (Básico)","VALOREM PRO (Financeiro)","Gestão de Processos (Kanban)","Agenda e Prazos","Emissão de Boletos/Recibos","Suporte via Ticket"]'::jsonb, 
  false, true, 0, true
),
(
  '{"pt": "Plano GROWTH", "en": "GROWTH Plan", "es": "Plan GROWTH"}'::jsonb, 
  '{"pt":"O ecossistema completo para alta performance jurídica com IA e automação de atendimento.","en":"The complete ecosystem for high legal performance with AI and service automation.","es":"El ecosistema completo para alto rendimiento legal con IA y automatización de procesos."}'::jsonb, 
  450.00, 5, 10, 15, 20, 
  '["Tudo do Plano START","SCRIPTOR PRO (IA de Redação)","SENTINEL PRO (Monitoramento Tribunais)","VOX CLIENTIS (Canal do Cliente)","Envio Automático WhatsApp","IA Ilimitada (BYODB)"]'::jsonb, 
  true, true, 1, true
),
(
  '{"pt": "Plano STRATEGY", "en": "STRATEGY Plan", "es": "Plan STRATEGY"}'::jsonb, 
  '{"pt":"Infraestrutura estratégica para grandes bancas. Foco em inteligência preditiva e dados.","en":"Strategic infrastructure for large firms. Focus on predictive intelligence and data.","es":"Infraestructura estratégica para grandes despachos. Foco en inteligencia predictiva y datos."}'::jsonb, 
  1500.00, 5, 10, 15, 20, 
  '["Tudo do Plano GROWTH","COGNITIO PRO (Jurimetria)","SENTINEL 360 (Clipping de Mídia)","NEXUS Advanced (Workflows)","Nível de Serviço (SLA) VIP","Auditoria de Risco Mensual"]'::jsonb, 
  false, true, 2, true
),

-- STANDALONES (is_combo = false)
(
  '{"pt": "Sentinel Radar", "en": "Sentinel Radar", "es": "Sentinel Radar"}'::jsonb, 
  '{"pt":"Monitoramento inteligente de processos e diários oficiais com Captura Antecipada.","en":"Smart case and official gazette monitoring with Early Capture.","es":"Monitoreo inteligente de procesos y diarios oficiales con Captura Anticipada."}'::jsonb, 
  89.90, 5, 7, 10, 15, 
  '["Monitoramento de Processos","Recortes de Diários Oficiais","Captura na Distribuição","Alertas via E-mail/Push"]'::jsonb, 
  false, true, 3, false
),
(
  '{"pt": "Sentinel 360º", "en": "Sentinel 360º", "es": "Sentinel 360º"}'::jsonb, 
  '{"pt":"Inteligência total: Tribunais + Clipping de notícias, jornais e monitoramento de marca.","en":"Total intelligence: Courts + News clipping, newspapers and brand monitoring.","es":"Inteligencia total: Tribunales + Clipping de noticias, periódicos y monitoreo de marca."}'::jsonb, 
  249.00, 5, 7, 10, 15, 
  '["Tudo do Sentinel Radar","Clipping de Web e Jornais","Rastreamento de Marca/Nomes","Relatórios de Reputação"]'::jsonb, 
  false, true, 4, false
),
(
  '{"pt": "Cognitio Pro", "en": "Cognitio Pro", "es": "Cognitio Pro"}'::jsonb, 
  '{"pt":"Jurimetria de entrada para decisões baseadas em dados e probabilidade de êxito.","en":"Entry-level jurimetrics for data-driven decisions and success probability.","es":"Jurimetría básica para decisiones basadas en datos y probabilidad de éxito."}'::jsonb, 
  399.00, 5, 7, 10, 15, 
  '["Perfil de Juízes e Comarcas","Probabilidade de Êxito","Dashboards de BI Integrados","Análise de Jurisprudência IA"]'::jsonb, 
  false, true, 5, false
),
(
  '{"pt": "Scriptor Pro", "en": "Scriptor Pro", "es": "Scriptor Pro"}'::jsonb, 
  '{"pt":"O copiloto definitivo para elaboração de peças processuais com IA generativa.","en":"The ultimate copilot for drafting procedural pieces with generative AI.","es":"El copiloto definitivo para la elaboración de piezas procesales con IA generativa."}'::jsonb, 
  149.00, 5, 7, 10, 15, 
  '["Gerador de Peças via IA","Analisador de Documentos","Revisão Jurídica Inteligente","Exportação Multi-formato"]'::jsonb, 
  true, true, 6, false
),
-- TRIAL (is_combo = false)
(
  '{"pt": "Trial 14 Dias", "en": "14-Day Trial", "es": "Prueba 14 Días"}'::jsonb, 
  '{"pt":"Acesso total gratuito por 14 dias.","en":"Full free access for 14 days.","es":"Acceso total gratuito por 14 días."}'::jsonb, 
  0, 0, 0, 0, 0, 
  '["Acesso Total"]'::jsonb, 
  false, true, 99, false
)
ON CONFLICT (name) DO UPDATE SET 
  short_desc = EXCLUDED.short_desc,
  monthly_price = EXCLUDED.monthly_price,
  monthly_discount = EXCLUDED.monthly_discount,
  quarterly_discount = EXCLUDED.quarterly_discount,
  semiannual_discount = EXCLUDED.semiannual_discount,
  yearly_discount = EXCLUDED.yearly_discount,
  features = EXCLUDED.features,
  active = EXCLUDED.active,
  order_index = EXCLUDED.order_index,
  is_combo = EXCLUDED.is_combo;

-- ----------------------------------------------------------------------------
-- 4. MAPEAMENTO DE PERMISSÕES (PLAN PERMISSIONS)
-- ----------------------------------------------------------------------------
DELETE FROM "public"."plan_permissions";

WITH p_ids AS (SELECT id, name->>'pt' as name FROM public.plans),
     f_ids AS (SELECT id, feature_key FROM public.features)
INSERT INTO public.plan_permissions (plan_id, feature_id)
SELECT p.id, f.id
FROM (
    VALUES
    -- 1. Plano START (Essencial + RBAC básico)
    ('Plano START', 'nexus_gestao_prazos'),
    ('Plano START', 'nexus_gestao_pessoas'),
    ('Plano START', 'nexus_gestao_equipe'),
    ('Plano START', 'sentinel_diarios'),
    ('Plano START', 'scriptor_ged'),
    ('Plano START', 'valorem_financeiro'),
    ('Plano START', 'valorem_boletos_pix'),
    ('Plano START', 'valorem_pjecalc'),

    -- 2. Plano GROWTH (START + Automação)
    ('Plano GROWTH', 'nexus_gestao_prazos'),
    ('Plano GROWTH', 'nexus_gestao_pessoas'),
    ('Plano GROWTH', 'nexus_gestao_equipe'),
    ('Plano GROWTH', 'sentinel_diarios'),
    ('Plano GROWTH', 'scriptor_ged'),
    ('Plano GROWTH', 'valorem_financeiro'),
    ('Plano GROWTH', 'valorem_boletos_pix'),
    ('Plano GROWTH', 'valorem_pjecalc'),
    ('Plano GROWTH', 'nexus_workflows'),
    ('Plano GROWTH', 'sentinel_captura_antecipada'),
    ('Plano GROWTH', 'sentinel_analise_sentimento'),
    ('Plano GROWTH', 'scriptor_gerador_ia'),
    ('Plano GROWTH', 'scriptor_assinatura'),
    ('Plano GROWTH', 'vox_portal'),
    ('Plano GROWTH', 'vox_whatsapp'),
    ('Plano GROWTH', 'vox_traducao_ia'),

    -- 3. Plano STRATEGY (GROWTH + Inteligência Total)
    ('Plano STRATEGY', 'nexus_gestao_prazos'),
    ('Plano STRATEGY', 'nexus_gestao_pessoas'),
    ('Plano STRATEGY', 'nexus_gestao_equipe'),
    ('Plano STRATEGY', 'intelligence_golden_alerts'),
    ('Plano STRATEGY', 'intelligence_matcher'),
    ('Plano STRATEGY', 'sentinel_diarios'),
    ('Plano STRATEGY', 'scriptor_ged'),
    ('Plano STRATEGY', 'valorem_financeiro'),
    ('Plano STRATEGY', 'valorem_boletos_pix'),
    ('Plano STRATEGY', 'valorem_pjecalc'),
    ('Plano STRATEGY', 'nexus_workflows'),
    ('Plano STRATEGY', 'sentinel_captura_antecipada'),
    ('Plano STRATEGY', 'sentinel_analise_sentimento'),
    ('Plano STRATEGY', 'scriptor_gerador_ia'),
    ('Plano STRATEGY', 'scriptor_assinatura'),
    ('Plano STRATEGY', 'vox_portal'),
    ('Plano STRATEGY', 'vox_whatsapp'),
    ('Plano STRATEGY', 'vox_traducao_ia'),
    ('Plano STRATEGY', 'nexus_gestao_ativos'),
    ('Plano STRATEGY', 'nexus_controle_societario'),
    ('Plano STRATEGY', 'sentinel_clipping_midia'),
    ('Plano STRATEGY', 'scriptor_auditoria_risco'),
    ('Plano STRATEGY', 'valorem_provisionamento'),
    ('Plano STRATEGY', 'cognitio_dashboards'),
    ('Plano STRATEGY', 'cognitio_preditiva'),
    ('Plano STRATEGY', 'cognitio_magistrados'),

    -- 4. Sentinel Radar (Standalone)
    ('Sentinel Radar', 'sentinel_diarios'),
    ('Sentinel Radar', 'sentinel_captura_antecipada'),

    -- 5. Sentinel 360º (Standalone)
    ('Sentinel 360º', 'sentinel_diarios'),
    ('Sentinel 360º', 'sentinel_captura_antecipada'),
    ('Sentinel 360º', 'sentinel_clipping_midia'),
    ('Sentinel 360º', 'sentinel_analise_sentimento'),

    -- 6. Cognitio Pro (Standalone)
    ('Cognitio Pro', 'cognitio_dashboards'),
    ('Cognitio Pro', 'cognitio_preditiva'),
    ('Cognitio Pro', 'cognitio_magistrados'),

    -- 7. Scriptor Pro (Standalone)
    ('Scriptor Pro', 'scriptor_ged'),
    ('Scriptor Pro', 'scriptor_gerador_ia'),
    ('Scriptor Pro', 'scriptor_auditoria_risco'),
    ('Scriptor Pro', 'scriptor_assinatura'),

    -- 8. Trial 14 Dias (Para teste inicial)
    ('Trial 14 Dias', 'nexus_gestao_prazos'),
    ('Trial 14 Dias', 'nexus_gestao_pessoas'),
    ('Trial 14 Dias', 'scriptor_gerador_ia')

) AS mapping(p_name, f_key)
JOIN p_ids p ON p.name = mapping.p_name
JOIN f_ids f ON f.feature_key = mapping.f_key;

-- ----------------------------------------------------------------------------
-- 5. CONFIGURAÇÕES DE E-MAIL (EMAIL SETTINGS)
-- ----------------------------------------------------------------------------
INSERT INTO "public"."email_settings" ("scenario_key", "config") VALUES 
('general', $$ {
  "pt": {"email": "contato@veritumpro.com", "name": "Veritum PRO"},
  "en": {"email": "contact@veritumpro.com", "name": "Veritum PRO"}
} $$::jsonb), 
('sales', $$ {
  "pt": {"email": "sucesso@veritumpro.com", "name": "Veritum Sucesso"},
  "en": {"email": "success@veritumpro.com", "name": "Veritum Success"}
} $$::jsonb),
('billing', $$ {
  "pt": {"email": "financeiro@veritumpro.com", "name": "Veritum Financeiro"},
  "en": {"email": "billing@veritumpro.com", "name": "Veritum Billing"}
} $$::jsonb), 
('support', $$ {
  "pt": {"email": "suporte@veritumpro.com", "name": "Veritum Suporte"},
  "en": {"email": "support@veritumpro.com", "name": "Veritum Support"}
} $$::jsonb)
ON CONFLICT (scenario_key) DO UPDATE SET 
  config = EXCLUDED.config,
  updated_at = now();

-- ----------------------------------------------------------------------------
-- 6. TEMPLATES DE GRUPOS (PERSONAS COMPLETAS)
-- ----------------------------------------------------------------------------
DELETE FROM "public"."group_templates";

-- Sócio-Administrador: O dono do castelo
INSERT INTO "public"."group_templates" ("name", "description", "default_features")
SELECT '{"pt": "Sócio-Administrador", "en": "Partner-Administrator", "es": "Socio-Administrador"}'::jsonb, 
       '{"pt": "Acesso total a todos os módulos e configurações.", "en": "Full access to all modules and settings.", "es": "Acceso total a todos los módulos y configuraciones."}'::jsonb, 
       array_agg(id) FROM public.features;

-- Advogado Sênior / Coordenador: O capitão do time
INSERT INTO "public"."group_templates" ("name", "description", "default_features")
SELECT '{"pt": "Advogado Sênior / Coordenador", "en": "Senior Lawyer / Coordinator", "es": "Abogado Senior / Coordinador"}'::jsonb, 
       '{"pt": "Gestão de prazos, redação e jurimetria.", "en": "Management of deadlines, drafting and jurimetrics.", "es": "Gestión de plazos, redacción y jurimetría."}'::jsonb, 
       array_agg(id) FROM public.features 
WHERE feature_key IN ('nexus_gestao_prazos', 'nexus_workflows', 'scriptor_gerador_ia', 'nexus_controle_societario', 'sentinel_diarios', 'cognitio_preditiva', 'vox_whatsapp');

-- Advogado Associado / Júnior: O motor operacional
INSERT INTO "public"."group_templates" ("name", "description", "default_features")
SELECT '{"pt": "Advogado Associado / Júnior", "en": "Associate / Junior Lawyer", "es": "Abogado Asociado / Junior"}'::jsonb, 
       '{"pt": "Focado na execução de tarefas e redação.", "en": "Focused on task execution and drafting.", "es": "Enfocado en la ejecución de tareas y redacción."}'::jsonb, 
       array_agg(id) FROM public.features 
WHERE feature_key IN ('nexus_gestao_prazos', 'scriptor_gerador_ia', 'vox_whatsapp');

-- Estagiário / Paralegal: Suporte e cadastro
INSERT INTO "public"."group_templates" ("name", "description", "default_features")
SELECT '{"pt": "Estagiário / Paralegal", "en": "Intern / Paralegal", "es": "Pasante / Paralegal"}'::jsonb, 
       '{"pt": "Auxiliar em cadastros e monitoramento básico.", "en": "Assist in registrations and basic monitoring.", "es": "Auxiliar en registros y monitoreo básico."}'::jsonb, 
       array_agg(id) FROM public.features 
WHERE feature_key IN ('nexus_gestao_pessoas', 'sentinel_diarios');

-- Departamento Financeiro / Faturamento: O cofre
INSERT INTO "public"."group_templates" ("name", "description", "default_features")
SELECT '{"pt": "Departamento Financeiro / Faturamento", "en": "Finance / Billing Department", "es": "Departamento de Finanzas / Facturación"}'::jsonb, 
       '{"pt": "Gestão de honorários e faturamento.", "en": "Management of fees and billing.", "es": "Gestión de honorarios y facturación."}'::jsonb, 
       array_agg(id) FROM public.features 
WHERE feature_key IN ('valorem_financeiro', 'valorem_pjecalc', 'valorem_boletos_pix', 'nexus_gestao_pessoas');

-- Controladoria Jurídica (Legal Ops): Estratégia e Dados
INSERT INTO "public"."group_templates" ("name", "description", "default_features")
SELECT '{"pt": "Controladoria Jurídica (Legal Ops)", "en": "Legal Controller (Legal Ops)", "es": "Controladoría Jurídica (Legal Ops)"}'::jsonb, 
       '{"pt": "Monitoramento de performance e jurimetria.", "en": "Performance monitoring and jurimetrics.", "es": "Monitoreo de rendimiento y jurimetría."}'::jsonb, 
       array_agg(id) FROM public.features 
WHERE feature_key IN ('nexus_gestao_prazos', 'cognitio_dashboards', 'sentinel_captura_antecipada');

-- Secretariado / Recepção: Atendimento inicial
INSERT INTO "public"."group_templates" ("name", "description", "default_features")
SELECT '{"pt": "Secretariado / Recepção", "en": "Secretariat / Reception", "es": "Secretariado / Recepción"}'::jsonb, 
       '{"pt": "Atendimento via Vox e gerenciamento de pessoas.", "en": "Service via Vox and people management.", "es": "Atención vía Vox y gestión de personas."}'::jsonb, 
       array_agg(id) FROM public.features 
WHERE feature_key IN ('nexus_gestao_pessoas', 'vox_whatsapp');

-- Cliente (Acesso Externo B2B2C): Acesso restrito para consulta
INSERT INTO "public"."group_templates" ("name", "description", "default_features")
SELECT '{"pt": "Cliente (Acesso Externo B2B2C)", "en": "Client (External Access B2B2C)", "es": "Cliente (Acceso Externo B2B2C)"}'::jsonb, 
       '{"pt": "Acesso restrito e seguro ao Portal do Cliente para consulta de processos.", "en": "Restricted and secure access to the Client Portal for case consultation.", "es": "Acceso restringido y seguro al Portal del Cliente para consulta de procesos."}'::jsonb, 
       array_agg(id) FROM public.features 
WHERE feature_key IN ('vox_portal', 'vox_traducao_ia', 'vox_whatsapp');

-- ----------------------------------------------------------------------------
-- 7. LÓGICA DE AUTO-SETUP MASTER (MULTI-ROLES GRANULARES)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  master_id uuid;
BEGIN
  -- Tenta encontrar o usuário Master
  SELECT id INTO master_id FROM public.users WHERE role = 'Master' LIMIT 1;

  IF master_id IS NOT NULL THEN
    -- Limpa registros prévios para evitar duplicidade no re-run
    DELETE FROM "public"."access_groups" WHERE admin_id = master_id;
    DELETE FROM "public"."roles" WHERE admin_id = master_id;

    -- 1. Cria os Access Groups a partir dos templates (8 Grupos Principais)
    INSERT INTO "public"."access_groups" ("name", "admin_id")
    SELECT name, master_id FROM "public"."group_templates";
    
    -- 2. Vincula permissões aos grupos do Master
    INSERT INTO "public"."group_permissions" ("group_id", "feature_id")
    SELECT g.id, unnest(t.default_features)
    FROM "public"."access_groups" g
    JOIN "public"."group_templates" t ON t.name->>'pt' = g.name->>'pt'
    WHERE g.admin_id = master_id;

    -- 3. MAPEAMENTO GRANULAR DE ROLES PARA GRUPOS
    -- 3.1 Grupo: Sócio-Administrador
    INSERT INTO "public"."roles" (name, access_group_id, admin_id)
    SELECT jsonb_build_object('pt', r_pt, 'en', r_en, 'es', r_es), g.id, master_id
    FROM (VALUES 
      ('Sócio Administrador', 'Partner Administrator', 'Socio Administrador'), 
      ('Sócio Fundador', 'Founding Partner', 'Socio Fundador'), 
      ('Diretor Jurídico', 'Legal Director', 'Director Jurídico'), 
      ('Gestor Geral', 'General Manager', 'Gestor General')
    ) AS roles(r_pt, r_en, r_es)
    JOIN "public"."access_groups" g ON g.name->>'pt' = 'Sócio-Administrador' AND g.admin_id = master_id;

    -- 3.2 Grupo: Advogado Sênior / Coordenador
    INSERT INTO "public"."roles" (name, access_group_id, admin_id)
    SELECT jsonb_build_object('pt', r_pt, 'en', r_en, 'es', r_es), g.id, master_id
    FROM (VALUES 
      ('Advogado Sênior', 'Senior Lawyer', 'Abogado Sênior'), 
      ('Coordenador Jurídico', 'Legal Coordinator', 'Coordinador Jurídico'), 
      ('Head de Área', 'Head of Area', 'Head de Área'), 
      ('Gestor Contencioso', 'Litigation Manager', 'Gestor Contencioso')
    ) AS roles(r_pt, r_en, r_es)
    JOIN "public"."access_groups" g ON g.name->>'pt' = 'Advogado Sênior / Coordenador' AND g.admin_id = master_id;

    -- 3.3 Grupo: Advogado Associado / Júnior
    INSERT INTO "public"."roles" (name, access_group_id, admin_id)
    SELECT jsonb_build_object('pt', r_pt, 'en', r_en, 'es', r_es), g.id, master_id
    FROM (VALUES 
      ('Advogado Associado', 'Associate Lawyer', 'Abogado Asociado'), 
      ('Advogado Júnior', 'Junior Lawyer', 'Abogado Júnior'), 
      ('Advogado Pleno', 'Mid-Level Lawyer', 'Abogado Pleno'), 
      ('Advogado Trabalhista', 'Labor Lawyer', 'Abogado Laboral')
    ) AS roles(r_pt, r_en, r_es)
    JOIN "public"."access_groups" g ON g.name->>'pt' = 'Advogado Associado / Júnior' AND g.admin_id = master_id;

    -- 3.4 Grupo: Controladoria Jurídica (Legal Ops)
    INSERT INTO "public"."roles" (name, access_group_id, admin_id)
    SELECT jsonb_build_object('pt', r_pt, 'en', r_en, 'es', r_es), g.id, master_id
    FROM (VALUES 
      ('Controller Jurídico', 'Legal Controller', 'Controller Jurídico'), 
      ('Analista de Legal Ops', 'Legal Ops Analyst', 'Analista de Legal Ops'), 
      ('Analista de Dados Jurídicos', 'Legal Data Analyst', 'Analista de Datos Jurídicos'), 
      ('Engenheiro Jurídico', 'Legal Engineer', 'Ingeniero Jurídico')
    ) AS roles(r_pt, r_en, r_es)
    JOIN "public"."access_groups" g ON g.name->>'pt' = 'Controladoria Jurídica (Legal Ops)' AND g.admin_id = master_id;

    -- 3.5 Grupo: Estagiário / Paralegal
    INSERT INTO "public"."roles" (name, access_group_id, admin_id)
    SELECT jsonb_build_object('pt', r_pt, 'en', r_en, 'es', r_es), g.id, master_id
    FROM (VALUES 
      ('Estagiário', 'Intern', 'Pasante'), 
      ('Paralegal', 'Paralegal', 'Paralegal'), 
      ('Assistente Jurídico', 'Legal Assistant', 'Asistente Jurídico'), 
      ('Auxiliar Administrativo', 'Administrative Assistant', 'Auxiliar Administrativo')
    ) AS roles(r_pt, r_en, r_es)
    JOIN "public"."access_groups" g ON g.name->>'pt' = 'Estagiário / Paralegal' AND g.admin_id = master_id;

    -- 3.6 Grupo: Departamento Financeiro / Faturamento
    INSERT INTO "public"."roles" (name, access_group_id, admin_id)
    SELECT jsonb_build_object('pt', r_pt, 'en', r_en, 'es', r_es), g.id, master_id
    FROM (VALUES 
      ('Gerente Financeiro', 'Finance Manager', 'Gerente Financiero'), 
      ('Analista Financeiro', 'Finance Analyst', 'Analista Financiero'), 
      ('Assistente de Faturamento', 'Billing Assistant', 'Asistente de Facturación'), 
      ('Auxiliar de Cobrança', 'Collection Assistant', 'Auxiliar de Cobranza')
    ) AS roles(r_pt, r_en, r_es)
    JOIN "public"."access_groups" g ON g.name->>'pt' = 'Departamento Financeiro / Faturamento' AND g.admin_id = master_id;

    -- 3.7 Grupo: Secretariado / Recepção
    INSERT INTO "public"."roles" (name, access_group_id, admin_id)
    SELECT jsonb_build_object('pt', r_pt, 'en', r_en, 'es', r_es), g.id, master_id
    FROM (VALUES 
      ('Secretária Executiva', 'Executive Secretary', 'Secretaría Ejecutiva'), 
      ('Recepcionista', 'Receptionist', 'Recepcionista'), 
      ('Assistente de Atendimento', 'Service Assistant', 'Asistente de Atención'), 
      ('Telefonista', 'Switchboard Operator', 'Telefonista')
    ) AS roles(r_pt, r_en, r_es)
    JOIN "public"."access_groups" g ON g.name->>'pt' = 'Secretariado / Recepção' AND g.admin_id = master_id;

    -- 3.8 Grupo: Cliente
    INSERT INTO "public"."roles" (name, access_group_id, admin_id)
    SELECT jsonb_build_object('pt', r_pt, 'en', r_en, 'es', r_es), g.id, master_id
    FROM (VALUES 
      ('Cliente (Pessoa Física)', 'Client (Individual)', 'Cliente (Persona Física)'), 
      ('Representante Legal (Empresa)', 'Legal Representative (Company)', 'Representante Legal (Empresa)')
    ) AS roles(r_pt, r_en, r_es)
    JOIN "public"."access_groups" g ON g.name->>'pt' = 'Cliente (Acesso Externo B2B2C)' AND g.admin_id = master_id;

  END IF;
END $$;


-- ================================================================================

-- ==============================================================================
-- 1. Limpar Benefícios Anteriores para Inserir do Zero (Apenas os 2 solicitados)
-- ==============================================================================
DELETE FROM public.vip_benefits;

-- ==============================================================================
-- 2. Inserir os 2 Benefícios VIP
-- ==============================================================================
INSERT INTO public.vip_benefits (name, short_desc, long_desc, benefit_type, status, icon_name, benefit_key, metadata, order_index)
VALUES 
(
    '{"pt": "Desconto Automático na Renovação", "en": "Automatic Renewal Discount", "es": "Descuento Automático en Renovación"}'::jsonb,
    '{"pt": "Converta seus pontos em até 100% de desconto automático.", "en": "Convert points into up to 100% automatic discount.", "es": "Convierta puntos en hasta un 100% de descuento automático."}'::jsonb,
    '{"pt": "O sistema abaterá automaticamente 1% de desconto para cada ponto que você tiver na carteira no momento da renovação, com teto de 100 pontos.", "en": "The system will automatically apply a 1% discount for each point.", "es": "El sistema aplicará automáticamente un 1% de descuento por cada punto."}'::jsonb,
    'discount',
    'active',
    'DollarSign',
    'auto_discount_renewal',
    '{"cost_in_points": 100, "conversion_ratio": 1}'::jsonb,
    1
),
(
    '{"pt": "Caixa Postal VIP Exclusiva", "en": "Exclusive VIP Mailbox", "es": "Buzón VIP Exclusivo"}'::jsonb,
    '{"pt": "E-mail corporativo @veritumpro.com.", "en": "Corporate email @veritumpro.com.", "es": "Correo corporativo @veritumpro.com."}'::jsonb,
    '{"pt": "Tenha a identidade digital @veritumpro.com com segurança de grau militar emulada na nossa própria infraestrutura.", "en": "Get the @veritumpro.com digital identity.", "es": "Obtenga la identidad digital @veritumpro.com."}'::jsonb,
    'service',
    'active',
    'Mail',
    'exclusive_email',
    '{"cost_in_points": 0, "is_automatic": true}'::jsonb,
    2
);

-- ==============================================================================
-- 3. Atrelar os Benefícios aos Planos Corretos
-- ==============================================================================
DO $$
DECLARE
    start_id uuid;
    growth_id uuid;
    strategy_id uuid;
    discount_id uuid;
    email_id uuid;
BEGIN
    -- Obter os IDs dos Planos
    SELECT id INTO start_id FROM public.plans WHERE (name->>'pt') ILIKE '%start%' LIMIT 1;
    SELECT id INTO growth_id FROM public.plans WHERE (name->>'pt') ILIKE '%growth%' LIMIT 1;
    SELECT id INTO strategy_id FROM public.plans WHERE (name->>'pt') ILIKE '%strategy%' LIMIT 1;

    -- Obter os IDs dos Benefícios que acabamos de inserir
    SELECT id INTO discount_id FROM public.vip_benefits WHERE benefit_key = 'auto_discount_renewal' LIMIT 1;
    SELECT id INTO email_id FROM public.vip_benefits WHERE benefit_key = 'exclusive_email' LIMIT 1;

    -- ============================================================
    -- A) Desconto Automático = Todos os Planos e Todos os Ciclos
    -- ============================================================
    IF discount_id IS NOT NULL THEN
        IF start_id IS NOT NULL THEN
            INSERT INTO public.vip_benefit_plans (benefit_id, plan_id, cycles) 
            VALUES (discount_id, start_id, '["monthly", "quarterly", "semiannual", "annual"]'::jsonb);
        END IF;

        IF growth_id IS NOT NULL THEN
            INSERT INTO public.vip_benefit_plans (benefit_id, plan_id, cycles) 
            VALUES (discount_id, growth_id, '["monthly", "quarterly", "semiannual", "annual"]'::jsonb);
        END IF;

        IF strategy_id IS NOT NULL THEN
            INSERT INTO public.vip_benefit_plans (benefit_id, plan_id, cycles) 
            VALUES (discount_id, strategy_id, '["monthly", "quarterly", "semiannual", "annual"]'::jsonb);
        END IF;
    END IF;

    -- ============================================================
    -- B) Caixa Postal = Apenas Growth (Semestral/Anual) e Strategy (Semestral/Anual)
    -- ============================================================
    IF email_id IS NOT NULL THEN
        -- Growth
        IF growth_id IS NOT NULL THEN
            INSERT INTO public.vip_benefit_plans (benefit_id, plan_id, cycles) 
            VALUES (email_id, growth_id, '["semiannual", "annual"]'::jsonb);
        END IF;

        -- Strategy
        IF strategy_id IS NOT NULL THEN
            INSERT INTO public.vip_benefit_plans (benefit_id, plan_id, cycles) 
            VALUES (email_id, strategy_id, '["semiannual", "annual"]'::jsonb);
        END IF;
    END IF;

END $$;

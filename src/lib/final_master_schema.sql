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
  default_role text := 'Administrador';
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
      'plan_id', NEW.plan_id
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
       is_trial = EXISTS (SELECT 1 FROM public.plans WHERE id = NEW.plan_id AND name ILIKE '%Trial%'),
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
CREATE POLICY "Admins manage own config" ON public.tenant_configs FOR ALL USING (auth.uid() = owner_id OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'Master');
CREATE POLICY "Admins manage organization" ON public.organizations FOR ALL USING (auth.uid() = admin_id OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'Master');

-- 9.4 Políticas de RBAC (Contexto do Administrador do Workspace)
CREATE POLICY "Admins manage access groups" ON public.access_groups FOR ALL USING (auth.uid() = admin_id OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'Master');
CREATE POLICY "Admins manage roles" ON public.roles FOR ALL USING (auth.uid() = admin_id OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'Master');
CREATE POLICY "Admins manage group perms" ON public.group_permissions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.access_groups ag WHERE ag.id = group_id AND (ag.admin_id = auth.uid() OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'Master'))
);

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

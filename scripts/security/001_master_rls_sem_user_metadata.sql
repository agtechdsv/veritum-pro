-- =====================================================================================
-- 001 - Master DB: remove a confianca em auth.jwt() -> 'user_metadata' das policies RLS
-- =====================================================================================
-- PROBLEMA: user_metadata e gravavel pelo proprio usuario (supabase.auth.updateUser).
-- Qualquer conta logada podia se dar role='Master' (ou forjar parent_user_id) e passar
-- nas policies, obtendo acesso a users, payments, plans, asaas_sub_accounts, tenant_configs...
--
-- CORRECAO: o papel e o pai passam a ser lidos de public.users (nao editavel pelo usuario)
-- por funcoes SECURITY DEFINER.
--
-- RODAR APENAS NO PROJETO "Veritum PRO" (MASTER, ref rmcjx...). NUNCA no metabuilder-pro
-- e NUNCA no banco de cliente. Rodar no SQL Editor do Supabase.
--
-- ANTES DE RODAR (pre-requisitos, senao voce se tranca para fora):
--   1) Confirme que o seu usuario Master tem role = 'Master' em public.users:
--        select id, email, role from public.users where role = 'Master';
--      Deve listar o seu usuario. Se nao listar, corrija a linha ANTES.
--   2) Confirme que nenhuma policy de UPDATE/INSERT em public.users deixa o usuario
--      alterar a propria coluna role / parent_user_id (ver query de verificacao no fim).
--
-- ROLLBACK: recriar as policies com as definicoes antigas (estao em
-- src/lib/_1_MASTER_SCHEMA_AND_SEED.sql, linhas 191-613) e dropar as funcoes abaixo.
-- =====================================================================================

BEGIN;

-- ---------- Funcoes auxiliares ----------
CREATE OR REPLACE FUNCTION public.is_master()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role = 'Master'
  );
$$;

CREATE OR REPLACE FUNCTION public.current_parent_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT u.parent_user_id FROM public.users u WHERE u.id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.is_master() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_parent_user_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_master() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_parent_user_id() TO anon, authenticated, service_role;

-- ---------- Policies "Master: ..." (FOR ALL) ----------
DROP POLICY IF EXISTS "Master: Manage everything" ON public.asaas_sub_accounts;
CREATE POLICY "Master: Manage everything" ON public.asaas_sub_accounts FOR ALL USING (public.is_master());

DROP POLICY IF EXISTS "Master: Manage demo requests" ON public.demo_requests;
CREATE POLICY "Master: Manage demo requests" ON public.demo_requests FOR ALL USING (public.is_master());

DROP POLICY IF EXISTS "Master: Manage everything" ON public.email_settings;
CREATE POLICY "Master: Manage everything" ON public.email_settings FOR ALL USING (public.is_master());

DROP POLICY IF EXISTS "Master: Manage everything" ON public.features;
CREATE POLICY "Master: Manage everything" ON public.features FOR ALL USING (public.is_master());

DROP POLICY IF EXISTS "Master: Manage everything" ON public.payments;
CREATE POLICY "Master: Manage everything" ON public.payments FOR ALL USING (public.is_master());

DROP POLICY IF EXISTS "Master: Manage everything" ON public.plan_permissions;
CREATE POLICY "Master: Manage everything" ON public.plan_permissions FOR ALL USING (public.is_master());

DROP POLICY IF EXISTS "Master: Manage everything" ON public.plans;
CREATE POLICY "Master: Manage everything" ON public.plans FOR ALL USING (public.is_master());

DROP POLICY IF EXISTS "Master: Manage cancellation logs" ON public.subscription_cancellation_logs;
CREATE POLICY "Master: Manage cancellation logs" ON public.subscription_cancellation_logs FOR ALL USING (public.is_master());

DROP POLICY IF EXISTS "Master: Manage everything" ON public.suites;
CREATE POLICY "Master: Manage everything" ON public.suites FOR ALL USING (public.is_master());

DROP POLICY IF EXISTS "Master: Manage everything" ON public.user_subscriptions;
CREATE POLICY "Master: Manage everything" ON public.user_subscriptions FOR ALL USING (public.is_master());

DROP POLICY IF EXISTS "Master: Manage everything" ON public.users;
CREATE POLICY "Master: Manage everything" ON public.users FOR ALL USING (public.is_master());

-- ---------- Policies "dono OU Master" ----------
DROP POLICY IF EXISTS "Admins manage access groups" ON public.access_groups;
CREATE POLICY "Admins manage access groups" ON public.access_groups FOR ALL
  USING (auth.uid() = admin_id OR public.is_master());

DROP POLICY IF EXISTS "Admins manage group perms" ON public.group_permissions;
CREATE POLICY "Admins manage group perms" ON public.group_permissions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.access_groups ag
    WHERE ag.id = group_permissions.group_id
      AND (ag.admin_id = auth.uid() OR public.is_master())
  ));

DROP POLICY IF EXISTS "Admins manage organization" ON public.organizations;
CREATE POLICY "Admins manage organization" ON public.organizations FOR ALL
  USING (auth.uid() = admin_id OR public.is_master());

DROP POLICY IF EXISTS "Users view own payments" ON public.payments;
CREATE POLICY "Users view own payments" ON public.payments FOR SELECT
  USING (auth.uid() = user_id OR public.is_master());

DROP POLICY IF EXISTS "Admins manage roles" ON public.roles;
CREATE POLICY "Admins manage roles" ON public.roles FOR ALL
  USING (auth.uid() = admin_id OR public.is_master());

DROP POLICY IF EXISTS "Admins manage own config" ON public.tenant_configs;
CREATE POLICY "Admins manage own config" ON public.tenant_configs FOR ALL
  USING (auth.uid() = owner_id OR public.is_master());

DROP POLICY IF EXISTS "Users view own subscription" ON public.user_subscriptions;
CREATE POLICY "Users view own subscription" ON public.user_subscriptions FOR SELECT
  USING (auth.uid() = user_id OR public.is_master());

-- ---------- users: colegas e pai (antes usava user_metadata.parent_user_id, forjavel) ----------
DROP POLICY IF EXISTS "Users: View colleagues and parent" ON public.users;
CREATE POLICY "Users: View colleagues and parent" ON public.users FOR SELECT
  USING (
    parent_user_id = public.current_parent_user_id()
    OR id = public.current_parent_user_id()
  );

COMMIT;

-- =====================================================================================
-- VERIFICACOES POS-EXECUCAO (somente leitura)
-- =====================================================================================
-- 1) Nao deve sobrar nenhuma policy com user_metadata (resultado esperado: 0 linhas):
--      select tablename, policyname from pg_policies
--      where schemaname = 'public'
--        and (qual ilike '%user_metadata%' or with_check ilike '%user_metadata%');
--
-- 2) Policies de escrita em public.users (revisar se algum usuario comum pode alterar
--    a propria role/parent_user_id; se puder, e a mesma falha por outro caminho):
--      select policyname, cmd, qual, with_check from pg_policies
--      where schemaname = 'public' and tablename = 'users' and cmd in ('UPDATE','INSERT','ALL');

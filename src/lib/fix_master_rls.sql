-- ============================================================================
-- VERITUM PRO: FIX MASTER RLS POLICIES
-- ============================================================================
-- Execute este script no banco MASTER para habilitar o Row Level Security (RLS)
-- e criar as políticas de acesso corretas para as tabelas SaaS (Planos, Suítes etc).
-- Isso fixará a tela de "Gestão de Planos" que está retornando um array vazio.
-- ============================================================================

-- 1. Habilitar RLS nas tabelas Master
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

-- 2. Políticas de Acesso
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

-- Add policies for roles
DROP POLICY IF EXISTS "Admins can view their own roles" ON public.roles;
CREATE POLICY "Admins can view their own roles" ON public.roles FOR SELECT USING (admin_id = auth.uid() OR admin_id = (SELECT parent_user_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can insert their own roles" ON public.roles;
CREATE POLICY "Admins can insert their own roles" ON public.roles FOR INSERT WITH CHECK (admin_id = auth.uid());

DROP POLICY IF EXISTS "Admins can update their own roles" ON public.roles;
CREATE POLICY "Admins can update their own roles" ON public.roles FOR UPDATE USING (admin_id = auth.uid());

DROP POLICY IF EXISTS "Admins can delete their own roles" ON public.roles;
CREATE POLICY "Admins can delete their own roles" ON public.roles FOR DELETE USING (admin_id = auth.uid());

-- Allow internal settings read
DROP POLICY IF EXISTS "Authenticated users can read email_settings" ON public.email_settings;
CREATE POLICY "Authenticated users can read email_settings" ON public.email_settings FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can read app_settings" ON public.app_settings;
CREATE POLICY "Authenticated users can read app_settings" ON public.app_settings FOR SELECT USING (auth.role() = 'authenticated');

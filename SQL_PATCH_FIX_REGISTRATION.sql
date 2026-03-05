-- ============================================================================
-- VERITUM PRO: MEGA PATCH DE SINCRONIZAÇÃO E TRIGGERS
-- ============================================================================
-- Instruções: Execute todo este bloco no Editor SQL do seu Supabase Dashboard.
-- Este script corrige a inconsistência entre "Sócio Administrador" e "Sócio-Administrador",
-- garante que o Trial seja sempre criado (mesmo via Google) e vincula o grupo correto.

BEGIN;

-- 1. PADRONIZAÇÃO DE NOMES (Evita inconsistência de hífen)
UPDATE public.plans 
SET name = jsonb_build_object('pt', 'Trial 14 Dias', 'en', '14-Day Trial', 'es', 'Prueba 14 Días')
WHERE name->>'pt' ILIKE '%Trial%';

-- 2. FUNÇÃO DE SEED ROBUSTA (Melhorada para JSONB)
CREATE OR REPLACE FUNCTION public.seed_user_workspace(new_admin_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    master_id uuid;
BEGIN
    -- Se já for um operador (tem parent), não gera workspace próprio
    IF EXISTS (SELECT 1 FROM public.users WHERE id = new_admin_id AND parent_user_id IS NOT NULL) THEN RETURN; END IF;
    
    -- Busca o usuário Master para copiar os templates
    SELECT id INTO master_id FROM public.users WHERE role = 'Master' LIMIT 1;
    IF master_id IS NULL THEN RETURN; END IF;

    -- A. COPIAR GRUPOS (Padrão Master)
    INSERT INTO public.access_groups (name, admin_id)
    SELECT name, new_admin_id FROM public.access_groups 
    WHERE admin_id = master_id 
    ON CONFLICT DO NOTHING;

    -- B. COPIAR ROLES
    INSERT INTO public.roles (name, access_group_id, admin_id)
    SELECT r.name, ng.id, new_admin_id
    FROM public.roles r
    JOIN public.access_groups og ON og.id = r.access_group_id
    -- Match por nome JSONB (extraído o texto pt para facilitar)
    JOIN public.access_groups ng ON (ng.name->>'pt' = og.name->>'pt') AND ng.admin_id = new_admin_id
    WHERE r.admin_id = master_id 
    ON CONFLICT DO NOTHING;

    -- C. COPIAR PERMISSÕES
    INSERT INTO public.group_permissions (group_id, feature_id, can_access)
    SELECT ng.id, gp.feature_id, gp.can_access
    FROM public.group_permissions gp
    JOIN public.access_groups og ON og.id = gp.group_id
    JOIN public.access_groups ng ON (ng.name->>'pt' = og.name->>'pt') AND ng.admin_id = new_admin_id
    WHERE og.admin_id = master_id 
    ON CONFLICT DO NOTHING;
END;
$$;

-- 3. TRIGGER DE NOVO USUÁRIO (O Coração da Automação)
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
  user_name := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Novo Usuário');
  user_plan_id := (new.raw_user_meta_data->>'plan_id')::uuid;

  -- 2. FAILSAFE PARA GOOGLE: Se não veio plan_id, busca o Trial 14 Dias por nome
  IF user_plan_id IS NULL THEN 
    SELECT id INTO user_plan_id FROM public.plans WHERE name->>'pt' ILIKE '%Trial%' LIMIT 1; 
  END IF;

  -- 3. CRIAR USUÁRIO PÚBLICO
  INSERT INTO public.users (id, name, email, role, active, avatar_url, parent_user_id, plan_id)
  VALUES (
    new.id, 
    user_name, 
    new.email, 
    user_role, 
    TRUE, 
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'), 
    (new.raw_user_meta_data->>'parent_user_id')::uuid, 
    user_plan_id
  )
  ON CONFLICT (id) DO UPDATE SET 
    role = EXCLUDED.role, 
    name = EXCLUDED.name, 
    plan_id = COALESCE(public.users.plan_id, EXCLUDED.plan_id);

  -- 4. CRIAR ASSINATURA TRIAL (Garante registro na user_subscriptions)
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
     ON CONFLICT (user_id) DO UPDATE SET
        plan_id = EXCLUDED.plan_id,
        status = 'active',
        is_trial = EXCLUDED.is_trial;
  END IF;

  -- 5. EXECUTAR SEED DE WORKSPACE (Roles e Grupos padrão)
  PERFORM public.seed_user_workspace(new.id);
  
  -- 6. VINCULAR AO GRUPO SÓCIO ADMINISTRADOR (Garante acesso inicial)
  IF (new.raw_user_meta_data->>'parent_user_id') IS NULL THEN
      -- Busca o grupo ignorando hífen/espaço
      SELECT id INTO generated_group_id FROM public.access_groups 
      WHERE admin_id = new.id 
      AND (name->>'pt' ILIKE 'Sócio%Administrador') 
      LIMIT 1;
      
      IF generated_group_id IS NOT NULL THEN
          UPDATE public.users 
          SET access_group_id = generated_group_id, role = 'Sócio Administrador'
          WHERE id = new.id;
      END IF;
  END IF;

  -- 7. SINCRONIZAR METADADOS DE VOLTA PARA O AUTH
  UPDATE auth.users 
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'role', user_role, 
      'plan_id', user_plan_id, 
      'access_group_id', generated_group_id
    ) 
  WHERE id = new.id;

  -- 8. VINCULAR CONVITE VIP NO CLUBE
  IF (new.raw_user_meta_data->>'invited_by_code') IS NOT NULL THEN
      DECLARE
          inviter_id uuid;
      BEGIN
          SELECT id INTO inviter_id FROM public.users 
          WHERE vip_code = new.raw_user_meta_data->>'invited_by_code' 
          LIMIT 1;

          IF inviter_id IS NOT NULL THEN
              INSERT INTO public.user_referrals (referrer_id, referred_id, referred_email, plan_id, status)
              VALUES (inviter_id, new.id, new.email, user_plan_id, 'pending')
              ON CONFLICT DO NOTHING;
          END IF;
      EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'VIP Referral Error: %', SQLERRM;
      END;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

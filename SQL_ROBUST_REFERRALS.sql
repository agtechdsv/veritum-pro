-- ============================================================================
-- VERITUM PRO: ROBUST GOOGLE REFERRAL FIX
-- ============================================================================

BEGIN;

-- 1. FUNÇÃO AUXILIAR PARA REGISTRAR REFERRAL (Pode ser chamada do trigger ou do callback)
CREATE OR REPLACE FUNCTION public.apply_referral_code(
    p_user_id UUID,
    p_invite_code TEXT
) RETURNS VOID AS $$
DECLARE
    v_inviter_id UUID;
    v_user_email TEXT;
    v_user_plan_id UUID;
    v_clean_code TEXT := trim(upper(p_invite_code));
BEGIN
    -- 1. Validar código
    IF v_clean_code IS NULL OR v_clean_code = '' THEN
        RETURN;
    END IF;

    -- 2. Buscar o padrinho (Inviter)
    SELECT id INTO v_inviter_id FROM public.users 
    WHERE upper(vip_code) = v_clean_code 
    LIMIT 1;

    IF v_inviter_id IS NULL THEN
        RETURN;
    END IF;

    -- 3. Buscar dados do novo usuário para o registro do referral
    -- Pegamos do public.users que já deve ter sido sincronizado ou criamos com fallback
    SELECT email, plan_id INTO v_user_email, v_user_plan_id 
    FROM public.users WHERE id = p_user_id;

    -- Fallback para auth.users se for chamado muito cedo
    IF v_user_email IS NULL THEN
        SELECT email, (raw_user_meta_data->>'plan_id')::uuid INTO v_user_email, v_user_plan_id 
        FROM auth.users WHERE id = p_user_id;
    END IF;

    -- 4. Inserir ou atualizar na user_referrals
    INSERT INTO public.user_referrals (referrer_id, referred_id, referred_email, plan_id, status)
    VALUES (v_inviter_id, p_user_id, v_user_email, v_user_plan_id, 'pending')
    ON CONFLICT (referred_email) DO UPDATE SET
        referred_id = EXCLUDED.referred_id,
        plan_id = COALESCE(public.user_referrals.plan_id, EXCLUDED.plan_id)
    WHERE public.user_referrals.status = 'pending';

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. MELHORAR O TRIGGER DE REGISTRO PARA USAR A FUNÇÃO
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  default_role text := 'Sócio Administrador';
  user_role text;
  user_name text;
  user_plan_id uuid;
  generated_group_id uuid;
  v_invited_by_code text;
BEGIN
  -- 1. Extrair metadados
  user_role := coalesce(new.raw_user_meta_data->>'role', default_role);
  user_name := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Novo Usuário');
  user_plan_id := (new.raw_user_meta_data->>'plan_id')::uuid;
  v_invited_by_code := trim(new.raw_user_meta_data->>'invited_by_code');

  -- 2. FAILSAFE PARA GOOGLE: Se não veio plan_id, busca o Trial
  IF user_plan_id IS NULL THEN 
    SELECT id INTO user_plan_id FROM public.plans WHERE name->>'pt' ILIKE '%Trial%' LIMIT 1; 
  END IF;

  -- 3. CRIAR USUÁRIO PÚBLICO
  INSERT INTO public.users (id, name, email, role, active, avatar_url, parent_user_id, plan_id)
  VALUES (new.id, user_name, new.email, user_role, TRUE, 
          coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'), 
          (new.raw_user_meta_data->>'parent_user_id')::uuid, user_plan_id)
  ON CONFLICT (id) DO UPDATE SET 
    role = EXCLUDED.role, 
    name = EXCLUDED.name, 
    plan_id = COALESCE(public.users.plan_id, EXCLUDED.plan_id);

  -- 4. CRIAR ASSINATURA TRIAL
  IF user_plan_id IS NOT NULL THEN
     INSERT INTO public.user_subscriptions (user_id, plan_id, start_date, end_date, status, is_trial)
     VALUES (new.id, user_plan_id, NOW(), NOW() + INTERVAL '14 days', 'active', TRUE)
     ON CONFLICT (user_id) DO UPDATE SET
        plan_id = EXCLUDED.plan_id,
        status = 'active',
        is_trial = EXCLUDED.is_trial;
  END IF;

  -- 5. GERAR WORKSPACE (Grupos e Roles)
  PERFORM public.seed_user_workspace(new.id);
  
  -- 6. VINCULAR AO GRUPO DE ACESSO
  IF (new.raw_user_meta_data->>'parent_user_id') IS NULL THEN
      SELECT id INTO generated_group_id FROM public.access_groups 
      WHERE admin_id = new.id AND (name->>'pt' ILIKE 'Sócio%Administrador') LIMIT 1;
      
      IF generated_group_id IS NOT NULL THEN
          UPDATE public.users SET access_group_id = generated_group_id WHERE id = new.id;
      END IF;
  END IF;

  -- 7. SINCRONIZAR METADADOS DE VOLTA (Garante que role/plan fiquem no JWT)
  UPDATE auth.users 
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'role', user_role, 
      'plan_id', user_plan_id, 
      'access_group_id', generated_group_id
    ) 
  WHERE id = new.id;

  -- 8. VINCULAR CONVITE VIP USANDO A NOVA FUNÇÃO
  IF v_invited_by_code IS NOT NULL AND v_invited_by_code <> '' THEN
      PERFORM public.apply_referral_code(new.id, v_invited_by_code);
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

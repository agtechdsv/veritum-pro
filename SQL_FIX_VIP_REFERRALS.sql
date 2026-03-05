-- ============================================================================
-- VERITUM PRO: FIX CLUBE VIP & REFERRALS
-- ============================================================================

BEGIN;

-- 1. GARANTIR QUE O MASTER TENHA UM VIP CODE PARA TESTES
UPDATE public.users 
SET vip_code = 'VIP-AGTECH-C3B6', vip_active = true 
WHERE email = 'agtech.dsv@gmail.com' AND (vip_code IS NULL OR vip_code = '');

-- 2. AJUSTAR RLS EM USER_REFERRALS
-- A política atual bloqueava o Trigger de inserir porque auth.uid() não era o referrer_id no momento do signup.
DROP POLICY IF EXISTS "Users insert own referrals (invites)" ON public.user_referrals;
CREATE POLICY "Enable insert for registration trigger" ON public.user_referrals 
FOR INSERT WITH CHECK (true); -- Permitimos o insert, o controle de quem insere é feito pelo security definer do trigger.

-- 3. ADICIONAR CONSTRAINT DE UNICIDADE (Evita duplicar indicação para o mesmo e-mail/usuário)
-- Primeiro limpamos duplicados se existirem (improvável dado que não está salvando agora)
DELETE FROM public.user_referrals a USING public.user_referrals b 
WHERE a.id > b.id AND a.referred_email = b.referred_email;

ALTER TABLE public.user_referrals DROP CONSTRAINT IF EXISTS user_referrals_referred_email_key;
ALTER TABLE public.user_referrals ADD CONSTRAINT user_referrals_referred_email_key UNIQUE (referred_email);

-- 4. MELHORAR O TRIGGER DE REGISTRO (Busca case-insensitive e limpeza de espaços)
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

  -- 2. FALLSAFE PARA GOOGLE: Se não veio plan_id, busca o Trial
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

  -- 7. VINCULAR CONVITE VIP (REFERRALS)
  IF v_invited_by_code IS NOT NULL AND v_invited_by_code <> '' THEN
      DECLARE
          inviter_id uuid;
      BEGIN
          -- Busca o inviter pelo código (Case Insensitive)
          SELECT id INTO inviter_id FROM public.users 
          WHERE upper(vip_code) = upper(v_invited_by_code)
          LIMIT 1;

          IF inviter_id IS NOT NULL THEN
              INSERT INTO public.user_referrals (referrer_id, referred_id, referred_email, plan_id, status)
              VALUES (inviter_id, new.id, new.email, user_plan_id, 'pending')
              ON CONFLICT (referred_email) DO NOTHING;
          END IF;
      EXCEPTION WHEN OTHERS THEN 
          RAISE NOTICE 'VIP Referral Error for email %: %', new.email, SQLERRM;
      END;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

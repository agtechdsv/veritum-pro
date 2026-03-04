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
       -- FIX CRÍTICO AQUI: name é jsonb, a busca ILIKE requer text
       is_trial = EXISTS (SELECT 1 FROM public.plans WHERE id = NEW.plan_id AND name::text ILIKE '%Trial%'),
       updated_at = NOW()
     WHERE user_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sincroniza o plano para o usuário que realizou a compra recente e ficou travado.
-- Substitua os valores abaixo se necessário
UPDATE public.users 
SET plan_id = 'c38ea923-bc7a-4b1d-ad67-728bbe955cd3' 
WHERE email = 'alexandregms@gmail.com';

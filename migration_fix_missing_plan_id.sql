-- 1. Add plan_id column to public.users if it doesn't exist
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES public.plans(id) ON DELETE SET NULL;

-- 2. Update handle_new_user trigger function to include plan_id and auto-trial
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_role TEXT := 'Administrador';
  user_role TEXT;
  user_name TEXT;
  user_plan_id UUID;
BEGIN
  user_role := COALESCE(new.raw_user_meta_data->>'role', default_role);
  user_name := COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Usuário');
  user_plan_id := (new.raw_user_meta_data->>'plan_id')::uuid;

  -- 💎 AUTO TRIAL: Se nenhum plan_id foi fornecido, busca o plano "Trial"
  IF user_plan_id IS NULL THEN
     SELECT id INTO user_plan_id FROM public.plans WHERE name ILIKE '%Trial%' LIMIT 1;
  END IF;

  INSERT INTO public.users (id, name, username, role, active, avatar_url, parent_user_id, plan_id)
  VALUES (
    new.id,
    user_name,
    new.email,
    user_role, 
    TRUE,
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
    (new.raw_user_meta_data->>'parent_user_id')::uuid,
    user_plan_id
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    name = EXCLUDED.name,
    plan_id = EXCLUDED.plan_id;

  -- 💎 AUTO SUBSCRIPTION: Vincula o usuário ao plano trial/atribuído por 14 dias
  IF user_plan_id IS NOT NULL THEN
     INSERT INTO public.user_subscriptions (user_id, plan_id, start_date, end_date, status, is_trial)
     VALUES (
       new.id,
       user_plan_id,
       now(),
       now() + interval '14 days',
       'active',
       TRUE
     )
     ON CONFLICT DO NOTHING;
  END IF;

  -- Ensure Auth Metadata matches the role and plan for instant RLS validation
  UPDATE auth.users
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'role', user_role,
      'full_name', user_name,
      'name', user_name,
      'plan_id', user_plan_id
    )
  WHERE id = new.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update handle_updated_user trigger function to include plan_id
CREATE OR REPLACE FUNCTION public.handle_updated_user()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'role', NEW.role,
      'full_name', NEW.name,
      'name', NEW.name,
      'parent_user_id', NEW.parent_user_id,
      'active', NEW.active,
      'plan_id', NEW.plan_id
    )
  WHERE id = NEW.id;

  -- Cascade Active status to Operators
  IF (OLD.active IS DISTINCT FROM NEW.active) THEN
    UPDATE public.users SET active = NEW.active WHERE parent_user_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. FORCE SCHEMA RELOAD (DDL trick)
-- Adding and dropping a column forces PostgREST to refresh its schema cache for the table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS _force_cache_reload_v4 BOOLEAN;
ALTER TABLE public.users DROP COLUMN IF EXISTS _force_cache_reload_v4;

-- 5. ALSO NOTIFY (Standard method)
NOTIFY pgrst, 'reload schema';

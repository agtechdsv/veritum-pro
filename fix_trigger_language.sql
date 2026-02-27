-- FIX: Remove missing columns 'language' and 'theme' from the new user trigger.
-- These columns were removed from the table definition but left in the trigger function.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_role TEXT := 'Administrador';
  user_role TEXT;
  user_name TEXT;
  user_plan_id UUID;
  generated_group_id UUID;
BEGIN
  -- 1. Extrair metadados do Auth
  user_role := COALESCE(new.raw_user_meta_data->>'role', default_role);
  user_name := COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Usuário');
  user_plan_id := (new.raw_user_meta_data->>'plan_id')::uuid;

  -- 2. Definir Plano de Trial se não houver um
  IF user_plan_id IS NULL THEN 
    SELECT id INTO user_plan_id FROM public.plans WHERE name = 'Trial 14 Dias' LIMIT 1; 
  END IF;

  -- 3. Criar o usuário na tabela pública
  INSERT INTO public.users (id, name, username, role, active, avatar_url, parent_user_id, plan_id, access_group_id)
  VALUES (
    new.id, 
    user_name, 
    new.email, 
    user_role, 
    TRUE, 
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'), 
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
     ON CONFLICT DO NOTHING;
  END IF;

  -- 5. Criar preferências (SEM as colunas language/theme que agora são LocalStorage)
  INSERT INTO public.user_preferences (user_id) 
  VALUES (new.id) 
  ON CONFLICT (user_id) DO NOTHING;

  -- 6. Sincronizar metadados do Auth
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
  
  -- 7. AUTO-SEED: Gera grupos e cargos padrões para este novo workspace
  PERFORM public.seed_user_workspace(new.id);
  
  -- 8. Criação da Organização para Admin Root
  IF (new.raw_user_meta_data->>'parent_user_id') IS NULL THEN
      INSERT INTO public.organizations (admin_id, company_name)
      VALUES (new.id, user_name || ' - Escritório')
      ON CONFLICT (admin_id) DO NOTHING;
  END IF;
  
  -- 9. Vincular Pioneiro ao grupo Sócio-Administrador
  IF (new.raw_user_meta_data->>'parent_user_id') IS NULL THEN
      SELECT id INTO generated_group_id FROM public.access_groups WHERE admin_id = new.id AND name = 'Sócio-Administrador' LIMIT 1;
      
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VERITUM PRO: AUTO-SEED DE GRUPOS E CARGOS PARA NOVOS CLIENTES (MASTER)
-- ============================================================================
-- Cria uma função que clona dinamicamente os Grupos de Acesso (com permissões)
-- e os Cargos do usuário Master para qualquer novo Sócio-Administrador.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.seed_user_workspace(new_admin_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    master_id uuid;
    mg record;
    new_group_id uuid;
BEGIN
    -- 1. Se o usuário for um "Membro de Equipe" (tem parent_user_id), não ganha workspace master local.
    IF EXISTS (SELECT 1 FROM public.users WHERE id = new_admin_id AND parent_user_id IS NOT NULL) THEN
        RETURN;
    END IF;

    -- 2. Descobre quem é o Master (Dono da plataforma)
    SELECT id INTO master_id FROM public.users WHERE role = 'Master' LIMIT 1;
    IF master_id IS NULL THEN
        -- Fallback de segurança: pega o usuário fundador mais antigo do sistema
        SELECT id INTO master_id FROM public.users ORDER BY created_at ASC LIMIT 1;
    END IF;

    -- 3. Prevenção: Se for a criação do próprio Master, não faz sentido ele clonar dele mesmo.
    IF master_id = new_admin_id THEN
        RETURN;
    END IF;

    -- 4. Inicia o Loop de clonagem (A Magia Dinâmica!)
    -- Vamos varrer todos os Grupos de Acesso que pertencem ao Master.
    FOR mg IN SELECT id, name, name_loc FROM public.access_groups WHERE admin_id = master_id LOOP
        
        -- 4.1 Clona o Grupo de Acesso para o novo admin, replicando `name_loc` com fallback.
        INSERT INTO public.access_groups (id, name, name_loc, admin_id)
        VALUES (
            gen_random_uuid(), 
            mg.name, 
            coalesce(mg.name_loc, jsonb_build_object('pt', mg.name, 'en', mg.name, 'es', mg.name)), 
            new_admin_id
        )
        RETURNING id INTO new_group_id;

        -- 4.2 Clona as Permissões (Rules de Features) desse grupo recém-criado
        INSERT INTO public.group_permissions (group_id, feature_id, can_access)
        SELECT new_group_id, feature_id, can_access
        FROM public.group_permissions
        WHERE group_id = mg.id;

        -- 4.3 Clona os Cargos (Roles) que estavam amarrados especificamente a esse grupo no Master
        INSERT INTO public.roles (id, name, name_loc, access_group_id, admin_id)
        SELECT 
            gen_random_uuid(), 
            name, 
            coalesce(name_loc, jsonb_build_object('pt', name, 'en', name, 'es', name)), 
            new_group_id, 
            new_admin_id
        FROM public.roles
        WHERE access_group_id = mg.id AND admin_id = master_id;

    END LOOP;

    -- 5. Clona também eventuali Cargos (Roles) avulsos do Master que não têm um grupo de acesso amarrado.
    INSERT INTO public.roles (id, name, name_loc, access_group_id, admin_id)
    SELECT 
        gen_random_uuid(), 
        name, 
        coalesce(name_loc, jsonb_build_object('pt', name, 'en', name, 'es', name)), 
        null, 
        new_admin_id
    FROM public.roles
    WHERE access_group_id IS NULL AND admin_id = master_id;

END;
$$;


-- 2. Atualiza a Função HANDLE_NEW_USER (Gatilho Original de Criação de Conta)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  default_role text := 'Administrador';
  user_role text;
  user_name text;
  user_plan_id uuid;
  generated_group_id uuid;
BEGIN
  user_role := coalesce(new.raw_user_meta_data->>'role', default_role);
  user_name := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Usuário');
  user_plan_id := (new.raw_user_meta_data->>'plan_id')::uuid;

  if user_plan_id is null then 
    select id into user_plan_id from public.plans where name = 'Trial 14 Dias' limit 1; 
  end if;

  insert into public.users (id, name, username, role, active, avatar_url, parent_user_id, plan_id, access_group_id)
  values (new.id, user_name, new.email, user_role, true, coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'), (new.raw_user_meta_data->>'parent_user_id')::uuid, user_plan_id, (new.raw_user_meta_data->>'access_group_id')::uuid)
  on conflict (id) do update set role = excluded.role, name = excluded.name, plan_id = excluded.plan_id, access_group_id = excluded.access_group_id;

  if user_plan_id is not null then
     insert into public.user_subscriptions (user_id, plan_id, start_date, end_date, status, is_trial)
     values (new.id, user_plan_id, now(), case when (new.raw_user_meta_data->>'parent_user_id') is not null then null else now() + interval '14 days' end, 'active', case when (new.raw_user_meta_data->>'parent_user_id') is not null then false else true end)
     on conflict do nothing;
  end if;

  insert into public.user_preferences (user_id, language, theme) values (new.id, 'pt', 'dark') on conflict (user_id) do nothing;

  update auth.users set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', user_role, 'full_name', user_name, 'name', user_name, 'plan_id', user_plan_id, 'access_group_id', (new.raw_user_meta_data->>'access_group_id')) where id = new.id;
  
  -- Roda a semeadeira dinâmica atualizada! (Clona Master)
  PERFORM public.seed_user_workspace(new.id);

  -- VINCULA O PIONEIRO (ROOT) AO GRUPO DE SÓCIO-ADMINISTRADOR CLONADO
  if (new.raw_user_meta_data->>'parent_user_id') is null then
      select id into generated_group_id from public.access_groups where admin_id = new.id and name = 'Sócio-Administrador' limit 1;
      
      if generated_group_id is not null then
          update public.users 
          set access_group_id = generated_group_id, role = 'Sócio Administrador'
          where id = new.id;
          
          update auth.users 
          set raw_user_meta_data = raw_user_meta_data || jsonb_build_object('access_group_id', generated_group_id, 'role', 'Sócio Administrador')
          where id = new.id;
      end if;
  end if;

  return new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VERITUM PRO: AUTO-SEED DE GRUPOS E CARGOS PARA NOVOS CLIENTES (MASTER)
-- ============================================================================
-- Cria uma função que gera automaticamente os Grupos de Acesso (com permissões)
-- e os Cargos baseados nos Templates Globais para qualquer novo usuário
-- que assinar a plataforma organicamente.
-- Em seguida, anexa essa função ao trigger de novo usuário.
-- ============================================================================

-- 1. Cria ou Atualiza a Função de Seeding do Workspace
CREATE OR REPLACE FUNCTION public.seed_user_workspace(new_admin_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Se o usuário for um "Membro de Equipe" (tem parent_user_id), abortar.
    -- Só criamos workspace root para donos de escritório (Master ou Administrador orgânico).
    IF EXISTS (SELECT 1 FROM public.users WHERE id = new_admin_id AND parent_user_id IS NOT NULL) THEN
        RETURN;
    END IF;

    -- 1.1 Cadastra os 8 Access Groups atrelados a este novo admin
    INSERT INTO "public"."access_groups" ("id", "name", "admin_id")
    SELECT gen_random_uuid(), name, new_admin_id
    FROM "public"."group_templates"
    ON CONFLICT DO NOTHING;

    -- 1.2 Atrela as Features exatas de cada Template para cada um dos Grupos gerados
    INSERT INTO "public"."group_permissions" ("group_id", "feature_id")
    SELECT g.id, unnest(t.default_features)
    FROM "public"."access_groups" g
    JOIN "public"."group_templates" t ON t.name = g.name
    WHERE g.admin_id = new_admin_id
    ON CONFLICT DO NOTHING;

    -- 1.3 GERAR CARGOS (ROLES) VINCULADOS
    -- GRUPO 1: Sócio-Administrador
    INSERT INTO "public"."roles" (name, access_group_id, admin_id)
    SELECT unnest(ARRAY['Sócio Administrador', 'Sócio Fundador', 'Diretor Jurídico', 'Gestor Geral']), id, new_admin_id
    FROM "public"."access_groups" WHERE name = 'Sócio-Administrador' AND admin_id = new_admin_id;

    -- GRUPO 2: Advogado Sênior / Coordenador
    INSERT INTO "public"."roles" (name, access_group_id, admin_id)
    SELECT unnest(ARRAY['Advogado Sênior', 'Coordenador Jurídico', 'Head de Área', 'Gestor Contencioso']), id, new_admin_id
    FROM "public"."access_groups" WHERE name = 'Advogado Sênior / Coordenador' AND admin_id = new_admin_id;

    -- GRUPO 3: Advogado Associado / Júnior
    INSERT INTO "public"."roles" (name, access_group_id, admin_id)
    SELECT unnest(ARRAY['Advogado Associado', 'Advogado Júnior', 'Advogado Pleno', 'Advogado Trabalhista']), id, new_admin_id
    FROM "public"."access_groups" WHERE name = 'Advogado Associado / Júnior' AND admin_id = new_admin_id;

    -- GRUPO 4: Estagiário / Paralegal
    INSERT INTO "public"."roles" (name, access_group_id, admin_id)
    SELECT unnest(ARRAY['Estagiário', 'Paralegal', 'Assistente Jurídico', 'Auxiliar Administrativo']), id, new_admin_id
    FROM "public"."access_groups" WHERE name = 'Estagiário / Paralegal' AND admin_id = new_admin_id;

    -- GRUPO 5: Departamento Financeiro / Faturamento
    INSERT INTO "public"."roles" (name, access_group_id, admin_id)
    SELECT unnest(ARRAY['Gerente Financeiro', 'Analista Financeiro', 'Assistente de Faturamento', 'Auxiliar de Cobrança']), id, new_admin_id
    FROM "public"."access_groups" WHERE name = 'Departamento Financeiro / Faturamento' AND admin_id = new_admin_id;

    -- GRUPO 6: Controladoria Jurídica (Legal Ops)
    INSERT INTO "public"."roles" (name, access_group_id, admin_id)
    SELECT unnest(ARRAY['Controller Jurídico', 'Analista de Legal Ops', 'Analista de Dados Jurídicos', 'Engenheiro Jurídico']), id, new_admin_id
    FROM "public"."access_groups" WHERE name = 'Controladoria Jurídica (Legal Ops)' AND admin_id = new_admin_id;

    -- GRUPO 7: Secretariado / Recepção
    INSERT INTO "public"."roles" (name, access_group_id, admin_id)
    SELECT unnest(ARRAY['Secretária Executiva', 'Recepcionista', 'Assistente de Atendimento', 'Telefonista']), id, new_admin_id
    FROM "public"."access_groups" WHERE name = 'Secretariado / Recepção' AND admin_id = new_admin_id;

    -- GRUPO 8: Cliente (Acesso Externo B2B2C)
    INSERT INTO "public"."roles" (name, access_group_id, admin_id)
    SELECT unnest(ARRAY['Cliente (Pessoa Física)', 'Representante Legal (Empresa)']), id, new_admin_id
    FROM "public"."access_groups" WHERE name = 'Cliente (Acesso Externo B2B2C)' AND admin_id = new_admin_id;

END;
$$;


-- 2. Atualiza a Função HANDLE_NEW_USER (Gatilho Original de Criação de Conta)
-- Injetando a chamada da nossa função de Seed acima logo no final do fluxo.
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
  
  -- NOVIDADE: Chama o robô semeador de workspace (Grupos e Cargos baseados em template)
  PERFORM public.seed_user_workspace(new.id);

  -- VINCULA O PIONEIRO (ROOT) AO GRUPO DE SÓCIO-ADMINISTRADOR
  if (new.raw_user_meta_data->>'parent_user_id') is null then
      select id into generated_group_id from public.access_groups where admin_id = new.id and name = 'Sócio-Administrador' limit 1;
      
      if generated_group_id is not null then
          -- Atualiza o registro visível
          update public.users 
          set access_group_id = generated_group_id, role = 'Sócio Administrador'
          where id = new.id;
          
          -- Sincroniza de volta no metadata do Auth
          update auth.users 
          set raw_user_meta_data = raw_user_meta_data || jsonb_build_object('access_group_id', generated_group_id, 'role', 'Sócio Administrador')
          where id = new.id;
      end if;
  end if;

  return new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

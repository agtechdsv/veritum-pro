-- ============================================================================
-- VERITUM PRO: SQL SEED PARA CARGOS VINCULADOS AOS GRUPOS (MASTER)
-- ============================================================================
-- Este script localiza os 8 Grupos de Acesso Globais criados pelo Master 
-- e associa cada um deles a uma série de Cargos predefinidos no sistema.
-- Execute este script no SQL Editor do banco MASTER.
-- ============================================================================

DO $$
DECLARE
  master_id uuid;
BEGIN
  -- 1. Encontra o ID do usuário Master
  SELECT id INTO master_id FROM public.users WHERE role = 'Master' LIMIT 1;

  IF master_id IS NOT NULL THEN
    
    -- 2. Limpa os cargos antigos do Master (Opcional, para não duplicar se rodar 2x)
    DELETE FROM "public"."roles" WHERE admin_id = master_id;

    -- ==========================================
    -- 3. ASSOCIAÇÃO: GRUPO -> CARGOS
    -- ==========================================

    -- GRUPO 1: Sócio-Administrador
    INSERT INTO "public"."roles" (name, access_group_id, admin_id)
    SELECT unnest(ARRAY[
        'Sócio Administrador', 
        'Sócio Fundador', 
        'Diretor Jurídico', 
        'Gestor Geral'
    ]), id, master_id
    FROM "public"."access_groups" WHERE name = 'Sócio-Administrador' AND admin_id = master_id;

    -- GRUPO 2: Advogado Sênior / Coordenador
    INSERT INTO "public"."roles" (name, access_group_id, admin_id)
    SELECT unnest(ARRAY[
        'Advogado Sênior', 
        'Coordenador Jurídico', 
        'Head de Área', 
        'Gestor Contencioso'
    ]), id, master_id
    FROM "public"."access_groups" WHERE name = 'Advogado Sênior / Coordenador' AND admin_id = master_id;

    -- GRUPO 3: Advogado Associado / Júnior
    INSERT INTO "public"."roles" (name, access_group_id, admin_id)
    SELECT unnest(ARRAY[
        'Advogado Associado', 
        'Advogado Júnior', 
        'Advogado Pleno', 
        'Advogado Trabalhista'
    ]), id, master_id
    FROM "public"."access_groups" WHERE name = 'Advogado Associado / Júnior' AND admin_id = master_id;

    -- GRUPO 4: Estagiário / Paralegal
    INSERT INTO "public"."roles" (name, access_group_id, admin_id)
    SELECT unnest(ARRAY[
        'Estagiário', 
        'Paralegal', 
        'Assistente Jurídico', 
        'Auxiliar Administrativo'
    ]), id, master_id
    FROM "public"."access_groups" WHERE name = 'Estagiário / Paralegal' AND admin_id = master_id;

    -- GRUPO 5: Departamento Financeiro / Faturamento
    INSERT INTO "public"."roles" (name, access_group_id, admin_id)
    SELECT unnest(ARRAY[
        'Gerente Financeiro', 
        'Analista Financeiro', 
        'Assistente de Faturamento', 
        'Auxiliar de Cobrança'
    ]), id, master_id
    FROM "public"."access_groups" WHERE name = 'Departamento Financeiro / Faturamento' AND admin_id = master_id;

    -- GRUPO 6: Controladoria Jurídica (Legal Ops)
    INSERT INTO "public"."roles" (name, access_group_id, admin_id)
    SELECT unnest(ARRAY[
        'Controller Jurídico', 
        'Analista de Legal Ops', 
        'Analista de Dados Jurídicos', 
        'Engenheiro Jurídico'
    ]), id, master_id
    FROM "public"."access_groups" WHERE name = 'Controladoria Jurídica (Legal Ops)' AND admin_id = master_id;

    -- GRUPO 7: Secretariado / Recepção
    INSERT INTO "public"."roles" (name, access_group_id, admin_id)
    SELECT unnest(ARRAY[
        'Secretária Executiva', 
        'Recepcionista', 
        'Assistente de Atendimento', 
        'Telefonista'
    ]), id, master_id
    FROM "public"."access_groups" WHERE name = 'Secretariado / Recepção' AND admin_id = master_id;

    -- GRUPO 8: Cliente (Acesso Externo B2B2C)
    INSERT INTO "public"."roles" (name, access_group_id, admin_id)
    SELECT unnest(ARRAY[
        'Cliente (Pessoa Física)', 
        'Representante Legal (Empresa)'
    ]), id, master_id
    FROM "public"."access_groups" WHERE name = 'Cliente (Acesso Externo B2B2C)' AND admin_id = master_id;

  END IF;
END $$;

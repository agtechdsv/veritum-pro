-- ============================================================================
-- VERITUM PRO: SQL SEED COMPLETO PARA GRUPOS E CARGOS (MASTER)
-- ============================================================================
-- Execute este script no SQL Editor do banco MASTER.
-- Ele garantirá que os 8 TEMPLATES base sejam gerados, transformados 
-- em GRUPOS DE ACESSO vinculados à sua conta Master, e por fim injetará 
-- os CARGOS recomendados em cada um deles.
-- ============================================================================

-- 1. TEMPLATES DE GRUPOS (PERSONAS PADRÃO)
DELETE FROM "public"."group_templates";

INSERT INTO "public"."group_templates" ("name", "description", "default_features")
SELECT 'Sócio-Administrador', 'Acesso total e irrestrito, incluindo configurações de workspace e faturamento.', array_agg(id)
FROM public.features;

INSERT INTO "public"."group_templates" ("name", "description", "default_features")
SELECT 'Advogado Sênior / Coordenador', 'Gestores operacionais, aprovação de peças e análise de risco, sem acesso ao financeiro/configurações.', array_agg(id)
FROM public.features WHERE feature_key IN ('nexus_gestao_prazos', 'nexus_workflows', 'scriptor_gerador_ia', 'scriptor_auditoria_risco', 'scriptor_ged', 'scriptor_assinatura', 'sentinel_diarios', 'sentinel_analise_sentimento', 'cognitio_dashboards', 'cognitio_magistrados', 'cognitio_preditiva', 'intelligence_golden_alerts', 'intelligence_matcher', 'nexus_gestao_equipe', 'nexus_gestao_pessoas');

INSERT INTO "public"."group_templates" ("name", "description", "default_features")
SELECT 'Advogado Associado / Júnior', 'A base operacional: cadastro, IA, processos e prazos, sem visão estratégica global.', array_agg(id)
FROM public.features WHERE feature_key IN ('nexus_gestao_prazos', 'scriptor_gerador_ia', 'scriptor_ged', 'sentinel_diarios', 'intelligence_golden_alerts', 'nexus_gestao_pessoas');

INSERT INTO "public"."group_templates" ("name", "description", "default_features")
SELECT 'Estagiário / Paralegal', 'Foco em alimentar o sistema, cadastrar pessoas e anexar documentos, sem redigir com IA ou assinar.', array_agg(id)
FROM public.features WHERE feature_key IN ('nexus_gestao_prazos', 'scriptor_ged', 'sentinel_diarios', 'nexus_gestao_pessoas');

INSERT INTO "public"."group_templates" ("name", "description", "default_features")
SELECT 'Departamento Financeiro / Faturamento', 'Foco total no Valorem PRO, caixa e emissão de boletos, isolado dos documentos jurídicos.', array_agg(id)
FROM public.features WHERE feature_key IN ('valorem_financeiro', 'valorem_boletos_pix', 'valorem_pjecalc', 'valorem_provisionamento', 'nexus_gestao_pessoas');

INSERT INTO "public"."group_templates" ("name", "description", "default_features")
SELECT 'Cliente (Acesso Externo B2B2C)', 'Acesso exclusivo ao Portal do Cliente para consulta de seus processos.', array_agg(id)
FROM public.features WHERE feature_key IN ('vox_portal');

INSERT INTO "public"."group_templates" ("name", "description", "default_features")
SELECT 'Controladoria Jurídica (Legal Ops)', 'O cérebro das automações, prazos e relatórios de jurimetria.', array_agg(id)
FROM public.features WHERE feature_key IN ('nexus_gestao_prazos', 'nexus_workflows', 'sentinel_diarios', 'cognitio_dashboards', 'scriptor_auditoria_risco');

INSERT INTO "public"."group_templates" ("name", "description", "default_features")
SELECT 'Secretariado / Recepção', 'A linha de frente: cadastro básico de clientes e atendimento via WhatsApp.', array_agg(id)
FROM public.features WHERE feature_key IN ('nexus_gestao_prazos', 'nexus_gestao_pessoas', 'vox_whatsapp');

-- ============================================================================
-- 2. TRANSFORMAR TEMPLATES EM "ACCESS_GROUPS", HABILITANDO "PERMISSIONS" E "ROLES"
-- ============================================================================
DO $$
DECLARE
  master_id uuid;
BEGIN
  -- Identifica o ID do usuário Master logado
  SELECT id INTO master_id FROM public.users WHERE role = 'Master' LIMIT 1;

  IF master_id IS NOT NULL THEN
    
    -- Limpeza de Prevenção (deleta apenas os da lista caso você rode o script de novo)
    DELETE FROM "public"."access_groups" WHERE admin_id = master_id AND name IN (SELECT name FROM "public"."group_templates");

    -- 2.1 Cadastra os 8 Access Groups atrelados ao seu Master ID
    INSERT INTO "public"."access_groups" ("id", "name", "admin_id")
    SELECT gen_random_uuid(), name, master_id
    FROM "public"."group_templates";

    -- 2.2 Atrela as Features exatas de cada Template para cada um dos Grupos do Master
    INSERT INTO "public"."group_permissions" ("group_id", "feature_id")
    SELECT g.id, unnest(t.default_features)
    FROM "public"."access_groups" g
    JOIN "public"."group_templates" t ON t.name = g.name
    WHERE g.admin_id = master_id
    ON CONFLICT DO NOTHING;

    -- ==========================================
    -- 2.3 GERAR CARGOS (ROLES) VINCULADOS
    -- ==========================================
    DELETE FROM "public"."roles" WHERE admin_id = master_id;

    -- GRUPO 1: Sócio-Administrador
    INSERT INTO "public"."roles" (name, access_group_id, admin_id)
    SELECT unnest(ARRAY['Sócio Administrador', 'Sócio Fundador', 'Diretor Jurídico', 'Gestor Geral']), id, master_id
    FROM "public"."access_groups" WHERE name = 'Sócio-Administrador' AND admin_id = master_id;

    -- GRUPO 2: Advogado Sênior / Coordenador
    INSERT INTO "public"."roles" (name, access_group_id, admin_id)
    SELECT unnest(ARRAY['Advogado Sênior', 'Coordenador Jurídico', 'Head de Área', 'Gestor Contencioso']), id, master_id
    FROM "public"."access_groups" WHERE name = 'Advogado Sênior / Coordenador' AND admin_id = master_id;

    -- GRUPO 3: Advogado Associado / Júnior
    INSERT INTO "public"."roles" (name, access_group_id, admin_id)
    SELECT unnest(ARRAY['Advogado Associado', 'Advogado Júnior', 'Advogado Pleno', 'Advogado Trabalhista']), id, master_id
    FROM "public"."access_groups" WHERE name = 'Advogado Associado / Júnior' AND admin_id = master_id;

    -- GRUPO 4: Estagiário / Paralegal
    INSERT INTO "public"."roles" (name, access_group_id, admin_id)
    SELECT unnest(ARRAY['Estagiário', 'Paralegal', 'Assistente Jurídico', 'Auxiliar Administrativo']), id, master_id
    FROM "public"."access_groups" WHERE name = 'Estagiário / Paralegal' AND admin_id = master_id;

    -- GRUPO 5: Departamento Financeiro / Faturamento
    INSERT INTO "public"."roles" (name, access_group_id, admin_id)
    SELECT unnest(ARRAY['Gerente Financeiro', 'Analista Financeiro', 'Assistente de Faturamento', 'Auxiliar de Cobrança']), id, master_id
    FROM "public"."access_groups" WHERE name = 'Departamento Financeiro / Faturamento' AND admin_id = master_id;

    -- GRUPO 6: Controladoria Jurídica (Legal Ops)
    INSERT INTO "public"."roles" (name, access_group_id, admin_id)
    SELECT unnest(ARRAY['Controller Jurídico', 'Analista de Legal Ops', 'Analista de Dados Jurídicos', 'Engenheiro Jurídico']), id, master_id
    FROM "public"."access_groups" WHERE name = 'Controladoria Jurídica (Legal Ops)' AND admin_id = master_id;

    -- GRUPO 7: Secretariado / Recepção
    INSERT INTO "public"."roles" (name, access_group_id, admin_id)
    SELECT unnest(ARRAY['Secretária Executiva', 'Recepcionista', 'Assistente de Atendimento', 'Telefonista']), id, master_id
    FROM "public"."access_groups" WHERE name = 'Secretariado / Recepção' AND admin_id = master_id;

    -- GRUPO 8: Cliente (Acesso Externo B2B2C)
    INSERT INTO "public"."roles" (name, access_group_id, admin_id)
    SELECT unnest(ARRAY['Cliente (Pessoa Física)', 'Representante Legal (Empresa)']), id, master_id
    FROM "public"."access_groups" WHERE name = 'Cliente (Acesso Externo B2B2C)' AND admin_id = master_id;

  END IF;
END $$;

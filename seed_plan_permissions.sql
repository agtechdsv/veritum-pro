-- Refined Seed Plan Permissions (Clean Slate)

-- 1. DELETE all existing permissions to ensure only the assigned ones remain
TRUNCATE public.plan_permissions;

-- 2. Bulk INSERT permissions based on the provided business rules
WITH p_ids AS (
    SELECT id, name FROM public.plans
),
f_ids AS (
    SELECT id, feature_key FROM public.features
)
INSERT INTO public.plan_permissions (plan_id, feature_id)
SELECT p.id, f.id
FROM (
    VALUES
    -- 1. Plano START
    ('Plano START', 'nexus_gestao_prazos'),
    ('Plano START', 'sentinel_diarios'),
    ('Plano START', 'scriptor_ged'),
    ('Plano START', 'valorem_financeiro'),
    ('Plano START', 'valorem_boletos_pix'),
    ('Plano START', 'valorem_pjecalc'),

    -- 2. Plano GROWTH
    ('Plano GROWTH', 'nexus_gestao_prazos'),
    ('Plano GROWTH', 'sentinel_diarios'),
    ('Plano GROWTH', 'scriptor_ged'),
    ('Plano GROWTH', 'valorem_financeiro'),
    ('Plano GROWTH', 'valorem_boletos_pix'),
    ('Plano GROWTH', 'valorem_pjecalc'),
    ('Plano GROWTH', 'nexus_workflows'),
    ('Plano GROWTH', 'sentinel_captura_antecipada'),
    ('Plano GROWTH', 'sentinel_analise_sentimento'),
    ('Plano GROWTH', 'scriptor_gerador_ia'),
    ('Plano GROWTH', 'scriptor_assinatura'),
    ('Plano GROWTH', 'vox_portal'),
    ('Plano GROWTH', 'vox_whatsapp'),
    ('Plano GROWTH', 'vox_traducao_ia'),

    -- 3. Plano STRATEGY
    ('Plano STRATEGY', 'nexus_gestao_prazos'),
    ('Plano STRATEGY', 'sentinel_diarios'),
    ('Plano STRATEGY', 'scriptor_ged'),
    ('Plano STRATEGY', 'valorem_financeiro'),
    ('Plano STRATEGY', 'valorem_boletos_pix'),
    ('Plano STRATEGY', 'valorem_pjecalc'),
    ('Plano STRATEGY', 'nexus_workflows'),
    ('Plano STRATEGY', 'sentinel_captura_antecipada'),
    ('Plano STRATEGY', 'sentinel_analise_sentimento'),
    ('Plano STRATEGY', 'scriptor_gerador_ia'),
    ('Plano STRATEGY', 'scriptor_assinatura'),
    ('Plano STRATEGY', 'vox_portal'),
    ('Plano STRATEGY', 'vox_whatsapp'),
    ('Plano STRATEGY', 'vox_traducao_ia'),
    ('Plano STRATEGY', 'nexus_gestao_ativos'),
    ('Plano STRATEGY', 'nexus_controle_societario'),
    ('Plano STRATEGY', 'sentinel_clipping_midia'),
    ('Plano STRATEGY', 'scriptor_auditoria_risco'),
    ('Plano STRATEGY', 'valorem_provisionamento'),
    ('Plano STRATEGY', 'cognitio_dashboards'),
    ('Plano STRATEGY', 'cognitio_preditiva'),
    ('Plano STRATEGY', 'cognitio_magistrados'),

    -- 4. Sentinel Radar (Standalone)
    ('Sentinel Radar', 'sentinel_diarios'),
    ('Sentinel Radar', 'sentinel_captura_antecipada'),

    -- 5. Sentinel 360º (Standalone)
    ('Sentinel 360º', 'sentinel_diarios'),
    ('Sentinel 360º', 'sentinel_captura_antecipada'),
    ('Sentinel 360º', 'sentinel_clipping_midia'),
    ('Sentinel 360º', 'sentinel_analise_sentimento'),

    -- 6. Cognitio Pro (Standalone)
    ('Cognitio Pro', 'cognitio_dashboards'),
    ('Cognitio Pro', 'cognitio_preditiva'),
    ('Cognitio Pro', 'cognitio_magistrados'),

    -- 7. Scriptor Pro (Standalone)
    ('Scriptor Pro', 'scriptor_ged'),
    ('Scriptor Pro', 'scriptor_gerador_ia'),
    ('Scriptor Pro', 'scriptor_auditoria_risco'),
    ('Scriptor Pro', 'scriptor_assinatura')

) AS mapping(p_name, f_key)
JOIN p_ids p ON p.name = mapping.p_name
JOIN f_ids f ON f.feature_key = mapping.f_key;

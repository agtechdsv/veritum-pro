-- 1. Inserir Benefícios VIP baseados na Landing Page
INSERT INTO public.vip_benefits (name, short_desc, benefit_type, status, icon_name)
VALUES 
(
    '{"pt": "Caixa Postal VIP Exclusiva", "en": "Exclusive VIP Mailbox", "es": "Buzón VIP Exclusivo"}'::jsonb,
    '{"pt": "Ative o seu webmail corporativo com a sua identidade digital @veritumpro.com com segurança de grau militar.", "en": "Activate your corporate webmail with your digital identity @veritumpro.com with military-grade security.", "es": "Active su webmail corporativo con su identidad digital @veritumpro.com con seguridad de grado militar."}'::jsonb,
    'service',
    'active',
    'ShieldCheck'
),
(
    '{"pt": "Filtro Inteligente de Clientes", "en": "Smart Client Filter", "es": "Filtro Inteligente de Clientes"}'::jsonb,
    '{"pt": "Sistema de IA pré-filtra quem acessa o seu link exclusivo reduzindo spamários jurídicos.", "en": "AI system pre-filters who accesses your exclusive link reducing legal spammers.", "es": "El sistema de IA prefiltra quién accede a su enlace exclusivo reduciendo los spammers legales."}'::jsonb,
    'service',
    'active',
    'Target'
),
(
    '{"pt": "Acesso Antecipado a Módulos", "en": "Early Access to Modules", "es": "Acceso Anticipado a Módulos"}'::jsonb,
    '{"pt": "Receba novos recursos e módulos do SaaS 15 dias antes de toda a base de usuários.", "en": "Receive new SaaS features and modules 15 days before the entire user base.", "es": "Reciba nuevas funciones y módulos SaaS 15 días antes que toda la base de usuarios."}'::jsonb,
    'service',
    'active',
    'Zap'
);

-- 2. Inserir Regras de Pontuação (Depende dos IDs reais dos planos START, GROWTH, STRATEGY)
-- Vou usar subqueries para buscar o plan_id dinamicamente com base no nome do plano (assumindo que existam na tabela)
DO $$
DECLARE
    start_id uuid;
    growth_id uuid;
    strategy_id uuid;
BEGIN
    SELECT id INTO start_id FROM public.plans WHERE (name->>'pt') ILIKE '%start%' or (name->>'en') ILIKE '%start%' LIMIT 1;
    SELECT id INTO growth_id FROM public.plans WHERE (name->>'pt') ILIKE '%growth%' or (name->>'en') ILIKE '%growth%' LIMIT 1;
    SELECT id INTO strategy_id FROM public.plans WHERE (name->>'pt') ILIKE '%strategy%' or (name->>'en') ILIKE '%strategy%' LIMIT 1;

    -- Pontos do Plano START (1 Mensal, 2 Trimes, 3 Semes, 5 Anual)
    IF start_id IS NOT NULL THEN
        INSERT INTO public.referral_rules (plan_id, billing_cycle, points_generated) VALUES 
        (start_id, 'monthly', 1), (start_id, 'quarterly', 2), (start_id, 'semiannual', 3), (start_id, 'annual', 5)
        ON CONFLICT (plan_id, billing_cycle) DO UPDATE SET points_generated = EXCLUDED.points_generated;
    END IF;

    -- Pontos do Plano GROWTH (2 Mensal, 4 Trimes, 7 Semes, 10 Anual)
    IF growth_id IS NOT NULL THEN
        INSERT INTO public.referral_rules (plan_id, billing_cycle, points_generated) VALUES 
        (growth_id, 'monthly', 2), (growth_id, 'quarterly', 4), (growth_id, 'semiannual', 7), (growth_id, 'annual', 10)
        ON CONFLICT (plan_id, billing_cycle) DO UPDATE SET points_generated = EXCLUDED.points_generated;
    END IF;

    -- Pontos do Plano STRATEGY (3 Mensal, 6 Trimes, 11 Semes, 15 Anual)
    IF strategy_id IS NOT NULL THEN
        INSERT INTO public.referral_rules (plan_id, billing_cycle, points_generated) VALUES 
        (strategy_id, 'monthly', 3), (strategy_id, 'quarterly', 6), (strategy_id, 'semiannual', 11), (strategy_id, 'annual', 15)
        ON CONFLICT (plan_id, billing_cycle) DO UPDATE SET points_generated = EXCLUDED.points_generated;
    END IF;

END $$;

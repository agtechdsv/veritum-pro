-- ==============================================================================
-- 1. Limpar Benefícios Anteriores para Inserir do Zero (Apenas os 2 solicitados)
-- ==============================================================================
DELETE FROM public.vip_benefits;

-- ==============================================================================
-- 2. Inserir os 2 Benefícios VIP
-- ==============================================================================
INSERT INTO public.vip_benefits (name, short_desc, long_desc, benefit_type, status, icon_name, benefit_key, metadata, order_index)
VALUES 
(
    '{"pt": "Desconto Automático na Renovação", "en": "Automatic Renewal Discount", "es": "Descuento Automático en Renovación"}'::jsonb,
    '{"pt": "Converta seus pontos em até 100% de desconto automático.", "en": "Convert points into up to 100% automatic discount.", "es": "Convierta puntos en hasta un 100% de descuento automático."}'::jsonb,
    '{"pt": "O sistema abaterá automaticamente 1% de desconto para cada ponto que você tiver na carteira no momento da renovação, com teto de 100 pontos.", "en": "The system will automatically apply a 1% discount for each point.", "es": "El sistema aplicará automáticamente un 1% de descuento por cada punto."}'::jsonb,
    'discount',
    'active',
    'DollarSign',
    'auto_discount_renewal',
    '{"cost_in_points": 100, "conversion_ratio": 1}'::jsonb,
    1
),
(
    '{"pt": "Caixa Postal VIP Exclusiva", "en": "Exclusive VIP Mailbox", "es": "Buzón VIP Exclusivo"}'::jsonb,
    '{"pt": "E-mail corporativo @veritumpro.com.", "en": "Corporate email @veritumpro.com.", "es": "Correo corporativo @veritumpro.com."}'::jsonb,
    '{"pt": "Tenha a identidade digital @veritumpro.com com segurança de grau militar emulada na nossa própria infraestrutura.", "en": "Get the @veritumpro.com digital identity.", "es": "Obtenga la identidad digital @veritumpro.com."}'::jsonb,
    'service',
    'active',
    'Mail',
    'exclusive_email',
    '{"cost_in_points": 0, "is_automatic": true}'::jsonb,
    2
);

-- ==============================================================================
-- 3. Atrelar os Benefícios aos Planos Corretos
-- ==============================================================================
DO $$
DECLARE
    start_id uuid;
    growth_id uuid;
    strategy_id uuid;
    discount_id uuid;
    email_id uuid;
BEGIN
    -- Obter os IDs dos Planos
    SELECT id INTO start_id FROM public.plans WHERE (name->>'pt') ILIKE '%start%' LIMIT 1;
    SELECT id INTO growth_id FROM public.plans WHERE (name->>'pt') ILIKE '%growth%' LIMIT 1;
    SELECT id INTO strategy_id FROM public.plans WHERE (name->>'pt') ILIKE '%strategy%' LIMIT 1;

    -- Obter os IDs dos Benefícios que acabamos de inserir
    SELECT id INTO discount_id FROM public.vip_benefits WHERE benefit_key = 'auto_discount_renewal' LIMIT 1;
    SELECT id INTO email_id FROM public.vip_benefits WHERE benefit_key = 'exclusive_email' LIMIT 1;

    -- ============================================================
    -- A) Desconto Automático = Todos os Planos e Todos os Ciclos
    -- ============================================================
    IF discount_id IS NOT NULL THEN
        IF start_id IS NOT NULL THEN
            INSERT INTO public.vip_benefit_plans (benefit_id, plan_id, cycles) 
            VALUES (discount_id, start_id, '["monthly", "quarterly", "semiannual", "annual"]'::jsonb);
        END IF;

        IF growth_id IS NOT NULL THEN
            INSERT INTO public.vip_benefit_plans (benefit_id, plan_id, cycles) 
            VALUES (discount_id, growth_id, '["monthly", "quarterly", "semiannual", "annual"]'::jsonb);
        END IF;

        IF strategy_id IS NOT NULL THEN
            INSERT INTO public.vip_benefit_plans (benefit_id, plan_id, cycles) 
            VALUES (discount_id, strategy_id, '["monthly", "quarterly", "semiannual", "annual"]'::jsonb);
        END IF;
    END IF;

    -- ============================================================
    -- B) Caixa Postal = Apenas Growth (Semestral/Anual) e Strategy (Semestral/Anual)
    -- ============================================================
    IF email_id IS NOT NULL THEN
        -- Growth
        IF growth_id IS NOT NULL THEN
            INSERT INTO public.vip_benefit_plans (benefit_id, plan_id, cycles) 
            VALUES (email_id, growth_id, '["semiannual", "annual"]'::jsonb);
        END IF;

        -- Strategy
        IF strategy_id IS NOT NULL THEN
            INSERT INTO public.vip_benefit_plans (benefit_id, plan_id, cycles) 
            VALUES (email_id, strategy_id, '["semiannual", "annual"]'::jsonb);
        END IF;
    END IF;

END $$;

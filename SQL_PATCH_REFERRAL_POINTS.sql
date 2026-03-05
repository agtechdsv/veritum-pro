-- ============================================================================
-- VERITUM PRO: REFERRAL POINTS SYSTEM (CLUBE VIP)
-- ============================================================================

BEGIN;

-- 1. ADICIONAR COLUNA BILLING_CYCLE EM USER_SUBSCRIPTIONS (Se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_subscriptions' AND column_name = 'billing_cycle') THEN
        ALTER TABLE public.user_subscriptions ADD COLUMN billing_cycle text;
    END IF;
END $$;

-- 2. GARANTIR QUE TODO USUÁRIO TENHA UM REGISTRO DE SALDO VIP (Opcional, mas seguro)
-- Podemos fazer isso num trigger ou sob demanda.

-- 3. FUNÇÃO PARA PROCESSAR CRÉDITO DE PONTOS
CREATE OR REPLACE FUNCTION public.process_referral_points()
RETURNS trigger AS $$
DECLARE
    v_referrer_id uuid;
    v_points integer;
    v_rule_cycle text;
BEGIN
    -- Só processamos se o plano deixou de ser TRIAL (virou oficial)
    IF (OLD.is_trial IS TRUE AND NEW.is_trial IS FALSE) OR (OLD.plan_id IS DISTINCT FROM NEW.plan_id AND NEW.is_trial IS FALSE) THEN
        
        -- Mapear Cycle para a regra (yearly -> annual)
        v_rule_cycle := CASE 
            WHEN NEW.billing_cycle = 'yearly' THEN 'annual'
            ELSE coalesce(NEW.billing_cycle, 'monthly')
        END;

        -- 1. Tentar encontrar a indicação pendente para este usuário
        SELECT referrer_id INTO v_referrer_id 
        FROM public.user_referrals 
        WHERE referred_id = NEW.user_id AND status = 'pending'
        LIMIT 1;

        IF v_referrer_id IS NOT NULL THEN
            -- 2. Buscar quantos pontos essa combinação Plano + Ciclo gera
            SELECT points_generated INTO v_points
            FROM public.referral_rules
            WHERE plan_id = NEW.plan_id 
              AND billing_cycle = v_rule_cycle
            LIMIT 1;

            -- Fallback: Se não achar regra específica para o ciclo, tenta mensal ou qualquer uma do plano
            IF v_points IS NULL THEN
                SELECT points_generated INTO v_points
                FROM public.referral_rules
                WHERE plan_id = NEW.plan_id
                ORDER BY (billing_cycle = 'monthly') DESC
                LIMIT 1;
            END IF;

            IF v_points IS NOT NULL AND v_points > 0 THEN
                -- 3. Atualizar a indicação
                UPDATE public.user_referrals
                SET 
                    status = 'confirmed',
                    points_generated = v_points,
                    payment_confirmed_at = NOW(),
                    points_credited_at = NOW(),
                    plan_id = NEW.plan_id,
                    updated_at = NOW()
                WHERE referred_id = NEW.user_id AND status = 'pending';

                -- 4. Somar pontos no saldo do padrinho (Referrer)
                INSERT INTO public.user_vip_balance (user_id, total_points, last_updated)
                VALUES (v_referrer_id, v_points, NOW())
                ON CONFLICT (user_id) DO UPDATE SET
                    total_points = public.user_vip_balance.total_points + EXCLUDED.total_points,
                    last_updated = NOW();
                
                RAISE NOTICE 'Pontos VIP creditados: % para o indicador %', v_points, v_referrer_id;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. ACOPLAR TRIGGER NA TABELA DE ASSINATURAS
DROP TRIGGER IF EXISTS trg_process_referral_points ON public.user_subscriptions;
CREATE TRIGGER trg_process_referral_points
    AFTER UPDATE ON public.user_subscriptions
    FOR EACH ROW
    WHEN (OLD.is_trial IS DISTINCT FROM NEW.is_trial OR OLD.plan_id IS DISTINCT FROM NEW.plan_id)
    EXECUTE FUNCTION public.process_referral_points();

COMMIT;

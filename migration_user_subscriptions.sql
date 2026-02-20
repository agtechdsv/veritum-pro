-- 1. Create user_subscriptions table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
    start_date timestamp with time zone DEFAULT now(),
    end_date timestamp with time zone,
    status text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'canceled')),
    is_trial boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- 3. Policies
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Master: Full access to subscriptions" ON public.user_subscriptions
FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Master');

-- 4. Seed "Trial" Plan (Hidden/Inactive by default)
INSERT INTO public.plans (name, active, order_index, is_combo)
VALUES ('Trial 14 Dias', false, 99, false)
ON CONFLICT DO NOTHING;

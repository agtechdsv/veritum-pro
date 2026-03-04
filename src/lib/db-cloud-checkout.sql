-- Execute no SQL Editor do Supabase para suportar Checkout com Cloud_Plans e gerenciar a vigência independente:

-- 1. Cria as colunas cloud_plan_id nas tabelas fundamentais
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS cloud_plan_id UUID REFERENCES public.cloud_plans(id) ON DELETE SET NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS cloud_plan_id UUID REFERENCES public.cloud_plans(id) ON DELETE SET NULL;

-- 2. Adiciona as datas de controle independente para o Cloud (preparando para upsells futuros)
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS cloud_start_date TIMESTAMPTZ;
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS cloud_end_date TIMESTAMPTZ;
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS cloud_status TEXT DEFAULT 'active' CHECK (cloud_status IN ('active', 'expired', 'canceled'));

-- 3. Cria os índices para deixar as queries futuras mais rápidas
CREATE INDEX IF NOT EXISTS idx_subs_cloud ON public.user_subscriptions(cloud_plan_id);
CREATE INDEX IF NOT EXISTS idx_users_cloud ON public.users(cloud_plan_id);

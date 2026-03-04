-- Run this in your Supabase SQL Editor to support the VIP Gamification Module

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS vip_active BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS vip_points INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS vip_code TEXT;

-- Opcional: Para gerar os códigos automaticamente para todos os usuários atuais
-- UPDATE public.users SET vip_code = 'VIP-' || UPPER(SPLIT_PART(name, ' ', 1)) WHERE vip_code IS NULL;

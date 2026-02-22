-- Drop old table if exists (starting fresh for refactor)
DROP TABLE IF EXISTS public.email_settings;

-- Create the public.email_settings table with JSONB config
CREATE TABLE IF NOT EXISTS public.email_settings (
  id uuid not null default gen_random_uuid (),
  scenario_key text not null, -- 'general', 'sales', 'billing', 'support'
  config jsonb not null default '{
    "pt": {"email": "", "name": ""},
    "en": {"email": "", "name": ""}
  }'::jsonb,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint email_settings_pkey primary key (id),
  constraint email_settings_scenario_key_key unique (scenario_key)
) TABLESPACE pg_default;

-- Enable RLS
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Master: Full CRUD" ON public.email_settings;
DROP POLICY IF EXISTS "Service Role: Read" ON public.email_settings;

-- Master: Full CRUD
CREATE POLICY "Master: Full CRUD" ON public.email_settings 
FOR ALL USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'Master'
);

-- Service Role (Edge Functions): Read
CREATE POLICY "Service Role: Read" ON public.email_settings 
FOR SELECT USING (true);

-- Insert Initial Aliases grouped by scenario
INSERT INTO public.email_settings (scenario_key, config)
VALUES 
  ('general', '{
    "pt": {"email": "contato@veritumpro.com", "name": "Veritum PRO"},
    "en": {"email": "contact@veritumpro.com", "name": "Veritum PRO"}
  }'),
  ('sales', '{
    "pt": {"email": "sucesso@veritumpro.com", "name": "Veritum Sucesso"},
    "en": {"email": "success@veritumpro.com", "name": "Veritum Success"}
  }'),
  ('billing', '{
    "pt": {"email": "financeiro@veritumpro.com", "name": "Veritum Financeiro"},
    "en": {"email": "billing@veritumpro.com", "name": "Veritum Billing"}
  }'),
  ('support', '{
    "pt": {"email": "suporte@veritumpro.com", "name": "Veritum Suporte"},
    "en": {"email": "support@veritumpro.com", "name": "Veritum Support"}
  }')
ON CONFLICT (scenario_key) DO UPDATE SET
  config = EXCLUDED.config,
  updated_at = now();

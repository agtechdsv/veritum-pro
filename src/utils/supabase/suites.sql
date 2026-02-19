-- Create the public.suites table
CREATE TABLE IF NOT EXISTS public.suites (
  id uuid not null default gen_random_uuid (),
  suite_key text not null,
  name text not null,
  short_desc jsonb null default '{"en": "", "es": "", "pt": ""}'::jsonb,
  detailed_desc jsonb null default '{"en": "", "es": "", "pt": ""}'::jsonb,
  features jsonb null default '{"en": [], "es": [], "pt": []}'::jsonb,
  icon_svg text null,
  active boolean null default true,
  order_index integer null default 0,
  created_at timestamp with time zone null default now(),
  constraint suites_pkey primary key (id),
  constraint suites_suite_key_key unique (suite_key)
) TABLESPACE pg_default;

-- Enable RLS
ALTER TABLE public.suites ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Master: Full CRUD" ON public.suites;
DROP POLICY IF EXISTS "Active Suites: Public Select" ON public.suites;

-- Master: Full CRUD
CREATE POLICY "Master: Full CRUD" ON public.suites 
FOR ALL USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'Master'
);

-- Public/Authenticated: Select active suites
CREATE POLICY "Active Suites: Public Select" ON public.suites 
FOR SELECT USING (active = true);

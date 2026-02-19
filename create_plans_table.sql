create table public.plans (
  id uuid not null default gen_random_uuid (),
  name text not null,
  short_desc jsonb null default '{"en": "", "es": "", "pt": ""}'::jsonb,
  monthly_price numeric null default 0,
  monthly_discount numeric null default 0,
  yearly_price numeric null default 0,
  yearly_discount numeric null default 0,
  features jsonb null default '{"en": [], "es": [], "pt": []}'::jsonb,
  recommended boolean null default false,
  active boolean null default true,
  order_index integer null default 0,
  created_at timestamp with time zone null default now(),
  is_combo boolean null default false,
  constraint plans_pkey primary key (id)
) TABLESPACE pg_default;

-- Enable RLS
alter table public.plans enable row level security;

-- Policies
create policy "Public can read active plans" on public.plans for select using (active = true);
create policy "Master has full access to plans" on public.plans for all using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Master');

-- Create plan_permissions table
create table if not exists public.plan_permissions (
    id uuid not null default gen_random_uuid (),
    plan_id uuid not null references public.plans(id) on delete cascade,
    suite_key text not null,
    enabled_features text[] default '{}',
    tier_name text, -- e.g., 'Basic', 'Standard', 'Advanced'
    created_at timestamp with time zone default now(),
    constraint plan_permissions_pkey primary key (id),
    constraint plan_permissions_plan_suite_unique unique (plan_id, suite_key)
);

-- Enable RLS for plan_permissions
alter table public.plan_permissions enable row level security;

-- Policies for plan_permissions
create policy "Public can read active plan permissions" 
on public.plan_permissions for select 
using (exists (select 1 from public.plans where id = plan_permissions.plan_id and active = true));

create policy "Master has full access to plan permissions" 
on public.plan_permissions for all 
using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Master');

-- Add plan_id to users table if it doesn't exist
alter table public.users add column if not exists plan_id uuid references public.plans(id);

-- Update RLS for users to allow Master to manage plan_id
-- (Assuming Master already has permission to update users, this just adds the column)

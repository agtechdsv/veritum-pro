-- Veritum Pro: Dynamic RBAC (Access Groups) Schema
-- Execute this on your Master DB (Central Project)

-- 1. Create Access Groups Table
create table if not exists access_groups (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    admin_id uuid not null, -- References the Administrador who owns this group
    created_at timestamptz default now()
);

-- 2. Create Group Permissions Table (Granular Features)
create table if not exists group_permissions (
    id uuid primary key default gen_random_uuid(),
    group_id uuid references access_groups(id) on delete cascade,
    feature_id uuid not null, -- References features(id) in Master DB
    can_access boolean default true,
    created_at timestamptz default now(),
    unique(group_id, feature_id)
);

-- 3. Update Users Table (Master)
-- Note: Assuming the users table already exists.
alter table users add column if not exists access_group_id uuid references access_groups(id) on delete set null;

-- 4. Enable RLS
alter table access_groups enable row level security;
alter table group_permissions enable row level security;

-- 5. Basic RLS Policies
-- Administrators can manage their own groups
create policy "Admins manage their own groups" on access_groups
    for all using (auth.uid() = admin_id);

-- Group permissions are visible to anyone in that group or the owner admin
create policy "Viewable by group members or admin owner" on group_permissions
    for select using (
        exists (
            select 1 from access_groups
            where access_groups.id = group_permissions.group_id
            and (access_groups.admin_id = auth.uid() or exists (
                select 1 from users where users.id = auth.uid() and users.access_group_id = group_permissions.group_id
            ))
        )
    );

create policy "Admins manage their own group permissions" on group_permissions
    for all using (
        exists (
            select 1 from access_groups
            where access_groups.id = group_permissions.group_id
            and access_groups.admin_id = auth.uid()
        )
    );

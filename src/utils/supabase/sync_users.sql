-- Create the public.users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
  id uuid not null,
  name text not null,
  username text not null,
  role text null default 'Administrador'::text,
  active boolean null default true,
  avatar_url text null,
  cpf_cnpj text null,
  phone text null,
  parent_user_id uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint users_pkey primary key (id),
  constraint users_username_key unique (username),
  constraint users_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE,
  constraint users_parent_user_id_fkey foreign key (parent_user_id) references public.users (id) on delete cascade
) TABLESPACE pg_default;

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public.users
DROP POLICY IF EXISTS "Master: Full CRUD" ON public.users;
DROP POLICY IF EXISTS "Administrador: Manage self and operators" ON public.users;
DROP POLICY IF EXISTS "Operator: Read colleagues" ON public.users;
DROP POLICY IF EXISTS "Operator: Read/Update self" ON public.users;
DROP POLICY IF EXISTS "Operator: Update own" ON public.users;
DROP POLICY IF EXISTS "Operator: Update self" ON public.users;

-- Master: Full CRUD on everyone
CREATE POLICY "Master: Full CRUD" ON public.users 
FOR ALL USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'Master'
);

-- Administrador: CRUD on self and related operators
CREATE POLICY "Administrador: Manage self and operators" ON public.users 
FOR ALL USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'Administrador' AND (
    auth.uid() = id OR 
    (parent_user_id = auth.uid() AND role = 'Operador')
  )
);

-- Operator: Select self and colleagues, Update only self
-- We use the parent_user_id from the JWT to avoid recursion
CREATE POLICY "Operator: Read colleagues" ON public.users 
FOR SELECT USING (
  auth.uid() = id OR (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'Operador' AND 
    parent_user_id = (auth.jwt() -> 'user_metadata' ->> 'parent_user_id')::uuid
  )
);

CREATE POLICY "Operator: Update self" ON public.users 
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Function to handle new user sync
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_role TEXT := 'Administrador';
  user_role TEXT;
  user_name TEXT;
BEGIN
  -- Determine role: prefer metadata, fallback to 'Administrador'
  user_role := COALESCE(new.raw_user_meta_data->>'role', default_role);
  -- Determine name: prefer metadata fields, fallback to 'Usuário'
  user_name := COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Usuário');

  -- 1. Insert into public profile table
  INSERT INTO public.users (id, name, username, role, active, avatar_url, parent_user_id)
  VALUES (
    new.id,
    user_name,
    new.email,
    user_role, 
    TRUE,
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
    (new.raw_user_meta_data->>'parent_user_id')::uuid
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    name = EXCLUDED.name;

  -- 2. Force sync back to auth.users metadata
  -- This ensures the JWT used for RLS will contain the correct role immediately
  UPDATE auth.users
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'role', user_role,
      'full_name', user_name,
      'name', user_name
    )
  WHERE id = new.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run after a user is created in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to sync public.users changes back to auth.users (for manual edits/updates)
CREATE OR REPLACE FUNCTION public.handle_updated_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Sync profile shifts back to auth.users metadata
  UPDATE auth.users
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'role', NEW.role,
      'full_name', NEW.name,
      'name', NEW.name,
      'parent_user_id', NEW.parent_user_id,
      'active', NEW.active
    )
  WHERE id = NEW.id;

  -- 2. Cascade active status to children (Operators) if parent status changed
  IF (OLD.active IS DISTINCT FROM NEW.active) THEN
    UPDATE public.users
    SET active = NEW.active
    WHERE parent_user_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run after a user is updated in public.users
DROP TRIGGER IF EXISTS on_public_user_updated ON public.users;
CREATE TRIGGER on_public_user_updated
  AFTER UPDATE ON public.users
  FOR EACH ROW 
  WHEN (
    OLD.role IS DISTINCT FROM NEW.role OR 
    OLD.name IS DISTINCT FROM NEW.name OR 
    OLD.parent_user_id IS DISTINCT FROM NEW.parent_user_id OR
    OLD.active IS DISTINCT FROM NEW.active
  )
  EXECUTE FUNCTION public.handle_updated_user();

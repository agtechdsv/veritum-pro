-- ############################################################
-- VERITUM PRO - COMPREHENSIVE DATABASE MIGRATION SCRIPT
-- ############################################################
-- Use this script to set up a new Supabase project from scratch.
-- It creates all tables, functions, triggers, and RLS policies.

-- 1. EXTENSIONS
-- Required for vector search in Scriptor Pro
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. TABLES (PUBLIC SCHEMA)

-- Profiles table linked to Supabase Auth
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  username text NOT NULL UNIQUE,
  role text DEFAULT 'Administrador' CHECK (role IN ('Master', 'Administrador', 'Operador')),
  active boolean DEFAULT true,
  avatar_url text,
  cpf_cnpj text,
  phone text,
  parent_user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User Preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  language text DEFAULT 'pt' CHECK (language IN ('pt', 'en', 'es')),
  theme text DEFAULT 'dark' CHECK (theme IN ('light', 'dark')),
  custom_supabase_url text,
  custom_supabase_key text,
  custom_gemini_key text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Suite Management
CREATE TABLE IF NOT EXISTS public.suites (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  suite_key text NOT NULL UNIQUE,
  name text NOT NULL,
  short_desc jsonb DEFAULT '{"en": "", "es": "", "pt": ""}'::jsonb,
  detailed_desc jsonb DEFAULT '{"en": "", "es": "", "pt": ""}'::jsonb,
  features jsonb DEFAULT '{"en": [], "es": [], "pt": []}'::jsonb,
  icon_svg text,
  active boolean DEFAULT true,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Global App Settings
CREATE TABLE IF NOT EXISTS public.app_settings (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  office_name text,
  whatsapp_api_url text,
  theme_color text,
  created_at timestamptz DEFAULT now()
);

-- Nexus Pro (Lawsuits)
CREATE TABLE IF NOT EXISTS public.lawsuits (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  cnj_number text UNIQUE,
  client_name text,
  case_title text,
  status text DEFAULT 'Active',
  phase text,
  value numeric,
  court text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sentinel & Vox (Movements)
CREATE TABLE IF NOT EXISTS public.movements (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  lawsuit_id uuid REFERENCES public.lawsuits(id) ON DELETE CASCADE,
  original_text text,
  translated_text text,
  sentiment_score float,
  source text,
  is_notified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Scriptor Pro (Embeddings)
CREATE TABLE IF NOT EXISTS public.document_embeddings (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  lawsuit_id uuid REFERENCES public.lawsuits(id) ON DELETE CASCADE,
  filename text,
  content text,
  embedding vector(1536),
  created_at timestamptz DEFAULT now()
);

-- Valorem Pro (Financials)
CREATE TABLE IF NOT EXISTS public.financial_records (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  lawsuit_id uuid REFERENCES public.lawsuits(id) ON DELETE SET NULL,
  description text,
  type text CHECK (type IN ('fee', 'cost', 'settlement', 'honorarium')),
  amount numeric,
  due_date date,
  is_paid boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 3. FUNCTIONS & TRIGGERS

-- Trigger Function: Sync Auth User to Public Profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_role TEXT := 'Administrador';
  user_role TEXT;
  user_name TEXT;
BEGIN
  user_role := COALESCE(new.raw_user_meta_data->>'role', default_role);
  user_name := COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Usuário');

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

  -- Ensure Auth Metadata matches the role for instant RLS validation
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

-- Create Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger Function: Sync Profile changes back to Auth
CREATE OR REPLACE FUNCTION public.handle_updated_user()
RETURNS TRIGGER AS $$
BEGIN
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

  -- Cascade Active status to Operators
  IF (OLD.active IS DISTINCT FROM NEW.active) THEN
    UPDATE public.users SET active = NEW.active WHERE parent_user_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Trigger on public.users
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


-- 4. ROW LEVEL SECURITY (RLS) policies

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lawsuits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;

-- Dynamic Policies based on Role Metadata

-- MASTER: Full Access
CREATE POLICY "Master: Full CRUD" ON public.users FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Master');
CREATE POLICY "Master: Full CRUD" ON public.suites FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Master');

-- ADMINISTRADOR: Manage self and children
CREATE POLICY "Administrador: Manage self and operators" ON public.users 
FOR ALL USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'Administrador' AND (
    auth.uid() = id OR (parent_user_id = auth.uid() AND role = 'Operador')
  )
);

-- OPERADOR: Read colleagues
CREATE POLICY "Operator: Read colleagues" ON public.users 
FOR SELECT USING (
  id = auth.uid() OR (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'Operador' AND 
    parent_user_id = (auth.jwt() -> 'user_metadata' ->> 'parent_user_id')::uuid
  )
);

CREATE POLICY "Operator: Update self" ON public.users FOR UPDATE USING (auth.uid() = id);

-- General Auth Policies
CREATE POLICY "Users can manage their own preferences" ON public.user_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Active Suites: Public Select" ON public.suites FOR SELECT USING (active = true);
CREATE POLICY "Auth access for app settings" ON public.app_settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth access for lawsuits" ON public.lawsuits FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth access for movements" ON public.movements FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth access for document_embeddings" ON public.document_embeddings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth access for financial_records" ON public.financial_records FOR ALL USING (auth.role() = 'authenticated');

-- 5. STORAGE BUCKETS

-- Document Storage
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Enable access to documents for auth users" ON storage.objects FOR ALL USING (
  bucket_id = 'documents' AND auth.role() = 'authenticated'
);

-- ############################################################
-- SCRIPT COMPLETED - REFRESH DASHBOARD AFTER RUNNING
-- ############################################################

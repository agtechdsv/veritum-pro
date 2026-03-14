-- 1. Garantir que o bucket existe e torná-lo PÚBLICO
-- (Público significa que o arquivo pode ser lido via URL direta, mas o UPLOAD continua protegido por RLS)
INSERT INTO storage.buckets (id, name, public)
VALUES ('nexus-documents', 'nexus-documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Limpar políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Access Nexus Documents: Select" ON storage.objects;
DROP POLICY IF EXISTS "Access Nexus Documents: Insert" ON storage.objects;
DROP POLICY IF EXISTS "Access Nexus Documents: Update" ON storage.objects;
DROP POLICY IF EXISTS "Access Nexus Documents: Delete" ON storage.objects;
DROP POLICY IF EXISTS "Nexus Documents Full Access" ON storage.objects;

-- 3. Criar uma política única de ACESSO TOTAL para este bucket específico
-- Aplicada aos papéis 'anon' e 'authenticated' (uso do public role no Supabase)
CREATE POLICY "Nexus Documents Full Access" ON storage.objects
FOR ALL TO anon, authenticated
USING (bucket_id = 'nexus-documents')
WITH CHECK (bucket_id = 'nexus-documents');

-- 4. Garantir que o RLS está ativo no storage
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

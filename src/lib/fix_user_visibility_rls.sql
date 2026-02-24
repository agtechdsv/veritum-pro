-- ============================================================================
-- VERITUM PRO: FIX RECURSIVE RLS POLICIES (USER VISIBILITY)
-- ============================================================================

-- Primeiro, removemos as políticas que causaram a recursividade
DROP POLICY IF EXISTS "Users can read their peers" ON public.users;
DROP POLICY IF EXISTS "Users can read their manager" ON public.users;
DROP POLICY IF EXISTS "Admins can read their team" ON public.users;
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Master: Full Control" ON public.users;

-- 1. Política Master: Sem recursividade usando diretamente o JWT
CREATE POLICY "Master: Full Control" ON public.users 
FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Master');

-- 2. Política de Perfil Próprio: Acesso direto pelo UID
CREATE POLICY "Users can read own profile" ON public.users 
FOR SELECT USING (auth.uid() = id);

-- 3. Política de Hierarquia: Resolvendo a recursividade
-- Usamos auth.uid() diretamente sem subselects na mesma tabela para evitar o erro 42P17
CREATE POLICY "Hierarchy visibility" ON public.users 
FOR SELECT USING (
    -- Posso ver quem eu cadastrei (sou o parent)
    parent_user_id = auth.uid() 
    OR 
    -- Posso ver quem me cadastrou (sou o subordinado)
    id = (auth.jwt() -> 'user_metadata' ->> 'parent_user_id')::uuid
    OR
    -- Posso ver meus colegas (temos o mesmo parent)
    parent_user_id = (auth.jwt() -> 'user_metadata' ->> 'parent_user_id')::uuid
);

-- NOTA: Para que as políticas acima funcionem perfeitamente para "colegas" e "chefes",
-- é essencial que o metadado 'parent_user_id' esteja sincronizado no JWT do Auth.
-- Se ele não estiver lá, a recursividade é inevitável com SELECT simples.

-- ============================================================================
-- VERITUM PRO: CORREÇÃO DE PERMISSÕES DO SUPABASE
-- ============================================================================
-- O script nuclear_drop.sql acidentalmente removeu as permissões nativas
-- que o Supabase dá para as roles 'anon' e 'authenticated' no schema public.
-- Rode este script em AMBOS os bancos (Master e Client) para corrigir
-- os erros de "permission denied".
-- ============================================================================

-- 1. Garante o uso do schema
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- 2. Restaura privilégios em TODAS as tabelas existentes
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 3. Restaura privilégios em TODAS as funções existentes
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 4. Restaura privilégios em TODOS os sequenciadores existentes
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 5. Configura as "Privileges Default" para que qualquer nova tabela futuramente
-- também receba as permissões nativas automaticamente.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;

-- PRONTO! As permissões originais do Supabase foram completamente restauradas.

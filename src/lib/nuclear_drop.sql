-- ============================================================================
-- VERITUM PRO: NUCLEAR DROP SCRIPT (CUIDADO!)
-- ============================================================================
-- Description: Este script limpa TODO o schema "public" do seu Supabase.
-- Ele remove TODAS as tabelas, funções, triggers, views e policies.
-- 
-- USO: Rode isso apenas quando quiser ZERAR o banco de dados completamente 
-- para rodar os scripts final_master_schema.sql ou final_client_schema.sql.
-- ============================================================================

-- 1. Remove Triggers do Auth (Se existirem)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. "Destroi e Recria" o Schema Public completo
-- Isso é muito mais limpo e rápido do que rodar DROP TABLE 50 vezes.
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- 3. Restaura as permissões padrão essenciais do Supabase para o Schema Public
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;

-- ============================================================================
-- 💡 OBSERVAÇÃO IMPORTANTE:
-- O Supabase gerencia o schema "auth" separadamente (que contém logins e senhas).
-- Este script NÃO APAGA os logins/senhas dos seus usuários testadores no Supabase Auth.
-- Ele apenas limpa os dados da sua aplicação. 
-- ============================================================================

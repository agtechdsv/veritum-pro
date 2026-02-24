-- ============================================================================
-- VERITUM PRO: FIX CASCATA DE EXCLUSÃO DE GRUPOS E CARGOS
-- ============================================================================
-- Objetivo: Garantir que quando um usuário (Sócio-Administrador/Master) for
-- excluído, todos os seus Grupos de Acesso (access_groups) e Cargos (roles)
-- sejam automaticamente deletados em cascata.
-- ============================================================================

-- 1. Remover chaves estrangeiras existentes ou recriá-las com validação cruzada
ALTER TABLE "public"."access_groups"
DROP CONSTRAINT IF EXISTS fk_access_group_admin;

ALTER TABLE "public"."roles"
DROP CONSTRAINT IF EXISTS fk_roles_admin;

-- 1.5. Limpeza de Órfãos (Para evitar o erro 23503 de chave estrangeira)
-- Se você excluiu usuários no passado antes dessa correção, existem grupos soltos.
DELETE FROM "public"."roles" WHERE admin_id NOT IN (SELECT id FROM "auth"."users");
DELETE FROM "public"."access_groups" WHERE admin_id NOT IN (SELECT id FROM "auth"."users");

-- 2. Adicionar as constraints amarrando ao Auth (ou Public.Users) com CASCADE
-- Usando a auth.users garante que ao remover a conta raiz, tudo associado se vai.
ALTER TABLE "public"."access_groups"
ADD CONSTRAINT fk_access_group_admin
FOREIGN KEY (admin_id) REFERENCES "auth"."users"(id) ON DELETE CASCADE;

ALTER TABLE "public"."roles"
ADD CONSTRAINT fk_roles_admin
FOREIGN KEY (admin_id) REFERENCES "auth"."users"(id) ON DELETE CASCADE;

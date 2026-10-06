-- =====================================================================================
-- 002 - Master DB: impede escalada de privilegio via public.users
-- =====================================================================================
-- PROBLEMA: as policies "Users: Manage own profile" (ALL, auth.uid() = id) e
-- "Admins: Manage team members" (ALL, auth.uid() = parent_user_id) permitem que um usuario
-- comum altere colunas privilegiadas da propria linha (ou da linha da equipe):
--   * role = 'Master'      -> vira Master (is_master() le users.role)
--   * parent_user_id = X   -> passa a resolver o tenant (e as credenciais) de outro escritorio
--
-- CORRECAO: trigger BEFORE INSERT/UPDATE que bloqueia essas mudancas para quem nao e Master.
-- Contextos sem usuario autenticado (service_role, SQL Editor, triggers de signup) passam
-- direto, pois auth.uid() e NULL neles.
--
-- RODAR APENAS NO PROJETO "Veritum PRO" (MASTER). Depende do script 001 (public.is_master()).
--
-- ANTES DE RODAR:
--   select id, email, role, parent_user_id from public.users where role = 'Master';
--   -> deve listar so quem DEVE ser Master. Se aparecer alguem estranho, ja houve escalada:
--      rebaixe essa conta e invalide as sessoes dela.
--
-- LIMITACOES CONHECIDAS (nao cobertas aqui, exigem revisar o app antes de bloquear):
--   plan_id, access_group_id, force_password_reset e campos de trial tambem sao editaveis
--   pelo proprio usuario (ex.: trocar o proprio plano sem pagar).
--
-- ROLLBACK:
--   DROP TRIGGER IF EXISTS users_guard_privileged_columns ON public.users;
--   DROP FUNCTION IF EXISTS public.users_guard_privileged_columns();
-- =====================================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.users_guard_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- Sem usuario autenticado (service_role, SQL Editor, signup): nao restringe.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Master pode tudo.
  IF public.is_master() THEN
    RETURN NEW;
  END IF;

  -- Ninguem alem de Master atribui o papel Master.
  IF NEW.role = 'Master' THEN
    RAISE EXCEPTION 'Operacao nao permitida: atribuicao do papel Master';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Nao e permitido trocar o dono/escritorio de uma conta.
    IF NEW.parent_user_id IS DISTINCT FROM OLD.parent_user_id THEN
      RAISE EXCEPTION 'Operacao nao permitida: alteracao de parent_user_id';
    END IF;
    -- Ninguem altera o proprio papel (admin pode alterar o da equipe).
    IF NEW.role IS DISTINCT FROM OLD.role AND OLD.id = auth.uid() THEN
      RAISE EXCEPTION 'Operacao nao permitida: alteracao do proprio papel';
    END IF;
  ELSE
    -- INSERT: so pode criar conta sem pai ou como filha de si mesmo.
    IF NEW.parent_user_id IS NOT NULL AND NEW.parent_user_id <> auth.uid() THEN
      RAISE EXCEPTION 'Operacao nao permitida: parent_user_id de outro usuario';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_guard_privileged_columns ON public.users;
CREATE TRIGGER users_guard_privileged_columns
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.users_guard_privileged_columns();

COMMIT;

-- =====================================================================================
-- VERIFICACAO POS-EXECUCAO (somente leitura)
-- =====================================================================================
--   select tgname, tgenabled from pg_trigger
--   where tgrelid = 'public.users'::regclass and not tgisinternal;
--   -> deve listar users_guard_privileged_columns com tgenabled = 'O'.
--
-- TESTE FUNCIONAL: logado como usuario comum (nao Master) no app, os dois comandos abaixo,
-- executados pelo cliente, devem falhar com "Operacao nao permitida":
--   supabase.from('users').update({ role: 'Master' }).eq('id', <meu id>)
--   supabase.from('users').update({ parent_user_id: <outro id> }).eq('id', <meu id>)

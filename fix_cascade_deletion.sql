-- VERITUM PRO: FIX FOREIGN KEYS FOR CASCADE DELETION
-- This ensures that deleting a user from auth.users (or public.users)
-- automatically removes all associated records in all tables.

-- 1. Fix PAYMENTS table constraint
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments' AND table_schema = 'public') THEN
        ALTER TABLE "public"."payments" DROP CONSTRAINT IF EXISTS "payments_user_id_fkey";
        ALTER TABLE "public"."payments" 
        ADD CONSTRAINT "payments_user_id_fkey" 
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Fix ASAAS_SUB_ACCOUNTS table constraint (Ensuring consistency)
ALTER TABLE "public"."asaas_sub_accounts" DROP CONSTRAINT IF EXISTS "asaas_sub_accounts_admin_id_fkey";
ALTER TABLE "public"."asaas_sub_accounts" 
ADD CONSTRAINT "asaas_sub_accounts_admin_id_fkey" 
FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- 3. Fix USER_SUBSCRIPTIONS (referencing auth.users)
ALTER TABLE "public"."user_subscriptions" DROP CONSTRAINT IF EXISTS "user_subscriptions_user_id_fkey";
ALTER TABLE "public"."user_subscriptions" 
ADD CONSTRAINT "user_subscriptions_user_id_fkey" 
FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- 4. Audit Logs (Optional: if we want to delete logs when user is deleted)
-- Most audit logs don't cascade, but if the user wants to "reset everything", it helps.
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'user_id') THEN
        ALTER TABLE "public"."audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_user_id_fkey";
        -- Note: only add constraint if you want strict enforcement. 
        -- Usually user_id in audit_logs is just a UUID field for history.
    END IF;
END $$;

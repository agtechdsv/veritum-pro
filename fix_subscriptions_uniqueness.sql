-- FIX: Ensure user_subscriptions can be upserted by adding a unique constraint on user_id.

-- 1. Clean up any existing duplicates (keep only the newest record per user)
DELETE FROM public.user_subscriptions a USING public.user_subscriptions b
WHERE a.id < b.id AND a.user_id = b.user_id;

-- 2. Add the UNIQUE constraint on user_id to enable 'upsert' with conflict target 'user_id'
ALTER TABLE public.user_subscriptions ADD CONSTRAINT user_subscriptions_user_id_key UNIQUE (user_id);

-- 3. Update the existing trial record for the user who just paid (Fixing the specific case reported)
-- Note: Replace 'USER_ID_HERE' with the actual user ID if we knew it, 
-- but since this script runs globally, we can also just find users who have is_trial=true 
-- but have a non-trial plan_id in the users table.

UPDATE public.user_subscriptions sub
SET 
  is_trial = false,
  status = 'active',
  plan_id = u.plan_id,
  updated_at = now()
FROM public.users u
WHERE sub.user_id = u.id
AND sub.is_trial = true
AND u.plan_id IS NOT NULL
AND u.plan_id NOT IN (SELECT id FROM public.plans WHERE name ILIKE '%Trial%');

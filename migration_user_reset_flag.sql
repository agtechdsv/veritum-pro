-- Add force_password_reset column to public.users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS force_password_reset BOOLEAN DEFAULT true;

-- Update existing users to false so they aren't forced to reset unexpectedly, 
-- except maybe ones we just created (hard to tell, so default to false for existing)
UPDATE public.users SET force_password_reset = false WHERE force_password_reset IS NULL;

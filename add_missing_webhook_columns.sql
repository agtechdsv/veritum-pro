ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS webhook_payload JSONB,
ADD COLUMN IF NOT EXISTS webhook_received_at TIMESTAMPTZ;

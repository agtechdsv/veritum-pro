-- Create demo_requests table
CREATE TABLE IF NOT EXISTS public.demo_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    team_size TEXT NOT NULL,
    preferred_start TIMESTAMPTZ NOT NULL,
    preferred_end TIMESTAMPTZ NOT NULL,
    scheduled_at TIMESTAMPTZ,
    attended_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'attended', 'canceled')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert demo requests (anonymous/public)
CREATE POLICY "Allow public inserts for demo requests" 
ON public.demo_requests 
FOR INSERT 
WITH CHECK (true);

-- Only allow Master users to view/manage demo requests 
-- (Assuming Master role check logic similar to other tables)
CREATE POLICY "Allow master to manage demo requests"
ON public.demo_requests
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE public.users.id = auth.uid()
    AND public.users.role = 'Master'
  )
);

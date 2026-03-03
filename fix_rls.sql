DROP POLICY IF EXISTS "Cloud plans modifiable by Master" ON public.cloud_plans;

CREATE POLICY "Cloud plans modifiable by Master"
ON public.cloud_plans FOR ALL
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Master' OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'Sócio-Administrador');

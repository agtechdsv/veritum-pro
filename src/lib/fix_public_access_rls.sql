-- ============================================================================
-- VERITUM PRO: ALLOW PUBLIC ACCESS TO MARKETING DATA
-- ============================================================================

-- 1. Suites (Módulos)
DROP POLICY IF EXISTS "Authenticated users can read suites" ON public.suites;
DROP POLICY IF EXISTS "Public can read suites" ON public.suites;
CREATE POLICY "Public can read suites" ON public.suites FOR SELECT USING (true);

-- 2. Plans (Planos)
DROP POLICY IF EXISTS "Authenticated users can read plans" ON public.plans;
DROP POLICY IF EXISTS "Public can read plans" ON public.plans;
CREATE POLICY "Public can read plans" ON public.plans FOR SELECT USING (true);

-- 3. Features (Funcionalidades)
DROP POLICY IF EXISTS "Authenticated users can read features" ON public.features;
DROP POLICY IF EXISTS "Public can read features" ON public.features;
CREATE POLICY "Public can read features" ON public.features FOR SELECT USING (true);

-- 4. Plan Permissions (Needed for filtering logic if used publicly, but landing page now uses it for guests too)
DROP POLICY IF EXISTS "Authenticated users can read plan_permissions" ON public.plan_permissions;
DROP POLICY IF EXISTS "Public can read plan_permissions" ON public.plan_permissions;
CREATE POLICY "Public can read plan_permissions" ON public.plan_permissions FOR SELECT USING (true);

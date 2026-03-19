-- Run in Supabase SQL Editor. Idempotent: only inserts if table empty OR names don't exist.

INSERT INTO public.platform_organizations (id, name, display_name, tipo, plan, status, country)
SELECT gen_random_uuid(), 'Demo Cooperativa', 'Demo Cooperativa', 'cooperativa'::public.org_tipo, 'none'::public.org_plan, 'en_prueba'::public.org_status, 'Costa Rica'
WHERE NOT EXISTS (SELECT 1 FROM public.platform_organizations WHERE name = 'Demo Cooperativa');

INSERT INTO public.platform_organizations (id, name, display_name, tipo, plan, status, country)
SELECT gen_random_uuid(), 'Demo Exportador', 'Demo Exportador', 'exportador'::public.org_tipo, 'none'::public.org_plan, 'en_prueba'::public.org_status, 'Costa Rica'
WHERE NOT EXISTS (SELECT 1 FROM public.platform_organizations WHERE name = 'Demo Exportador');

-- =============================================================================
-- NOVA SILVA — DEMO DATA FIX (part 2/2)
-- Migration: 20260323000002_demo_data_fix
-- =============================================================================
-- Architecture:
--   profiles.organization_id       → platform_organizations.id  (SaaS tenant)
--   organizacion_usuarios.org_id   → organizaciones.id          (app tenant)
--   cert_user_org_id() RLS reads   → organizacion_usuarios → organizaciones
--
-- Fixes applied:
--   1. Insert platform_organizations 003 (certificadora demo tenant)
--   2. Insert organizaciones 002 + 003 (app-level tenants for exportador / certificadora)
--   3. Fix profiles.organization_id for demo.tecnico (→ 001) and demo.certificadora (→ 003)
--   4. Insert user_roles entry for demo.tecnico (was missing; tecnico enum added in migration 001)
--   5. Populate organizacion_usuarios for all 5 demo users
--      (required by cert_user_org_id() RLS fallback — was completely empty before this fix)
--
-- All writes are idempotent: ON CONFLICT DO NOTHING / WHERE NOT EXISTS guards.
-- =============================================================================

-- 1. platform_organizations: org 003 (certificadora)
INSERT INTO public.platform_organizations (id, name, is_demo)
VALUES ('00000000-0000-0000-0000-000000000003', 'CertifiCafé Internacional', true)
ON CONFLICT (id) DO NOTHING;

-- 2. organizaciones: orgs 002 (exportador) and 003 (certificadora)
INSERT INTO public.organizaciones (id, nombre, tipo)
VALUES
  ('00000000-0000-0000-0000-000000000002', 'Exportadora Sol de América', 'exportador'),
  ('00000000-0000-0000-0000-000000000003', 'CertifiCafé Internacional',  'certificadora')
ON CONFLICT (id) DO NOTHING;

-- 3. Fix profiles for demo.tecnico and demo.certificadora
UPDATE public.profiles
SET organization_id   = '00000000-0000-0000-0000-000000000001',
    organization_name = 'Cooperativa Café de la Selva'
WHERE user_id = 'be8d9b59-4d6e-4f83-892d-616568707346'
  AND (organization_id IS NULL
       OR organization_id <> '00000000-0000-0000-0000-000000000001');

UPDATE public.profiles
SET organization_id   = '00000000-0000-0000-0000-000000000003',
    organization_name = 'CertifiCafé Internacional'
WHERE user_id = '295d5cb7-a1f8-4ccd-a21d-306e6fa044f1'
  AND (organization_id IS NULL
       OR organization_id <> '00000000-0000-0000-0000-000000000003');

-- 4. user_roles: insert for demo.tecnico (enum value committed in migration 001)
INSERT INTO public.user_roles (user_id, role)
SELECT 'be8d9b59-4d6e-4f83-892d-616568707346'::uuid, 'tecnico'::public.app_role
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = 'be8d9b59-4d6e-4f83-892d-616568707346'
);

-- 5. organizacion_usuarios: all 5 demo users
--    Unique constraint: (organizacion_id, user_id)
INSERT INTO public.organizacion_usuarios (id, organizacion_id, user_id, rol, activo)
VALUES
  (gen_random_uuid(),
   '00000000-0000-0000-0000-000000000001',
   '79f30bd1-123a-4d59-9e44-224610bd71f9',   -- demo.cooperativa
   'cooperativa', true),
  (gen_random_uuid(),
   '00000000-0000-0000-0000-000000000001',
   '1ed96de4-00b6-45fd-be77-cdb73c783448',   -- demo.productor
   'productor', true),
  (gen_random_uuid(),
   '00000000-0000-0000-0000-000000000001',
   'be8d9b59-4d6e-4f83-892d-616568707346',   -- demo.tecnico
   'tecnico', true),
  (gen_random_uuid(),
   '00000000-0000-0000-0000-000000000002',
   '481fc7e6-4a30-4968-9efe-9bde4862c832',   -- demo.exportador
   'exportador', true),
  (gen_random_uuid(),
   '00000000-0000-0000-0000-000000000003',
   '295d5cb7-a1f8-4ccd-a21d-306e6fa044f1',   -- demo.certificadora
   'certificadora', true)
ON CONFLICT (organizacion_id, user_id) DO NOTHING;

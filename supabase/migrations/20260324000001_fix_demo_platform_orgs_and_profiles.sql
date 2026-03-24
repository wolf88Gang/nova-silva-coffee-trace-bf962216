-- =============================================================================
-- FIX: Demo platform organizations + demo_profiles seed
-- Migration: 20260324000001
-- Fixes /demo page showing UUID names and only 1 archetype
--
-- Root causes:
--   1. platform_organizations had is_demo=false for orgs 001 & 002
--   2. display_name, org_type, operating_model were NULL on all 3 demo orgs
--   3. demo_profiles table was empty → no profiles shown from DB
-- =============================================================================

-- ── 1. Fix platform_organizations: cooperativa ─────────────────────────────
UPDATE public.platform_organizations
SET
  display_name    = 'Cooperativa Café de la Selva',
  org_type        = 'cooperativa',
  operating_model = 'aggregator',
  is_demo         = true,
  modules         = '["Produccion","Agronomia","VITAL","EUDR","Finanzas","Nova Cup"]'::jsonb
WHERE id = '00000000-0000-0000-0000-000000000001';

-- ── 2. Fix platform_organizations: exportador ──────────────────────────────
UPDATE public.platform_organizations
SET
  display_name    = 'Exportadora Sol de América',
  org_type        = 'exportador',
  operating_model = 'trader',
  is_demo         = true,
  modules         = '["Origenes","Cumplimiento","EUDR","Lotes","Analitica","Nova Cup","Finanzas"]'::jsonb
WHERE id = '00000000-0000-0000-0000-000000000002';

-- ── 3. Fix platform_organizations: certificadora ───────────────────────────
UPDATE public.platform_organizations
SET
  display_name    = 'CertifiCafé Internacional',
  org_type        = 'certificadora',
  operating_model = 'auditor',
  is_demo         = true,
  modules         = '["Auditorias","Data Room","Dossiers"]'::jsonb
WHERE id = '00000000-0000-0000-0000-000000000003';

-- ── 4. Populate demo_profiles ──────────────────────────────────────────────
-- Idempotent: delete + reinsert
DELETE FROM public.demo_profiles
WHERE organization_id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003'
);

INSERT INTO public.demo_profiles
  (id, organization_id, profile_label, role, description, landing_route)
VALUES
  -- Cooperativa Café de la Selva (org 001)
  (
    'a1000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Gerencia cooperativa',
    'cooperativa',
    'Vista estratégica: producción, cumplimiento, finanzas y calidad.',
    '/produccion'
  ),
  (
    'a1000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Técnico de campo',
    'tecnico',
    'Registra visitas, diagnósticos y captura evidencia en parcelas.',
    '/produccion'
  ),
  (
    'a1000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'Oficial de cumplimiento',
    'cooperativa',
    'Gestión de evidencia documental y dossiers EUDR.',
    '/cumplimiento'
  ),
  -- Exportadora Sol de América (org 002)
  (
    'a2000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    'Gerente de origen',
    'exportador',
    'Proveedores, compras, cumplimiento y oferta de café.',
    '/origenes'
  ),
  (
    'a2000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'Analista EUDR',
    'exportador',
    'Polígonos, riesgos de deforestación y dossiers por proveedor.',
    '/cumplimiento/eudr'
  ),
  -- CertifiCafé Internacional (org 003)
  (
    'a3000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000003',
    'Auditor líder',
    'certificadora',
    'Revisa evidencia, verifica cumplimiento y genera reportes.',
    '/cumplimiento'
  );

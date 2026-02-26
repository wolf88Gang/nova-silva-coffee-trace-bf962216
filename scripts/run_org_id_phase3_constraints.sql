-- =============================================================================
-- Phase 3: NOT NULL + FK + org-only RLS — IDEMPOTENTE
-- Ejecutar en Supabase SQL Editor DESPUÉS de confirmar 0 NULLs en organization_id
-- =============================================================================

-- ═════════════════════════════════════════════════════════════════════════════
-- 0) PRECHECK: abort si hay NULLs
-- ═════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'productores','parcelas','entregas','documentos',
    'lotes_acopio','lotes_comerciales','contratos','cooperativa_exportadores'
  ];
  cnt bigint;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=t AND column_name='organization_id') THEN
      RAISE EXCEPTION 'ABORT: %.organization_id column does not exist', t;
    END IF;
    EXECUTE format('SELECT COUNT(*) FROM public.%I WHERE organization_id IS NULL', t) INTO cnt;
    IF cnt > 0 THEN
      RAISE EXCEPTION 'ABORT: % has % rows with NULL organization_id. Run backfill first.', t, cnt;
    END IF;
  END LOOP;
  RAISE NOTICE '✅ PRECHECK passed: 0 NULLs in all target tables';
END $$;


-- ═════════════════════════════════════════════════════════════════════════════
-- 1) NOT NULL constraints (idempotente)
-- ═════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'productores','parcelas','entregas','documentos',
    'lotes_acopio','lotes_comerciales','contratos','cooperativa_exportadores'
  ];
  is_nullable text;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    SELECT c.is_nullable INTO is_nullable
    FROM information_schema.columns c
    WHERE c.table_schema='public' AND c.table_name=t AND c.column_name='organization_id';

    IF is_nullable = 'YES' THEN
      EXECUTE format('ALTER TABLE public.%I ALTER COLUMN organization_id SET NOT NULL', t);
      RAISE NOTICE '  ✓ SET NOT NULL on %.organization_id', t;
    ELSE
      RAISE NOTICE '  ✓ %.organization_id already NOT NULL', t;
    END IF;
  END LOOP;
  RAISE NOTICE '✅ PHASE 1 complete: NOT NULL constraints';
END $$;


-- ═════════════════════════════════════════════════════════════════════════════
-- 2) FOREIGN KEY to platform_organizations (idempotente)
-- ═════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'productores','parcelas','entregas','documentos',
    'lotes_acopio','lotes_comerciales','contratos','cooperativa_exportadores'
  ];
  cname text;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    cname := 'fk_' || t || '_organization_id';
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = cname AND conrelid = ('public.' || t)::regclass
    ) THEN
      EXECUTE format(
        'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (organization_id) REFERENCES public.platform_organizations(id) ON UPDATE CASCADE ON DELETE RESTRICT',
        t, cname
      );
      RAISE NOTICE '  ✓ FK created: % on %', cname, t;
    ELSE
      RAISE NOTICE '  ✓ FK % already exists on %', cname, t;
    END IF;
  END LOOP;
  RAISE NOTICE '✅ PHASE 2 complete: foreign keys';
END $$;


-- ═════════════════════════════════════════════════════════════════════════════
-- 3) COMPOSITE INDEXES for RLS performance (idempotente)
-- ═════════════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_productores_org_id ON public.productores(organization_id, id);
CREATE INDEX IF NOT EXISTS idx_parcelas_org_prod ON public.parcelas(organization_id, productor_id);

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='entregas' AND column_name='fecha') THEN
    CREATE INDEX IF NOT EXISTS idx_entregas_org_prod_fecha ON public.entregas(organization_id, productor_id, fecha);
  ELSE
    CREATE INDEX IF NOT EXISTS idx_entregas_org_prod ON public.entregas(organization_id, productor_id);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documentos' AND column_name='parcela_id') THEN
    CREATE INDEX IF NOT EXISTS idx_documentos_org_prod_parc ON public.documentos(organization_id, productor_id, parcela_id);
  ELSE
    CREATE INDEX IF NOT EXISTS idx_documentos_org_prod ON public.documentos(organization_id, productor_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_org_id ON public.profiles(organization_id);

DO $$ BEGIN RAISE NOTICE '✅ PHASE 3 complete: composite indexes'; END $$;


-- ═════════════════════════════════════════════════════════════════════════════
-- 4) RLS: org-only policies (replace legacy fallback)
-- ═════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'productores','parcelas','entregas','documentos',
    'lotes_acopio','lotes_comerciales','contratos','cooperativa_exportadores'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    -- Drop legacy fallback policies (orgid_* from Phase 1-2)
    EXECUTE format('DROP POLICY IF EXISTS "orgid_select_%s" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "orgid_insert_%s" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "orgid_update_%s" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "orgid_delete_%s" ON public.%I', t, t);

    -- Drop older legacy policies
    EXECUTE format('DROP POLICY IF EXISTS "orgfirst_select_%s" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "orgfirst_insert_%s" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "orgfirst_update_%s" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "orgfirst_delete_%s" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "org_scoped_select_%s" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "org_scoped_insert_%s" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "org_scoped_update_%s" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "org_scoped_delete_%s" ON public.%I', t, t);

    -- Drop if re-running this script
    EXECUTE format('DROP POLICY IF EXISTS "org_only_select_%s" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "org_only_insert_%s" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "org_only_update_%s" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "org_only_delete_%s" ON public.%I', t, t);

    -- CREATE org-only policies (no cooperativa_id fallback)
    EXECUTE format(
      'CREATE POLICY "org_only_select_%s" ON public.%I FOR SELECT TO authenticated USING (
        public.is_admin(auth.uid())
        OR organization_id = public.get_user_organization_id(auth.uid())
      )', t, t);

    EXECUTE format(
      'CREATE POLICY "org_only_insert_%s" ON public.%I FOR INSERT TO authenticated WITH CHECK (
        public.is_admin(auth.uid())
        OR organization_id = public.get_user_organization_id(auth.uid())
      )', t, t);

    EXECUTE format(
      'CREATE POLICY "org_only_update_%s" ON public.%I FOR UPDATE TO authenticated USING (
        public.is_admin(auth.uid())
        OR organization_id = public.get_user_organization_id(auth.uid())
      )', t, t);

    EXECUTE format(
      'CREATE POLICY "org_only_delete_%s" ON public.%I FOR DELETE TO authenticated USING (
        public.is_admin(auth.uid())
        OR organization_id = public.get_user_organization_id(auth.uid())
      )', t, t);

    RAISE NOTICE '  ✓ org_only policies on %', t;
  END LOOP;
  RAISE NOTICE '✅ PHASE 4 complete: org-only RLS';
END $$;


-- ═════════════════════════════════════════════════════════════════════════════
-- 5) RETIRE dual-write triggers (keep function for rollback)
-- ═════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'productores','parcelas','entregas','documentos',
    'lotes_acopio','lotes_comerciales','contratos','cooperativa_exportadores'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_sync_org_id_%s ON public.%I', t, t);
    EXECUTE format('DROP TRIGGER IF EXISTS trg_sync_organization_id ON public.%I', t);
  END LOOP;
  -- Keep function for potential rollback:
  -- public.sync_org_id_from_legacy_cols() NOT dropped
  RAISE NOTICE '✅ PHASE 5 complete: dual-write triggers removed (function retained)';
END $$;

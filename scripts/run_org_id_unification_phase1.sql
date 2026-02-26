-- =============================================================================
-- Fase 1–4: organization_id unification — IDEMPOTENTE
-- Ejecutar en Supabase SQL Editor (proyecto externo)
-- Se puede correr múltiples veces sin romper nada.
-- =============================================================================

-- ═════════════════════════════════════════════════════════════════════════════
-- 0) PRECHECKS — abortar si falta algo crítico
-- ═════════════════════════════════════════════════════════════════════════════
DO $$ BEGIN
  -- 0.1 platform_organizations
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='platform_organizations') THEN
    RAISE EXCEPTION 'ABORT: public.platform_organizations does NOT exist.';
  END IF;

  -- 0.2 profiles columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='user_id') THEN
    RAISE EXCEPTION 'ABORT: profiles.user_id missing.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='organization_id') THEN
    RAISE EXCEPTION 'ABORT: profiles.organization_id missing.';
  END IF;

  -- 0.3 helpers
  IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema='public' AND routine_name='get_user_organization_id') THEN
    RAISE EXCEPTION 'ABORT: get_user_organization_id() missing. Create helpers first.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema='public' AND routine_name='is_admin') THEN
    RAISE EXCEPTION 'ABORT: is_admin() missing.';
  END IF;

  RAISE NOTICE '✅ PRECHECKS passed';
END $$;


-- ═════════════════════════════════════════════════════════════════════════════
-- 1) ADD COLUMN organization_id (idempotente, skip if table missing)
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
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t) THEN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=t AND column_name='organization_id') THEN
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN organization_id uuid', t);
        RAISE NOTICE '  + Added organization_id to %', t;
      ELSE
        RAISE NOTICE '  ✓ organization_id already exists on %', t;
      END IF;
    ELSE
      RAISE NOTICE '  ⊘ Table % does not exist, skipping', t;
    END IF;
  END LOOP;
  RAISE NOTICE '✅ PHASE 1 complete: columns';
END $$;


-- ═════════════════════════════════════════════════════════════════════════════
-- 2) INDEXES (idempotente)
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
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=t AND column_name='organization_id') THEN
      EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_organization_id ON public.%I(organization_id)', t, t);
    END IF;
  END LOOP;
  RAISE NOTICE '✅ PHASE 2 complete: indexes';
END $$;


-- ═════════════════════════════════════════════════════════════════════════════
-- 3) BACKFILL EN ORDEN (idempotente — only updates NULLs)
-- ═════════════════════════════════════════════════════════════════════════════

-- 3.1 productores ← cooperativa_id
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='productores' AND column_name='cooperativa_id') THEN
    UPDATE public.productores
    SET organization_id = cooperativa_id
    WHERE organization_id IS NULL AND cooperativa_id IS NOT NULL;
    RAISE NOTICE '  ✓ productores backfilled';
  END IF;
END $$;

-- 3.2 parcelas ← cooperativa_id || productores.organization_id
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='parcelas') THEN
    -- Direct cooperativa_id first
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='parcelas' AND column_name='cooperativa_id') THEN
      UPDATE public.parcelas SET organization_id = cooperativa_id
      WHERE organization_id IS NULL AND cooperativa_id IS NOT NULL;
    END IF;
    -- Then via productor join
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='parcelas' AND column_name='productor_id') THEN
      UPDATE public.parcelas pa
      SET organization_id = pr.organization_id
      FROM public.productores pr
      WHERE pa.productor_id = pr.id
        AND pa.organization_id IS NULL
        AND pr.organization_id IS NOT NULL;
    END IF;
    RAISE NOTICE '  ✓ parcelas backfilled';
  END IF;
END $$;

-- 3.3 entregas ← cooperativa_id || productor || parcela
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='entregas') THEN
    -- cooperativa_id direct
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='entregas' AND column_name='cooperativa_id') THEN
      UPDATE public.entregas SET organization_id = cooperativa_id
      WHERE organization_id IS NULL AND cooperativa_id IS NOT NULL;
    END IF;
    -- productor join
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='entregas' AND column_name='productor_id') THEN
      UPDATE public.entregas e
      SET organization_id = pr.organization_id
      FROM public.productores pr
      WHERE e.productor_id = pr.id
        AND e.organization_id IS NULL AND pr.organization_id IS NOT NULL;
    END IF;
    -- parcela join
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='entregas' AND column_name='parcela_id') THEN
      UPDATE public.entregas e
      SET organization_id = pa.organization_id
      FROM public.parcelas pa
      WHERE e.parcela_id = pa.id
        AND e.organization_id IS NULL AND pa.organization_id IS NOT NULL;
    END IF;
    RAISE NOTICE '  ✓ entregas backfilled';
  END IF;
END $$;

-- 3.4 documentos ← cooperativa_id || parcela || productor
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='documentos') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documentos' AND column_name='cooperativa_id') THEN
      UPDATE public.documentos SET organization_id = cooperativa_id
      WHERE organization_id IS NULL AND cooperativa_id IS NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documentos' AND column_name='parcela_id') THEN
      UPDATE public.documentos d SET organization_id = pa.organization_id
      FROM public.parcelas pa WHERE d.parcela_id = pa.id
        AND d.organization_id IS NULL AND pa.organization_id IS NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documentos' AND column_name='productor_id') THEN
      UPDATE public.documentos d SET organization_id = pr.organization_id
      FROM public.productores pr WHERE d.productor_id = pr.id
        AND d.organization_id IS NULL AND pr.organization_id IS NOT NULL;
    END IF;
    RAISE NOTICE '  ✓ documentos backfilled';
  END IF;
END $$;

-- 3.5 lotes_acopio ← cooperativa_id
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='lotes_acopio')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='lotes_acopio' AND column_name='cooperativa_id') THEN
    UPDATE public.lotes_acopio SET organization_id = cooperativa_id
    WHERE organization_id IS NULL AND cooperativa_id IS NOT NULL;
    RAISE NOTICE '  ✓ lotes_acopio backfilled';
  END IF;
END $$;

-- 3.6 lotes_comerciales ← exportador_id || cooperativa_id
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='lotes_comerciales') THEN
    UPDATE public.lotes_comerciales
    SET organization_id = COALESCE(
      organization_id,
      CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='lotes_comerciales' AND column_name='exportador_id') THEN exportador_id ELSE NULL END,
      CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='lotes_comerciales' AND column_name='cooperativa_id') THEN cooperativa_id ELSE NULL END
    )
    WHERE organization_id IS NULL;
    RAISE NOTICE '  ✓ lotes_comerciales backfilled';
  END IF;
EXCEPTION WHEN undefined_column THEN
  RAISE NOTICE '  ⊘ lotes_comerciales: column not found, skipping';
END $$;

-- 3.7 contratos ← exportador_id
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='contratos') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contratos' AND column_name='exportador_id') THEN
      UPDATE public.contratos SET organization_id = exportador_id
      WHERE organization_id IS NULL AND exportador_id IS NOT NULL;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contratos' AND column_name='cooperativa_id') THEN
      UPDATE public.contratos SET organization_id = cooperativa_id
      WHERE organization_id IS NULL AND cooperativa_id IS NOT NULL;
    END IF;
    RAISE NOTICE '  ✓ contratos backfilled';
  END IF;
END $$;

-- 3.8 cooperativa_exportadores ← cooperativa_id
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='cooperativa_exportadores')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='cooperativa_exportadores' AND column_name='cooperativa_id') THEN
    UPDATE public.cooperativa_exportadores SET organization_id = cooperativa_id
    WHERE organization_id IS NULL AND cooperativa_id IS NOT NULL;
    RAISE NOTICE '  ✓ cooperativa_exportadores backfilled';
  END IF;
END $$;

DO $$ BEGIN RAISE NOTICE '✅ PHASE 3 complete: backfill'; END $$;


-- ═════════════════════════════════════════════════════════════════════════════
-- 4) DUAL-WRITE TRIGGER (idempotente)
-- ═════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.sync_org_id_from_legacy_cols()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.organization_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  -- Try cooperativa_id
  BEGIN
    IF (NEW).cooperativa_id IS NOT NULL THEN
      NEW.organization_id := (NEW).cooperativa_id;
      RETURN NEW;
    END IF;
  EXCEPTION WHEN undefined_column THEN NULL;
  END;
  -- Try exportador_id
  BEGIN
    IF (NEW).exportador_id IS NOT NULL THEN
      NEW.organization_id := (NEW).exportador_id;
      RETURN NEW;
    END IF;
  EXCEPTION WHEN undefined_column THEN NULL;
  END;
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'productores','parcelas','entregas','documentos',
    'lotes_acopio','lotes_comerciales','contratos','cooperativa_exportadores'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=t AND column_name='organization_id') THEN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_sync_org_id_%s ON public.%I', t, t);
      EXECUTE format(
        'CREATE TRIGGER trg_sync_org_id_%s BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.sync_org_id_from_legacy_cols()',
        t, t
      );
      RAISE NOTICE '  ✓ trigger on %', t;
    END IF;
  END LOOP;
  RAISE NOTICE '✅ PHASE 4a complete: dual-write triggers';
END $$;


-- ═════════════════════════════════════════════════════════════════════════════
-- 5) RLS POLICIES org-first (sin borrar legacy, idempotente)
-- ═════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'productores','parcelas','entregas','documentos',
    'lotes_acopio','lotes_comerciales','contratos','cooperativa_exportadores'
  ];
  has_coop boolean;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=t AND column_name='organization_id') THEN
      CONTINUE;
    END IF;

    has_coop := EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=t AND column_name='cooperativa_id');

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    -- Drop if re-running
    EXECUTE format('DROP POLICY IF EXISTS "orgid_select_%s" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "orgid_insert_%s" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "orgid_update_%s" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "orgid_delete_%s" ON public.%I', t, t);

    -- SELECT
    IF has_coop THEN
      EXECUTE format(
        'CREATE POLICY "orgid_select_%s" ON public.%I FOR SELECT TO authenticated USING (
          public.is_admin(auth.uid())
          OR organization_id = public.get_user_organization_id(auth.uid())
          OR (organization_id IS NULL AND cooperativa_id = public.get_user_organization_id(auth.uid()))
        )', t, t);
    ELSE
      EXECUTE format(
        'CREATE POLICY "orgid_select_%s" ON public.%I FOR SELECT TO authenticated USING (
          public.is_admin(auth.uid())
          OR organization_id = public.get_user_organization_id(auth.uid())
          OR organization_id IS NULL
        )', t, t);
    END IF;

    -- INSERT
    IF has_coop THEN
      EXECUTE format(
        'CREATE POLICY "orgid_insert_%s" ON public.%I FOR INSERT TO authenticated WITH CHECK (
          public.is_admin(auth.uid())
          OR organization_id = public.get_user_organization_id(auth.uid())
          OR (organization_id IS NULL AND cooperativa_id = public.get_user_organization_id(auth.uid()))
        )', t, t);
    ELSE
      EXECUTE format(
        'CREATE POLICY "orgid_insert_%s" ON public.%I FOR INSERT TO authenticated WITH CHECK (
          public.is_admin(auth.uid())
          OR organization_id = public.get_user_organization_id(auth.uid())
          OR organization_id IS NULL
        )', t, t);
    END IF;

    -- UPDATE
    IF has_coop THEN
      EXECUTE format(
        'CREATE POLICY "orgid_update_%s" ON public.%I FOR UPDATE TO authenticated USING (
          public.is_admin(auth.uid())
          OR organization_id = public.get_user_organization_id(auth.uid())
          OR (organization_id IS NULL AND cooperativa_id = public.get_user_organization_id(auth.uid()))
        )', t, t);
    ELSE
      EXECUTE format(
        'CREATE POLICY "orgid_update_%s" ON public.%I FOR UPDATE TO authenticated USING (
          public.is_admin(auth.uid())
          OR organization_id = public.get_user_organization_id(auth.uid())
          OR organization_id IS NULL
        )', t, t);
    END IF;

    -- DELETE
    IF has_coop THEN
      EXECUTE format(
        'CREATE POLICY "orgid_delete_%s" ON public.%I FOR DELETE TO authenticated USING (
          public.is_admin(auth.uid())
          OR organization_id = public.get_user_organization_id(auth.uid())
          OR (organization_id IS NULL AND cooperativa_id = public.get_user_organization_id(auth.uid()))
        )', t, t);
    ELSE
      EXECUTE format(
        'CREATE POLICY "orgid_delete_%s" ON public.%I FOR DELETE TO authenticated USING (
          public.is_admin(auth.uid())
          OR organization_id = public.get_user_organization_id(auth.uid())
          OR organization_id IS NULL
        )', t, t);
    END IF;

    RAISE NOTICE '  ✓ orgid policies on %', t;
  END LOOP;
  RAISE NOTICE '✅ PHASE 5 complete: RLS org-first policies';
END $$;


-- ═════════════════════════════════════════════════════════════════════════════
-- 6) VERIFICATION OUTPUT
-- ═════════════════════════════════════════════════════════════════════════════

-- 6.1 NULL counts
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'productores','parcelas','entregas','documentos',
    'lotes_acopio','lotes_comerciales','contratos','cooperativa_exportadores'
  ];
  cnt bigint;
BEGIN
  RAISE NOTICE '─── NULL COUNTS ───';
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=t AND column_name='organization_id') THEN
      EXECUTE format('SELECT COUNT(*) FROM public.%I WHERE organization_id IS NULL', t) INTO cnt;
      IF cnt = 0 THEN
        RAISE NOTICE '  ✅ % : 0 nulls', t;
      ELSE
        RAISE NOTICE '  ⚠️  % : % nulls', t, cnt;
      END IF;
    END IF;
  END LOOP;
END $$;

-- 6.2 Sample rows (run these SELECTs manually to see output)
SELECT 'productores' AS tbl, id, cooperativa_id, organization_id FROM public.productores LIMIT 5;
SELECT 'parcelas' AS tbl, id, cooperativa_id, organization_id FROM public.parcelas LIMIT 5;
SELECT 'entregas' AS tbl, id, cooperativa_id, organization_id FROM public.entregas LIMIT 5;

-- 6.3 Policies created
SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies
WHERE schemaname = 'public' AND policyname LIKE 'orgid_%'
ORDER BY tablename, policyname;

-- 6.4 Triggers created
SELECT tgname, c.relname AS tablename
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
WHERE NOT t.tgisinternal
  AND tgname LIKE 'trg_sync_org_id_%'
ORDER BY c.relname;

-- 6.5 Helpers present
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_user_organization_id','is_admin','has_role','get_user_productor_id','sync_org_id_from_legacy_cols')
ORDER BY routine_name;

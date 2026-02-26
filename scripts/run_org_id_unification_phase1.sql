-- =============================================================================
-- EJECUTAR EN SUPABASE SQL EDITOR — Fase 1: Unificación organization_id
-- Incremental, reversible, sin downtime.
-- Prerequisito: platform_organizations ya existe como tabla canónica.
-- =============================================================================

-- ═══════════════════════════════════════════════════════════════════════════════
-- FASE 0: Safety rails — Helpers canónicos
-- ═══════════════════════════════════════════════════════════════════════════════

-- 0.1 Confirmar tabla canónica
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'platform_organizations'
  ) THEN
    RAISE EXCEPTION 'ABORT: platform_organizations does NOT exist. Create it first.';
  END IF;
END $$;

-- 0.2 Helper: get_user_organization_id
CREATE OR REPLACE FUNCTION public.get_user_organization_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE user_id = _user_id LIMIT 1;
$$;

-- 0.3 Helper: has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

-- 0.4 Helper: is_admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin');
$$;

-- 0.5 Helper: get_user_productor_id
CREATE OR REPLACE FUNCTION public.get_user_productor_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT productor_id FROM public.profiles WHERE user_id = _user_id LIMIT 1;
$$;

-- 0.6 Grants
GRANT EXECUTE ON FUNCTION public.get_user_organization_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_productor_id(uuid) TO authenticated;


-- ═══════════════════════════════════════════════════════════════════════════════
-- FASE 1: Añadir columna organization_id + índices (sin NOT NULL)
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  t text;
  all_tables text[] := ARRAY[
    'productores','parcelas','entregas','documentos',
    'lotes_acopio','lotes_comerciales','contratos','cooperativa_exportadores',
    'creditos','visitas','cataciones','alertas','avisos',
    'cuadrillas','inventario_insumos','transacciones',
    'evidencias','paquetes_eudr','diagnostico_org'
  ];
BEGIN
  FOREACH t IN ARRAY all_tables LOOP
    -- Only if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t) THEN
      -- Add column if missing
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=t AND column_name='organization_id') THEN
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN organization_id uuid', t);
        RAISE NOTICE 'Added organization_id to %', t;
      END IF;
      -- Index
      EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_organization_id ON public.%I(organization_id)', t, t);
    ELSE
      RAISE NOTICE 'Skipping (table not found): %', t;
    END IF;
  END LOOP;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- FASE 2: Backfill consistente (orden dependiente)
-- ═══════════════════════════════════════════════════════════════════════════════

-- 2.1 productores ← cooperativa_id
UPDATE public.productores
SET organization_id = cooperativa_id
WHERE cooperativa_id IS NOT NULL AND organization_id IS NULL;

-- 2.2 parcelas ← cooperativa_id OR productores.organization_id
UPDATE public.parcelas p
SET organization_id = COALESCE(p.cooperativa_id, pr.organization_id)
FROM public.productores pr
WHERE p.productor_id = pr.id
  AND p.organization_id IS NULL
  AND (p.cooperativa_id IS NOT NULL OR pr.organization_id IS NOT NULL);

-- Parcelas sin productor_id pero con cooperativa_id
UPDATE public.parcelas
SET organization_id = cooperativa_id
WHERE cooperativa_id IS NOT NULL AND organization_id IS NULL;

-- 2.3 entregas ← cooperativa_id, productores, parcelas
UPDATE public.entregas
SET organization_id = cooperativa_id
WHERE cooperativa_id IS NOT NULL AND organization_id IS NULL;

UPDATE public.entregas e
SET organization_id = pr.organization_id
FROM public.productores pr
WHERE e.productor_id = pr.id
  AND e.organization_id IS NULL AND pr.organization_id IS NOT NULL;

UPDATE public.entregas e
SET organization_id = p.organization_id
FROM public.parcelas p
WHERE e.parcela_id = p.id
  AND e.organization_id IS NULL AND p.organization_id IS NOT NULL;

-- 2.4 documentos
UPDATE public.documentos
SET organization_id = cooperativa_id
WHERE cooperativa_id IS NOT NULL AND organization_id IS NULL;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documentos' AND column_name='parcela_id') THEN
    EXECUTE '
      UPDATE public.documentos d
      SET organization_id = p.organization_id
      FROM public.parcelas p
      WHERE d.parcela_id = p.id AND d.organization_id IS NULL AND p.organization_id IS NOT NULL';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documentos' AND column_name='productor_id') THEN
    EXECUTE '
      UPDATE public.documentos d
      SET organization_id = pr.organization_id
      FROM public.productores pr
      WHERE d.productor_id = pr.id AND d.organization_id IS NULL AND pr.organization_id IS NOT NULL';
  END IF;
END $$;

-- 2.5 lotes_acopio ← cooperativa_id
UPDATE public.lotes_acopio
SET organization_id = cooperativa_id
WHERE cooperativa_id IS NOT NULL AND organization_id IS NULL;

-- 2.6 lotes_comerciales ← exportador_id || cooperativa_id
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='lotes_comerciales') THEN
    EXECUTE '
      UPDATE public.lotes_comerciales
      SET organization_id = COALESCE(exportador_id, cooperativa_id)
      WHERE (exportador_id IS NOT NULL OR cooperativa_id IS NOT NULL) AND organization_id IS NULL';
  END IF;
END $$;

-- contratos ← exportador_id
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='contratos') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contratos' AND column_name='exportador_id') THEN
      EXECUTE 'UPDATE public.contratos SET organization_id = exportador_id WHERE exportador_id IS NOT NULL AND organization_id IS NULL';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contratos' AND column_name='cooperativa_id') THEN
      EXECUTE 'UPDATE public.contratos SET organization_id = cooperativa_id WHERE cooperativa_id IS NOT NULL AND organization_id IS NULL';
    END IF;
  END IF;
END $$;

-- cooperativa_exportadores
UPDATE public.cooperativa_exportadores
SET organization_id = cooperativa_id
WHERE cooperativa_id IS NOT NULL AND organization_id IS NULL;

-- 2.7 Tablas adicionales (backfill simple desde cooperativa_id si existe)
DO $$
DECLARE
  t text;
  extra_tables text[] := ARRAY['creditos','visitas','cataciones','alertas','avisos','cuadrillas','inventario_insumos','transacciones','evidencias','paquetes_eudr','diagnostico_org'];
BEGIN
  FOREACH t IN ARRAY extra_tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t)
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=t AND column_name='organization_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=t AND column_name='cooperativa_id') THEN
      EXECUTE format('UPDATE public.%I SET organization_id = cooperativa_id WHERE cooperativa_id IS NOT NULL AND organization_id IS NULL', t);
      RAISE NOTICE 'Backfilled % from cooperativa_id', t;
    END IF;
    -- Try productor_id join fallback
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t)
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=t AND column_name='organization_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=t AND column_name='productor_id') THEN
      EXECUTE format('
        UPDATE public.%I t SET organization_id = pr.organization_id
        FROM public.productores pr
        WHERE t.productor_id = pr.id AND t.organization_id IS NULL AND pr.organization_id IS NOT NULL', t);
      RAISE NOTICE 'Backfilled % from productor join', t;
    END IF;
  END LOOP;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- FASE 3: Dual-write trigger (sync cooperativa_id → organization_id)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.sync_organization_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- If organization_id already set, don't override
  IF NEW.organization_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Try cooperativa_id
  IF TG_TABLE_NAME IN ('productores','parcelas','entregas','documentos','lotes_acopio',
    'cooperativa_exportadores','creditos','visitas','cataciones','alertas','avisos',
    'cuadrillas','inventario_insumos','transacciones','evidencias','paquetes_eudr','diagnostico_org')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=TG_TABLE_NAME AND column_name='cooperativa_id')
  THEN
    NEW.organization_id := COALESCE(NEW.organization_id, (NEW).cooperativa_id);
  END IF;

  -- Try exportador_id (lotes_comerciales, contratos)
  IF NEW.organization_id IS NULL
    AND TG_TABLE_NAME IN ('lotes_comerciales','contratos')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=TG_TABLE_NAME AND column_name='exportador_id')
  THEN
    NEW.organization_id := (NEW).exportador_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Apply trigger to all target tables
DO $$
DECLARE
  t text;
  all_tables text[] := ARRAY[
    'productores','parcelas','entregas','documentos',
    'lotes_acopio','lotes_comerciales','contratos','cooperativa_exportadores',
    'creditos','visitas','cataciones','alertas','avisos',
    'cuadrillas','inventario_insumos','transacciones',
    'evidencias','paquetes_eudr','diagnostico_org'
  ];
BEGIN
  FOREACH t IN ARRAY all_tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t)
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=t AND column_name='organization_id') THEN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_sync_organization_id ON public.%I', t);
      EXECUTE format('CREATE TRIGGER trg_sync_organization_id BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.sync_organization_id()', t);
      RAISE NOTICE 'Trigger created on %', t;
    END IF;
  END LOOP;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- FASE 4: RLS "org-first" con compatibilidad legacy
-- ═══════════════════════════════════════════════════════════════════════════════

-- New org-first policies (coexist with legacy cooperativa_id policies)
DO $$
DECLARE
  t text;
  rls_tables text[] := ARRAY[
    'productores','parcelas','entregas','documentos',
    'lotes_acopio','lotes_comerciales','contratos','cooperativa_exportadores'
  ];
BEGIN
  FOREACH t IN ARRAY rls_tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t)
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=t AND column_name='organization_id') THEN

      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

      -- Drop existing org-first policies if re-running
      EXECUTE format('DROP POLICY IF EXISTS "orgfirst_select_%s" ON public.%I', t, t);
      EXECUTE format('DROP POLICY IF EXISTS "orgfirst_insert_%s" ON public.%I', t, t);
      EXECUTE format('DROP POLICY IF EXISTS "orgfirst_update_%s" ON public.%I', t, t);
      EXECUTE format('DROP POLICY IF EXISTS "orgfirst_delete_%s" ON public.%I', t, t);

      -- SELECT: admin OR organization_id matches OR legacy null (transition)
      EXECUTE format(
        'CREATE POLICY "orgfirst_select_%s" ON public.%I FOR SELECT TO authenticated USING (
          public.is_admin(auth.uid())
          OR organization_id = public.get_user_organization_id(auth.uid())
          OR organization_id IS NULL
        )', t, t);

      -- INSERT
      EXECUTE format(
        'CREATE POLICY "orgfirst_insert_%s" ON public.%I FOR INSERT TO authenticated WITH CHECK (
          public.is_admin(auth.uid())
          OR organization_id = public.get_user_organization_id(auth.uid())
          OR organization_id IS NULL
        )', t, t);

      -- UPDATE
      EXECUTE format(
        'CREATE POLICY "orgfirst_update_%s" ON public.%I FOR UPDATE TO authenticated USING (
          public.is_admin(auth.uid())
          OR organization_id = public.get_user_organization_id(auth.uid())
        )', t, t);

      -- DELETE
      EXECUTE format(
        'CREATE POLICY "orgfirst_delete_%s" ON public.%I FOR DELETE TO authenticated USING (
          public.is_admin(auth.uid())
          OR organization_id = public.get_user_organization_id(auth.uid())
        )', t, t);

      RAISE NOTICE 'Org-first RLS policies created on %', t;
    END IF;
  END LOOP;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- Verificación inmediata post-ejecución
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT 'HELPERS' AS check_type, routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_user_organization_id','has_role','is_admin','get_user_productor_id','sync_organization_id');

SELECT 'TRIGGERS' AS check_type, trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public' AND trigger_name = 'trg_sync_organization_id';

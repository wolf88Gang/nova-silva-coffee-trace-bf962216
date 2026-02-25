-- =============================================================================
-- EJECUTAR EN SUPABASE SQL EDITOR
-- Refactor Fase 1: organization_id como tenant unificado
-- =============================================================================

-- 1. Crear organizations si falta
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  tipo text,
  pais text,
  estado text DEFAULT 'activo',
  created_at timestamptz DEFAULT now()
);

-- 2. Agregar organization_id (defensivo)
DO $$
DECLARE t text;
  tables text[] := ARRAY['productores','parcelas','entregas','documentos','lotes_acopio','lotes_comerciales','contratos','cooperativa_exportadores'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t AND column_name = 'organization_id') THEN
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN organization_id uuid', t);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_organization_id ON public.%I(organization_id)', t, t);
      END IF;
    END IF;
  END LOOP;
END $$;

-- 3. Backfill
UPDATE public.productores SET organization_id = cooperativa_id WHERE cooperativa_id IS NOT NULL AND organization_id IS NULL;

UPDATE public.parcelas p SET organization_id = COALESCE(p.cooperativa_id, pr.organization_id)
FROM public.productores pr WHERE p.productor_id = pr.id AND p.organization_id IS NULL AND (p.cooperativa_id IS NOT NULL OR pr.organization_id IS NOT NULL);

UPDATE public.entregas SET organization_id = cooperativa_id WHERE cooperativa_id IS NOT NULL AND organization_id IS NULL;

UPDATE public.entregas e SET organization_id = COALESCE(e.organization_id, pr.organization_id)
FROM public.productores pr WHERE e.productor_id = pr.id AND e.organization_id IS NULL AND pr.organization_id IS NOT NULL;

UPDATE public.entregas e SET organization_id = COALESCE(e.organization_id, p.organization_id)
FROM public.parcelas p WHERE e.parcela_id = p.id AND e.organization_id IS NULL AND p.organization_id IS NOT NULL;

UPDATE public.documentos SET organization_id = cooperativa_id WHERE cooperativa_id IS NOT NULL AND organization_id IS NULL;

UPDATE public.documentos d SET organization_id = COALESCE(d.organization_id, p.organization_id)
FROM public.parcelas p WHERE d.parcela_id = p.id AND d.organization_id IS NULL AND p.organization_id IS NOT NULL;

UPDATE public.documentos d SET organization_id = COALESCE(d.organization_id, pr.organization_id)
FROM public.productores pr WHERE d.productor_id = pr.id AND d.organization_id IS NULL AND pr.organization_id IS NOT NULL;

UPDATE public.lotes_acopio SET organization_id = cooperativa_id WHERE cooperativa_id IS NOT NULL AND organization_id IS NULL;

UPDATE public.lotes_comerciales SET organization_id = COALESCE(exportador_id, cooperativa_id) WHERE (exportador_id IS NOT NULL OR cooperativa_id IS NOT NULL) AND organization_id IS NULL;

UPDATE public.contratos SET organization_id = exportador_id WHERE exportador_id IS NOT NULL AND organization_id IS NULL;

UPDATE public.cooperativa_exportadores SET organization_id = cooperativa_id WHERE cooperativa_id IS NOT NULL AND organization_id IS NULL;

-- 4. Helpers
CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS uuid AS $$ SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1; $$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'); $$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public._can_access_org(p_org_id uuid)
RETURNS boolean AS $$
BEGIN
  IF p_org_id IS NULL THEN RETURN true; END IF;
  IF public.is_admin() THEN RETURN true; END IF;
  RETURN p_org_id = public.current_org_id();
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 5. RLS
DO $$
DECLARE tbl text;
  tables text[] := ARRAY['productores','parcelas','entregas','documentos','lotes_acopio','lotes_comerciales','contratos','cooperativa_exportadores'];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl)
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'organization_id') THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "org_scoped_select_%s" ON public.%I', tbl, tbl);
      EXECUTE format('DROP POLICY IF EXISTS "org_scoped_insert_%s" ON public.%I', tbl, tbl);
      EXECUTE format('DROP POLICY IF EXISTS "org_scoped_update_%s" ON public.%I', tbl, tbl);
      EXECUTE format('DROP POLICY IF EXISTS "org_scoped_delete_%s" ON public.%I', tbl, tbl);
      EXECUTE format('CREATE POLICY "org_scoped_select_%s" ON public.%I FOR SELECT USING (public._can_access_org(organization_id))', tbl, tbl);
      EXECUTE format('CREATE POLICY "org_scoped_insert_%s" ON public.%I FOR INSERT WITH CHECK (public._can_access_org(organization_id))', tbl, tbl);
      EXECUTE format('CREATE POLICY "org_scoped_update_%s" ON public.%I FOR UPDATE USING (public._can_access_org(organization_id))', tbl, tbl);
      EXECUTE format('CREATE POLICY "org_scoped_delete_%s" ON public.%I FOR DELETE USING (public._can_access_org(organization_id))', tbl, tbl);
    END IF;
  END LOOP;
END $$;

-- Verificación
SELECT routine_name, routine_type FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name IN ('current_org_id','is_admin','_can_access_org');

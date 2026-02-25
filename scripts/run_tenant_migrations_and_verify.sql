-- =============================================================================
-- EJECUTAR TODO EN SUPABASE SQL EDITOR (https://supabase.com/dashboard/project/.../sql)
-- Copia y pega este archivo completo, luego Run.
-- =============================================================================

-- ========== MIGRACIÓN 1: Add tenant_org_id ==========
CREATE OR REPLACE FUNCTION _add_tenant_org_column(p_table text, p_add_productor_index boolean DEFAULT false)
RETURNS void AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = p_table) THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = p_table AND column_name = 'tenant_org_id') THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN tenant_org_id uuid', p_table);
      EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_tenant_org_id ON public.%I(tenant_org_id)', p_table, p_table);
      IF p_add_productor_index AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = p_table AND column_name = 'productor_id') THEN
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_tenant_productor ON public.%I(tenant_org_id, productor_id)', p_table, p_table);
      END IF;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

SELECT _add_tenant_org_column('productores', false);
SELECT _add_tenant_org_column('parcelas', false);
SELECT _add_tenant_org_column('documentos', false);
SELECT _add_tenant_org_column('entregas', true);
SELECT _add_tenant_org_column('creditos', true);
SELECT _add_tenant_org_column('visitas', true);
SELECT _add_tenant_org_column('cataciones', true);
SELECT _add_tenant_org_column('lotes_acopio', false);
SELECT _add_tenant_org_column('avisos', false);
SELECT _add_tenant_org_column('cuadrillas', false);
SELECT _add_tenant_org_column('inventario_insumos', false);
SELECT _add_tenant_org_column('transacciones', false);
SELECT _add_tenant_org_column('alertas', false);
SELECT _add_tenant_org_column('evidencias', false);
SELECT _add_tenant_org_column('paquetes_eudr', false);
SELECT _add_tenant_org_column('lotes_comerciales', false);
SELECT _add_tenant_org_column('cooperativa_exportadores', false);
SELECT _add_tenant_org_column('contratos', false);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'diagnostico_org') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'diagnostico_org' AND column_name = 'tenant_org_id') THEN
      ALTER TABLE public.diagnostico_org ADD COLUMN tenant_org_id uuid;
      CREATE INDEX IF NOT EXISTS idx_diagnostico_org_tenant_org_id ON public.diagnostico_org(tenant_org_id);
    END IF;
  END IF;
END $$;

DROP FUNCTION IF EXISTS _add_tenant_org_column(text, boolean);

-- ========== MIGRACIÓN 2: Backfill ==========
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'productores' AND column_name = 'tenant_org_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'productores' AND column_name = 'cooperativa_id') THEN
    UPDATE public.productores SET tenant_org_id = cooperativa_id WHERE cooperativa_id IS NOT NULL AND tenant_org_id IS NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'parcelas' AND column_name = 'tenant_org_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'parcelas' AND column_name = 'productor_id') THEN
    UPDATE public.parcelas p SET tenant_org_id = pr.tenant_org_id FROM public.productores pr
    WHERE p.productor_id = pr.id AND pr.tenant_org_id IS NOT NULL AND p.tenant_org_id IS NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documentos' AND column_name = 'tenant_org_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documentos' AND column_name = 'parcela_id') THEN
    UPDATE public.documentos d SET tenant_org_id = p.tenant_org_id FROM public.parcelas p
    WHERE d.parcela_id = p.id AND p.tenant_org_id IS NOT NULL AND d.tenant_org_id IS NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'entregas' AND column_name = 'tenant_org_id') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'entregas' AND column_name = 'productor_id') THEN
      UPDATE public.entregas e SET tenant_org_id = pr.tenant_org_id FROM public.productores pr
      WHERE e.productor_id = pr.id AND pr.tenant_org_id IS NOT NULL AND e.tenant_org_id IS NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'entregas' AND column_name = 'parcela_id') THEN
      UPDATE public.entregas e SET tenant_org_id = p.tenant_org_id FROM public.parcelas p
      WHERE e.parcela_id = p.id AND p.tenant_org_id IS NOT NULL AND e.tenant_org_id IS NULL;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'creditos' AND column_name = 'tenant_org_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'creditos' AND column_name = 'productor_id') THEN
    UPDATE public.creditos c SET tenant_org_id = pr.tenant_org_id FROM public.productores pr
    WHERE c.productor_id = pr.id AND pr.tenant_org_id IS NOT NULL AND c.tenant_org_id IS NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'visitas' AND column_name = 'tenant_org_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'visitas' AND column_name = 'productor_id') THEN
    UPDATE public.visitas v SET tenant_org_id = pr.tenant_org_id FROM public.productores pr
    WHERE v.productor_id = pr.id AND pr.tenant_org_id IS NOT NULL AND v.tenant_org_id IS NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cataciones' AND column_name = 'tenant_org_id') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cataciones' AND column_name = 'productor_id') THEN
      UPDATE public.cataciones ca SET tenant_org_id = pr.tenant_org_id FROM public.productores pr
      WHERE ca.productor_id = pr.id AND pr.tenant_org_id IS NOT NULL AND ca.tenant_org_id IS NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cataciones' AND column_name = 'lote_id') THEN
      UPDATE public.cataciones ca SET tenant_org_id = la.tenant_org_id FROM public.lotes_acopio la
      WHERE ca.lote_id = la.id AND la.tenant_org_id IS NOT NULL AND ca.tenant_org_id IS NULL;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lotes_acopio' AND column_name = 'tenant_org_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lotes_acopio' AND column_name = 'cooperativa_id') THEN
    UPDATE public.lotes_acopio SET tenant_org_id = cooperativa_id WHERE cooperativa_id IS NOT NULL AND tenant_org_id IS NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'avisos' AND column_name = 'tenant_org_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'avisos' AND column_name = 'cooperativa_id') THEN
    UPDATE public.avisos SET tenant_org_id = cooperativa_id WHERE cooperativa_id IS NOT NULL AND tenant_org_id IS NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cuadrillas' AND column_name = 'tenant_org_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cuadrillas' AND column_name = 'cooperativa_id') THEN
    UPDATE public.cuadrillas SET tenant_org_id = cooperativa_id WHERE cooperativa_id IS NOT NULL AND tenant_org_id IS NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventario_insumos' AND column_name = 'tenant_org_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventario_insumos' AND column_name = 'cooperativa_id') THEN
    UPDATE public.inventario_insumos SET tenant_org_id = cooperativa_id WHERE cooperativa_id IS NOT NULL AND tenant_org_id IS NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'transacciones' AND column_name = 'tenant_org_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'transacciones' AND column_name = 'cooperativa_id') THEN
    UPDATE public.transacciones SET tenant_org_id = cooperativa_id WHERE cooperativa_id IS NOT NULL AND tenant_org_id IS NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cooperativa_exportadores' AND column_name = 'tenant_org_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cooperativa_exportadores' AND column_name = 'cooperativa_id') THEN
    UPDATE public.cooperativa_exportadores SET tenant_org_id = cooperativa_id WHERE cooperativa_id IS NOT NULL AND tenant_org_id IS NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'contratos' AND column_name = 'tenant_org_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'contratos' AND column_name = 'cooperativa_id') THEN
    UPDATE public.contratos SET tenant_org_id = cooperativa_id WHERE cooperativa_id IS NOT NULL AND tenant_org_id IS NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'diagnostico_org' AND column_name = 'tenant_org_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'diagnostico_org' AND column_name = 'organization_id') THEN
    UPDATE public.diagnostico_org SET tenant_org_id = organization_id WHERE organization_id IS NOT NULL AND tenant_org_id IS NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'paquetes_eudr' AND column_name = 'tenant_org_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'paquetes_eudr' AND column_name = 'lote_id') THEN
    UPDATE public.paquetes_eudr pe SET tenant_org_id = la.tenant_org_id FROM public.lotes_acopio la
    WHERE pe.lote_id = la.id AND la.tenant_org_id IS NOT NULL AND pe.tenant_org_id IS NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lotes_comerciales' AND column_name = 'tenant_org_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lotes_comerciales' AND column_name = 'exportador_id') THEN
    UPDATE public.lotes_comerciales SET tenant_org_id = exportador_id WHERE exportador_id IS NOT NULL AND tenant_org_id IS NULL;
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lotes_comerciales' AND column_name = 'tenant_org_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lotes_comerciales' AND column_name = 'origen_id') THEN
    UPDATE public.lotes_comerciales lc SET tenant_org_id = lc.origen_id WHERE lc.origen_id IS NOT NULL AND lc.tenant_org_id IS NULL;
  END IF;
END $$;

-- ========== MIGRACIÓN 3: RLS ==========
CREATE OR REPLACE FUNCTION public._user_can_access_tenant(p_tenant_org_id uuid)
RETURNS boolean AS $$
BEGIN
  IF p_tenant_org_id IS NULL THEN RETURN true; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin') THEN RETURN true; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'usuarios_org') THEN
    RETURN EXISTS (SELECT 1 FROM public.usuarios_org uo WHERE uo.user_id = auth.uid() AND uo.organization_id = p_tenant_org_id AND (uo.estado = 'activo' OR uo.estado IS NULL));
  END IF;
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
DECLARE tbl text;
  tables text[] := ARRAY['productores','parcelas','documentos','entregas','creditos','visitas','cataciones','lotes_acopio','avisos','cuadrillas','inventario_insumos','transacciones','alertas','evidencias','paquetes_eudr','lotes_comerciales','cooperativa_exportadores','contratos','diagnostico_org'];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl)
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'tenant_org_id') THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "tenant_select_%s" ON public.%I', tbl, tbl);
      EXECUTE format('DROP POLICY IF EXISTS "tenant_insert_%s" ON public.%I', tbl, tbl);
      EXECUTE format('DROP POLICY IF EXISTS "tenant_update_%s" ON public.%I', tbl, tbl);
      EXECUTE format('DROP POLICY IF EXISTS "tenant_delete_%s" ON public.%I', tbl, tbl);
      EXECUTE format('CREATE POLICY "tenant_select_%s" ON public.%I FOR SELECT USING (public._user_can_access_tenant(tenant_org_id))', tbl, tbl);
      EXECUTE format('CREATE POLICY "tenant_insert_%s" ON public.%I FOR INSERT WITH CHECK (public._user_can_access_tenant(tenant_org_id))', tbl, tbl);
      EXECUTE format('CREATE POLICY "tenant_update_%s" ON public.%I FOR UPDATE USING (public._user_can_access_tenant(tenant_org_id))', tbl, tbl);
      EXECUTE format('CREATE POLICY "tenant_delete_%s" ON public.%I FOR DELETE USING (public._user_can_access_tenant(tenant_org_id))', tbl, tbl);
    END IF;
  END LOOP;
END $$;

-- ========== VERIFICACIÓN: Función _user_can_access_tenant ==========
SELECT routine_schema, routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = '_user_can_access_tenant';

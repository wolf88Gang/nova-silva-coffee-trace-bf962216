-- Migration: RLS policies for tenant_org_id (Fase 1 - Tenant refactor)
-- Run order: 3 (after backfill)
-- Requires: usuarios_org(user_id, organization_id, estado), user_roles(user_id, role)

-- Reusable helper: check if user has access to tenant
CREATE OR REPLACE FUNCTION public._user_can_access_tenant(p_tenant_org_id uuid)
RETURNS boolean AS $$
BEGIN
  IF p_tenant_org_id IS NULL THEN
    RETURN true;  -- legacy: allow access during transition
  END IF;
  -- Admin bypass
  IF EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin') THEN
    RETURN true;
  END IF;
  -- Tenant membership (usuarios_org)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'usuarios_org') THEN
    RETURN EXISTS (
      SELECT 1 FROM public.usuarios_org uo
      WHERE uo.user_id = auth.uid()
        AND uo.organization_id = p_tenant_org_id
        AND (uo.estado = 'activo' OR uo.estado IS NULL)
    );
  END IF;
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply RLS to tenant tables (only if table exists and has tenant_org_id)
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'productores','parcelas','documentos','entregas','creditos','visitas',
    'cataciones','lotes_acopio','avisos','cuadrillas','inventario_insumos',
    'transacciones','alertas','evidencias','paquetes_eudr','lotes_comerciales',
    'cooperativa_exportadores','contratos','diagnostico_org'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl)
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'tenant_org_id') THEN

      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);

      -- Drop existing policies if any (idempotent)
      EXECUTE format('DROP POLICY IF EXISTS "tenant_select_%s" ON public.%I', tbl, tbl);
      EXECUTE format('DROP POLICY IF EXISTS "tenant_insert_%s" ON public.%I', tbl, tbl);
      EXECUTE format('DROP POLICY IF EXISTS "tenant_update_%s" ON public.%I', tbl, tbl);
      EXECUTE format('DROP POLICY IF EXISTS "tenant_delete_%s" ON public.%I', tbl, tbl);

      -- SELECT
      EXECUTE format(
        'CREATE POLICY "tenant_select_%s" ON public.%I FOR SELECT USING (public._user_can_access_tenant(tenant_org_id))',
        tbl, tbl
      );
      -- INSERT
      EXECUTE format(
        'CREATE POLICY "tenant_insert_%s" ON public.%I FOR INSERT WITH CHECK (public._user_can_access_tenant(tenant_org_id))',
        tbl, tbl
      );
      -- UPDATE
      EXECUTE format(
        'CREATE POLICY "tenant_update_%s" ON public.%I FOR UPDATE USING (public._user_can_access_tenant(tenant_org_id))',
        tbl, tbl
      );
      -- DELETE
      EXECUTE format(
        'CREATE POLICY "tenant_delete_%s" ON public.%I FOR DELETE USING (public._user_can_access_tenant(tenant_org_id))',
        tbl, tbl
      );

      RAISE NOTICE 'RLS enabled for %', tbl;
    END IF;
  END LOOP;
END $$;

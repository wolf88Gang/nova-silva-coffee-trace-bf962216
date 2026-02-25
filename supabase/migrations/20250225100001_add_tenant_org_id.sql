-- Migration: Add tenant_org_id to operational tables (Fase 1 - Tenant refactor)
-- Defensive: only alters if table exists; skips if column already exists.
-- Run order: 1

-- Helper: add column and indexes if table exists and column doesn't
CREATE OR REPLACE FUNCTION _add_tenant_org_column(
  p_table text,
  p_add_productor_index boolean DEFAULT false
) RETURNS void AS $$
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

-- productores (has cooperativa_id)
SELECT _add_tenant_org_column('productores', false);

-- parcelas (has productor_id)
SELECT _add_tenant_org_column('parcelas', false);

-- documentos (has parcela_id)
SELECT _add_tenant_org_column('documentos', false);

-- entregas (has productor_id, parcela_id)
SELECT _add_tenant_org_column('entregas', true);

-- creditos (has productor_id)
SELECT _add_tenant_org_column('creditos', true);

-- visitas (has productor_id, tecnico_id)
SELECT _add_tenant_org_column('visitas', true);

-- cataciones (has lote_id, productor_id)
SELECT _add_tenant_org_column('cataciones', true);

-- lotes_acopio (has cooperativa_id)
SELECT _add_tenant_org_column('lotes_acopio', false);

-- avisos (has cooperativa_id)
SELECT _add_tenant_org_column('avisos', false);

-- cuadrillas (has cooperativa_id)
SELECT _add_tenant_org_column('cuadrillas', false);

-- inventario_insumos (has cooperativa_id)
SELECT _add_tenant_org_column('inventario_insumos', false);

-- transacciones (has cooperativa_id)
SELECT _add_tenant_org_column('transacciones', false);

-- alertas (has entidad_tipo, entidad_id)
SELECT _add_tenant_org_column('alertas', false);

-- evidencias (has entidad_tipo, entidad_id)
SELECT _add_tenant_org_column('evidencias', false);

-- paquetes_eudr (has lote_id)
SELECT _add_tenant_org_column('paquetes_eudr', false);

-- lotes_comerciales (origen/exportador - tenant puede ser exportador)
SELECT _add_tenant_org_column('lotes_comerciales', false);

-- cooperativa_exportadores (cooperativa_id, exportador_id)
SELECT _add_tenant_org_column('cooperativa_exportadores', false);

-- contratos (cooperativa_id, exportador_id)
SELECT _add_tenant_org_column('contratos', false);

-- diagnostico_org (organization_id - puede ser el tenant)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'diagnostico_org') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'diagnostico_org' AND column_name = 'tenant_org_id') THEN
      -- diagnostico_org ya tiene organization_id; tenant_org_id = organization_id
      ALTER TABLE public.diagnostico_org ADD COLUMN tenant_org_id uuid;
      CREATE INDEX IF NOT EXISTS idx_diagnostico_org_tenant_org_id ON public.diagnostico_org(tenant_org_id);
    END IF;
  END IF;
END $$;

-- FK to organizations: deferred to separate migration after backfill validation
-- ALTER TABLE public.productores ADD CONSTRAINT ... REFERENCES organizations(id);

DROP FUNCTION IF EXISTS _add_tenant_org_column(text, boolean);

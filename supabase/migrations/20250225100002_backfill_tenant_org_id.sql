-- Migration: Backfill tenant_org_id (Fase 1 - Tenant refactor)
-- Run order: 2 (after 20250225100001)
-- Defensive: only updates tables/columns that exist

-- productores: tenant_org_id = cooperativa_id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'productores' AND column_name = 'tenant_org_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'productores' AND column_name = 'cooperativa_id') THEN
    UPDATE public.productores SET tenant_org_id = cooperativa_id WHERE cooperativa_id IS NOT NULL AND tenant_org_id IS NULL;
  END IF;
END $$;

-- parcelas: tenant_org_id from productores
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'parcelas' AND column_name = 'tenant_org_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'parcelas' AND column_name = 'productor_id') THEN
    UPDATE public.parcelas p
    SET tenant_org_id = pr.tenant_org_id
    FROM public.productores pr
    WHERE p.productor_id = pr.id AND pr.tenant_org_id IS NOT NULL AND p.tenant_org_id IS NULL;
  END IF;
END $$;

-- documentos: tenant_org_id from parcelas
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documentos' AND column_name = 'tenant_org_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documentos' AND column_name = 'parcela_id') THEN
    UPDATE public.documentos d
    SET tenant_org_id = p.tenant_org_id
    FROM public.parcelas p
    WHERE d.parcela_id = p.id AND p.tenant_org_id IS NOT NULL AND d.tenant_org_id IS NULL;
  END IF;
END $$;

-- entregas: tenant_org_id from productor or parcela
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'entregas' AND column_name = 'tenant_org_id') THEN
    -- From productor
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'entregas' AND column_name = 'productor_id') THEN
      UPDATE public.entregas e
      SET tenant_org_id = pr.tenant_org_id
      FROM public.productores pr
      WHERE e.productor_id = pr.id AND pr.tenant_org_id IS NOT NULL AND e.tenant_org_id IS NULL;
    END IF;
    -- From parcela (if still null and parcela_id exists)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'entregas' AND column_name = 'parcela_id') THEN
      UPDATE public.entregas e
      SET tenant_org_id = p.tenant_org_id
      FROM public.parcelas p
      WHERE e.parcela_id = p.id AND p.tenant_org_id IS NOT NULL AND e.tenant_org_id IS NULL;
    END IF;
  END IF;
END $$;

-- creditos: tenant_org_id from productores
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'creditos' AND column_name = 'tenant_org_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'creditos' AND column_name = 'productor_id') THEN
    UPDATE public.creditos c
    SET tenant_org_id = pr.tenant_org_id
    FROM public.productores pr
    WHERE c.productor_id = pr.id AND pr.tenant_org_id IS NOT NULL AND c.tenant_org_id IS NULL;
  END IF;
END $$;

-- visitas: tenant_org_id from productores
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'visitas' AND column_name = 'tenant_org_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'visitas' AND column_name = 'productor_id') THEN
    UPDATE public.visitas v
    SET tenant_org_id = pr.tenant_org_id
    FROM public.productores pr
    WHERE v.productor_id = pr.id AND pr.tenant_org_id IS NOT NULL AND v.tenant_org_id IS NULL;
  END IF;
END $$;

-- cataciones: tenant_org_id from productor or lote
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cataciones' AND column_name = 'tenant_org_id') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cataciones' AND column_name = 'productor_id') THEN
      UPDATE public.cataciones ca
      SET tenant_org_id = pr.tenant_org_id
      FROM public.productores pr
      WHERE ca.productor_id = pr.id AND pr.tenant_org_id IS NOT NULL AND ca.tenant_org_id IS NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cataciones' AND column_name = 'lote_id') THEN
      UPDATE public.cataciones ca
      SET tenant_org_id = la.tenant_org_id
      FROM public.lotes_acopio la
      WHERE ca.lote_id = la.id AND la.tenant_org_id IS NOT NULL AND ca.tenant_org_id IS NULL;
    END IF;
  END IF;
END $$;

-- lotes_acopio: tenant_org_id = cooperativa_id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lotes_acopio' AND column_name = 'tenant_org_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lotes_acopio' AND column_name = 'cooperativa_id') THEN
    UPDATE public.lotes_acopio SET tenant_org_id = cooperativa_id WHERE cooperativa_id IS NOT NULL AND tenant_org_id IS NULL;
  END IF;
END $$;

-- avisos: tenant_org_id = cooperativa_id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'avisos' AND column_name = 'tenant_org_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'avisos' AND column_name = 'cooperativa_id') THEN
    UPDATE public.avisos SET tenant_org_id = cooperativa_id WHERE cooperativa_id IS NOT NULL AND tenant_org_id IS NULL;
  END IF;
END $$;

-- cuadrillas: tenant_org_id = cooperativa_id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cuadrillas' AND column_name = 'tenant_org_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cuadrillas' AND column_name = 'cooperativa_id') THEN
    UPDATE public.cuadrillas SET tenant_org_id = cooperativa_id WHERE cooperativa_id IS NOT NULL AND tenant_org_id IS NULL;
  END IF;
END $$;

-- inventario_insumos: tenant_org_id = cooperativa_id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventario_insumos' AND column_name = 'tenant_org_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventario_insumos' AND column_name = 'cooperativa_id') THEN
    UPDATE public.inventario_insumos SET tenant_org_id = cooperativa_id WHERE cooperativa_id IS NOT NULL AND tenant_org_id IS NULL;
  END IF;
END $$;

-- transacciones: tenant_org_id = cooperativa_id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'transacciones' AND column_name = 'tenant_org_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'transacciones' AND column_name = 'cooperativa_id') THEN
    UPDATE public.transacciones SET tenant_org_id = cooperativa_id WHERE cooperativa_id IS NOT NULL AND tenant_org_id IS NULL;
  END IF;
END $$;

-- cooperativa_exportadores: tenant_org_id = cooperativa_id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cooperativa_exportadores' AND column_name = 'tenant_org_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cooperativa_exportadores' AND column_name = 'cooperativa_id') THEN
    UPDATE public.cooperativa_exportadores SET tenant_org_id = cooperativa_id WHERE cooperativa_id IS NOT NULL AND tenant_org_id IS NULL;
  END IF;
END $$;

-- contratos: tenant_org_id = cooperativa_id (tenant = coop que vende)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'contratos' AND column_name = 'tenant_org_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'contratos' AND column_name = 'cooperativa_id') THEN
    UPDATE public.contratos SET tenant_org_id = cooperativa_id WHERE cooperativa_id IS NOT NULL AND tenant_org_id IS NULL;
  END IF;
END $$;

-- diagnostico_org: tenant_org_id = organization_id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'diagnostico_org' AND column_name = 'tenant_org_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'diagnostico_org' AND column_name = 'organization_id') THEN
    UPDATE public.diagnostico_org SET tenant_org_id = organization_id WHERE organization_id IS NOT NULL AND tenant_org_id IS NULL;
  END IF;
END $$;

-- paquetes_eudr: tenant_org_id from lotes_acopio
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'paquetes_eudr' AND column_name = 'tenant_org_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'paquetes_eudr' AND column_name = 'lote_id') THEN
    UPDATE public.paquetes_eudr pe
    SET tenant_org_id = la.tenant_org_id
    FROM public.lotes_acopio la
    WHERE pe.lote_id = la.id AND la.tenant_org_id IS NOT NULL AND pe.tenant_org_id IS NULL;
  END IF;
END $$;

-- lotes_comerciales: tenant_org_id = exportador (owner del lote comercial)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lotes_comerciales' AND column_name = 'tenant_org_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lotes_comerciales' AND column_name = 'exportador_id') THEN
    UPDATE public.lotes_comerciales SET tenant_org_id = exportador_id WHERE exportador_id IS NOT NULL AND tenant_org_id IS NULL;
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lotes_comerciales' AND column_name = 'tenant_org_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lotes_comerciales' AND column_name = 'origen_id') THEN
    -- Si origen_id apunta a org (coop)
    UPDATE public.lotes_comerciales lc
    SET tenant_org_id = lc.origen_id
    WHERE lc.origen_id IS NOT NULL AND lc.tenant_org_id IS NULL;
  END IF;
END $$;

-- alertas: resolve tenant by entidad_tipo (defensive, entidad_id may be text/uuid)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'alertas' AND column_name = 'tenant_org_id') THEN RETURN; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'alertas' AND column_name = 'entidad_id') THEN RETURN; END IF;

  UPDATE public.alertas a SET tenant_org_id = p.tenant_org_id FROM public.parcelas p
  WHERE a.entidad_tipo = 'parcela' AND a.entidad_id::uuid = p.id AND p.tenant_org_id IS NOT NULL AND a.tenant_org_id IS NULL;

  UPDATE public.alertas a SET tenant_org_id = la.tenant_org_id FROM public.lotes_acopio la
  WHERE a.entidad_tipo = 'lote_acopio' AND a.entidad_id::uuid = la.id AND la.tenant_org_id IS NOT NULL AND a.tenant_org_id IS NULL;

  UPDATE public.alertas a SET tenant_org_id = d.tenant_org_id FROM public.documentos d
  WHERE a.entidad_tipo = 'documento' AND a.entidad_id::uuid = d.id AND d.tenant_org_id IS NOT NULL AND a.tenant_org_id IS NULL;

  UPDATE public.alertas a SET tenant_org_id = pe.tenant_org_id FROM public.paquetes_eudr pe
  WHERE a.entidad_tipo = 'paquete_eudr' AND a.entidad_id::uuid = pe.id AND pe.tenant_org_id IS NOT NULL AND a.tenant_org_id IS NULL;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'alertas backfill: %', SQLERRM;
END $$;

-- evidencias: same pattern
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'evidencias' AND column_name = 'tenant_org_id') THEN RETURN; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'evidencias' AND column_name = 'entidad_id') THEN RETURN; END IF;

  UPDATE public.evidencias e SET tenant_org_id = p.tenant_org_id FROM public.parcelas p
  WHERE e.entidad_tipo = 'parcela' AND e.entidad_id::uuid = p.id AND p.tenant_org_id IS NOT NULL AND e.tenant_org_id IS NULL;

  UPDATE public.evidencias e SET tenant_org_id = la.tenant_org_id FROM public.lotes_acopio la
  WHERE e.entidad_tipo = 'lote_acopio' AND e.entidad_id::uuid = la.id AND la.tenant_org_id IS NOT NULL AND e.tenant_org_id IS NULL;

  UPDATE public.evidencias e SET tenant_org_id = d.tenant_org_id FROM public.documentos d
  WHERE e.entidad_tipo = 'documento' AND e.entidad_id::uuid = d.id AND d.tenant_org_id IS NOT NULL AND e.tenant_org_id IS NULL;

  UPDATE public.evidencias e SET tenant_org_id = pe.tenant_org_id FROM public.paquetes_eudr pe
  WHERE e.entidad_tipo = 'paquete_eudr' AND e.entidad_id::uuid = pe.id AND pe.tenant_org_id IS NOT NULL AND e.tenant_org_id IS NULL;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'evidencias backfill: %', SQLERRM;
END $$;

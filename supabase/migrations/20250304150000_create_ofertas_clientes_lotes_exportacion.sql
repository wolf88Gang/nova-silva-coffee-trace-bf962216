-- Migration: Tablas comerciales (ofertas, clientes, lotes exportación, lotes_comerciales_lotes_acopio)
-- Para módulo de subastas y gestión comercial.
-- Requiere: lotes_comerciales, lotes_acopio, organizations.

-- ========== 1. clientes_compradores ==========
CREATE TABLE IF NOT EXISTS public.clientes_compradores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  nombre text NOT NULL,
  pais text NULL,
  contacto text NULL,
  email text NULL,
  contratos_activos int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clientes_org ON public.clientes_compradores (organization_id);

-- ========== 2. ofertas_comerciales ==========
CREATE TABLE IF NOT EXISTS public.ofertas_comerciales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  lote_comercial_id uuid NULL REFERENCES public.lotes_comerciales(id) ON DELETE SET NULL,
  comprador_id uuid NULL REFERENCES public.clientes_compradores(id) ON DELETE SET NULL,
  precio_unitario numeric NULL,
  volumen_kg numeric NULL,
  incoterm text NULL,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aceptada', 'rechazada', 'vencida')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ofertas_org ON public.ofertas_comerciales (organization_id);
CREATE INDEX IF NOT EXISTS idx_ofertas_lote ON public.ofertas_comerciales (lote_comercial_id);

-- ========== 3. ofertas_lotes (junction: oferta <-> lotes acopio) ==========
CREATE TABLE IF NOT EXISTS public.ofertas_lotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  oferta_comercial_id uuid NOT NULL REFERENCES public.ofertas_comerciales(id) ON DELETE CASCADE,
  lote_acopio_id uuid NOT NULL REFERENCES public.lotes_acopio(id) ON DELETE CASCADE,
  kg_asignados numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(oferta_comercial_id, lote_acopio_id)
);

CREATE INDEX IF NOT EXISTS idx_ofertas_lotes_oferta ON public.ofertas_lotes (oferta_comercial_id);
CREATE INDEX IF NOT EXISTS idx_ofertas_lotes_acopio ON public.ofertas_lotes (lote_acopio_id);

-- ========== 4. lotes_comerciales_lotes_acopio (junction: lote comercial <-> lotes acopio) ==========
CREATE TABLE IF NOT EXISTS public.lotes_comerciales_lotes_acopio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_comercial_id uuid NOT NULL REFERENCES public.lotes_comerciales(id) ON DELETE CASCADE,
  lote_acopio_id uuid NOT NULL REFERENCES public.lotes_acopio(id) ON DELETE CASCADE,
  kg_asignados numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(lote_comercial_id, lote_acopio_id)
);

CREATE INDEX IF NOT EXISTS idx_lcla_lote_comercial ON public.lotes_comerciales_lotes_acopio (lote_comercial_id);
CREATE INDEX IF NOT EXISTS idx_lcla_lote_acopio ON public.lotes_comerciales_lotes_acopio (lote_acopio_id);

-- ========== 5. lotes_exportacion ==========
CREATE TABLE IF NOT EXISTS public.lotes_exportacion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  lote_comercial_id uuid NULL REFERENCES public.lotes_comerciales(id) ON DELETE SET NULL,
  contrato_id uuid NULL,
  referencia text NULL,
  volumen_kg numeric NULL,
  estado text NOT NULL DEFAULT 'preparacion' CHECK (estado IN ('preparacion', 'embarcado', 'en_transito', 'entregado')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lotes_export_org ON public.lotes_exportacion (organization_id);
CREATE INDEX IF NOT EXISTS idx_lotes_export_lote ON public.lotes_exportacion (lote_comercial_id);

-- RLS
ALTER TABLE public.clientes_compradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ofertas_comerciales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ofertas_lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lotes_comerciales_lotes_acopio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lotes_exportacion ENABLE ROW LEVEL SECURITY;

-- Policies (usa get_user_organization_id o _can_access_org según exista)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_organization_id') THEN
    -- clientes_compradores
    DROP POLICY IF EXISTS "clientes_select" ON public.clientes_compradores;
    CREATE POLICY "clientes_select" ON public.clientes_compradores FOR SELECT TO authenticated
      USING (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin());
    DROP POLICY IF EXISTS "clientes_insert" ON public.clientes_compradores;
    CREATE POLICY "clientes_insert" ON public.clientes_compradores FOR INSERT TO authenticated
      WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));
    DROP POLICY IF EXISTS "clientes_update" ON public.clientes_compradores;
    CREATE POLICY "clientes_update" ON public.clientes_compradores FOR UPDATE TO authenticated
      USING (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin());
    DROP POLICY IF EXISTS "clientes_delete" ON public.clientes_compradores;
    CREATE POLICY "clientes_delete" ON public.clientes_compradores FOR DELETE TO authenticated
      USING (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin());

    -- ofertas_comerciales
    DROP POLICY IF EXISTS "ofertas_select" ON public.ofertas_comerciales;
    CREATE POLICY "ofertas_select" ON public.ofertas_comerciales FOR SELECT TO authenticated
      USING (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin());
    DROP POLICY IF EXISTS "ofertas_insert" ON public.ofertas_comerciales;
    CREATE POLICY "ofertas_insert" ON public.ofertas_comerciales FOR INSERT TO authenticated
      WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));
    DROP POLICY IF EXISTS "ofertas_update" ON public.ofertas_comerciales;
    CREATE POLICY "ofertas_update" ON public.ofertas_comerciales FOR UPDATE TO authenticated
      USING (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin());
    DROP POLICY IF EXISTS "ofertas_delete" ON public.ofertas_comerciales;
    CREATE POLICY "ofertas_delete" ON public.ofertas_comerciales FOR DELETE TO authenticated
      USING (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin());

    -- ofertas_lotes (acceso vía oferta)
    DROP POLICY IF EXISTS "ofertas_lotes_select" ON public.ofertas_lotes;
    CREATE POLICY "ofertas_lotes_select" ON public.ofertas_lotes FOR SELECT TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.ofertas_comerciales oc
        WHERE oc.id = oferta_comercial_id
          AND (oc.organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin())
      ));
    DROP POLICY IF EXISTS "ofertas_lotes_insert" ON public.ofertas_lotes;
    CREATE POLICY "ofertas_lotes_insert" ON public.ofertas_lotes FOR INSERT TO authenticated
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.ofertas_comerciales oc
        WHERE oc.id = oferta_comercial_id
          AND oc.organization_id = public.get_user_organization_id(auth.uid())
      ));
    DROP POLICY IF EXISTS "ofertas_lotes_update" ON public.ofertas_lotes;
    CREATE POLICY "ofertas_lotes_update" ON public.ofertas_lotes FOR UPDATE TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.ofertas_comerciales oc
        WHERE oc.id = oferta_comercial_id
          AND (oc.organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin())
      ));
    DROP POLICY IF EXISTS "ofertas_lotes_delete" ON public.ofertas_lotes;
    CREATE POLICY "ofertas_lotes_delete" ON public.ofertas_lotes FOR DELETE TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.ofertas_comerciales oc
        WHERE oc.id = oferta_comercial_id
          AND (oc.organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin())
      ));

    -- lotes_comerciales_lotes_acopio (acceso vía lote comercial)
    DROP POLICY IF EXISTS "lcla_select" ON public.lotes_comerciales_lotes_acopio;
    CREATE POLICY "lcla_select" ON public.lotes_comerciales_lotes_acopio FOR SELECT TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.lotes_comerciales lc
        WHERE lc.id = lote_comercial_id
          AND (lc.organization_id = public.get_user_organization_id(auth.uid())
            OR lc.exportador_id = public.get_user_organization_id(auth.uid())
            OR lc.cooperativa_id = public.get_user_organization_id(auth.uid())
            OR public.is_admin())
      ));
    DROP POLICY IF EXISTS "lcla_insert" ON public.lotes_comerciales_lotes_acopio;
    CREATE POLICY "lcla_insert" ON public.lotes_comerciales_lotes_acopio FOR INSERT TO authenticated
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.lotes_comerciales lc
        WHERE lc.id = lote_comercial_id
          AND (lc.organization_id = public.get_user_organization_id(auth.uid())
            OR lc.exportador_id = public.get_user_organization_id(auth.uid())
            OR lc.cooperativa_id = public.get_user_organization_id(auth.uid()))
      ));
    DROP POLICY IF EXISTS "lcla_update" ON public.lotes_comerciales_lotes_acopio;
    CREATE POLICY "lcla_update" ON public.lotes_comerciales_lotes_acopio FOR UPDATE TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.lotes_comerciales lc
        WHERE lc.id = lote_comercial_id
          AND (lc.organization_id = public.get_user_organization_id(auth.uid())
            OR lc.exportador_id = public.get_user_organization_id(auth.uid())
            OR lc.cooperativa_id = public.get_user_organization_id(auth.uid())
            OR public.is_admin())
      ));
    DROP POLICY IF EXISTS "lcla_delete" ON public.lotes_comerciales_lotes_acopio;
    CREATE POLICY "lcla_delete" ON public.lotes_comerciales_lotes_acopio FOR DELETE TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.lotes_comerciales lc
        WHERE lc.id = lote_comercial_id
          AND (lc.organization_id = public.get_user_organization_id(auth.uid())
            OR lc.exportador_id = public.get_user_organization_id(auth.uid())
            OR lc.cooperativa_id = public.get_user_organization_id(auth.uid())
            OR public.is_admin())
      ));

    -- lotes_exportacion
    DROP POLICY IF EXISTS "lotes_export_select" ON public.lotes_exportacion;
    CREATE POLICY "lotes_export_select" ON public.lotes_exportacion FOR SELECT TO authenticated
      USING (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin());
    DROP POLICY IF EXISTS "lotes_export_insert" ON public.lotes_exportacion;
    CREATE POLICY "lotes_export_insert" ON public.lotes_exportacion FOR INSERT TO authenticated
      WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));
    DROP POLICY IF EXISTS "lotes_export_update" ON public.lotes_exportacion;
    CREATE POLICY "lotes_export_update" ON public.lotes_exportacion FOR UPDATE TO authenticated
      USING (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin());
    DROP POLICY IF EXISTS "lotes_export_delete" ON public.lotes_exportacion;
    CREATE POLICY "lotes_export_delete" ON public.lotes_exportacion FOR DELETE TO authenticated
      USING (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin());
  END IF;
END $$;

-- Triggers updated_at
CREATE OR REPLACE FUNCTION _comercial_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_clientes_updated ON public.clientes_compradores;
CREATE TRIGGER trg_clientes_updated BEFORE UPDATE ON public.clientes_compradores FOR EACH ROW EXECUTE FUNCTION _comercial_updated_at();
DROP TRIGGER IF EXISTS trg_ofertas_updated ON public.ofertas_comerciales;
CREATE TRIGGER trg_ofertas_updated BEFORE UPDATE ON public.ofertas_comerciales FOR EACH ROW EXECUTE FUNCTION _comercial_updated_at();
DROP TRIGGER IF EXISTS trg_lotes_export_updated ON public.lotes_exportacion;
CREATE TRIGGER trg_lotes_export_updated BEFORE UPDATE ON public.lotes_exportacion FOR EACH ROW EXECUTE FUNCTION _comercial_updated_at();

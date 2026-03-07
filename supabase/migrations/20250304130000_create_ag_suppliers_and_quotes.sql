-- Migration: Proveedores, cotizaciones y comisiones (módulo nutrición)
-- ag_suppliers, ag_supplier_products, ag_quotes, ag_quote_events, ag_commissions

-- ========== 1. ag_suppliers ==========
CREATE TABLE IF NOT EXISTS public.ag_suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  nombre text NOT NULL,
  pais text NULL,
  provincia text NULL,
  canton text NULL,
  distrito text NULL,
  lat numeric(10,7) NULL,
  lng numeric(10,7) NULL,
  radio_servicio_km numeric(8,2) NULL,
  telefono text NULL,
  whatsapp text NULL,
  email text NULL,
  commission_pct_default numeric(5,4) NULL DEFAULT 0.03,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ag_suppliers_org ON public.ag_suppliers (organization_id);
CREATE INDEX IF NOT EXISTS idx_ag_suppliers_activo ON public.ag_suppliers (activo) WHERE activo = true;

-- ========== 2. ag_supplier_products ==========
CREATE TABLE IF NOT EXISTS public.ag_supplier_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.ag_suppliers(id) ON DELETE CASCADE,
  nombre_producto text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('NPK', 'N', 'P', 'K', 'Ca', 'Mg', 'Micros', 'Enmienda')),
  analisis_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  unidad text NOT NULL DEFAULT 'kg' CHECK (unidad IN ('kg', 'saco_50kg', 'litro')),
  precio_unitario numeric(12,2) NOT NULL,
  moneda text NOT NULL DEFAULT 'USD',
  vigencia_desde date NULL,
  vigencia_hasta date NULL,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ag_supplier_products_supplier ON public.ag_supplier_products (supplier_id);

-- analisis_json: { "N_pct": 46, "P2O5_pct": 0, "K2O_pct": 0 } para urea, etc.

-- ========== 3. ag_quotes ==========
CREATE TABLE IF NOT EXISTS public.ag_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  plan_id uuid NOT NULL REFERENCES public.nutricion_planes(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES public.ag_suppliers(id) ON DELETE CASCADE,
  quote_status text NOT NULL DEFAULT 'draft' CHECK (quote_status IN ('draft', 'sent', 'accepted', 'expired', 'cancelled', 'fulfilled')),
  quote_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  hash_quote text NULL,
  quote_idempotency_key text NULL,
  created_by uuid NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ag_quotes_idempotency
  ON public.ag_quotes (plan_id, supplier_id, quote_idempotency_key)
  WHERE quote_idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ag_quotes_plan ON public.ag_quotes (plan_id);
CREATE INDEX IF NOT EXISTS idx_ag_quotes_supplier ON public.ag_quotes (supplier_id);

-- ========== 4. ag_quote_events ==========
CREATE TABLE IF NOT EXISTS public.ag_quote_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  quote_id uuid NOT NULL REFERENCES public.ag_quotes(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('generated', 'sent', 'accepted', 'paid', 'fulfilled')),
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ag_quote_events_quote ON public.ag_quote_events (quote_id);

-- ========== 5. ag_commissions ==========
CREATE TABLE IF NOT EXISTS public.ag_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  quote_id uuid NOT NULL REFERENCES public.ag_quotes(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES public.ag_suppliers(id) ON DELETE CASCADE,
  invoice_amount numeric(12,2) NULL,
  commission_pct numeric(5,4) NULL,
  commission_amount numeric(12,2) NULL,
  status text NOT NULL DEFAULT 'estimated' CHECK (status IN ('estimated', 'confirmed', 'paid')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ag_commissions_quote ON public.ag_commissions (quote_id);

-- RLS
ALTER TABLE public.ag_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ag_supplier_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ag_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ag_quote_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ag_commissions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = '_can_access_org') THEN
    DROP POLICY IF EXISTS "ag_suppliers_org" ON public.ag_suppliers;
    CREATE POLICY "ag_suppliers_org" ON public.ag_suppliers FOR ALL USING (public._can_access_org(organization_id)) WITH CHECK (public._can_access_org(organization_id));
    DROP POLICY IF EXISTS "ag_supplier_products_org" ON public.ag_supplier_products;
    CREATE POLICY "ag_supplier_products_org" ON public.ag_supplier_products FOR ALL
      USING (EXISTS (SELECT 1 FROM public.ag_suppliers s WHERE s.id = supplier_id AND public._can_access_org(s.organization_id)))
      WITH CHECK (EXISTS (SELECT 1 FROM public.ag_suppliers s WHERE s.id = supplier_id AND public._can_access_org(s.organization_id)));
    DROP POLICY IF EXISTS "ag_quotes_org" ON public.ag_quotes;
    CREATE POLICY "ag_quotes_org" ON public.ag_quotes FOR ALL USING (public._can_access_org(organization_id)) WITH CHECK (public._can_access_org(organization_id));
    DROP POLICY IF EXISTS "ag_quote_events_org" ON public.ag_quote_events;
    CREATE POLICY "ag_quote_events_org" ON public.ag_quote_events FOR ALL USING (public._can_access_org(organization_id)) WITH CHECK (public._can_access_org(organization_id));
    DROP POLICY IF EXISTS "ag_commissions_org" ON public.ag_commissions;
    CREATE POLICY "ag_commissions_org" ON public.ag_commissions FOR ALL USING (public._can_access_org(organization_id)) WITH CHECK (public._can_access_org(organization_id));
  END IF;
END $$;

-- RPC: Obtener lat/lng de parcela (desde poligono_geojson o lat/lng si existen)
CREATE OR REPLACE FUNCTION public.get_parcela_centroid(p_parcela_id uuid)
RETURNS TABLE(lat numeric, lng numeric) AS $$
DECLARE
  geo jsonb;
  coords jsonb;
BEGIN
  SELECT poligono_geojson INTO geo FROM public.parcelas WHERE id = p_parcela_id LIMIT 1;
  IF geo IS NULL THEN RETURN; END IF;

  -- GeoJSON: { "type": "Feature", "geometry": { "coordinates": [[[lng,lat],...]] } } o { "coordinates": [[[lng,lat],...]] }
  coords := geo->'geometry'->'coordinates';
  IF coords IS NULL THEN coords := geo->'coordinates'; END IF;
  IF coords IS NULL THEN RETURN; END IF;

  -- Primer punto del primer anillo: [lng, lat]
  RETURN QUERY SELECT
    (coords->0->0->1)::numeric AS lat,
    (coords->0->0->0)::numeric AS lng;
EXCEPTION WHEN OTHERS THEN
  RETURN;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

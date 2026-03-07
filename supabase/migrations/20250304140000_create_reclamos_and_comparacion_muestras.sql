-- Migration: Tablas comerciales (reclamos_postventa, comparacion_muestras)
-- Para módulo de subastas y gestión comercial.
-- Usa organization_id como tenant. RLS con get_user_organization_id e is_admin.

-- ========== 1. reclamos_postventa ==========
CREATE TABLE IF NOT EXISTS public.reclamos_postventa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  lote_comercial_id uuid NULL REFERENCES public.lotes_comerciales(id) ON DELETE SET NULL,
  tipo text NOT NULL CHECK (tipo IN ('peso', 'calidad', 'humedad', 'documentacion', 'tiempo', 'otro')),
  severidad text NOT NULL DEFAULT 'media' CHECK (severidad IN ('baja', 'media', 'alta')),
  descripcion text NULL,
  fecha_reclamo date NOT NULL DEFAULT CURRENT_DATE,
  estado text NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto', 'en_analisis', 'en_investigacion', 'resuelto', 'cerrado')),
  creado_por uuid NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reclamos_org ON public.reclamos_postventa (organization_id);
CREATE INDEX IF NOT EXISTS idx_reclamos_lote ON public.reclamos_postventa (lote_comercial_id);
CREATE INDEX IF NOT EXISTS idx_reclamos_estado ON public.reclamos_postventa (estado);

-- ========== 2. comparacion_muestras ==========
CREATE TABLE IF NOT EXISTS public.comparacion_muestras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  lote_comercial_id uuid NULL REFERENCES public.lotes_comerciales(id) ON DELETE SET NULL,
  muestra_offer_id uuid NULL,
  muestra_pss_id uuid NULL,
  muestra_arrival_id uuid NULL,
  diferencia_puntaje_offer_pss numeric NULL,
  diferencia_puntaje_pss_arrival numeric NULL,
  diferencia_puntaje_offer_arrival numeric NULL,
  semaforo text NOT NULL DEFAULT 'pendiente' CHECK (semaforo IN ('verde', 'ambar', 'rojo', 'pendiente')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comparacion_org ON public.comparacion_muestras (organization_id);
CREATE INDEX IF NOT EXISTS idx_comparacion_lote ON public.comparacion_muestras (lote_comercial_id);

-- RLS
ALTER TABLE public.reclamos_postventa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comparacion_muestras ENABLE ROW LEVEL SECURITY;

-- Policies (usa get_user_organization_id(p_user_id) - en RLS se llama con auth.uid())
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_organization_id') THEN
    DROP POLICY IF EXISTS "reclamos_select" ON public.reclamos_postventa;
    CREATE POLICY "reclamos_select" ON public.reclamos_postventa FOR SELECT TO authenticated
      USING (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin());
    DROP POLICY IF EXISTS "reclamos_insert" ON public.reclamos_postventa;
    CREATE POLICY "reclamos_insert" ON public.reclamos_postventa FOR INSERT TO authenticated
      WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));
    DROP POLICY IF EXISTS "reclamos_update" ON public.reclamos_postventa;
    CREATE POLICY "reclamos_update" ON public.reclamos_postventa FOR UPDATE TO authenticated
      USING (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin());
    DROP POLICY IF EXISTS "reclamos_delete" ON public.reclamos_postventa;
    CREATE POLICY "reclamos_delete" ON public.reclamos_postventa FOR DELETE TO authenticated
      USING (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin());

    DROP POLICY IF EXISTS "comparacion_select" ON public.comparacion_muestras;
    CREATE POLICY "comparacion_select" ON public.comparacion_muestras FOR SELECT TO authenticated
      USING (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin());
    DROP POLICY IF EXISTS "comparacion_insert" ON public.comparacion_muestras;
    CREATE POLICY "comparacion_insert" ON public.comparacion_muestras FOR INSERT TO authenticated
      WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));
    DROP POLICY IF EXISTS "comparacion_update" ON public.comparacion_muestras;
    CREATE POLICY "comparacion_update" ON public.comparacion_muestras FOR UPDATE TO authenticated
      USING (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin());
    DROP POLICY IF EXISTS "comparacion_delete" ON public.comparacion_muestras;
    CREATE POLICY "comparacion_delete" ON public.comparacion_muestras FOR DELETE TO authenticated
      USING (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin());
  END IF;
END $$;

-- Trigger updated_at para reclamos
CREATE OR REPLACE FUNCTION _reclamos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reclamos_updated ON public.reclamos_postventa;
CREATE TRIGGER trg_reclamos_updated BEFORE UPDATE ON public.reclamos_postventa FOR EACH ROW EXECUTE FUNCTION _reclamos_updated_at();

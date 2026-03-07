-- Migration: Tablas transaccionales del módulo de nutrición
-- nutricion_planes, nutricion_aplicaciones, ag_plan_events
-- Multi-tenant por organization_id. RLS habilitado.

-- ========== 1. nutricion_planes ==========
CREATE TABLE IF NOT EXISTS public.nutricion_planes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  parcela_id uuid NOT NULL,
  ruleset_version text NOT NULL DEFAULT '1.0.0',
  engine_version text NOT NULL DEFAULT 'nutrition_v1',
  idempotency_key text NULL,
  receta_canonica_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  hash_receta text NULL,
  explain_json jsonb NULL,
  nivel_confianza text NULL CHECK (nivel_confianza IN ('alto', 'medio', 'bajo')),
  modo_calculo text NULL CHECK (modo_calculo IN ('completo', 'heuristico')),
  estado text NOT NULL DEFAULT 'recommended' CHECK (estado IN ('recommended', 'approved_tecnico', 'in_execution', 'completed', 'cancelled_climate', 'superseded')),
  execution_pct_total numeric(6,2) NOT NULL DEFAULT 0 CHECK (execution_pct_total >= 0 AND execution_pct_total <= 100),
  execution_pct_by_nutrient jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nutricion_planes_org ON public.nutricion_planes (organization_id);
CREATE INDEX IF NOT EXISTS idx_nutricion_planes_parcela ON public.nutricion_planes (parcela_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_nutricion_planes_idempotency
  ON public.nutricion_planes (parcela_id, idempotency_key) WHERE idempotency_key IS NOT NULL;

-- ========== 2. nutricion_aplicaciones ==========
CREATE TABLE IF NOT EXISTS public.nutricion_aplicaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  plan_id uuid NOT NULL REFERENCES public.nutricion_planes(id) ON DELETE CASCADE,
  parcela_id uuid NOT NULL,
  idempotency_key text NOT NULL,
  fecha_aplicacion date NOT NULL,
  tipo_aplicacion text NOT NULL CHECK (tipo_aplicacion IN ('edafica', 'foliar', 'mixta')),
  dosis_aplicada_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  evidencias jsonb NOT NULL DEFAULT '[]'::jsonb,
  costo_real numeric(12,2) NULL,
  notas text NULL,
  created_by uuid NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_nutricion_aplicaciones_plan ON public.nutricion_aplicaciones (plan_id);
CREATE INDEX IF NOT EXISTS idx_nutricion_aplicaciones_org ON public.nutricion_aplicaciones (organization_id);

-- ========== 3. ag_plan_events ==========
CREATE TABLE IF NOT EXISTS public.ag_plan_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  plan_id uuid NOT NULL REFERENCES public.nutricion_planes(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('generated', 'approved', 'revised', 'execution_logged', 'invoice_linked', 'cancelled_climate', 'closed', 'terms_accepted')),
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ag_plan_events_plan ON public.ag_plan_events (plan_id);
CREATE INDEX IF NOT EXISTS idx_ag_plan_events_org ON public.ag_plan_events (organization_id);

-- RLS
ALTER TABLE public.nutricion_planes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutricion_aplicaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ag_plan_events ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = '_can_access_org') THEN
    DROP POLICY IF EXISTS "nutricion_planes_org" ON public.nutricion_planes;
    CREATE POLICY "nutricion_planes_org" ON public.nutricion_planes FOR ALL USING (public._can_access_org(organization_id)) WITH CHECK (public._can_access_org(organization_id));
    DROP POLICY IF EXISTS "nutricion_aplicaciones_org" ON public.nutricion_aplicaciones;
    CREATE POLICY "nutricion_aplicaciones_org" ON public.nutricion_aplicaciones FOR ALL USING (public._can_access_org(organization_id)) WITH CHECK (public._can_access_org(organization_id));
    DROP POLICY IF EXISTS "ag_plan_events_org" ON public.ag_plan_events;
    CREATE POLICY "ag_plan_events_org" ON public.ag_plan_events FOR ALL USING (public._can_access_org(organization_id)) WITH CHECK (public._can_access_org(organization_id));
  ELSE
    DROP POLICY IF EXISTS "nutricion_planes_org" ON public.nutricion_planes;
    CREATE POLICY "nutricion_planes_org" ON public.nutricion_planes FOR ALL USING (organization_id = (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)) WITH CHECK (organization_id = (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1));
    DROP POLICY IF EXISTS "nutricion_aplicaciones_org" ON public.nutricion_aplicaciones;
    CREATE POLICY "nutricion_aplicaciones_org" ON public.nutricion_aplicaciones FOR ALL USING (organization_id = (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)) WITH CHECK (organization_id = (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1));
    DROP POLICY IF EXISTS "ag_plan_events_org" ON public.ag_plan_events;
    CREATE POLICY "ag_plan_events_org" ON public.ag_plan_events FOR ALL USING (organization_id = (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)) WITH CHECK (organization_id = (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1));
  END IF;
END $$;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION _nutricion_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_nutricion_planes_updated ON public.nutricion_planes;
CREATE TRIGGER trg_nutricion_planes_updated BEFORE UPDATE ON public.nutricion_planes FOR EACH ROW EXECUTE FUNCTION _nutricion_updated_at();

DROP TRIGGER IF EXISTS trg_nutricion_aplicaciones_updated ON public.nutricion_aplicaciones;
CREATE TRIGGER trg_nutricion_aplicaciones_updated BEFORE UPDATE ON public.nutricion_aplicaciones FOR EACH ROW EXECUTE FUNCTION _nutricion_updated_at();

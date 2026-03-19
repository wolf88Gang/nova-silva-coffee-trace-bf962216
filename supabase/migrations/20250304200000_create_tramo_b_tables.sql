-- Migration: Tramo B - Tablas de integración inter-modular
-- plot_module_snapshot, disease_assessments, resilience_assessments, cycle_learning_log
-- Requiere: parcelas, nutricion_planes, get_user_organization_id, is_admin

-- ========== 1. plot_module_snapshot ==========
CREATE TABLE IF NOT EXISTS public.plot_module_snapshot (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  parcela_id uuid NOT NULL,
  ciclo text NOT NULL,
  version int NOT NULL DEFAULT 1,
  -- Nova Yield
  yield_expected numeric NULL,
  yield_uncertainty numeric NULL,
  yield_potential numeric NULL,
  yield_method text NULL,
  yield_date date NULL,
  -- Nova Guard
  disease_pressure_index numeric NULL CHECK (disease_pressure_index >= 0 AND disease_pressure_index <= 1),
  roya_incidence numeric NULL CHECK (roya_incidence >= 0 AND roya_incidence <= 1),
  broca_incidence numeric NULL CHECK (broca_incidence >= 0 AND broca_incidence <= 1),
  defoliation_level numeric NULL CHECK (defoliation_level >= 0 AND defoliation_level <= 1),
  disease_factor numeric NULL CHECK (disease_factor >= 0.5 AND disease_factor <= 1),
  guard_assessment_date date NULL,
  -- Nutrición
  nutrient_limitation_score numeric NULL CHECK (nutrient_limitation_score >= 0 AND nutrient_limitation_score <= 1),
  limiting_nutrient text NULL,
  nutrient_factor numeric NULL CHECK (nutrient_factor >= 0.5 AND nutrient_factor <= 1),
  -- VITAL
  resilience_index numeric NULL CHECK (resilience_index >= 0 AND resilience_index <= 1),
  soil_health_score numeric NULL CHECK (soil_health_score >= 0 AND soil_health_score <= 1),
  water_stress_index numeric NULL CHECK (water_stress_index >= 0 AND water_stress_index <= 1),
  water_factor numeric NULL CHECK (water_factor >= 0.5 AND water_factor <= 1),
  -- Calculados
  yield_adjusted numeric NULL,
  yield_real numeric NULL,
  productivity_gap numeric NULL,
  computed_at timestamptz NOT NULL DEFAULT now(),
  computed_by uuid NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, parcela_id, ciclo)
);

CREATE INDEX IF NOT EXISTS idx_plot_snapshot_org ON public.plot_module_snapshot (organization_id);
CREATE INDEX IF NOT EXISTS idx_plot_snapshot_parcela ON public.plot_module_snapshot (parcela_id);

-- ========== 2. disease_assessments ==========
CREATE TABLE IF NOT EXISTS public.disease_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  parcela_id uuid NOT NULL,
  ciclo text NOT NULL,
  evaluador_id uuid NULL REFERENCES auth.users(id),
  fecha_evaluacion date NOT NULL,
  roya_incidence numeric NOT NULL CHECK (roya_incidence >= 0 AND roya_incidence <= 1),
  broca_incidence numeric NOT NULL CHECK (broca_incidence >= 0 AND broca_incidence <= 1),
  defoliation_level numeric NOT NULL CHECK (defoliation_level >= 0 AND defoliation_level <= 1),
  stress_symptoms numeric NOT NULL DEFAULT 0 CHECK (stress_symptoms >= 0 AND stress_symptoms <= 1),
  disease_pressure_index numeric NULL,
  disease_factor numeric NULL,
  sensitivity numeric NOT NULL DEFAULT 0.6,
  notas text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_disease_assessments_org ON public.disease_assessments (organization_id);
CREATE INDEX IF NOT EXISTS idx_disease_assessments_parcela ON public.disease_assessments (parcela_id);

-- ========== 3. resilience_assessments ==========
CREATE TABLE IF NOT EXISTS public.resilience_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  parcela_id uuid NOT NULL,
  ciclo text NOT NULL,
  evaluador_id uuid NULL REFERENCES auth.users(id),
  fecha_evaluacion date NOT NULL,
  soil_health numeric NOT NULL CHECK (soil_health >= 0 AND soil_health <= 1),
  organic_matter_score numeric NOT NULL CHECK (organic_matter_score >= 0 AND organic_matter_score <= 1),
  biodiversity numeric NOT NULL CHECK (biodiversity >= 0 AND biodiversity <= 1),
  water_management numeric NOT NULL CHECK (water_management >= 0 AND water_management <= 1),
  erosion_control numeric NOT NULL CHECK (erosion_control >= 0 AND erosion_control <= 1),
  shade_coverage numeric NULL CHECK (shade_coverage >= 0 AND shade_coverage <= 1),
  resilience_index numeric NULL,
  resilience_level text NULL CHECK (resilience_level IN ('fragil', 'baja', 'moderada', 'alta')),
  notas text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resilience_assessments_org ON public.resilience_assessments (organization_id);
CREATE INDEX IF NOT EXISTS idx_resilience_assessments_parcela ON public.resilience_assessments (parcela_id);

-- ========== 4. cycle_learning_log ==========
CREATE TABLE IF NOT EXISTS public.cycle_learning_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  parcela_id uuid NOT NULL,
  ciclo text NOT NULL,
  yield_expected numeric NULL,
  yield_real numeric NULL,
  plan_nutricional_id uuid NULL REFERENCES public.nutricion_planes(id) ON DELETE SET NULL,
  nutrient_factor numeric NULL,
  disease_factor numeric NULL,
  water_factor numeric NULL,
  yield_adjusted numeric NULL,
  productivity_gap numeric NULL,
  inferred_limiting_factor text NULL CHECK (inferred_limiting_factor IN ('nutricion', 'sanidad', 'hidrico', 'manejo', 'genetico')),
  confidence numeric NULL CHECK (confidence >= 0 AND confidence <= 1),
  learning_notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cycle_learning_org ON public.cycle_learning_log (organization_id);
CREATE INDEX IF NOT EXISTS idx_cycle_learning_parcela ON public.cycle_learning_log (parcela_id);

-- RLS
ALTER TABLE public.plot_module_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disease_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resilience_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycle_learning_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_organization_id') THEN
    DROP POLICY IF EXISTS "plot_snapshot_org" ON public.plot_module_snapshot;
    CREATE POLICY "plot_snapshot_org" ON public.plot_module_snapshot FOR ALL
      USING (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin())
      WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

    DROP POLICY IF EXISTS "disease_assessments_org" ON public.disease_assessments;
    CREATE POLICY "disease_assessments_org" ON public.disease_assessments FOR ALL
      USING (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin())
      WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

    DROP POLICY IF EXISTS "resilience_assessments_org" ON public.resilience_assessments;
    CREATE POLICY "resilience_assessments_org" ON public.resilience_assessments FOR ALL
      USING (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin())
      WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

    DROP POLICY IF EXISTS "cycle_learning_org" ON public.cycle_learning_log;
    CREATE POLICY "cycle_learning_org" ON public.cycle_learning_log FOR ALL
      USING (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin())
      WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));
  END IF;
END $$;

-- Trigger updated_at para plot_module_snapshot
CREATE OR REPLACE FUNCTION _plot_snapshot_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_plot_snapshot_updated ON public.plot_module_snapshot;
CREATE TRIGGER trg_plot_snapshot_updated BEFORE UPDATE ON public.plot_module_snapshot
  FOR EACH ROW EXECUTE FUNCTION _plot_snapshot_updated_at();

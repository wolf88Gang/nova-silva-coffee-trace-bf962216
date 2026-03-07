# Prompt para Supabase AI — Motor Inter-Modular Tramo B

> **Copia y pega este texto completo en el Supabase SQL Editor** y ejecútalo.
> Requiere: Tramo A ya ejecutado (tablas ag_*, harvest_results, yield_estimates, etc.)
> Última actualización: 2026-03-07

---

Eres un asistente SQL para **Nova Silva**. Este script crea las tablas de integración inter-modular del Tramo B: snapshots por parcela/ciclo, evaluaciones fitosanitarias (Nova Guard), evaluaciones de resiliencia (Protocolo VITAL), aprendizaje del sistema, y las RPCs de cálculo integrado.

## Reglas

1. Multi-tenant: `organization_id uuid NOT NULL` en toda tabla transaccional.
2. RLS activo en todas las tablas.
3. Funciones helper existentes: `get_user_organization_id()`, `is_admin()`, `is_org_admin()`.
4. Idioma: tablas y columnas en inglés técnico para variables científicas, español para campos descriptivos.

---

```sql
-- ============================================================
-- MOTOR INTER-MODULAR TRAMO B — TABLAS DE INTEGRACIÓN
-- Ejecutar de una sola vez en SQL Editor de Supabase
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- PARTE 1: SNAPSHOT INTER-MODULAR POR PARCELA/CICLO
-- Tabla central que almacena el estado integrado de todos los motores
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.plot_module_snapshot (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.platform_organizations(id),
  parcela_id uuid NOT NULL REFERENCES public.parcelas(id) ON DELETE CASCADE,
  ciclo text NOT NULL,                          -- '2025-2026'

  -- Nova Yield
  yield_expected numeric,                       -- qq/ha estimado
  yield_uncertainty numeric,                    -- ± error en qq
  yield_potential numeric,                      -- máximo bajo condiciones ideales
  yield_method text CHECK (yield_method IN ('conteo_frutos','historico','manual','modelo')),
  yield_date date,

  -- Nova Guard
  disease_pressure_index numeric CHECK (disease_pressure_index BETWEEN 0 AND 1),
  roya_incidence numeric CHECK (roya_incidence BETWEEN 0 AND 1),
  broca_incidence numeric CHECK (broca_incidence BETWEEN 0 AND 1),
  defoliation_level numeric CHECK (defoliation_level BETWEEN 0 AND 1),
  disease_factor numeric CHECK (disease_factor BETWEEN 0.5 AND 1.0),
  guard_assessment_date date,

  -- Nutrición
  nutrient_limitation_score numeric CHECK (nutrient_limitation_score BETWEEN 0 AND 1),
  limiting_nutrient text,                       -- 'N', 'K', 'P', etc.
  nutrient_factor numeric CHECK (nutrient_factor BETWEEN 0.5 AND 1.0),

  -- Protocolo VITAL
  resilience_index numeric CHECK (resilience_index BETWEEN 0 AND 1),
  soil_health_score numeric CHECK (soil_health_score BETWEEN 0 AND 1),
  water_stress_index numeric CHECK (water_stress_index BETWEEN 0 AND 1),
  water_factor numeric CHECK (water_factor BETWEEN 0.5 AND 1.0),

  -- Resultado calculado
  yield_adjusted numeric,                       -- yield × nutrient × disease × water
  yield_real numeric,                           -- cosecha real (post-ciclo)
  productivity_gap numeric,                     -- expected - real

  -- Meta
  computed_at timestamptz DEFAULT now(),
  computed_by uuid REFERENCES auth.users(id),
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(organization_id, parcela_id, ciclo, version)
);

ALTER TABLE public.plot_module_snapshot ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_plot_module_snapshot_org ON public.plot_module_snapshot(organization_id);
CREATE INDEX idx_plot_module_snapshot_parcela ON public.plot_module_snapshot(parcela_id);
CREATE INDEX idx_plot_module_snapshot_ciclo ON public.plot_module_snapshot(ciclo);

CREATE POLICY "plot_module_snapshot_select" ON public.plot_module_snapshot FOR SELECT TO authenticated
  USING (
    organization_id = public.get_user_organization_id(auth.uid())
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "plot_module_snapshot_insert" ON public.plot_module_snapshot FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.get_user_organization_id(auth.uid())
  );

CREATE POLICY "plot_module_snapshot_update" ON public.plot_module_snapshot FOR UPDATE TO authenticated
  USING (
    organization_id = public.get_user_organization_id(auth.uid())
    OR public.is_admin(auth.uid())
  );

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.plot_module_snapshot
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ────────────────────────────────────────────────────────────
-- PARTE 2: EVALUACIONES FITOSANITARIAS (Nova Guard)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.disease_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.platform_organizations(id),
  parcela_id uuid NOT NULL REFERENCES public.parcelas(id) ON DELETE CASCADE,
  ciclo text NOT NULL,
  evaluador_id uuid REFERENCES auth.users(id),
  fecha_evaluacion date NOT NULL,

  -- Componentes individuales (0-1)
  roya_incidence numeric NOT NULL DEFAULT 0 CHECK (roya_incidence BETWEEN 0 AND 1),
  broca_incidence numeric NOT NULL DEFAULT 0 CHECK (broca_incidence BETWEEN 0 AND 1),
  defoliation_level numeric NOT NULL DEFAULT 0 CHECK (defoliation_level BETWEEN 0 AND 1),
  stress_symptoms numeric NOT NULL DEFAULT 0 CHECK (stress_symptoms BETWEEN 0 AND 1),

  -- Pesos (parametrizables por org)
  w_roya numeric NOT NULL DEFAULT 0.4,
  w_broca numeric NOT NULL DEFAULT 0.3,
  w_defoliation numeric NOT NULL DEFAULT 0.2,
  w_stress numeric NOT NULL DEFAULT 0.1,

  -- Calculados
  disease_pressure_index numeric GENERATED ALWAYS AS (
    w_roya * roya_incidence + w_broca * broca_incidence +
    w_defoliation * defoliation_level + w_stress * stress_symptoms
  ) STORED,
  sensitivity numeric NOT NULL DEFAULT 0.6,
  disease_factor numeric,                       -- 1 - (pressure × sensitivity), calculado por trigger

  -- Clasificación
  pressure_level text GENERATED ALWAYS AS (
    CASE
      WHEN (w_roya * roya_incidence + w_broca * broca_incidence +
            w_defoliation * defoliation_level + w_stress * stress_symptoms) < 0.15 THEN 'baja'
      WHEN (w_roya * roya_incidence + w_broca * broca_incidence +
            w_defoliation * defoliation_level + w_stress * stress_symptoms) < 0.35 THEN 'moderada'
      WHEN (w_roya * roya_incidence + w_broca * broca_incidence +
            w_defoliation * defoliation_level + w_stress * stress_symptoms) < 0.6 THEN 'alta'
      ELSE 'severa'
    END
  ) STORED,

  notas text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.disease_assessments ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_disease_assessments_org ON public.disease_assessments(organization_id);
CREATE INDEX idx_disease_assessments_parcela ON public.disease_assessments(parcela_id, ciclo);

CREATE POLICY "disease_assessments_select" ON public.disease_assessments FOR SELECT TO authenticated
  USING (
    organization_id = public.get_user_organization_id(auth.uid())
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "disease_assessments_insert" ON public.disease_assessments FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.get_user_organization_id(auth.uid())
  );

-- Trigger para calcular disease_factor automáticamente
CREATE OR REPLACE FUNCTION public.calc_disease_factor()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.disease_factor := GREATEST(0.5, 1.0 - (
    NEW.w_roya * NEW.roya_incidence +
    NEW.w_broca * NEW.broca_incidence +
    NEW.w_defoliation * NEW.defoliation_level +
    NEW.w_stress * NEW.stress_symptoms
  ) * NEW.sensitivity);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_calc_disease_factor
  BEFORE INSERT OR UPDATE ON public.disease_assessments
  FOR EACH ROW EXECUTE FUNCTION public.calc_disease_factor();


-- ────────────────────────────────────────────────────────────
-- PARTE 3: EVALUACIONES DE RESILIENCIA (Protocolo VITAL)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.resilience_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.platform_organizations(id),
  parcela_id uuid NOT NULL REFERENCES public.parcelas(id) ON DELETE CASCADE,
  ciclo text NOT NULL,
  evaluador_id uuid REFERENCES auth.users(id),
  fecha_evaluacion date NOT NULL,

  -- Componentes (0-1)
  soil_health numeric NOT NULL DEFAULT 0.5 CHECK (soil_health BETWEEN 0 AND 1),
  organic_matter_score numeric NOT NULL DEFAULT 0.5 CHECK (organic_matter_score BETWEEN 0 AND 1),
  biodiversity numeric NOT NULL DEFAULT 0.5 CHECK (biodiversity BETWEEN 0 AND 1),
  water_management numeric NOT NULL DEFAULT 0.5 CHECK (water_management BETWEEN 0 AND 1),
  erosion_control numeric NOT NULL DEFAULT 0.5 CHECK (erosion_control BETWEEN 0 AND 1),
  shade_coverage numeric DEFAULT 0.5 CHECK (shade_coverage BETWEEN 0 AND 1),

  -- Pesos (parametrizables)
  w_soil numeric NOT NULL DEFAULT 0.25,
  w_organic numeric NOT NULL DEFAULT 0.20,
  w_biodiversity numeric NOT NULL DEFAULT 0.20,
  w_water numeric NOT NULL DEFAULT 0.20,
  w_erosion numeric NOT NULL DEFAULT 0.15,

  -- Calculado
  resilience_index numeric GENERATED ALWAYS AS (
    w_soil * soil_health + w_organic * organic_matter_score +
    w_biodiversity * biodiversity + w_water * water_management +
    w_erosion * erosion_control
  ) STORED,

  resilience_level text GENERATED ALWAYS AS (
    CASE
      WHEN (w_soil * soil_health + w_organic * organic_matter_score +
            w_biodiversity * biodiversity + w_water * water_management +
            w_erosion * erosion_control) < 0.3 THEN 'fragil'
      WHEN (w_soil * soil_health + w_organic * organic_matter_score +
            w_biodiversity * biodiversity + w_water * water_management +
            w_erosion * erosion_control) < 0.5 THEN 'baja'
      WHEN (w_soil * soil_health + w_organic * organic_matter_score +
            w_biodiversity * biodiversity + w_water * water_management +
            w_erosion * erosion_control) < 0.7 THEN 'moderada'
      ELSE 'alta'
    END
  ) STORED,

  notas text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.resilience_assessments ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_resilience_assessments_org ON public.resilience_assessments(organization_id);
CREATE INDEX idx_resilience_assessments_parcela ON public.resilience_assessments(parcela_id, ciclo);

CREATE POLICY "resilience_assessments_select" ON public.resilience_assessments FOR SELECT TO authenticated
  USING (
    organization_id = public.get_user_organization_id(auth.uid())
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "resilience_assessments_insert" ON public.resilience_assessments FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.get_user_organization_id(auth.uid())
  );


-- ────────────────────────────────────────────────────────────
-- PARTE 4: LOG DE APRENDIZAJE DEL SISTEMA
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.cycle_learning_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.platform_organizations(id),
  parcela_id uuid NOT NULL REFERENCES public.parcelas(id) ON DELETE CASCADE,
  ciclo text NOT NULL,

  -- Datos del ciclo
  yield_expected numeric,
  yield_real numeric,
  plan_nutricional_id uuid REFERENCES public.nutricion_planes(id),
  nutrient_factor numeric,
  disease_factor numeric,
  water_factor numeric,
  yield_adjusted numeric,
  productivity_gap numeric,

  -- Aprendizaje inferido
  inferred_limiting_factor text CHECK (inferred_limiting_factor IN (
    'nutricion','sanidad','hidrico','manejo','genetico','desconocido'
  )),
  confidence numeric CHECK (confidence BETWEEN 0 AND 1),
  learning_notes text,

  -- Cohorte (para agrupación)
  variedad text,
  altitud_rango text,              -- '0-1000', '1000-1400', '1400-1800', '>1800'
  textura_suelo text,

  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, parcela_id, ciclo)
);

ALTER TABLE public.cycle_learning_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_cycle_learning_org ON public.cycle_learning_log(organization_id);
CREATE INDEX idx_cycle_learning_parcela ON public.cycle_learning_log(parcela_id);

CREATE POLICY "cycle_learning_select" ON public.cycle_learning_log FOR SELECT TO authenticated
  USING (
    organization_id = public.get_user_organization_id(auth.uid())
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "cycle_learning_insert" ON public.cycle_learning_log FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.get_user_organization_id(auth.uid())
  );

CREATE POLICY "cycle_learning_update" ON public.cycle_learning_log FOR UPDATE TO authenticated
  USING (
    organization_id = public.get_user_organization_id(auth.uid())
    OR public.is_admin(auth.uid())
  );


-- ────────────────────────────────────────────────────────────
-- PARTE 5: RPCs DE CÁLCULO INTEGRADO
-- ────────────────────────────────────────────────────────────

-- 5.1 Calcular yield ajustado con todos los factores
CREATE OR REPLACE FUNCTION public.calc_yield_adjusted(
  _yield_estimated numeric,
  _nutrient_factor numeric DEFAULT 1.0,
  _disease_factor numeric DEFAULT 1.0,
  _water_factor numeric DEFAULT 1.0
)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT _yield_estimated
    * GREATEST(0.5, LEAST(1.0, _nutrient_factor))
    * GREATEST(0.5, LEAST(1.0, _disease_factor))
    * GREATEST(0.5, LEAST(1.0, _water_factor));
$$;

-- 5.2 Obtener el snapshot más reciente de una parcela/ciclo
CREATE OR REPLACE FUNCTION public.get_latest_snapshot(
  _parcela_id uuid,
  _ciclo text
)
RETURNS SETOF public.plot_module_snapshot
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.plot_module_snapshot
  WHERE parcela_id = _parcela_id
    AND ciclo = _ciclo
    AND organization_id = public.get_user_organization_id(auth.uid())
  ORDER BY version DESC
  LIMIT 1;
$$;

-- 5.3 Obtener la evaluación fitosanitaria más reciente
CREATE OR REPLACE FUNCTION public.get_latest_disease_assessment(
  _parcela_id uuid,
  _ciclo text
)
RETURNS SETOF public.disease_assessments
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.disease_assessments
  WHERE parcela_id = _parcela_id
    AND ciclo = _ciclo
    AND organization_id = public.get_user_organization_id(auth.uid())
  ORDER BY fecha_evaluacion DESC
  LIMIT 1;
$$;

-- 5.4 Obtener la evaluación de resiliencia más reciente
CREATE OR REPLACE FUNCTION public.get_latest_resilience_assessment(
  _parcela_id uuid,
  _ciclo text
)
RETURNS SETOF public.resilience_assessments
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.resilience_assessments
  WHERE parcela_id = _parcela_id
    AND ciclo = _ciclo
    AND organization_id = public.get_user_organization_id(auth.uid())
  ORDER BY fecha_evaluacion DESC
  LIMIT 1;
$$;

-- 5.5 Resumen de aprendizaje por cohorte
CREATE OR REPLACE FUNCTION public.get_cohort_learning(
  _org_id uuid,
  _variedad text DEFAULT NULL,
  _altitud_rango text DEFAULT NULL
)
RETURNS TABLE(
  variedad text,
  altitud_rango text,
  total_ciclos bigint,
  avg_productivity_gap numeric,
  avg_nutrient_factor numeric,
  avg_disease_factor numeric,
  dominant_limiting_factor text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    cl.variedad,
    cl.altitud_rango,
    COUNT(*) AS total_ciclos,
    AVG(cl.productivity_gap) AS avg_productivity_gap,
    AVG(cl.nutrient_factor) AS avg_nutrient_factor,
    AVG(cl.disease_factor) AS avg_disease_factor,
    MODE() WITHIN GROUP (ORDER BY cl.inferred_limiting_factor) AS dominant_limiting_factor
  FROM public.cycle_learning_log cl
  WHERE cl.organization_id = _org_id
    AND (_variedad IS NULL OR cl.variedad = _variedad)
    AND (_altitud_rango IS NULL OR cl.altitud_rango = _altitud_rango)
  GROUP BY cl.variedad, cl.altitud_rango;
$$;


-- ────────────────────────────────────────────────────────────
-- PARTE 6: VISTAS DE CONVENIENCIA
-- ────────────────────────────────────────────────────────────

-- Vista: Parcelas con riesgo productivo alto
CREATE OR REPLACE VIEW public.v_parcelas_riesgo_alto AS
SELECT
  s.organization_id,
  s.parcela_id,
  p.nombre AS parcela_nombre,
  s.ciclo,
  s.yield_expected,
  s.yield_adjusted,
  s.disease_pressure_index,
  s.nutrient_limitation_score,
  s.resilience_index,
  s.productivity_gap,
  CASE
    WHEN s.disease_pressure_index > 0.35 AND s.nutrient_limitation_score > 0.4 THEN 'doble_riesgo'
    WHEN s.disease_pressure_index > 0.35 THEN 'riesgo_sanitario'
    WHEN s.nutrient_limitation_score > 0.4 THEN 'riesgo_nutricional'
    WHEN s.resilience_index < 0.3 THEN 'sistema_fragil'
    ELSE 'monitorear'
  END AS tipo_riesgo
FROM public.plot_module_snapshot s
JOIN public.parcelas p ON p.id = s.parcela_id
WHERE s.version = (
  SELECT MAX(s2.version)
  FROM public.plot_module_snapshot s2
  WHERE s2.parcela_id = s.parcela_id AND s2.ciclo = s.ciclo
);


-- ────────────────────────────────────────────────────────────
-- SMOKE TESTS
-- ────────────────────────────────────────────────────────────

-- Verificar RLS habilitado
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('plot_module_snapshot','disease_assessments','resilience_assessments','cycle_learning_log');

-- Verificar políticas
SELECT tablename, policyname, cmd FROM pg_policies
WHERE tablename IN ('plot_module_snapshot','disease_assessments','resilience_assessments','cycle_learning_log');

-- Verificar índices
SELECT tablename, indexname FROM pg_indexes
WHERE tablename IN ('plot_module_snapshot','disease_assessments','resilience_assessments','cycle_learning_log')
  AND indexdef LIKE '%organization_id%';

-- Verificar funciones
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('calc_yield_adjusted','get_latest_snapshot','get_latest_disease_assessment','get_latest_resilience_assessment','get_cohort_learning','calc_disease_factor');
```

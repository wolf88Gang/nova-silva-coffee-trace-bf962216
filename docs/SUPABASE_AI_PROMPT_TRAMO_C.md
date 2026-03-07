# SUPABASE AI PROMPT — TRAMO C: Nutrición Avanzada + Heatmaps

> **Propósito**: Guía ejecutable para el agente Supabase AI. Contiene las migraciones, RPCs, vistas y seeds necesarios para implementar el módulo Nutrición v2 + Heatmaps dentro de Nova Silva.

> **Fecha**: 2026-03-07  
> **Prerequisito**: Tramos A y B completados (tablas `ag_nutrients`, `ag_fertilizers`, `ag_rulesets`, `nutricion_planes`, `plot_module_snapshot`, etc.)

---

## CONTEXTO: Tablas que YA existen (NO recrear)

### Catálogos Tramo A (existentes)
| Tabla | Estado |
|-------|--------|
| `ag_nutrients` | ✅ Existe con N, P, K, Ca, Mg, S, B, Zn, Cu, Mn, Fe |
| `ag_crop_nutrient_extraction` | ✅ Existe — mapea a `ag_ruleset_nutrient_extraction` del doc |
| `ag_nutrient_efficiency` | ✅ Existe — mapea a `ag_ruleset_efficiency_factors` del doc |
| `ag_fertilizers` | ✅ Existe con seed comercial y flag `activo` |
| `ag_rulesets` | ✅ Existe con CR_COFFEE_DEFAULT |
| `ag_altitude_coefficients` | ✅ Existe |
| `ag_age_coefficients` | ✅ Existe |

### Nutrición Operativa (existentes)
| Tabla | Estado |
|-------|--------|
| `nutricion_planes` | ✅ Existe con `idempotency_key` |
| `nutricion_aplicaciones` | ✅ Existe |
| `nutricion_fraccionamientos` | ✅ Existe |
| `nutricion_analisis_suelo` | ✅ Existe |
| `nutricion_analisis_foliar` | ✅ Existe |
| `nutricion_parcela_contexto` | ✅ Existe |

### Inter-modular Tramo B (existentes)
| Tabla | Estado |
|-------|--------|
| `plot_module_snapshot` | ✅ Existe |
| `disease_assessments` | ✅ Existe |
| `resilience_assessments` | ✅ Existe |
| `cycle_learning_log` | ✅ Existe |
| `harvest_results` | ✅ Existe |
| `yield_estimates` | ✅ Existe |
| `nutrition_outcomes` | ✅ Existe |
| `nutrition_adjustments` | ✅ Existe |

### Cumplimiento (existentes)
| Tabla | Estado |
|-------|--------|
| `org_certifications` | ✅ Existe con RPCs implícitas |
| `org_export_markets` | ✅ Existe con RPCs implícitas |
| `ag_ingredients_catalog` | ✅ Existe |

### Fase 3 Operativa (existentes)
| Tabla | Estado |
|-------|--------|
| `ag_sampling_protocol_logs` | ✅ Existe |
| `ag_support_tickets` | ✅ Existe |
| `ag_annual_review_reports` | ✅ Existe |
| `ag_engine_changelog` | ✅ Existe |

---

## ESTRATEGIA DE RECONCILIACIÓN

El Tramo C propone tablas con prefijo `ag_nut_*` que en algunos casos ya tienen equivalentes con prefijo `nutricion_*`. La estrategia es:

1. **NO duplicar** tablas que ya existen funcionales
2. **Crear tablas nuevas** solo para funcionalidad que NO existe aún
3. **Extender** tablas existentes con columnas faltantes cuando sea viable
4. **Crear vistas** que unifiquen nomenclatura si es necesario

### Mapa de reconciliación

| Propuesto en Tramo C | Existente | Acción |
|----------------------|-----------|--------|
| `ag_crops` | — | ✅ CREAR |
| `ag_crop_varieties` | — | ✅ CREAR |
| `ag_ruleset_sufficiency_thresholds` | — | ✅ CREAR |
| `ag_soil_analyses` | `nutricion_analisis_suelo` | ⚠️ EVALUAR extensión |
| `ag_plot_context_snapshots` | `nutricion_parcela_contexto` | ⚠️ EVALUAR extensión |
| `ag_nut_plans` | `nutricion_planes` | ⚠️ EXTENDER con columnas faltantes |
| `ag_nut_plan_nutrients` | — | ✅ CREAR |
| `ag_nut_plan_products` | — | ✅ CREAR |
| `ag_nut_schedule` | `nutricion_fraccionamientos` | ⚠️ EVALUAR extensión |
| `ag_nut_plan_financial_snapshots` | — | ✅ CREAR |
| `ag_nut_executions` | `nutricion_aplicaciones` | ⚠️ EVALUAR extensión |
| `ag_nut_execution_evidence` | — | ✅ CREAR |
| `ag_nut_adjustments` | `nutrition_adjustments` | ⚠️ Ya existe Tramo B |
| `ag_nut_plan_audit_events` | — | ✅ CREAR |
| `ag_nut_explain_steps` | — | ✅ CREAR |
| `ag_nut_outcomes` | `nutrition_outcomes` | ⚠️ Ya existe Tramo B |
| `ag_nut_pattern_training_queue` | — | ✅ CREAR |
| `ag_soil_sample_points` | — | ✅ CREAR (PostGIS) |
| `ag_heatmap_runs` | — | ✅ CREAR |
| `ag_management_zones` | — | ✅ CREAR |

---

## MIGRACIÓN 1: Enums nuevos

```sql
-- Solo crear si no existen
DO $$ BEGIN
  CREATE TYPE public.nutrition_calculation_mode AS ENUM (
    'full_evidence', 'assisted', 'heuristic', 'restricted'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.nutrition_plan_status AS ENUM (
    'generated', 'under_review', 'approved',
    'scheduled', 'in_execution', 'partially_executed',
    'executed', 'superseded', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.soil_analysis_quality_status AS ENUM (
    'pending_review', 'accepted', 'accepted_with_warnings',
    'rejected', 'heuristic_reference_only'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.nutrition_schedule_status AS ENUM (
    'planned', 'queued', 'in_progress',
    'completed', 'skipped', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.nutrition_execution_status AS ENUM (
    'completed', 'partial', 'failed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
```

---

## MIGRACIÓN 2: Catálogos nuevos (ag_crops, ag_crop_varieties)

```sql
-- 2.1 ag_crops
CREATE TABLE IF NOT EXISTS public.ag_crops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name_es text NOT NULL,
  name_en text,
  scientific_name text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ag_crops_code_upper_chk CHECK (code = upper(code))
);

-- 2.2 ag_crop_varieties
CREATE TABLE IF NOT EXISTS public.ag_crop_varieties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id uuid NOT NULL REFERENCES public.ag_crops(id),
  code text NOT NULL,
  name text NOT NULL,
  synonyms text[],
  genetic_group text,
  growth_vigor_score numeric(6,3),
  nutrition_coefficient numeric(8,4) NOT NULL DEFAULT 1,
  yield_response_profile text,
  disease_profile jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ag_crop_varieties_code_upper_chk CHECK (code = upper(code)),
  CONSTRAINT ag_crop_varieties_unique UNIQUE (crop_id, code)
);

CREATE INDEX IF NOT EXISTS ag_crop_varieties_crop_idx ON public.ag_crop_varieties (crop_id);

-- 2.3 ag_ruleset_sufficiency_thresholds
CREATE TABLE IF NOT EXISTS public.ag_ruleset_sufficiency_thresholds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ruleset_id uuid NOT NULL REFERENCES public.ag_rulesets(id) ON DELETE CASCADE,
  nutrient_id uuid NOT NULL REFERENCES public.ag_nutrients(id),
  soil_method text,
  soil_group text,
  min_critical_value numeric(14,6),
  target_low numeric(14,6),
  target_high numeric(14,6),
  max_reasonable_value numeric(14,6),
  unit text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ag_ruleset_sufficiency_thresholds_ruleset_idx
  ON public.ag_ruleset_sufficiency_thresholds (ruleset_id);
```

---

## MIGRACIÓN 3: Plan nutricional avanzado (tablas hijas)

Estas tablas complementan `nutricion_planes` existente con desglose por nutriente, producto, calendario y financiero.

```sql
-- 3.1 ag_nut_plan_nutrients (desglose por nutriente del plan)
CREATE TABLE IF NOT EXISTS public.ag_nut_plan_nutrients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  plan_id uuid NOT NULL REFERENCES public.nutricion_planes(id) ON DELETE CASCADE,
  nutrient_id uuid NOT NULL REFERENCES public.ag_nutrients(id),
  demand_kg_ha numeric(14,6),
  soil_supply_kg_ha numeric(14,6),
  organic_supply_kg_ha numeric(14,6),
  gross_required_kg_ha numeric(14,6),
  effective_efficiency numeric(8,4),
  loss_factor numeric(8,4),
  final_required_kg_ha numeric(14,6),
  sufficiency_index numeric(8,4),
  limitation_rank integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ag_nut_plan_nutrients_plan_idx
  ON public.ag_nut_plan_nutrients (plan_id);

-- 3.2 ag_nut_plan_products (productos recomendados)
CREATE TABLE IF NOT EXISTS public.ag_nut_plan_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  plan_id uuid NOT NULL REFERENCES public.nutricion_planes(id) ON DELETE CASCADE,
  fertilizer_id uuid REFERENCES public.ag_fertilizers(id),
  product_mode text NOT NULL,
  product_name_snapshot text NOT NULL,
  quantity_kg_ha numeric(14,6),
  quantity_total numeric(14,6),
  application_count integer,
  unit_cost numeric(14,4),
  estimated_total_cost numeric(14,4),
  nutrient_contribution_json jsonb NOT NULL,
  selection_priority integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ag_nut_plan_products_mode_chk CHECK (
    product_mode IN ('pure_nutrient', 'generic_formula', 'commercial_product')
  )
);

CREATE INDEX IF NOT EXISTS ag_nut_plan_products_plan_idx
  ON public.ag_nut_plan_products (plan_id);

-- 3.3 ag_nut_plan_financial_snapshots
CREATE TABLE IF NOT EXISTS public.ag_nut_plan_financial_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  plan_id uuid NOT NULL REFERENCES public.nutricion_planes(id) ON DELETE CASCADE,
  currency_code text NOT NULL,
  coffee_price_reference numeric(14,4),
  labor_cost_reference numeric(14,4),
  transport_cost_reference numeric(14,4),
  total_input_cost numeric(14,4),
  total_labor_cost numeric(14,4),
  total_logistics_cost numeric(14,4),
  expected_incremental_revenue numeric(14,4),
  roi_pct numeric(14,4),
  breakeven_yield_qq_ha numeric(12,4),
  snapshot_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ag_nut_plan_financial_plan_idx
  ON public.ag_nut_plan_financial_snapshots (plan_id);

-- 3.4 ag_nut_explain_steps (trazabilidad de decisiones del motor)
CREATE TABLE IF NOT EXISTS public.ag_nut_explain_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  plan_id uuid NOT NULL REFERENCES public.nutricion_planes(id) ON DELETE CASCADE,
  step_order integer NOT NULL,
  step_code text NOT NULL,
  step_title text NOT NULL,
  decision_text text NOT NULL,
  evidence_json jsonb,
  severity text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ag_nut_explain_steps_severity_chk CHECK (
    severity IS NULL OR severity IN ('low', 'medium', 'high', 'critical')
  ),
  CONSTRAINT ag_nut_explain_steps_unique UNIQUE (plan_id, step_order)
);

-- 3.5 ag_nut_plan_audit_events
CREATE TABLE IF NOT EXISTS public.ag_nut_plan_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  plan_id uuid NOT NULL REFERENCES public.nutricion_planes(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_payload jsonb NOT NULL,
  event_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id),
  CONSTRAINT ag_nut_plan_audit_events_type_chk CHECK (
    event_type IN ('generated', 'reviewed', 'approved', 'modified',
                   'superseded', 'cancelled', 'executed', 'outcome_recorded')
  )
);

CREATE INDEX IF NOT EXISTS ag_nut_plan_audit_plan_idx
  ON public.ag_nut_plan_audit_events (plan_id);
```

---

## MIGRACIÓN 4: Ejecución avanzada y evidencias

```sql
-- 4.1 ag_nut_execution_evidence
CREATE TABLE IF NOT EXISTS public.ag_nut_execution_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  execution_id uuid NOT NULL, -- FK a nutricion_aplicaciones.id
  evidence_type text NOT NULL,
  storage_path text NOT NULL,
  file_name text,
  file_size_bytes integer,
  mime_type text,
  geo_lat numeric(12,8),
  geo_lng numeric(12,8),
  captured_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id),
  CONSTRAINT ag_nut_execution_evidence_type_chk CHECK (
    evidence_type IN ('photo', 'document', 'gps_track', 'weather_log', 'other')
  )
);

CREATE INDEX IF NOT EXISTS ag_nut_execution_evidence_exec_idx
  ON public.ag_nut_execution_evidence (execution_id);
```

---

## MIGRACIÓN 5: Aprendizaje y training queue

```sql
-- 5.1 ag_nut_pattern_training_queue
CREATE TABLE IF NOT EXISTS public.ag_nut_pattern_training_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  source_outcome_id uuid NOT NULL REFERENCES public.nutrition_outcomes(id) ON DELETE CASCADE,
  training_status text NOT NULL DEFAULT 'pending',
  feature_snapshot_json jsonb NOT NULL,
  label_snapshot_json jsonb NOT NULL,
  eligible_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ag_nut_pattern_training_queue_status_chk CHECK (
    training_status IN ('pending', 'processed', 'rejected')
  )
);

CREATE INDEX IF NOT EXISTS ag_nut_pattern_training_org_idx
  ON public.ag_nut_pattern_training_queue (organization_id, training_status);
```

---

## MIGRACIÓN 6: Heatmaps y geoestadística

```sql
-- Requiere: CREATE EXTENSION IF NOT EXISTS postgis;

-- 6.1 ag_soil_sample_points (puntos georreferenciados de muestreo)
CREATE TABLE IF NOT EXISTS public.ag_soil_sample_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  plot_id uuid NOT NULL, -- FK a parcelas
  soil_analysis_id uuid, -- FK a nutricion_analisis_suelo si aplica
  sample_label text,
  sample_date date NOT NULL,
  depth_cm_from numeric(8,2),
  depth_cm_to numeric(8,2),
  geom geography(point, 4326), -- NULL si PostGIS no disponible
  lat numeric(12,8),
  lng numeric(12,8),
  raw_values_json jsonb NOT NULL,
  normalized_values_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id)
);

-- Índice espacial (solo si PostGIS activo)
-- CREATE INDEX IF NOT EXISTS ag_soil_sample_points_geom_gist_idx
--   ON public.ag_soil_sample_points USING gist (geom);

CREATE INDEX IF NOT EXISTS ag_soil_sample_points_org_plot_idx
  ON public.ag_soil_sample_points (organization_id, plot_id);

-- 6.2 ag_heatmap_runs
CREATE TABLE IF NOT EXISTS public.ag_heatmap_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  plot_id uuid NOT NULL,
  variable_code text NOT NULL,
  interpolation_method text NOT NULL,
  cell_size_m numeric(10,2),
  input_point_count integer NOT NULL,
  confidence_score numeric(6,3),
  grid_json jsonb,
  raster_path text,
  generated_at timestamptz NOT NULL DEFAULT now(),
  generated_by uuid REFERENCES public.profiles(id),
  CONSTRAINT ag_heatmap_runs_interpolation_chk CHECK (
    interpolation_method IN ('idw', 'kriging', 'spline')
  ),
  CONSTRAINT ag_heatmap_runs_conf_chk CHECK (
    confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)
  )
);

CREATE INDEX IF NOT EXISTS ag_heatmap_runs_org_plot_idx
  ON public.ag_heatmap_runs (organization_id, plot_id);

-- 6.3 ag_management_zones
CREATE TABLE IF NOT EXISTS public.ag_management_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  plot_id uuid NOT NULL,
  heatmap_run_id uuid REFERENCES public.ag_heatmap_runs(id) ON DELETE SET NULL,
  zone_code text NOT NULL,
  zone_label text,
  variable_code text,
  area_ha numeric(12,4),
  centroid_lat numeric(12,8),
  centroid_lng numeric(12,8),
  boundary_geojson jsonb,
  avg_value numeric(14,6),
  classification text,
  recommendation_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ag_management_zones_org_plot_idx
  ON public.ag_management_zones (organization_id, plot_id);
```

---

## MIGRACIÓN 7: RLS para todas las tablas nuevas

```sql
-- Habilitar RLS
ALTER TABLE public.ag_crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ag_crop_varieties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ag_ruleset_sufficiency_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ag_nut_plan_nutrients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ag_nut_plan_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ag_nut_plan_financial_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ag_nut_explain_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ag_nut_plan_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ag_nut_execution_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ag_nut_pattern_training_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ag_soil_sample_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ag_heatmap_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ag_management_zones ENABLE ROW LEVEL SECURITY;

-- Catálogos globales: lectura pública para authenticated
CREATE POLICY "ag_crops_select_all" ON public.ag_crops
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "ag_crop_varieties_select_all" ON public.ag_crop_varieties
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "ag_ruleset_sufficiency_select_all" ON public.ag_ruleset_sufficiency_thresholds
  FOR SELECT TO authenticated USING (true);

-- Tablas con organization_id: patrón estándar
-- Función reutilizable (ya debe existir):
-- public.get_user_organization_id(auth.uid())

-- Ejemplo para ag_nut_plan_nutrients (repetir para todas las tablas con organization_id):
CREATE POLICY "ag_nut_plan_nutrients_select"
  ON public.ag_nut_plan_nutrients FOR SELECT TO authenticated
  USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "ag_nut_plan_nutrients_insert"
  ON public.ag_nut_plan_nutrients FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

-- Repetir el mismo patrón para:
-- ag_nut_plan_products, ag_nut_plan_financial_snapshots, ag_nut_explain_steps,
-- ag_nut_plan_audit_events, ag_nut_execution_evidence, ag_nut_pattern_training_queue,
-- ag_soil_sample_points, ag_heatmap_runs, ag_management_zones
```

---

## MIGRACIÓN 8: Vistas y helpers

```sql
-- 8.1 Vista: último plan activo por parcela
CREATE OR REPLACE VIEW public.v_latest_active_nutrition_plan AS
SELECT DISTINCT ON (parcela_id)
  id, organization_id, parcela_id, estado, created_at
FROM public.nutricion_planes
WHERE estado IN ('aprobado', 'en_ejecucion', 'ejecutado')
ORDER BY parcela_id, created_at DESC;

-- 8.2 Función de idempotencia (ya existe parcialmente)
CREATE OR REPLACE FUNCTION public.get_existing_plan_by_idempotency(
  p_org_id uuid,
  p_key text
) RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.nutricion_planes
  WHERE organization_id = p_org_id AND idempotency_key = p_key
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_existing_plan_by_idempotency(uuid, text) TO authenticated;
```

---

## SEED: Costa Rica café (complemento)

```sql
-- Cultivo base
INSERT INTO public.ag_crops (code, name_es, scientific_name)
VALUES ('COFFEE_ARABICA', 'Café arábica', 'Coffea arabica')
ON CONFLICT (code) DO NOTHING;

-- Variedades mínimas CR
INSERT INTO public.ag_crop_varieties (crop_id, code, name, nutrition_coefficient)
SELECT c.id, v.code, v.name, v.coeff
FROM public.ag_crops c
CROSS JOIN (VALUES
  ('CATURRA', 'Caturra', 1.00::numeric),
  ('CATUAI', 'Catuaí', 1.03::numeric),
  ('SARCHIMOR', 'Sarchimor', 1.05::numeric),
  ('OBATA', 'Obatá', 1.04::numeric),
  ('GEISHA', 'Geisha', 0.92::numeric),
  ('VILLA_SARCHI', 'Villa Sarchí', 0.98::numeric)
) AS v(code, name, coeff)
WHERE c.code = 'COFFEE_ARABICA'
ON CONFLICT (crop_id, code) DO NOTHING;
```

---

## BUCKETS DE STORAGE

Crear estos buckets (si no existen):

| Bucket | Propósito |
|--------|-----------|
| `ag-soil-analysis-files` | PDFs de laboratorio |
| `ag-nut-execution-evidence` | Fotos y documentos de ejecución |
| `ag-heatmap-exports` | PNGs/GeoJSON de heatmaps generados |

Paths: `/org/{org_id}/plots/{plot_id}/...`

---

## EDGE FUNCTIONS A CREAR (prioridad)

| # | Función | Descripción |
|---|---------|-------------|
| 1 | `interpret_soil_analysis_v1` | Normaliza análisis, clasifica pH, CEC, Al, identifica alertas |
| 2 | `generate_nutrition_plan_v2` | ✅ Ya existe — EXTENDER con persist de plan_nutrients, products, explain_steps |
| 3 | `approve_nutrition_plan_v1` | Cambia estado, registra audit_event, genera schedule |
| 4 | `create_nutrition_tasks_v1` | Convierte schedule a jornales/field_tasks |
| 5 | `register_nutrition_execution_v1` | ✅ Ya existe como `log_nutrition_execution_v1` — EXTENDER |
| 6 | `evaluate_nutrition_outcome_v1` | Calcula scores de éxito agronómico/económico, alimenta training_queue |
| 7 | `generate_soil_heatmap_v1` | IDW interpolation sobre sample_points |

---

## REGLAS CRÍTICAS

1. **organization_id**: Todas las tablas nuevas DEBEN tener `organization_id uuid NOT NULL`
2. **RLS**: Todas con `get_user_organization_id(auth.uid())` — NO usar claims JWT
3. **Inmutabilidad**: Planes aprobados NO se actualizan — se superseden
4. **Idempotencia**: Siempre verificar `idempotency_key` antes de crear plan
5. **NO duplicar**: No recrear tablas que ya existen (ver mapa de reconciliación arriba)
6. **Prefijo**: Tablas nuevas usan `ag_nut_*` para planes y `ag_*` para catálogos/heatmaps

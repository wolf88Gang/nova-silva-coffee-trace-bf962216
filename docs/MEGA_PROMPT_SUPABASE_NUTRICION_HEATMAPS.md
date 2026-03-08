# Mega Prompt — Supabase — Nutrición + Heatmaps

> Usa este documento como guía de migraciones SQL para el módulo nutricional.
> Pega las secciones relevantes en Supabase SQL Editor según la migración que estés ejecutando.
> Última actualización: 2026-03-08

---

## 1. Contexto y reconciliación

### Tablas que YA EXISTEN — NO recrear

```
-- Catálogos científicos (globales, sin org_id)
ag_nutrients
ag_crops
ag_crop_varieties
ag_crop_nutrient_extraction
ag_nutrient_efficiency
ag_fertilizers
ag_rulesets
ag_ruleset_versions
ag_ruleset_sufficiency_thresholds
ag_altitude_coefficients
ag_age_coefficients
ag_reglas_suelo

-- Planes y ejecución (con organization_id)
nutricion_planes              -- Tabla principal, con idempotency_key y plan_json
nutricion_aplicaciones         -- Registro de aplicaciones (legacy)
nutricion_fraccionamientos
nutricion_analisis_suelo
nutricion_analisis_foliar
nutricion_parcela_contexto

-- Tablas hijas del plan (Tramo C)
ag_nut_plan_nutrients
ag_nut_plan_products
ag_nut_plan_financial_snapshots
ag_nut_explain_steps
ag_nut_executions
ag_nut_execution_evidence
ag_nut_adjustments

-- Transaccionales inter-modulares
harvest_results
yield_estimates
nutrition_outcomes
nutrition_adjustments
plot_module_snapshot
disease_assessments
resilience_assessments
cycle_learning_log

-- PostGIS / Heatmaps
ag_soil_sample_points
ag_heatmap_runs
ag_management_zones

-- Vista
v_nutricion_aplicaciones_min
```

### Helpers RLS que YA EXISTEN — NO recrear

```
get_user_organization_id(uuid) → uuid
is_admin(uuid) → boolean
is_org_admin(uuid) → boolean  -- tiene variantes con y sin segundo argumento
update_updated_at_column() → trigger function
```

### Mapeo de nombres reales

| Concepto Notion | Tabla real en DB | Nota |
|----------------|-----------------|------|
| `ag_nut_plans` | `nutricion_planes` | Tabla principal de planes. Usa esta. |
| `plots` | `parcelas` | Legacy. Usa `cooperativa_id` como tenant. |
| `ag_soil_analyses` | `nutricion_analisis_suelo` | Ya existe. No crear paralela. |
| `ag_nut_executions` | Ya existe con ese nombre | Complementa `nutricion_aplicaciones`. |
| `ag_harvest_results` | `harvest_results` | Sin prefijo `ag_`. |
| `ag_yield_estimates` | `yield_estimates` | Sin prefijo `ag_`. |

---

## 2. Migraciones en orden correcto

### Migración 1 — Columnas faltantes en `nutricion_planes`

**Propósito**: Completar la máquina de estados y versionado del plan.

```sql
-- ============================================================
-- MIGRACIÓN 1: Columnas faltantes en nutricion_planes
-- Verificar antes de ejecutar si ya existen
-- ============================================================

DO $$
BEGIN
  -- Status enum completo
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='nutricion_planes' AND column_name='status') THEN
    ALTER TABLE public.nutricion_planes
      ADD COLUMN status text NOT NULL DEFAULT 'generated'
      CHECK (status IN ('generated','under_review','approved','scheduled',
                        'in_execution','partially_executed','executed',
                        'evaluated','superseded','cancelled'));
  END IF;

  -- Aprobación
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='nutricion_planes' AND column_name='approved_at') THEN
    ALTER TABLE public.nutricion_planes ADD COLUMN approved_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='nutricion_planes' AND column_name='approved_by') THEN
    ALTER TABLE public.nutricion_planes ADD COLUMN approved_by uuid REFERENCES auth.users(id);
  END IF;

  -- Versionado de planes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='nutricion_planes' AND column_name='superseded_by_plan_id') THEN
    ALTER TABLE public.nutricion_planes ADD COLUMN superseded_by_plan_id uuid REFERENCES public.nutricion_planes(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='nutricion_planes' AND column_name='parent_plan_id') THEN
    ALTER TABLE public.nutricion_planes ADD COLUMN parent_plan_id uuid REFERENCES public.nutricion_planes(id);
  END IF;

  -- Confidence
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='nutricion_planes' AND column_name='confidence_score') THEN
    ALTER TABLE public.nutricion_planes ADD COLUMN confidence_score numeric(6,3)
      CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='nutricion_planes' AND column_name='confidence_band') THEN
    ALTER TABLE public.nutricion_planes ADD COLUMN confidence_band text
      CHECK (confidence_band IS NULL OR confidence_band IN ('very_high','high','medium','low','very_low'));
  END IF;

  RAISE NOTICE '✅ Migración 1 completada: columnas de nutricion_planes verificadas';
END;
$$;
```

---

### Migración 2 — Tabla `ag_nut_schedule` (calendario de aplicaciones)

**Propósito**: Puente entre plan aprobado y ejecución de campo.

```sql
-- ============================================================
-- MIGRACIÓN 2: ag_nut_schedule — Calendario de aplicaciones
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ag_nut_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.platform_organizations(id),
  plan_id uuid NOT NULL REFERENCES public.nutricion_planes(id) ON DELETE CASCADE,
  sequence_no integer NOT NULL,
  window_code text NOT NULL,
  target_date date,
  target_start_date date,
  target_end_date date,
  status text NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned','queued','in_progress','completed','skipped','cancelled')),
  application_goal text,
  products_json jsonb NOT NULL DEFAULT '[]',
  nutrients_json jsonb,
  labor_days_estimate numeric(12,4),
  labor_hours_estimate numeric(12,4),
  priority_score numeric(8,4),
  weather_sensitivity text,
  notes text,
  journal_task_id uuid,  -- Enlace futuro a módulo de jornales
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_ag_nut_schedule_org ON public.ag_nut_schedule(organization_id);
CREATE INDEX IF NOT EXISTS idx_ag_nut_schedule_plan ON public.ag_nut_schedule(plan_id);
CREATE INDEX IF NOT EXISTS idx_ag_nut_schedule_status ON public.ag_nut_schedule(organization_id, status, target_date);

ALTER TABLE public.ag_nut_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ag_nut_schedule_select" ON public.ag_nut_schedule FOR SELECT TO authenticated
  USING (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin(auth.uid()));

CREATE POLICY "ag_nut_schedule_insert" ON public.ag_nut_schedule FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "ag_nut_schedule_update" ON public.ag_nut_schedule FOR UPDATE TO authenticated
  USING (organization_id = public.get_user_organization_id(auth.uid()));

RAISE NOTICE '✅ Migración 2 completada: ag_nut_schedule creada';
```

---

### Migración 3 — Tabla `ag_nut_plan_audit_events` (bitácora de auditoría)

**Propósito**: Registrar toda transición de estado y evento relevante del plan.

```sql
-- ============================================================
-- MIGRACIÓN 3: ag_nut_plan_audit_events — Bitácora de auditoría
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ag_nut_plan_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.platform_organizations(id),
  plan_id uuid NOT NULL REFERENCES public.nutricion_planes(id) ON DELETE CASCADE,
  event_type text NOT NULL
    CHECK (event_type IN ('generated','reviewed','approved','adjusted',
                          'scheduled','executed','evaluated','superseded',
                          'cancelled','comment')),
  event_payload jsonb NOT NULL DEFAULT '{}',
  event_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_audit_events_plan ON public.ag_nut_plan_audit_events(plan_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_org ON public.ag_nut_plan_audit_events(organization_id);

ALTER TABLE public.ag_nut_plan_audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_events_select" ON public.ag_nut_plan_audit_events FOR SELECT TO authenticated
  USING (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin(auth.uid()));

CREATE POLICY "audit_events_insert" ON public.ag_nut_plan_audit_events FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

RAISE NOTICE '✅ Migración 3 completada: ag_nut_plan_audit_events creada';
```

---

### Migración 4 — RPCs para aprobación y supersedencia

**Propósito**: Funciones atómicas para transiciones de estado del plan.

```sql
-- ============================================================
-- MIGRACIÓN 4: RPCs de transición de estado
-- ============================================================

-- 4.1 Aprobar plan nutricional
CREATE OR REPLACE FUNCTION public.approve_nutrition_plan(
  _plan_id uuid,
  _user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _plan record;
  _org_id uuid;
BEGIN
  -- Verificar plan existe
  SELECT id, organization_id, status INTO _plan
  FROM public.nutricion_planes
  WHERE id = _plan_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Plan not found');
  END IF;

  -- Verificar pertenencia a org
  _org_id := public.get_user_organization_id(_user_id);
  IF _plan.organization_id != _org_id AND NOT public.is_admin(_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Access denied');
  END IF;

  -- Verificar estado válido para aprobación
  IF _plan.status NOT IN ('generated', 'under_review') THEN
    RETURN jsonb_build_object('success', false, 'error',
      format('Cannot approve plan in status: %s', _plan.status));
  END IF;

  -- Actualizar plan
  UPDATE public.nutricion_planes
  SET status = 'approved',
      approved_at = now(),
      approved_by = _user_id
  WHERE id = _plan_id;

  -- Registrar evento de auditoría
  INSERT INTO public.ag_nut_plan_audit_events
    (organization_id, plan_id, event_type, event_payload, created_by)
  VALUES
    (_plan.organization_id, _plan_id, 'approved',
     jsonb_build_object('previous_status', _plan.status, 'approved_by', _user_id),
     _user_id);

  RETURN jsonb_build_object('success', true, 'plan_id', _plan_id, 'status', 'approved');
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_nutrition_plan(uuid, uuid) TO authenticated;

-- 4.2 Reemplazar plan (supersede)
CREATE OR REPLACE FUNCTION public.supersede_nutrition_plan(
  _old_plan_id uuid,
  _new_plan_id uuid,
  _user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _old_plan record;
  _org_id uuid;
BEGIN
  SELECT id, organization_id, status INTO _old_plan
  FROM public.nutricion_planes
  WHERE id = _old_plan_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Old plan not found');
  END IF;

  _org_id := public.get_user_organization_id(_user_id);
  IF _old_plan.organization_id != _org_id AND NOT public.is_admin(_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Access denied');
  END IF;

  -- Marcar plan viejo como superseded
  UPDATE public.nutricion_planes
  SET status = 'superseded',
      superseded_by_plan_id = _new_plan_id
  WHERE id = _old_plan_id;

  -- Marcar plan nuevo con parent
  UPDATE public.nutricion_planes
  SET parent_plan_id = _old_plan_id
  WHERE id = _new_plan_id;

  -- Auditoría
  INSERT INTO public.ag_nut_plan_audit_events
    (organization_id, plan_id, event_type, event_payload, created_by)
  VALUES
    (_old_plan.organization_id, _old_plan_id, 'superseded',
     jsonb_build_object('superseded_by', _new_plan_id),
     _user_id);

  RETURN jsonb_build_object('success', true, 'old_plan_id', _old_plan_id, 'new_plan_id', _new_plan_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.supersede_nutrition_plan(uuid, uuid, uuid) TO authenticated;

-- Verificación
DO $$
BEGIN
  RAISE NOTICE '✅ Migración 4 completada: RPCs approve_nutrition_plan y supersede_nutrition_plan creadas';
END;
$$;
```

---

### Migración 5 — Vistas helper

**Propósito**: Vistas de consulta frecuente para frontend y dashboards.

```sql
-- ============================================================
-- MIGRACIÓN 5: Vistas helper
-- ============================================================

-- 5.1 Resumen de estado de planes por parcela
CREATE OR REPLACE VIEW public.v_plan_status_summary AS
SELECT
  np.id AS plan_id,
  np.organization_id,
  np.parcela_id,
  p.nombre AS parcela_nombre,
  np.status,
  np.confidence_score,
  np.confidence_band,
  np.created_at,
  np.approved_at,
  np.approved_by,
  (np.plan_json->>'nutriente_limitante')::jsonb->>'code' AS nutriente_limitante,
  (np.plan_json->'economia'->>'costo_total_usd')::numeric AS costo_estimado,
  (np.plan_json->'economia'->>'roi_estimado')::numeric AS roi_estimado,
  np.engine_version,
  np.hash_receta
FROM public.nutricion_planes np
LEFT JOIN public.parcelas p ON p.id = np.parcela_id
WHERE np.status != 'superseded'
ORDER BY np.created_at DESC;

-- 5.2 Aplicaciones pendientes
CREATE OR REPLACE VIEW public.v_pending_applications AS
SELECT
  s.id AS schedule_id,
  s.organization_id,
  s.plan_id,
  np.parcela_id,
  p.nombre AS parcela_nombre,
  s.sequence_no,
  s.window_code,
  s.target_date,
  s.status AS schedule_status,
  s.products_json,
  s.labor_days_estimate,
  s.priority_score
FROM public.ag_nut_schedule s
JOIN public.nutricion_planes np ON np.id = s.plan_id
LEFT JOIN public.parcelas p ON p.id = np.parcela_id
WHERE s.status IN ('planned', 'queued')
  AND np.status IN ('approved', 'scheduled', 'in_execution')
ORDER BY s.target_date ASC NULLS LAST;

-- 5.3 Completitud de ejecución por plan
CREATE OR REPLACE VIEW public.v_execution_completeness AS
SELECT
  np.id AS plan_id,
  np.organization_id,
  np.parcela_id,
  np.status,
  COUNT(s.id) AS total_scheduled,
  COUNT(s.id) FILTER (WHERE s.status = 'completed') AS total_completed,
  CASE
    WHEN COUNT(s.id) = 0 THEN 0
    ELSE ROUND(COUNT(s.id) FILTER (WHERE s.status = 'completed')::numeric / COUNT(s.id) * 100, 1)
  END AS completion_pct
FROM public.nutricion_planes np
LEFT JOIN public.ag_nut_schedule s ON s.plan_id = np.id
WHERE np.status NOT IN ('superseded', 'cancelled')
GROUP BY np.id, np.organization_id, np.parcela_id, np.status;

DO $$
BEGIN
  RAISE NOTICE '✅ Migración 5 completada: Vistas v_plan_status_summary, v_pending_applications, v_execution_completeness creadas';
END;
$$;
```

---

### Migración 6 — RPC de detalle completo del plan

**Propósito**: Endpoint unificado para que el frontend cargue toda la información de un plan.

```sql
-- ============================================================
-- MIGRACIÓN 6: RPC get_plan_detail
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_plan_detail(_plan_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _plan record;
  _nutrients jsonb;
  _products jsonb;
  _explain jsonb;
  _schedule jsonb;
  _financial jsonb;
  _adjustments jsonb;
  _audit jsonb;
  _org_id uuid;
BEGIN
  _org_id := public.get_user_organization_id(auth.uid());

  SELECT * INTO _plan FROM public.nutricion_planes WHERE id = _plan_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Plan not found');
  END IF;

  IF _plan.organization_id != _org_id AND NOT public.is_admin(auth.uid()) THEN
    RETURN jsonb_build_object('error', 'Access denied');
  END IF;

  -- Nutrients
  SELECT COALESCE(jsonb_agg(row_to_json(n)::jsonb ORDER BY n.created_at), '[]'::jsonb)
  INTO _nutrients
  FROM public.ag_nut_plan_nutrients n WHERE n.plan_id = _plan_id;

  -- Products
  SELECT COALESCE(jsonb_agg(row_to_json(p)::jsonb), '[]'::jsonb)
  INTO _products
  FROM public.ag_nut_plan_products p WHERE p.plan_id = _plan_id;

  -- Explain steps
  SELECT COALESCE(jsonb_agg(row_to_json(e)::jsonb ORDER BY e.step_order), '[]'::jsonb)
  INTO _explain
  FROM public.ag_nut_explain_steps e WHERE e.plan_id = _plan_id;

  -- Schedule
  SELECT COALESCE(jsonb_agg(row_to_json(s)::jsonb ORDER BY s.sequence_no), '[]'::jsonb)
  INTO _schedule
  FROM public.ag_nut_schedule s WHERE s.plan_id = _plan_id;

  -- Financial snapshot
  SELECT COALESCE(row_to_json(f)::jsonb, '{}'::jsonb)
  INTO _financial
  FROM public.ag_nut_plan_financial_snapshots f WHERE f.plan_id = _plan_id LIMIT 1;

  -- Adjustments
  SELECT COALESCE(jsonb_agg(row_to_json(a)::jsonb ORDER BY a.created_at), '[]'::jsonb)
  INTO _adjustments
  FROM public.ag_nut_adjustments a WHERE a.plan_id = _plan_id;

  -- Audit events
  SELECT COALESCE(jsonb_agg(row_to_json(au)::jsonb ORDER BY au.created_at), '[]'::jsonb)
  INTO _audit
  FROM public.ag_nut_plan_audit_events au WHERE au.plan_id = _plan_id;

  RETURN jsonb_build_object(
    'plan', row_to_json(_plan)::jsonb,
    'nutrients', _nutrients,
    'products', _products,
    'explain_steps', _explain,
    'schedule', _schedule,
    'financial', _financial,
    'adjustments', _adjustments,
    'audit_events', _audit
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_plan_detail(uuid) TO authenticated;

DO $$
BEGIN
  RAISE NOTICE '✅ Migración 6 completada: RPC get_plan_detail creada';
END;
$$;
```

---

### Migración 7 — Seeds mínimos para café Costa Rica

**Propósito**: Verificar que los catálogos base están poblados.

```sql
-- ============================================================
-- MIGRACIÓN 7: Verificación y seeds mínimos
-- Solo inserta si no existen (ON CONFLICT DO NOTHING)
-- ============================================================

-- 7.1 Verificar ag_nutrients
INSERT INTO public.ag_nutrients (code, nombre, tipo) VALUES
  ('N',  'Nitrógeno',  'macronutriente_primario'),
  ('P',  'Fósforo',    'macronutriente_primario'),
  ('K',  'Potasio',    'macronutriente_primario'),
  ('Ca', 'Calcio',     'macronutriente_secundario'),
  ('Mg', 'Magnesio',   'macronutriente_secundario'),
  ('S',  'Azufre',     'macronutriente_secundario'),
  ('B',  'Boro',       'micronutriente'),
  ('Zn', 'Zinc',       'micronutriente'),
  ('Cu', 'Cobre',      'micronutriente'),
  ('Fe', 'Hierro',     'micronutriente'),
  ('Mn', 'Manganeso',  'micronutriente'),
  ('Mo', 'Molibdeno',  'micronutriente')
ON CONFLICT (code) DO NOTHING;

-- 7.2 Verificar extracciones por ton (CENICAFE)
INSERT INTO public.ag_crop_nutrient_extraction (cultivo, nutrient_code, extraccion_kg_por_ton_min, extraccion_kg_por_ton_max, extraccion_kg_por_ton_default, fuente) VALUES
  ('cafe', 'N',  40, 50, 45, 'Sadeghian 2008; CENICAFE'),
  ('cafe', 'P',  5,  7,  6,  'Sadeghian 2008'),
  ('cafe', 'K',  45, 60, 52, 'Sadeghian 2008; CENICAFE'),
  ('cafe', 'Ca', 10, 15, 12, 'CENICAFE'),
  ('cafe', 'Mg', 5,  8,  6,  'CENICAFE'),
  ('cafe', 'S',  3,  5,  4,  'CENICAFE')
ON CONFLICT (cultivo, nutrient_code) DO NOTHING;

-- 7.3 Verificar eficiencias
INSERT INTO public.ag_nutrient_efficiency (nutrient_code, eficiencia_absorcion, contexto) VALUES
  ('N',  0.50, 'default'),
  ('P',  0.30, 'default'),
  ('K',  0.60, 'default'),
  ('Ca', 0.70, 'default'),
  ('Mg', 0.65, 'default'),
  ('S',  0.50, 'default')
ON CONFLICT (nutrient_code, contexto) DO NOTHING;

-- 7.4 Verificar coeficientes altitudinales
INSERT INTO public.ag_altitude_coefficients (altitud_min, altitud_max, coeficiente, descripcion) VALUES
  (0,    1199, 1.10, 'Baja altitud: metabolismo rápido'),
  (1200, 1500, 1.00, 'Altitud media: referencia base'),
  (1501, 3000, 0.90, 'Alta altitud: metabolismo lento')
ON CONFLICT DO NOTHING;

-- 7.5 Verificar coeficientes edad
INSERT INTO public.ag_age_coefficients (edad_min, edad_max, coeficiente, descripcion) VALUES
  (0, 2,  0.60, 'Establecimiento'),
  (3, 6,  1.00, 'Producción plena'),
  (7, 10, 0.90, 'Madurez'),
  (11, 99, 0.75, 'Declive')
ON CONFLICT DO NOTHING;

-- 7.6 Verificar fertilizantes
INSERT INTO public.ag_fertilizers (nombre, tipo, pct_n, pct_p, pct_k) VALUES
  ('Urea 46-0-0',          'granular', 46, 0,  0),
  ('DAP 18-46-0',          'granular', 18, 46, 0),
  ('KCl 0-0-60',           'granular', 0,  0,  60),
  ('NPK 10-30-10',         'granular', 10, 30, 10),
  ('NPK 17-6-18-2',        'granular', 17, 6,  18),
  ('Sulfato de Amonio',    'granular', 21, 0,  0),
  ('Triple Superfosfato',  'granular', 0,  46, 0),
  ('Nitrato de Potasio',   'soluble',  13, 0,  44)
ON CONFLICT DO NOTHING;

-- 7.7 Verificar ruleset Costa Rica
INSERT INTO public.ag_rulesets (region, pais, version, max_n_kg_ha, max_p_kg_ha, descripcion) VALUES
  ('Central', 'Costa Rica', 1, 250, 80, 'Regla base Costa Rica — Zona Central cafetalera')
ON CONFLICT (region, pais, version) DO NOTHING;

-- 7.8 Conteos de verificación
SELECT 'ag_nutrients' AS tabla, count(*) FROM public.ag_nutrients
UNION ALL SELECT 'ag_crop_nutrient_extraction', count(*) FROM public.ag_crop_nutrient_extraction
UNION ALL SELECT 'ag_nutrient_efficiency', count(*) FROM public.ag_nutrient_efficiency
UNION ALL SELECT 'ag_fertilizers', count(*) FROM public.ag_fertilizers
UNION ALL SELECT 'ag_altitude_coefficients', count(*) FROM public.ag_altitude_coefficients
UNION ALL SELECT 'ag_age_coefficients', count(*) FROM public.ag_age_coefficients
UNION ALL SELECT 'ag_rulesets', count(*) FROM public.ag_rulesets;
```

---

## 3. Qué NO debe duplicarse

| Concepto | Tabla existente | NO crear |
|----------|----------------|----------|
| Planes nutricionales | `nutricion_planes` | No crear `ag_nut_plans` |
| Análisis de suelo | `nutricion_analisis_suelo` | No crear `ag_soil_analyses` |
| Parcelas | `parcelas` | No crear `plots` |
| Productores | `productores` | No crear `producers` |
| Organizaciones | `platform_organizations` | No crear `organizations` |
| Cosecha | `harvest_results` | No crear `ag_harvest_results` |
| Yield estimados | `yield_estimates` | No crear `ag_yield_estimates` |
| Aplicaciones | `nutricion_aplicaciones` + `ag_nut_executions` | No crear otra tabla de ejecución |

---

## 4. Qué NO debe meterse como lógica opaca en triggers

1. **Cálculos agronómicos**: NO calcular demanda nutricional en triggers. Eso va en Edge Functions.
2. **Transiciones de estado complejas**: NO hacer la máquina de estados en triggers. Usar RPCs explícitas.
3. **Hash de planes**: NO generar SHA-256 en triggers. El hash lo calcula la Edge Function.
4. **Notificaciones**: NO enviar notificaciones desde triggers DB. Usar Edge Functions o webhooks.
5. **Validación de negocio compleja**: NO validar reglas agronómicas en triggers.

**Triggers SÍ aceptables**:
- `updated_at` automático (`update_updated_at_column()`)
- Registro simple de evento en tabla de auditoría
- Sincronización de status entre tablas relacionadas (ej: al completar todas las schedule → marcar plan como executed)

---

## 5. Verificación final

```sql
-- Ejecutar después de todas las migraciones
DO $$
DECLARE
  _tbl text;
  _tables text[] := ARRAY[
    'nutricion_planes', 'ag_nut_plan_nutrients', 'ag_nut_plan_products',
    'ag_nut_plan_financial_snapshots', 'ag_nut_explain_steps',
    'ag_nut_schedule', 'ag_nut_plan_audit_events',
    'ag_nut_executions', 'ag_nut_execution_evidence', 'ag_nut_adjustments',
    'ag_nutrients', 'ag_crop_nutrient_extraction', 'ag_nutrient_efficiency',
    'ag_fertilizers', 'ag_rulesets', 'ag_altitude_coefficients', 'ag_age_coefficients'
  ];
BEGIN
  FOREACH _tbl IN ARRAY _tables LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename=_tbl) THEN
      RAISE WARNING '⚠️ Tabla % NO encontrada', _tbl;
    ELSE
      RAISE NOTICE '✅ %', _tbl;
    END IF;
  END LOOP;

  -- Verificar RLS
  FOREACH _tbl IN ARRAY _tables LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename=_tbl) THEN
      IF NOT (SELECT rowsecurity FROM pg_tables WHERE schemaname='public' AND tablename=_tbl) THEN
        RAISE WARNING '⚠️ RLS deshabilitado en %', _tbl;
      END IF;
    END IF;
  END LOOP;

  -- Verificar funciones
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname='approve_nutrition_plan') THEN
    RAISE NOTICE '✅ approve_nutrition_plan';
  ELSE
    RAISE WARNING '⚠️ approve_nutrition_plan NO encontrada';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname='supersede_nutrition_plan') THEN
    RAISE NOTICE '✅ supersede_nutrition_plan';
  ELSE
    RAISE WARNING '⚠️ supersede_nutrition_plan NO encontrada';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname='get_plan_detail') THEN
    RAISE NOTICE '✅ get_plan_detail';
  ELSE
    RAISE WARNING '⚠️ get_plan_detail NO encontrada';
  END IF;

  RAISE NOTICE '🎉 Verificación del módulo nutricional completada';
END;
$$;
```

---

## 6. Resumen de migraciones

| # | Nombre | Tipo | Dependencia |
|---|--------|------|-------------|
| 1 | Columnas faltantes `nutricion_planes` | ALTER TABLE | Ninguna |
| 2 | `ag_nut_schedule` | CREATE TABLE | Migración 1 |
| 3 | `ag_nut_plan_audit_events` | CREATE TABLE | Migración 1 |
| 4 | RPCs aprobación/supersedencia | CREATE FUNCTION | Migraciones 1, 3 |
| 5 | Vistas helper | CREATE VIEW | Migraciones 1, 2 |
| 6 | RPC `get_plan_detail` | CREATE FUNCTION | Todas las anteriores |
| 7 | Seeds verificación | INSERT | Tablas de catálogo existentes |

**Ejecutar en orden numérico. No saltar migraciones.**

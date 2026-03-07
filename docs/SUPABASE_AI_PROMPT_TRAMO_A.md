# Prompt para Supabase AI — Motor Nutricional Tramo A

> **Copia y pega este texto completo en el Supabase SQL Editor** y ejecútalo.
> Requiere: Fase 1 y Fase 2 de nutrición ya ejecutadas.
> Última actualización: 2026-03-07

---

Eres un asistente SQL para **Nova Silva**. Este script crea las tablas de catálogos científicos, datos de parcela extendidos, resultados productivos y aprendizaje del motor nutricional Tramo A.

## Reglas

1. Multi-tenant: `organization_id uuid NOT NULL` en toda tabla transaccional.
2. Catálogos globales (ag_*): sin `organization_id`, visibles para todos.
3. RLS activo en todas las tablas.
4. Funciones helper existentes: `get_user_organization_id()`, `is_admin()`, `is_org_admin()`.

---

```sql
-- ============================================================
-- MOTOR NUTRICIONAL TRAMO A — CATÁLOGOS Y TABLAS DE DATOS
-- Ejecutar de una sola vez en SQL Editor de Supabase
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- PARTE 1: CATÁLOGOS CIENTÍFICOS (globales, sin org_id)
-- ────────────────────────────────────────────────────────────

-- 1.1 ag_nutrients — Lista de nutrientes del sistema
CREATE TABLE IF NOT EXISTS public.ag_nutrients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,           -- N, P, K, Ca, Mg, S, B, Zn, Cu, Fe, Mn, Mo, Cl, Ni
  nombre text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('macronutriente_primario','macronutriente_secundario','micronutriente')),
  unidad text NOT NULL DEFAULT 'kg/ha',
  descripcion text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ag_nutrients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ag_nutrients_select" ON public.ag_nutrients FOR SELECT TO authenticated
  USING (true);

-- Seed datos iniciales
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

-- 1.2 ag_crop_nutrient_extraction — Extracción por tonelada de café pergamino
CREATE TABLE IF NOT EXISTS public.ag_crop_nutrient_extraction (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cultivo text NOT NULL DEFAULT 'cafe',
  nutrient_code text NOT NULL REFERENCES public.ag_nutrients(code),
  extraccion_kg_por_ton_min numeric NOT NULL,  -- ej: 40 para N
  extraccion_kg_por_ton_max numeric NOT NULL,  -- ej: 50 para N
  extraccion_kg_por_ton_default numeric NOT NULL, -- ej: 45 para N
  fuente text,                                  -- referencia bibliográfica
  version integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  UNIQUE(cultivo, nutrient_code)
);

ALTER TABLE public.ag_crop_nutrient_extraction ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ag_crop_extraction_select" ON public.ag_crop_nutrient_extraction FOR SELECT TO authenticated
  USING (true);

-- Seed: Extracciones promedio café pergamino seco (kg/tonelada)
INSERT INTO public.ag_crop_nutrient_extraction (cultivo, nutrient_code, extraccion_kg_por_ton_min, extraccion_kg_por_ton_max, extraccion_kg_por_ton_default, fuente) VALUES
  ('cafe', 'N',  40, 50, 45, 'Sadeghian 2008; CENICAFE'),
  ('cafe', 'P',  5,  7,  6,  'Sadeghian 2008'),
  ('cafe', 'K',  45, 60, 52, 'Sadeghian 2008; CENICAFE'),
  ('cafe', 'Ca', 10, 15, 12, 'CENICAFE'),
  ('cafe', 'Mg', 5,  8,  6,  'CENICAFE'),
  ('cafe', 'S',  3,  5,  4,  'CENICAFE')
ON CONFLICT (cultivo, nutrient_code) DO NOTHING;

-- 1.3 ag_nutrient_efficiency — Eficiencia de absorción por nutriente
CREATE TABLE IF NOT EXISTS public.ag_nutrient_efficiency (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nutrient_code text NOT NULL REFERENCES public.ag_nutrients(code),
  eficiencia_absorcion numeric NOT NULL CHECK (eficiencia_absorcion > 0 AND eficiencia_absorcion <= 1),
  contexto text DEFAULT 'default',  -- 'default', 'suelo_arenoso', 'suelo_arcilloso', 'volcánico'
  fuente text,
  version integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  UNIQUE(nutrient_code, contexto)
);

ALTER TABLE public.ag_nutrient_efficiency ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ag_efficiency_select" ON public.ag_nutrient_efficiency FOR SELECT TO authenticated
  USING (true);

-- Seed: Eficiencias por defecto
INSERT INTO public.ag_nutrient_efficiency (nutrient_code, eficiencia_absorcion, contexto) VALUES
  ('N',  0.50, 'default'),
  ('P',  0.30, 'default'),
  ('K',  0.60, 'default'),
  ('Ca', 0.70, 'default'),
  ('Mg', 0.65, 'default'),
  ('S',  0.50, 'default')
ON CONFLICT (nutrient_code, contexto) DO NOTHING;

-- 1.4 ag_fertilizers — Catálogo de fertilizantes comerciales
CREATE TABLE IF NOT EXISTS public.ag_fertilizers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('granular','soluble','foliar','organico','enmienda')),
  pct_n numeric DEFAULT 0,
  pct_p numeric DEFAULT 0,
  pct_k numeric DEFAULT 0,
  pct_ca numeric DEFAULT 0,
  pct_mg numeric DEFAULT 0,
  pct_s numeric DEFAULT 0,
  pct_b numeric DEFAULT 0,
  pct_zn numeric DEFAULT 0,
  precio_referencia_usd_kg numeric,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ag_fertilizers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ag_fertilizers_select" ON public.ag_fertilizers FOR SELECT TO authenticated
  USING (true);

-- Seed: Fertilizantes comunes
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

-- 1.5 ag_rulesets — Reglas regionales
CREATE TABLE IF NOT EXISTS public.ag_rulesets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region text NOT NULL,
  pais text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  activo boolean DEFAULT true,
  fecha_activacion date DEFAULT CURRENT_DATE,
  max_n_kg_ha numeric,          -- Límite ambiental N
  max_p_kg_ha numeric,          -- Límite ambiental P
  descripcion text,
  parametros jsonb DEFAULT '{}',  -- Coeficientes adicionales por región
  created_at timestamptz DEFAULT now(),
  UNIQUE(region, pais, version)
);

ALTER TABLE public.ag_rulesets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ag_rulesets_select" ON public.ag_rulesets FOR SELECT TO authenticated
  USING (true);

INSERT INTO public.ag_rulesets (region, pais, version, max_n_kg_ha, max_p_kg_ha, descripcion) VALUES
  ('Central', 'Costa Rica', 1, 250, 80, 'Regla base Costa Rica — Zona Central cafetalera'),
  ('Huehuetenango', 'Guatemala', 1, 300, 100, 'Regla base Guatemala — Tierras altas')
ON CONFLICT (region, pais, version) DO NOTHING;

-- 1.6 ag_altitude_coefficients — Coeficientes por rango altitudinal
CREATE TABLE IF NOT EXISTS public.ag_altitude_coefficients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  altitud_min integer NOT NULL,
  altitud_max integer NOT NULL,
  coeficiente numeric NOT NULL DEFAULT 1.0,
  descripcion text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ag_altitude_coefficients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ag_altitude_select" ON public.ag_altitude_coefficients FOR SELECT TO authenticated
  USING (true);

INSERT INTO public.ag_altitude_coefficients (altitud_min, altitud_max, coeficiente, descripcion) VALUES
  (0,    1199, 1.10, 'Baja altitud: metabolismo rápido, mayor demanda'),
  (1200, 1500, 1.00, 'Altitud media: referencia base'),
  (1501, 3000, 0.90, 'Alta altitud: metabolismo lento, menor demanda')
ON CONFLICT DO NOTHING;

-- 1.7 ag_age_coefficients — Coeficientes por edad de plantación
CREATE TABLE IF NOT EXISTS public.ag_age_coefficients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  edad_min integer NOT NULL,
  edad_max integer NOT NULL,
  coeficiente numeric NOT NULL DEFAULT 1.0,
  descripcion text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ag_age_coefficients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ag_age_select" ON public.ag_age_coefficients FOR SELECT TO authenticated
  USING (true);

INSERT INTO public.ag_age_coefficients (edad_min, edad_max, coeficiente, descripcion) VALUES
  (0, 2,  0.60, 'Establecimiento: baja demanda'),
  (3, 6,  1.00, 'Producción plena: máxima demanda'),
  (7, 10, 0.90, 'Madurez: demanda estable'),
  (11, 99, 0.75, 'Declive: demanda reducida')
ON CONFLICT DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- PARTE 2: TABLAS TRANSACCIONALES (con organization_id)
-- ────────────────────────────────────────────────────────────

-- 2.1 harvest_results — Resultados de cosecha real
CREATE TABLE IF NOT EXISTS public.harvest_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.platform_organizations(id),
  parcela_id uuid NOT NULL,
  fecha_cosecha date NOT NULL,
  produccion_total numeric NOT NULL,
  unidad text NOT NULL DEFAULT 'kg',  -- kg, qq, ton
  ciclo text,                          -- '2025-2026'
  notas text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_harvest_results_org ON public.harvest_results(organization_id);
CREATE INDEX IF NOT EXISTS idx_harvest_results_parcela ON public.harvest_results(parcela_id);

ALTER TABLE public.harvest_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "harvest_results_select" ON public.harvest_results FOR SELECT TO authenticated
  USING (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin(auth.uid()));

CREATE POLICY "harvest_results_insert" ON public.harvest_results FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "harvest_results_update" ON public.harvest_results FOR UPDATE TO authenticated
  USING (
    (organization_id = public.get_user_organization_id(auth.uid()) AND public.is_org_admin(auth.uid()))
    OR public.is_admin(auth.uid())
  );

CREATE TRIGGER set_harvest_results_updated_at BEFORE UPDATE ON public.harvest_results
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2.2 yield_estimates — Estimaciones de Nova Yield
CREATE TABLE IF NOT EXISTS public.yield_estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.platform_organizations(id),
  parcela_id uuid NOT NULL,
  fecha_estimacion date NOT NULL DEFAULT CURRENT_DATE,
  yield_estimado numeric NOT NULL,     -- qq/ha
  intervalo_error numeric,             -- ±qq
  metodo text DEFAULT 'nova_yield_v1', -- Método utilizado
  confianza text CHECK (confianza IN ('alta','media','baja')),
  inputs_snapshot jsonb,               -- Snapshot de inputs usados
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_yield_estimates_org ON public.yield_estimates(organization_id);

ALTER TABLE public.yield_estimates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "yield_estimates_select" ON public.yield_estimates FOR SELECT TO authenticated
  USING (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin(auth.uid()));

CREATE POLICY "yield_estimates_insert" ON public.yield_estimates FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

-- 2.3 nutrition_outcomes — Dataset de aprendizaje del motor
CREATE TABLE IF NOT EXISTS public.nutrition_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.platform_organizations(id),
  parcela_id uuid NOT NULL,
  plan_id uuid,                        -- Referencia al plan nutricional
  variedad text,
  altitud numeric,
  tipo_suelo text,
  nutricion_aplicada jsonb,            -- JSON con nutrientes aplicados
  yield_estimado numeric,
  yield_real numeric,
  diferencia numeric GENERATED ALWAYS AS (yield_real - yield_estimado) STORED,
  ciclo text,                          -- '2025-2026'
  ruleset_version text,
  engine_version text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nutrition_outcomes_org ON public.nutrition_outcomes(organization_id);

ALTER TABLE public.nutrition_outcomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nutrition_outcomes_select" ON public.nutrition_outcomes FOR SELECT TO authenticated
  USING (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin(auth.uid()));

CREATE POLICY "nutrition_outcomes_insert" ON public.nutrition_outcomes FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

-- 2.4 nutrition_adjustments — Ajustes técnicos a planes
CREATE TABLE IF NOT EXISTS public.nutrition_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.platform_organizations(id),
  plan_id uuid NOT NULL,
  nutriente text NOT NULL,
  valor_original numeric NOT NULL,
  valor_modificado numeric NOT NULL,
  justificacion text NOT NULL,
  usuario_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nutrition_adjustments_org ON public.nutrition_adjustments(organization_id);

ALTER TABLE public.nutrition_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nutrition_adjustments_select" ON public.nutrition_adjustments FOR SELECT TO authenticated
  USING (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin(auth.uid()));

CREATE POLICY "nutrition_adjustments_insert" ON public.nutrition_adjustments FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

-- ────────────────────────────────────────────────────────────
-- PARTE 3: FUNCIONES HELPER PARA EL MOTOR
-- ────────────────────────────────────────────────────────────

-- 3.1 Obtener coeficiente de altitud
CREATE OR REPLACE FUNCTION public.get_altitude_coefficient(_altitud integer)
RETURNS numeric
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT coeficiente FROM public.ag_altitude_coefficients
     WHERE _altitud BETWEEN altitud_min AND altitud_max
     LIMIT 1),
    1.0
  );
$$;

-- 3.2 Obtener coeficiente de edad
CREATE OR REPLACE FUNCTION public.get_age_coefficient(_edad integer)
RETURNS numeric
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT coeficiente FROM public.ag_age_coefficients
     WHERE _edad BETWEEN edad_min AND edad_max
     LIMIT 1),
    1.0
  );
$$;

-- 3.3 Calcular demanda nutricional base para un nutriente
CREATE OR REPLACE FUNCTION public.calc_nutrient_demand(
  _nutrient_code text,
  _yield_ton numeric,
  _altitud integer DEFAULT 1300,
  _edad integer DEFAULT 5
)
RETURNS numeric
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(ext.extraccion_kg_por_ton_default, 0) * _yield_ton
    * public.get_altitude_coefficient(_altitud)
    * public.get_age_coefficient(_edad)
    / COALESCE(eff.eficiencia_absorcion, 0.5)
  FROM public.ag_crop_nutrient_extraction ext
  LEFT JOIN public.ag_nutrient_efficiency eff
    ON eff.nutrient_code = ext.nutrient_code AND eff.contexto = 'default'
  WHERE ext.nutrient_code = _nutrient_code
    AND ext.cultivo = 'cafe';
$$;

-- 3.4 RPC: Calcular demanda completa para una parcela
CREATE OR REPLACE FUNCTION public.calc_full_nutrient_demand(
  _yield_ton numeric,
  _altitud integer DEFAULT 1300,
  _edad integer DEFAULT 5
)
RETURNS TABLE(nutrient_code text, nombre text, demanda_kg_ha numeric, eficiencia numeric)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ext.nutrient_code,
    n.nombre,
    ROUND(
      ext.extraccion_kg_por_ton_default * _yield_ton
      * public.get_altitude_coefficient(_altitud)
      * public.get_age_coefficient(_edad)
      / COALESCE(eff.eficiencia_absorcion, 0.5)
    , 2) AS demanda_kg_ha,
    COALESCE(eff.eficiencia_absorcion, 0.5) AS eficiencia
  FROM public.ag_crop_nutrient_extraction ext
  JOIN public.ag_nutrients n ON n.code = ext.nutrient_code
  LEFT JOIN public.ag_nutrient_efficiency eff
    ON eff.nutrient_code = ext.nutrient_code AND eff.contexto = 'default'
  WHERE ext.cultivo = 'cafe'
  ORDER BY
    CASE n.tipo
      WHEN 'macronutriente_primario' THEN 1
      WHEN 'macronutriente_secundario' THEN 2
      ELSE 3
    END, ext.nutrient_code;
$$;

-- ────────────────────────────────────────────────────────────
-- PARTE 4: VERIFICACIÓN
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE
  _tbl text;
  _tables text[] := ARRAY[
    'ag_nutrients','ag_crop_nutrient_extraction','ag_nutrient_efficiency',
    'ag_fertilizers','ag_rulesets','ag_altitude_coefficients','ag_age_coefficients',
    'harvest_results','yield_estimates','nutrition_outcomes','nutrition_adjustments'
  ];
BEGIN
  FOREACH _tbl IN ARRAY _tables LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename=_tbl) THEN
      RAISE WARNING '⚠️ Tabla % NO creada', _tbl;
    ELSE
      RAISE NOTICE '✅ %', _tbl;
    END IF;
  END LOOP;

  -- Verificar RLS
  FOREACH _tbl IN ARRAY _tables LOOP
    IF NOT (SELECT rowsecurity FROM pg_tables WHERE schemaname='public' AND tablename=_tbl) THEN
      RAISE WARNING '⚠️ RLS deshabilitado en %', _tbl;
    END IF;
  END LOOP;

  -- Test rápido de funciones
  RAISE NOTICE '✅ calc_nutrient_demand(N, 1.5ton) = % kg/ha',
    public.calc_nutrient_demand('N', 1.5);

  RAISE NOTICE '🎉 Tramo A — Todas las tablas y funciones creadas correctamente';
END;
$$;

-- Test: Demanda completa para 1.5 ton/ha, 1400m, 5 años
SELECT * FROM public.calc_full_nutrient_demand(1.5, 1400, 5);
```

---

## Smoke Tests Post-Ejecución

```sql
-- 1. Verificar conteo de catálogos
SELECT 'ag_nutrients' AS tabla, count(*) FROM public.ag_nutrients
UNION ALL SELECT 'ag_crop_nutrient_extraction', count(*) FROM public.ag_crop_nutrient_extraction
UNION ALL SELECT 'ag_nutrient_efficiency', count(*) FROM public.ag_nutrient_efficiency
UNION ALL SELECT 'ag_fertilizers', count(*) FROM public.ag_fertilizers
UNION ALL SELECT 'ag_rulesets', count(*) FROM public.ag_rulesets
UNION ALL SELECT 'ag_altitude_coefficients', count(*) FROM public.ag_altitude_coefficients
UNION ALL SELECT 'ag_age_coefficients', count(*) FROM public.ag_age_coefficients;

-- 2. Test demanda nutricional
SELECT * FROM public.calc_full_nutrient_demand(1.5, 1400, 5);

-- 3. Verificar RLS
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('ag_nutrients','harvest_results','nutrition_outcomes','yield_estimates');
```

# Prompt Supabase – Tramo A: Catálogos y tablas transaccionales de nutrición

Ejecutá este SQL en el SQL Editor de Supabase, en el orden indicado.

---

## Requisitos previos

- Tablas existentes: `ag_variedades`, `ag_parametros_altitud`, `ag_parametros_fenologicos`, `ag_reglas_suelo`, `ag_ruleset_versions`, `parcelas`, `nutricion_planes`
- Funciones: `get_user_organization_id`, `_can_access_org` o `is_admin`

---

## 1. Tablas de catálogos (7 tablas)

### 1.1 ag_nutrients (nutrientes y extracción CENICAFE)

```sql
CREATE TABLE IF NOT EXISTS public.ag_nutrients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  nombre text NOT NULL,
  unidad text NOT NULL DEFAULT 'kg',
  extraction_per_ton numeric(12,6) NOT NULL DEFAULT 0,
  absorption_efficiency numeric(5,4) NOT NULL DEFAULT 0.5,
  to_oxide_ratio numeric(8,4) NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.ag_nutrients (codigo, nombre, extraction_per_ton, absorption_efficiency, to_oxide_ratio) VALUES
  ('N', 'Nitrógeno', 30.9, 0.50, NULL),
  ('P', 'Fósforo', 2.3, 0.30, 2.29),
  ('K', 'Potasio', 36.9, 0.60, 1.2),
  ('Ca', 'Calcio', 4.3, 0.40, 1.4),
  ('Mg', 'Magnesio', 2.3, 0.45, 1.66),
  ('S', 'Azufre', 1.2, 0.50, NULL)
ON CONFLICT (codigo) DO UPDATE SET
  extraction_per_ton = EXCLUDED.extraction_per_ton,
  absorption_efficiency = EXCLUDED.absorption_efficiency,
  to_oxide_ratio = EXCLUDED.to_oxide_ratio;
```

### 1.2 ag_fertilizers (fertilizantes comerciales)

```sql
CREATE TABLE IF NOT EXISTS public.ag_fertilizers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  formula text NULL,
  n_pct numeric(5,2) NULL,
  p2o5_pct numeric(5,2) NULL,
  k2o_pct numeric(5,2) NULL,
  costo_usd_kg numeric(8,4) NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ag_fertilizers_npk ON public.ag_fertilizers (n_pct, p2o5_pct, k2o_pct);
```

### 1.3 ag_rulesets (ya existe como ag_ruleset_versions – omitir si existe)

---

## 2. Tablas transaccionales (4 tablas)

### 2.1 harvest_results (resultados de cosecha)

```sql
CREATE TABLE IF NOT EXISTS public.harvest_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  parcela_id uuid NOT NULL,
  temporada text NOT NULL,
  kg_pergamino numeric(12,2) NOT NULL,
  kg_ha numeric(12,2) NULL,
  fecha_inicio date NULL,
  fecha_fin date NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_harvest_results_org ON public.harvest_results (organization_id);
CREATE INDEX IF NOT EXISTS idx_harvest_results_parcela ON public.harvest_results (parcela_id);
ALTER TABLE public.harvest_results ENABLE ROW LEVEL SECURITY;
```

### 2.2 yield_estimates (estimaciones de rendimiento)

```sql
CREATE TABLE IF NOT EXISTS public.yield_estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  parcela_id uuid NOT NULL,
  kg_ha numeric(12,2) NOT NULL,
  fuente text NULL,
  temporada text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_yield_estimates_org ON public.yield_estimates (organization_id);
CREATE INDEX IF NOT EXISTS idx_yield_estimates_parcela ON public.yield_estimates (parcela_id);
ALTER TABLE public.yield_estimates ENABLE ROW LEVEL SECURITY;
```

### 2.3 nutrition_outcomes (resultados de nutrición aplicada)

```sql
CREATE TABLE IF NOT EXISTS public.nutrition_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  plan_id uuid NULL REFERENCES public.nutricion_planes(id) ON DELETE SET NULL,
  parcela_id uuid NOT NULL,
  temporada text NULL,
  demanda_json jsonb NULL,
  fertilizantes_json jsonb NULL,
  costo_real_usd numeric(12,2) NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nutrition_outcomes_org ON public.nutrition_outcomes (organization_id);
ALTER TABLE public.nutrition_outcomes ENABLE ROW LEVEL SECURITY;
```

### 2.4 nutrition_adjustments (ajustes post-análisis)

```sql
CREATE TABLE IF NOT EXISTS public.nutrition_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  plan_id uuid NULL REFERENCES public.nutricion_planes(id) ON DELETE SET NULL,
  variable text NOT NULL,
  valor_anterior numeric(12,4) NULL,
  valor_nuevo numeric(12,4) NOT NULL,
  motivo text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nutrition_adjustments_org ON public.nutrition_adjustments (organization_id);
ALTER TABLE public.nutrition_adjustments ENABLE ROW LEVEL SECURITY;
```

---

## 3. Funciones helper

### 3.1 calc_nutrient_demand (demanda de un nutriente)

```sql
CREATE OR REPLACE FUNCTION public.calc_nutrient_demand(
  p_yield_kg_ha numeric,
  p_nutrient_code text,
  p_variety_factor numeric DEFAULT 1.0,
  p_age_factor numeric DEFAULT 1.0
)
RETURNS numeric AS $$
DECLARE
  v_extraction numeric;
  v_efficiency numeric;
  v_demanda numeric;
BEGIN
  SELECT extraction_per_ton, absorption_efficiency INTO v_extraction, v_efficiency
  FROM public.ag_nutrients WHERE codigo = p_nutrient_code LIMIT 1;
  IF v_extraction IS NULL THEN RETURN 0; END IF;
  v_demanda := (p_yield_kg_ha / 1000.0) * v_extraction * COALESCE(p_variety_factor, 1) * COALESCE(p_age_factor, 1) / NULLIF(v_efficiency, 0);
  RETURN v_demanda;
END;
$$ LANGUAGE plpgsql STABLE;
```

### 3.2 coeficientes (altitud, edad, estrés)

```sql
CREATE OR REPLACE FUNCTION public.coeficientes(
  p_altitud_msnm int,
  p_edad_anios int,
  p_estres text DEFAULT 'bajo'
)
RETURNS TABLE (zona text, age_factor numeric, stress_factor numeric) AS $$
BEGIN
  RETURN QUERY SELECT
    CASE WHEN p_altitud_msnm < 1200 THEN 'baja'::text WHEN p_altitud_msnm < 1500 THEN 'media'::text ELSE 'alta'::text END,
    CASE WHEN p_edad_anios < 2 THEN 0.6 WHEN p_edad_anios < 4 THEN 0.85 WHEN p_edad_anios < 8 THEN 1.0 WHEN p_edad_anios < 15 THEN 1.05 ELSE 0.95 END,
    CASE p_estres WHEN 'medio' THEN 1.1 WHEN 'alto' THEN 1.2 ELSE 1.0 END;
END;
$$ LANGUAGE plpgsql STABLE;
```

### 3.3 calc_full_nutrient_demand (demanda completa – simplificada)

```sql
CREATE OR REPLACE FUNCTION public.calc_full_nutrient_demand(
  p_yield_kg_ha numeric,
  p_variety_factor numeric DEFAULT 1.0,
  p_age_factor numeric DEFAULT 1.0,
  p_stress_factor numeric DEFAULT 1.0
)
RETURNS TABLE (nutriente text, kg_demanda numeric) AS $$
BEGIN
  RETURN QUERY
  SELECT n.codigo::text,
    (p_yield_kg_ha / 1000.0) * n.extraction_per_ton * p_variety_factor * p_age_factor * p_stress_factor / NULLIF(n.absorption_efficiency, 0)
  FROM public.ag_nutrients n
  WHERE n.codigo IN ('N','P','K','Ca','Mg','S');
END;
$$ LANGUAGE plpgsql STABLE;
```

---

## 4. RLS para tablas transaccionales

```sql
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_organization_id') THEN
    DROP POLICY IF EXISTS "harvest_results_org" ON public.harvest_results;
    CREATE POLICY "harvest_results_org" ON public.harvest_results FOR ALL
      USING (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin())
      WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

    DROP POLICY IF EXISTS "yield_estimates_org" ON public.yield_estimates;
    CREATE POLICY "yield_estimates_org" ON public.yield_estimates FOR ALL
      USING (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin())
      WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

    DROP POLICY IF EXISTS "nutrition_outcomes_org" ON public.nutrition_outcomes;
    CREATE POLICY "nutrition_outcomes_org" ON public.nutrition_outcomes FOR ALL
      USING (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin())
      WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

    DROP POLICY IF EXISTS "nutrition_adjustments_org" ON public.nutrition_adjustments;
    CREATE POLICY "nutrition_adjustments_org" ON public.nutrition_adjustments FOR ALL
      USING (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin())
      WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));
  END IF;
END $$;
```

---

## 5. Smoke test

```sql
SELECT public.calc_nutrient_demand(2500, 'N', 1.0, 1.0) AS demanda_n;
SELECT * FROM public.calc_full_nutrient_demand(2500, 1.0, 1.0, 1.0);
SELECT * FROM public.coeficientes(1400, 6, 'bajo');
```

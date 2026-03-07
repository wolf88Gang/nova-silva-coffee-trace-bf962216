-- Migration: Catálogos del Módulo de Nutrición Paramétrica (ag_*)
-- Tablas globales administradas por super admin. Sin RLS (catálogos).

-- ========== 1. ag_variedades ==========
CREATE TABLE IF NOT EXISTS public.ag_variedades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_comun text NOT NULL UNIQUE,
  grupo_morfologico text NOT NULL CHECK (grupo_morfologico IN ('compacto', 'alto', 'compuesto', 'exotico', 'f1')),
  factor_demanda_base numeric(6,4) NOT NULL CHECK (factor_demanda_base >= 0.5 AND factor_demanda_base <= 1.5),
  micros_multiplier numeric(6,4) NOT NULL DEFAULT 1.0 CHECK (micros_multiplier >= 0.8 AND micros_multiplier <= 1.4),
  limite_yield_sostenible_kg_ha int NOT NULL CHECK (limite_yield_sostenible_kg_ha >= 800 AND limite_yield_sostenible_kg_ha <= 5000),
  sens_exceso_n text NOT NULL CHECK (sens_exceso_n IN ('baja', 'media', 'alta')),
  sens_deficit_k text NOT NULL CHECK (sens_deficit_k IN ('baja', 'media', 'alta')),
  tolerancia_sequia text NOT NULL CHECK (tolerancia_sequia IN ('baja', 'media', 'alta')),
  tolerancia_calor text NOT NULL CHECK (tolerancia_calor IN ('baja', 'media', 'alta')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ag_variedades_grupo ON public.ag_variedades (grupo_morfologico);

-- ========== 2. ag_parametros_altitud ==========
CREATE TABLE IF NOT EXISTS public.ag_parametros_altitud (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zona text NOT NULL UNIQUE CHECK (zona IN ('baja', 'media', 'alta')),
  rango_min_msnm int NOT NULL,
  rango_max_msnm int NOT NULL,
  shift_dias int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ========== 3. ag_parametros_fenologicos ==========
CREATE TABLE IF NOT EXISTS public.ag_parametros_fenologicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zona text NOT NULL CHECK (zona IN ('baja', 'media', 'alta')),
  fase text NOT NULL,
  dias_post_floracion_min int NOT NULL,
  dias_post_floracion_max int NOT NULL,
  nutrientes_dominantes text[] NOT NULL DEFAULT '{}',
  proporcion_dosis_pct numeric(5,2) NOT NULL CHECK (proporcion_dosis_pct >= 0 AND proporcion_dosis_pct <= 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (zona, fase)
);

CREATE INDEX IF NOT EXISTS idx_ag_parametros_fenologicos_zona ON public.ag_parametros_fenologicos (zona);

-- ========== 4. ag_reglas_suelo ==========
CREATE TABLE IF NOT EXISTS public.ag_reglas_suelo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ruleset_version text NOT NULL,
  variable text NOT NULL,
  operador text NOT NULL CHECK (operador IN ('<', '<=', '>', '>=', '=', 'between')),
  umbral_min numeric(12,4) NOT NULL DEFAULT -999999,
  umbral_max numeric(12,4) NULL,
  accion_tipo text NOT NULL CHECK (accion_tipo IN ('bloqueo', 'ajuste', 'alerta')),
  accion_objetivo text NULL,
  accion_valor numeric(12,4) NULL,
  accion_valor_json jsonb NULL,
  severidad text NOT NULL CHECK (severidad IN ('roja', 'naranja', 'amarilla', 'verde')),
  mensaje text NULL,
  explain_code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ag_reglas_suelo_unique
  ON public.ag_reglas_suelo (ruleset_version, variable, operador, umbral_min, accion_tipo);
CREATE INDEX IF NOT EXISTS idx_ag_reglas_suelo_ruleset ON public.ag_reglas_suelo (ruleset_version);
CREATE INDEX IF NOT EXISTS idx_ag_reglas_suelo_variable ON public.ag_reglas_suelo (variable);

-- ========== 5. ag_ruleset_versions ==========
CREATE TABLE IF NOT EXISTS public.ag_ruleset_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL UNIQUE,
  descripcion text NULL,
  fecha_activacion date NOT NULL DEFAULT CURRENT_DATE,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION _ag_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['ag_variedades', 'ag_parametros_altitud', 'ag_parametros_fenologicos', 'ag_reglas_suelo', 'ag_ruleset_versions']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_ag_updated_at ON public.%I', t);
    EXECUTE format('CREATE TRIGGER trg_ag_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION _ag_updated_at()', t);
  END LOOP;
END $$;

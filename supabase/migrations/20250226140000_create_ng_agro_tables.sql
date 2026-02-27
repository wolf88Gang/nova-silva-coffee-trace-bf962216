-- Migration 000: Crear tablas NG→Impacto (agro_events, ng_diagnostics, ng_impacts, agro_state_parcela, yield_adjustments)
-- Aditivo: CREATE TABLE IF NOT EXISTS. organization_id como llave canónica.

-- ========== 1. agro_events ==========
CREATE TABLE IF NOT EXISTS public.agro_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  parcela_id uuid NULL,
  lote_id uuid NULL,
  productor_id uuid NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  observed_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL DEFAULT auth.uid(),
  source text NULL,
  confidence numeric(5,4) NULL CHECK (confidence >= 0 AND confidence <= 1),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agro_events_org_observed
  ON public.agro_events (organization_id, observed_at DESC);

CREATE INDEX IF NOT EXISTS idx_agro_events_org_type_observed
  ON public.agro_events (organization_id, event_type, observed_at DESC);

-- ========== 2. ng_diagnostics ==========
CREATE TABLE IF NOT EXISTS public.ng_diagnostics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  parcela_id uuid NULL,
  lote_id uuid NULL,
  productor_id uuid NULL,
  issue_code text NOT NULL,
  incidence_pct numeric(5,2) NULL CHECK (incidence_pct >= 0 AND incidence_pct <= 100),
  severity_scale smallint NULL CHECK (severity_scale >= 0 AND severity_scale <= 5),
  phenology_index numeric(5,4) NULL CHECK (phenology_index >= 0 AND phenology_index <= 1),
  notes text NULL,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  observed_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL DEFAULT auth.uid(),
  source text NULL DEFAULT 'mobile',
  model_version text NULL,
  confidence numeric(5,4) NULL CHECK (confidence >= 0 AND confidence <= 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ng_diagnostics_org_observed
  ON public.ng_diagnostics (organization_id, observed_at DESC);

CREATE INDEX IF NOT EXISTS idx_ng_diagnostics_parcela_issue_observed
  ON public.ng_diagnostics (parcela_id, issue_code, observed_at DESC)
  WHERE parcela_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ng_diagnostics_lote_issue_observed
  ON public.ng_diagnostics (lote_id, issue_code, observed_at DESC)
  WHERE lote_id IS NOT NULL;

-- ========== 3. ng_impacts ==========
CREATE TABLE IF NOT EXISTS public.ng_impacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  parcela_id uuid NULL,
  lote_id uuid NULL,
  productor_id uuid NULL,
  window_start timestamptz NOT NULL,
  window_end timestamptz NOT NULL,
  issue_code text NOT NULL,
  expected_loss_pct numeric(6,5) NOT NULL CHECK (expected_loss_pct >= 0 AND expected_loss_pct <= 1),
  damage_factor numeric(6,5) NOT NULL CHECK (damage_factor >= 0 AND damage_factor <= 1),
  method text NOT NULL DEFAULT 'rules_v1',
  inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  confidence numeric(5,4) NULL CHECK (confidence >= 0 AND confidence <= 1),
  computed_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ng_impacts_org_window
  ON public.ng_impacts (organization_id, window_end DESC);

CREATE INDEX IF NOT EXISTS idx_ng_impacts_org_parcela_issue_window
  ON public.ng_impacts (organization_id, parcela_id, issue_code, window_end DESC)
  WHERE parcela_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ng_impacts_org_lote_issue_window
  ON public.ng_impacts (organization_id, lote_id, issue_code, window_end DESC)
  WHERE lote_id IS NOT NULL;

-- ========== 4. agro_state_parcela ==========
CREATE TABLE IF NOT EXISTS public.agro_state_parcela (
  organization_id uuid NOT NULL,
  parcela_id uuid NOT NULL,
  damage_factor_current numeric(6,5) NULL CHECK (damage_factor_current >= 0 AND damage_factor_current <= 1),
  damage_factor_updated_at timestamptz NULL,
  phenology_index_current numeric(6,5) NULL CHECK (phenology_index_current >= 0 AND phenology_index_current <= 1),
  phenology_updated_at timestamptz NULL,
  climate_factor_current numeric(6,5) NULL CHECK (climate_factor_current >= 0 AND climate_factor_current <= 1),
  climate_factor_updated_at timestamptz NULL,
  data_quality_score numeric(6,5) NULL CHECK (data_quality_score >= 0 AND data_quality_score <= 1),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, parcela_id)
);

CREATE INDEX IF NOT EXISTS idx_agro_state_parcela_parcela_id
  ON public.agro_state_parcela (parcela_id);

-- ========== 5. yield_adjustments ==========
CREATE TABLE IF NOT EXISTS public.yield_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  yield_estimation_id uuid NOT NULL,
  parcela_id uuid NULL,
  lote_id uuid NULL,
  factor_key text NOT NULL,
  factor_value numeric(10,6) NOT NULL,
  formula_version text NOT NULL DEFAULT 'yield_v1',
  source_ref jsonb NOT NULL DEFAULT '{}'::jsonb,
  applied_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_yield_adjustments_yield_estimation_id
  ON public.yield_adjustments (yield_estimation_id);

CREATE INDEX IF NOT EXISTS idx_yield_adjustments_org_applied
  ON public.yield_adjustments (organization_id, applied_at DESC);

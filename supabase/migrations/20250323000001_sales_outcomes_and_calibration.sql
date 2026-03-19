-- Sales Intelligence — Outcomes table + calibration views
-- Prerequisite: sales_sessions, sales_session_objections, sales_session_recommendations
-- If sales_session_outcomes already exists, skip the CREATE TABLE block.

DO $$ BEGIN
  CREATE TYPE public.sales_outcome AS ENUM ('won', 'lost', 'no_decision');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.sales_session_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sales_sessions(id) ON DELETE CASCADE UNIQUE,
  outcome public.sales_outcome NOT NULL,
  deal_value numeric,
  close_date date,
  reason_lost text,
  recorded_at timestamptz DEFAULT now(),
  recorded_by uuid
);

CREATE INDEX IF NOT EXISTS idx_sso_session ON public.sales_session_outcomes (session_id);
CREATE INDEX IF NOT EXISTS idx_sso_outcome ON public.sales_session_outcomes (outcome);

ALTER TABLE public.sales_session_outcomes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sales_outcomes_admin" ON public.sales_session_outcomes;
CREATE POLICY "sales_outcomes_admin" ON public.sales_session_outcomes FOR ALL USING (public.is_admin());

-- ========== ANALYTICAL DATASET VIEW ==========
CREATE OR REPLACE VIEW public.v_sales_calibration_dataset AS
WITH obj_agg AS (
  SELECT
    session_id,
    COUNT(*)::int AS objection_count,
    MAX(confidence)::numeric AS max_objection_confidence,
    array_agg(DISTINCT objection_type::text ORDER BY objection_type::text) AS objection_types
  FROM public.sales_session_objections
  GROUP BY session_id
)
SELECT
  s.id AS session_id,
  o.outcome,
  s.score_pain,
  s.score_maturity,
  s.score_urgency,
  s.score_fit,
  s.score_budget_readiness,
  s.score_total AS total_score,
  COALESCE(obj.objection_count, 0) AS objection_count,
  obj.max_objection_confidence,
  COALESCE(obj.objection_types, '{}') AS objection_types
FROM public.sales_sessions s
LEFT JOIN public.sales_session_outcomes o ON o.session_id = s.id
LEFT JOIN obj_agg obj ON obj.session_id = s.id
WHERE s.status = 'completed'
  AND s.deleted_at IS NULL;

-- ========== CALIBRATION CONFIG ==========
CREATE TABLE IF NOT EXISTS public.sales_calibration_config (
  key text PRIMARY KEY,
  value numeric NOT NULL,
  updated_at timestamptz DEFAULT now()
);
INSERT INTO public.sales_calibration_config (key, value) VALUES
  ('win_rate_strong_positive', 0.65),
  ('loss_rate_strong_negative', 0.65),
  ('min_sample_size', 10)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- ========== CALIBRATION CONFIG RLS ==========
ALTER TABLE public.sales_calibration_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sales_calibration_config_admin" ON public.sales_calibration_config;
CREATE POLICY "sales_calibration_config_admin" ON public.sales_calibration_config FOR ALL USING (public.is_admin());

-- ========== RULE VERSIONING ==========
CREATE TABLE IF NOT EXISTS public.sales_rule_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  description text,
  changes_applied jsonb,
  scoring_thresholds jsonb,
  objection_confidences jsonb
);
ALTER TABLE public.sales_rule_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sales_rule_versions_admin" ON public.sales_rule_versions;
CREATE POLICY "sales_rule_versions_admin" ON public.sales_rule_versions FOR ALL USING (public.is_admin());

-- ========== INTERPRETATION HELPER ==========
CREATE OR REPLACE FUNCTION public.fn_sales_interpret_signal(
  p_win_rate numeric,
  p_loss_rate numeric,
  p_n bigint,
  p_win_high numeric DEFAULT 0.65,
  p_loss_high numeric DEFAULT 0.65,
  p_min_n bigint DEFAULT 10
)
RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN p_n < p_min_n THEN 'noise'
    WHEN p_win_rate >= p_win_high THEN 'strong_positive'
    WHEN p_loss_rate >= p_loss_high THEN 'strong_negative'
    WHEN p_win_rate > 0.5 THEN 'weak_positive'
    WHEN p_loss_rate > 0.5 THEN 'weak_negative'
    ELSE 'neutral'
  END;
$$;

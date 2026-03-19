-- Sales Intelligence — Production calibration layer
-- Upgrades: canonical dataset view, versioning with snapshots, config, interpretation

-- ========== CANONICAL CALIBRATION VIEW (replaces v_sales_calibration_dataset) ==========
CREATE OR REPLACE VIEW public.v_sales_calibration_dataset AS
WITH obj_agg AS (
  SELECT
    session_id,
    COUNT(*)::int AS objection_count,
    MAX(confidence)::numeric AS max_objection_confidence,
    array_agg(DISTINCT objection_type::text ORDER BY objection_type::text) AS objection_types
  FROM public.sales_session_objections
  GROUP BY session_id
),
rec_agg AS (
  SELECT
    session_id,
    COUNT(*)::int AS rec_count,
    array_agg(DISTINCT recommendation_type ORDER BY recommendation_type) AS rec_types,
    array_remove(array_agg(DISTINCT payload->>'signal'), NULL) AS rec_signals
  FROM public.sales_session_recommendations
  GROUP BY session_id
)
SELECT
  s.id AS session_id,
  s.organization_id,
  s.questionnaire_id,
  s.commercial_stage,
  s.lead_type,
  s.created_at AS session_created_at,
  o.outcome,
  o.deal_value,
  o.close_date,
  o.reason_lost,
  s.score_pain,
  s.score_maturity,
  s.score_objection,
  s.score_urgency,
  s.score_fit,
  s.score_budget_readiness,
  s.score_total AS total_score,
  COALESCE(obj.objection_count, 0) AS objection_count,
  obj.max_objection_confidence,
  COALESCE(obj.objection_types, '{}') AS objection_types,
  COALESCE(rec.rec_count, 0) AS rec_count,
  COALESCE(rec.rec_types, '{}') AS rec_types,
  COALESCE(rec.rec_signals, '{}') AS rec_signals
FROM public.sales_sessions s
LEFT JOIN public.sales_session_outcomes o ON o.session_id = s.id
LEFT JOIN obj_agg obj ON obj.session_id = s.id
LEFT JOIN rec_agg rec ON rec.session_id = s.id
WHERE s.status = 'completed'
  AND s.deleted_at IS NULL;

-- ========== CONFIG UPDATES ==========
INSERT INTO public.sales_calibration_config (key, value) VALUES
  ('min_sample_size', 15),
  ('scoring_weight_delta_max', 10),
  ('objection_confidence_delta_max', 0.15)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- ========== INTERPRETATION HELPER (min_sample 15) ==========
CREATE OR REPLACE FUNCTION public.fn_sales_interpret_signal(
  p_win_rate numeric,
  p_loss_rate numeric,
  p_n bigint,
  p_win_high numeric DEFAULT 0.65,
  p_loss_high numeric DEFAULT 0.65,
  p_min_n bigint DEFAULT 15
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

-- ========== VERSION REGISTRY (upgrade) ==========
ALTER TABLE public.sales_rule_versions ADD COLUMN IF NOT EXISTS parent_version_id uuid REFERENCES public.sales_rule_versions(id);
ALTER TABLE public.sales_rule_versions ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.sales_rule_versions ADD COLUMN IF NOT EXISTS deployed_at timestamptz;

-- ========== VERSION SNAPSHOTS (rollback support) ==========
CREATE TABLE IF NOT EXISTS public.sales_rule_version_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES public.sales_rule_versions(id) ON DELETE CASCADE,
  rule_kind text NOT NULL CHECK (rule_kind IN ('scoring', 'objection')),
  rule_id uuid NOT NULL,
  rule_code text,
  snapshot_before jsonb NOT NULL,
  snapshot_after jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_srvs_version ON public.sales_rule_version_snapshots (version_id);

ALTER TABLE public.sales_rule_version_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sales_rule_version_snapshots_admin" ON public.sales_rule_version_snapshots;
CREATE POLICY "sales_rule_version_snapshots_admin" ON public.sales_rule_version_snapshots FOR ALL USING (public.is_admin());

-- Grant SELECT on view for admin panel (RLS on underlying tables enforces is_admin())
GRANT SELECT ON public.v_sales_calibration_dataset TO authenticated;

-- =============================================================================
-- Sales Calibration System
--
-- Evolves Sales Intelligence from static rule-based to data-driven calibration.
-- Deterministic, SQL-only. No ML.
--
-- Changes:
--   1. Harden sales_session_outcomes (CHECK, unique, add deal_value/close_date)
--   2. Create analytical view: v_sales_calibration_dataset
--   3. Create calibration analysis functions (pure SQL, no side effects)
--   4. Create rule versioning table + functions
--   5. Create fn_sales_run_calibration (full calibration report)
-- =============================================================================


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 1: HARDEN sales_session_outcomes
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1a. Add missing columns
ALTER TABLE public.sales_session_outcomes
  ADD COLUMN IF NOT EXISTS deal_value  numeric,
  ADD COLUMN IF NOT EXISTS close_date  date,
  ADD COLUMN IF NOT EXISTS updated_at  timestamptz;

-- 1b. Constrain outcome values
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'chk_outcome_value'
  ) THEN
    ALTER TABLE public.sales_session_outcomes
      ADD CONSTRAINT chk_outcome_value
      CHECK (outcome IN ('won', 'lost', 'no_decision'));
  END IF;
END $$;

-- 1c. Ensure one outcome per session (latest wins via ON CONFLICT)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'uq_sso_session_id'
  ) THEN
    CREATE UNIQUE INDEX uq_sso_session_id
      ON public.sales_session_outcomes (session_id);
  END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 2: ANALYTICAL DATASET VIEW
-- ═══════════════════════════════════════════════════════════════════════════════
-- One row per completed session with outcome. All score dimensions + objection
-- aggregates. This is the single source of truth for all calibration queries.

CREATE OR REPLACE VIEW public.v_sales_calibration_dataset AS
SELECT
  s.id                                            AS session_id,
  s.organization_id,
  s.lead_type,
  s.commercial_stage,
  s.questionnaire_id,
  s.questionnaire_version,
  o.outcome,
  o.deal_value,
  o.close_date,
  o.reason                                        AS outcome_reason,

  -- Score dimensions (coalesce to 0 for safe arithmetic)
  coalesce(s.score_pain, 0)                       AS score_pain,
  coalesce(s.score_maturity, 0)                    AS score_maturity,
  coalesce(s.score_urgency, 0)                     AS score_urgency,
  coalesce(s.score_fit, 0)                         AS score_fit,
  coalesce(s.score_budget_readiness, 0)            AS score_budget_readiness,
  coalesce(s.score_objection, 0)                   AS score_objection,
  coalesce(s.score_total, 0)                       AS score_total,

  -- Objection aggregates
  coalesce(obj.objection_count, 0)                 AS objection_count,
  coalesce(obj.max_confidence, 0)                  AS max_objection_confidence,
  coalesce(obj.objection_types, ARRAY[]::text[])   AS objection_types,

  -- Recommendation types generated
  coalesce(rec.recommendation_types, ARRAY[]::text[]) AS recommendation_types,

  -- Timing
  s.created_at                                     AS session_created_at,
  o.created_at                                     AS outcome_recorded_at,
  s.updated_at                                     AS session_updated_at

FROM public.sales_sessions s
INNER JOIN public.sales_session_outcomes o ON o.session_id = s.id
LEFT JOIN LATERAL (
  SELECT
    count(*)                                       AS objection_count,
    max(confidence)                                AS max_confidence,
    array_agg(DISTINCT objection_type::text ORDER BY objection_type::text) AS objection_types
  FROM public.sales_session_objections
  WHERE session_id = s.id
) obj ON true
LEFT JOIN LATERAL (
  SELECT
    array_agg(DISTINCT recommendation_type::text ORDER BY recommendation_type::text) AS recommendation_types
  FROM public.sales_session_recommendations
  WHERE session_id = s.id
) rec ON true
WHERE s.status = 'completed'
  AND s.deleted_at IS NULL;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 3: CORE ANALYSIS FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─── 3a. Win rate by score bucket (parameterized) ────────────────────────────
-- Returns win/loss/no_decision counts per bucket for a given score dimension.
-- Bucket size is configurable (default 10).
-- Usage: SELECT * FROM fn_cal_score_buckets('score_pain', 15);

CREATE OR REPLACE FUNCTION public.fn_cal_score_buckets(
  p_score_field text,
  p_bucket_size numeric DEFAULT 10
)
RETURNS TABLE (
  bucket_floor    numeric,
  bucket_ceiling  numeric,
  total_sessions  bigint,
  won             bigint,
  lost            bigint,
  no_decision     bigint,
  win_rate        numeric,
  loss_rate       numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF p_score_field NOT IN (
    'score_pain', 'score_maturity', 'score_urgency',
    'score_fit', 'score_budget_readiness', 'score_objection', 'score_total'
  ) THEN
    RAISE EXCEPTION 'Invalid score field: %', p_score_field;
  END IF;

  RETURN QUERY EXECUTE format(
    $q$
    WITH bucketed AS (
      SELECT
        floor(%I / $1) * $1 AS bucket_floor,
        outcome
      FROM v_sales_calibration_dataset
    )
    SELECT
      b.bucket_floor,
      b.bucket_floor + $1  AS bucket_ceiling,
      count(*)             AS total_sessions,
      count(*) FILTER (WHERE b.outcome = 'won')         AS won,
      count(*) FILTER (WHERE b.outcome = 'lost')        AS lost,
      count(*) FILTER (WHERE b.outcome = 'no_decision') AS no_decision,
      CASE WHEN count(*) > 0
        THEN round(count(*) FILTER (WHERE b.outcome = 'won')::numeric / count(*), 4)
        ELSE 0 END AS win_rate,
      CASE WHEN count(*) > 0
        THEN round(count(*) FILTER (WHERE b.outcome = 'lost')::numeric / count(*), 4)
        ELSE 0 END AS loss_rate
    FROM bucketed b
    GROUP BY b.bucket_floor
    ORDER BY b.bucket_floor
    $q$,
    p_score_field
  ) USING p_bucket_size;
END;
$$;


-- ─── 3b. Loss rate by objection type ─────────────────────────────────────────
-- Shows how each objection type correlates with outcomes.
-- Usage: SELECT * FROM fn_cal_objection_outcomes();

CREATE OR REPLACE FUNCTION public.fn_cal_objection_outcomes()
RETURNS TABLE (
  objection_type        text,
  sessions_with         bigint,
  won_with              bigint,
  lost_with             bigint,
  no_decision_with      bigint,
  win_rate_with         numeric,
  loss_rate_with        numeric,
  sessions_without      bigint,
  won_without           bigint,
  lost_without          bigint,
  win_rate_without      numeric,
  loss_rate_without     numeric,
  lift_win              numeric,
  lift_loss             numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH all_types AS (
    SELECT unnest(enum_range(NULL::sales_objection_type))::text AS objection_type
  ),
  base AS (
    SELECT * FROM v_sales_calibration_dataset
  ),
  with_obj AS (
    SELECT
      t.objection_type,
      count(*)                                                    AS sessions_with,
      count(*) FILTER (WHERE b.outcome = 'won')                  AS won_with,
      count(*) FILTER (WHERE b.outcome = 'lost')                 AS lost_with,
      count(*) FILTER (WHERE b.outcome = 'no_decision')          AS no_decision_with
    FROM all_types t
    JOIN base b ON t.objection_type = ANY(b.objection_types)
    GROUP BY t.objection_type
  ),
  without_obj AS (
    SELECT
      t.objection_type,
      count(*)                                                    AS sessions_without,
      count(*) FILTER (WHERE b.outcome = 'won')                  AS won_without,
      count(*) FILTER (WHERE b.outcome = 'lost')                 AS lost_without
    FROM all_types t
    CROSS JOIN base b
    WHERE NOT (t.objection_type = ANY(b.objection_types))
    GROUP BY t.objection_type
  )
  SELECT
    t.objection_type,
    coalesce(w.sessions_with, 0),
    coalesce(w.won_with, 0),
    coalesce(w.lost_with, 0),
    coalesce(w.no_decision_with, 0),
    CASE WHEN coalesce(w.sessions_with, 0) > 0
      THEN round(w.won_with::numeric / w.sessions_with, 4) ELSE 0 END,
    CASE WHEN coalesce(w.sessions_with, 0) > 0
      THEN round(w.lost_with::numeric / w.sessions_with, 4) ELSE 0 END,
    coalesce(wo.sessions_without, 0),
    coalesce(wo.won_without, 0),
    coalesce(wo.lost_without, 0),
    CASE WHEN coalesce(wo.sessions_without, 0) > 0
      THEN round(wo.won_without::numeric / wo.sessions_without, 4) ELSE 0 END,
    CASE WHEN coalesce(wo.sessions_without, 0) > 0
      THEN round(wo.lost_without::numeric / wo.sessions_without, 4) ELSE 0 END,
    -- Lift: how much does the presence of this objection change win/loss rate
    CASE WHEN coalesce(wo.sessions_without, 0) > 0 AND coalesce(w.sessions_with, 0) > 0
      THEN round(
        (w.won_with::numeric / w.sessions_with) - (wo.won_without::numeric / wo.sessions_without),
        4)
      ELSE 0 END AS lift_win,
    CASE WHEN coalesce(wo.sessions_without, 0) > 0 AND coalesce(w.sessions_with, 0) > 0
      THEN round(
        (w.lost_with::numeric / w.sessions_with) - (wo.lost_without::numeric / wo.sessions_without),
        4)
      ELSE 0 END AS lift_loss
  FROM all_types t
  LEFT JOIN with_obj w ON w.objection_type = t.objection_type
  LEFT JOIN without_obj wo ON wo.objection_type = t.objection_type
  ORDER BY coalesce(w.sessions_with, 0) DESC;
$$;


-- ─── 3c. Combination analysis ────────────────────────────────────────────────
-- Tests specific signal combinations against outcomes.
-- Usage: SELECT * FROM fn_cal_combo_analysis();

CREATE OR REPLACE FUNCTION public.fn_cal_combo_analysis()
RETURNS TABLE (
  combo_name      text,
  total_sessions  bigint,
  won             bigint,
  lost            bigint,
  no_decision     bigint,
  win_rate        numeric,
  loss_rate       numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH base AS (SELECT * FROM v_sales_calibration_dataset),

  combos AS (
    -- Combo 1: low maturity + complexity objection
    SELECT 'low_maturity_AND_complexity'::text AS combo_name, *
    FROM base WHERE score_maturity < 40 AND 'complexity' = ANY(objection_types)

    UNION ALL
    -- Combo 2: low budget + timing objection
    SELECT 'low_budget_AND_timing', *
    FROM base WHERE score_budget_readiness <= 25 AND 'timing' = ANY(objection_types)

    UNION ALL
    -- Combo 3: high pain + compliance_fear
    SELECT 'high_pain_AND_compliance_fear', *
    FROM base WHERE score_pain >= 60 AND 'compliance_fear' = ANY(objection_types)

    UNION ALL
    -- Combo 4: high pain + high urgency (ideal profile)
    SELECT 'high_pain_AND_high_urgency', *
    FROM base WHERE score_pain >= 60 AND score_urgency >= 40

    UNION ALL
    -- Combo 5: low fit + any objection
    SELECT 'low_fit_AND_any_objection', *
    FROM base WHERE score_fit <= 25 AND objection_count > 0

    UNION ALL
    -- Combo 6: high pain + low maturity + budget gap
    SELECT 'high_pain_low_mat_budget_gap', *
    FROM base WHERE score_pain >= 60 AND score_maturity < 40 AND score_budget_readiness <= 25

    UNION ALL
    -- Combo 7: trust + complexity (double resistance)
    SELECT 'trust_AND_complexity', *
    FROM base WHERE 'trust' = ANY(objection_types) AND 'complexity' = ANY(objection_types)

    UNION ALL
    -- Combo 8: price + no_priority (structural stall)
    SELECT 'price_AND_no_priority', *
    FROM base WHERE 'price' = ANY(objection_types) AND 'no_priority' = ANY(objection_types)

    UNION ALL
    -- Combo 9: high fit + high urgency + no objections (ideal)
    SELECT 'ideal_profile_no_objections', *
    FROM base WHERE score_fit > 50 AND score_urgency >= 40 AND objection_count = 0

    UNION ALL
    -- Combo 10: high objection score + low urgency (stalled)
    SELECT 'high_objection_low_urgency', *
    FROM base WHERE score_objection >= 30 AND score_urgency < 30
  )

  SELECT
    c.combo_name,
    count(*),
    count(*) FILTER (WHERE c.outcome = 'won'),
    count(*) FILTER (WHERE c.outcome = 'lost'),
    count(*) FILTER (WHERE c.outcome = 'no_decision'),
    CASE WHEN count(*) > 0
      THEN round(count(*) FILTER (WHERE c.outcome = 'won')::numeric / count(*), 4)
      ELSE 0 END,
    CASE WHEN count(*) > 0
      THEN round(count(*) FILTER (WHERE c.outcome = 'lost')::numeric / count(*), 4)
      ELSE 0 END
  FROM combos c
  GROUP BY c.combo_name
  ORDER BY count(*) DESC;
$$;


-- ─── 3d. Threshold sensitivity analysis ──────────────────────────────────────
-- Tests multiple cutoff values for a score field and shows win/loss rates
-- above vs below each cutoff.
-- Usage: SELECT * FROM fn_cal_threshold_sensitivity('score_pain');

CREATE OR REPLACE FUNCTION public.fn_cal_threshold_sensitivity(
  p_score_field text,
  p_cutoffs     numeric[] DEFAULT ARRAY[20, 30, 40, 50, 60, 70, 80]
)
RETURNS TABLE (
  cutoff              numeric,
  above_count         bigint,
  above_won           bigint,
  above_lost          bigint,
  above_win_rate      numeric,
  above_loss_rate     numeric,
  below_count         bigint,
  below_won           bigint,
  below_lost          bigint,
  below_win_rate      numeric,
  below_loss_rate     numeric,
  separation_score    numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF p_score_field NOT IN (
    'score_pain', 'score_maturity', 'score_urgency',
    'score_fit', 'score_budget_readiness', 'score_objection', 'score_total'
  ) THEN
    RAISE EXCEPTION 'Invalid score field: %', p_score_field;
  END IF;

  RETURN QUERY EXECUTE format(
    $q$
    WITH cutoffs AS (
      SELECT unnest($1) AS cutoff
    ),
    base AS (
      SELECT %I AS score_val, outcome
      FROM v_sales_calibration_dataset
    )
    SELECT
      c.cutoff,
      -- Above cutoff
      count(*) FILTER (WHERE b.score_val >= c.cutoff),
      count(*) FILTER (WHERE b.score_val >= c.cutoff AND b.outcome = 'won'),
      count(*) FILTER (WHERE b.score_val >= c.cutoff AND b.outcome = 'lost'),
      CASE WHEN count(*) FILTER (WHERE b.score_val >= c.cutoff) > 0
        THEN round(
          count(*) FILTER (WHERE b.score_val >= c.cutoff AND b.outcome = 'won')::numeric /
          count(*) FILTER (WHERE b.score_val >= c.cutoff), 4)
        ELSE 0 END,
      CASE WHEN count(*) FILTER (WHERE b.score_val >= c.cutoff) > 0
        THEN round(
          count(*) FILTER (WHERE b.score_val >= c.cutoff AND b.outcome = 'lost')::numeric /
          count(*) FILTER (WHERE b.score_val >= c.cutoff), 4)
        ELSE 0 END,
      -- Below cutoff
      count(*) FILTER (WHERE b.score_val < c.cutoff),
      count(*) FILTER (WHERE b.score_val < c.cutoff AND b.outcome = 'won'),
      count(*) FILTER (WHERE b.score_val < c.cutoff AND b.outcome = 'lost'),
      CASE WHEN count(*) FILTER (WHERE b.score_val < c.cutoff) > 0
        THEN round(
          count(*) FILTER (WHERE b.score_val < c.cutoff AND b.outcome = 'won')::numeric /
          count(*) FILTER (WHERE b.score_val < c.cutoff), 4)
        ELSE 0 END,
      CASE WHEN count(*) FILTER (WHERE b.score_val < c.cutoff) > 0
        THEN round(
          count(*) FILTER (WHERE b.score_val < c.cutoff AND b.outcome = 'lost')::numeric /
          count(*) FILTER (WHERE b.score_val < c.cutoff), 4)
        ELSE 0 END,
      -- Separation: |win_rate_above - win_rate_below| — higher = better discriminator
      CASE WHEN count(*) FILTER (WHERE b.score_val >= c.cutoff) > 0
            AND count(*) FILTER (WHERE b.score_val < c.cutoff) > 0
        THEN round(abs(
          count(*) FILTER (WHERE b.score_val >= c.cutoff AND b.outcome = 'won')::numeric /
          count(*) FILTER (WHERE b.score_val >= c.cutoff)
          -
          count(*) FILTER (WHERE b.score_val < c.cutoff AND b.outcome = 'won')::numeric /
          count(*) FILTER (WHERE b.score_val < c.cutoff)
        ), 4)
        ELSE 0 END AS separation_score
    FROM cutoffs c
    CROSS JOIN base b
    GROUP BY c.cutoff
    ORDER BY c.cutoff
    $q$,
    p_score_field
  ) USING p_cutoffs;
END;
$$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 4: INTERPRETATION FRAMEWORK
-- ═══════════════════════════════════════════════════════════════════════════════
-- Deterministic signal classification based on parameterizable thresholds.
-- Returns a structured assessment for each score dimension and objection type.

CREATE OR REPLACE FUNCTION public.fn_cal_interpret_signals(
  p_strong_positive_threshold numeric DEFAULT 0.65,
  p_strong_negative_threshold numeric DEFAULT 0.65,
  p_min_sample_size           integer DEFAULT 5
)
RETURNS TABLE (
  signal_source   text,
  signal_name     text,
  sample_size     bigint,
  win_rate        numeric,
  loss_rate       numeric,
  classification  text,
  confidence      text,
  recommendation  text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Score dimension signals (using optimal threshold from sensitivity analysis)
  WITH score_signals AS (
    SELECT
      'score_dimension' AS signal_source,
      dim.field_name    AS signal_name,
      count(*)          AS sample_size,
      CASE WHEN count(*) > 0
        THEN round(count(*) FILTER (WHERE d.outcome = 'won')::numeric / count(*), 4)
        ELSE 0 END AS win_rate,
      CASE WHEN count(*) > 0
        THEN round(count(*) FILTER (WHERE d.outcome = 'lost')::numeric / count(*), 4)
        ELSE 0 END AS loss_rate
    FROM v_sales_calibration_dataset d
    CROSS JOIN (VALUES
      ('high_pain',             'score_pain >= 60'),
      ('low_pain',              'score_pain < 30'),
      ('high_maturity',         'score_maturity >= 60'),
      ('low_maturity',          'score_maturity < 40'),
      ('high_urgency',          'score_urgency >= 40'),
      ('low_urgency',           'score_urgency < 20'),
      ('high_fit',              'score_fit > 50'),
      ('low_fit',               'score_fit <= 25'),
      ('high_budget_readiness', 'score_budget_readiness > 50'),
      ('low_budget_readiness',  'score_budget_readiness <= 25')
    ) AS dim(field_name, condition)
    WHERE CASE dim.field_name
      WHEN 'high_pain'             THEN d.score_pain >= 60
      WHEN 'low_pain'              THEN d.score_pain < 30
      WHEN 'high_maturity'         THEN d.score_maturity >= 60
      WHEN 'low_maturity'          THEN d.score_maturity < 40
      WHEN 'high_urgency'          THEN d.score_urgency >= 40
      WHEN 'low_urgency'           THEN d.score_urgency < 20
      WHEN 'high_fit'              THEN d.score_fit > 50
      WHEN 'low_fit'               THEN d.score_fit <= 25
      WHEN 'high_budget_readiness' THEN d.score_budget_readiness > 50
      WHEN 'low_budget_readiness'  THEN d.score_budget_readiness <= 25
      ELSE false
    END
    GROUP BY dim.field_name
  ),
  -- Objection presence signals
  objection_signals AS (
    SELECT
      'objection_presence' AS signal_source,
      t.objection_type::text AS signal_name,
      count(*) AS sample_size,
      CASE WHEN count(*) > 0
        THEN round(count(*) FILTER (WHERE d.outcome = 'won')::numeric / count(*), 4)
        ELSE 0 END AS win_rate,
      CASE WHEN count(*) > 0
        THEN round(count(*) FILTER (WHERE d.outcome = 'lost')::numeric / count(*), 4)
        ELSE 0 END AS loss_rate
    FROM v_sales_calibration_dataset d
    CROSS JOIN (SELECT unnest(enum_range(NULL::sales_objection_type)) AS objection_type) t
    WHERE t.objection_type::text = ANY(d.objection_types)
    GROUP BY t.objection_type
  ),
  -- Combo signals
  combo_signals AS (
    SELECT
      'combo' AS signal_source,
      combo_name AS signal_name,
      total_sessions AS sample_size,
      win_rate,
      loss_rate
    FROM fn_cal_combo_analysis()
  ),
  all_signals AS (
    SELECT * FROM score_signals
    UNION ALL
    SELECT * FROM objection_signals
    UNION ALL
    SELECT * FROM combo_signals
  )
  SELECT
    a.signal_source,
    a.signal_name,
    a.sample_size,
    a.win_rate,
    a.loss_rate,
    -- Classification
    CASE
      WHEN a.sample_size < p_min_sample_size THEN 'insufficient_data'
      WHEN a.win_rate >= p_strong_positive_threshold THEN 'strong_positive'
      WHEN a.loss_rate >= p_strong_negative_threshold THEN 'strong_negative'
      WHEN a.win_rate >= 0.50 THEN 'weak_positive'
      WHEN a.loss_rate >= 0.50 THEN 'weak_negative'
      ELSE 'neutral'
    END,
    -- Confidence label
    CASE
      WHEN a.sample_size < p_min_sample_size THEN 'low'
      WHEN a.sample_size < 15 THEN 'medium'
      WHEN a.sample_size < 30 THEN 'high'
      ELSE 'very_high'
    END,
    -- Actionable recommendation
    CASE
      WHEN a.sample_size < p_min_sample_size THEN 'Collect more data before acting'
      WHEN a.win_rate >= p_strong_positive_threshold THEN 'KEEP: strong win predictor — consider increasing weight'
      WHEN a.loss_rate >= p_strong_negative_threshold THEN 'FLAG: strong loss predictor — review and adjust rules'
      WHEN a.win_rate >= 0.50 AND a.loss_rate < 0.30 THEN 'MONITOR: positive trend — may strengthen with more data'
      WHEN a.loss_rate >= 0.50 AND a.win_rate < 0.30 THEN 'MONITOR: negative trend — watch for confirmation'
      ELSE 'NEUTRAL: no clear signal — low calibration priority'
    END
  FROM all_signals a
  ORDER BY
    CASE a.signal_source
      WHEN 'score_dimension' THEN 1
      WHEN 'objection_presence' THEN 2
      WHEN 'combo' THEN 3
    END,
    a.sample_size DESC;
$$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 5: RULE VERSIONING SYSTEM
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.sales_rule_versions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_number  integer NOT NULL,
  description     text NOT NULL,
  changes         jsonb NOT NULL,         -- structured diff of what changed
  scoring_snapshot  jsonb,                 -- full dump of sales_scoring_rules at time of version
  objection_snapshot jsonb,               -- full dump of sales_objection_rules at time of version
  threshold_snapshot jsonb,               -- key thresholds used in recommendations
  baseline_metrics  jsonb,                -- win_rate, loss_rate, avg_score at time of creation
  created_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_srv_version_number
  ON public.sales_rule_versions (version_number);

-- Enable RLS on the new table (consistent with all sales_* tables)
ALTER TABLE public.sales_rule_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sales_rule_versions_internal ON public.sales_rule_versions;
CREATE POLICY sales_rule_versions_internal ON public.sales_rule_versions
  FOR ALL USING (public.fn_is_internal_admin());


-- ─── 5a. Snapshot current rules into a version ──────────────────────────────

CREATE OR REPLACE FUNCTION public.fn_cal_create_version(
  p_description text,
  p_changes     jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_next_version integer;
  v_version_id   uuid;
  v_scoring      jsonb;
  v_objections   jsonb;
  v_metrics      jsonb;
BEGIN
  PERFORM public._ensure_internal();

  -- Next version number
  SELECT coalesce(max(version_number), 0) + 1
  INTO v_next_version
  FROM public.sales_rule_versions;

  -- Snapshot scoring rules
  SELECT jsonb_agg(row_to_json(r))
  INTO v_scoring
  FROM (
    SELECT id, name, score_field, weight, operator, answer_option_id,
           question_id, is_active, priority
    FROM public.sales_scoring_rules
    WHERE is_active = true
    ORDER BY score_field, priority
  ) r;

  -- Snapshot objection rules
  SELECT jsonb_agg(row_to_json(r))
  INTO v_objections
  FROM (
    SELECT id, name, objection_type, base_confidence, operator,
           answer_option_id, question_id, is_active, priority
    FROM public.sales_objection_rules
    WHERE is_active = true
    ORDER BY objection_type, priority
  ) r;

  -- Baseline metrics from current dataset
  SELECT jsonb_build_object(
    'total_sessions', count(*),
    'win_rate',       round(count(*) FILTER (WHERE outcome = 'won')::numeric / GREATEST(count(*), 1), 4),
    'loss_rate',      round(count(*) FILTER (WHERE outcome = 'lost')::numeric / GREATEST(count(*), 1), 4),
    'no_decision_rate', round(count(*) FILTER (WHERE outcome = 'no_decision')::numeric / GREATEST(count(*), 1), 4),
    'avg_score_pain', round(avg(score_pain)::numeric, 2),
    'avg_score_maturity', round(avg(score_maturity)::numeric, 2),
    'avg_score_urgency', round(avg(score_urgency)::numeric, 2),
    'avg_score_fit', round(avg(score_fit)::numeric, 2),
    'avg_score_budget_readiness', round(avg(score_budget_readiness)::numeric, 2),
    'avg_objection_count', round(avg(objection_count)::numeric, 2)
  )
  INTO v_metrics
  FROM v_sales_calibration_dataset;

  INSERT INTO public.sales_rule_versions
    (version_number, description, changes, scoring_snapshot, objection_snapshot, baseline_metrics, created_by)
  VALUES
    (v_next_version, p_description, p_changes, v_scoring, v_objections, v_metrics, auth.uid())
  RETURNING id INTO v_version_id;

  RETURN v_version_id;
END;
$$;


-- ─── 5b. Compare two versions ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.fn_cal_compare_versions(
  p_version_a integer,
  p_version_b integer
)
RETURNS TABLE (
  category       text,
  metric         text,
  version_a_val  text,
  version_b_val  text,
  delta          text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH va AS (
    SELECT * FROM public.sales_rule_versions WHERE version_number = p_version_a
  ),
  vb AS (
    SELECT * FROM public.sales_rule_versions WHERE version_number = p_version_b
  )
  SELECT
    'baseline_metrics' AS category,
    m.key AS metric,
    (va.baseline_metrics ->> m.key) AS version_a_val,
    (vb.baseline_metrics ->> m.key) AS version_b_val,
    CASE
      WHEN (va.baseline_metrics ->> m.key) ~ '^\d+\.?\d*$'
       AND (vb.baseline_metrics ->> m.key) ~ '^\d+\.?\d*$'
      THEN round(
        (vb.baseline_metrics ->> m.key)::numeric - (va.baseline_metrics ->> m.key)::numeric,
        4)::text
      ELSE 'N/A'
    END AS delta
  FROM va, vb,
  LATERAL (
    SELECT DISTINCT key FROM (
      SELECT key FROM jsonb_object_keys(va.baseline_metrics) AS key
      UNION
      SELECT key FROM jsonb_object_keys(vb.baseline_metrics) AS key
    ) sub
  ) m

  UNION ALL

  SELECT
    'rule_counts',
    'scoring_rules_active',
    jsonb_array_length(coalesce(va.scoring_snapshot, '[]'::jsonb))::text,
    jsonb_array_length(coalesce(vb.scoring_snapshot, '[]'::jsonb))::text,
    (jsonb_array_length(coalesce(vb.scoring_snapshot, '[]'::jsonb)) -
     jsonb_array_length(coalesce(va.scoring_snapshot, '[]'::jsonb)))::text
  FROM va, vb

  UNION ALL

  SELECT
    'rule_counts',
    'objection_rules_active',
    jsonb_array_length(coalesce(va.objection_snapshot, '[]'::jsonb))::text,
    jsonb_array_length(coalesce(vb.objection_snapshot, '[]'::jsonb))::text,
    (jsonb_array_length(coalesce(vb.objection_snapshot, '[]'::jsonb)) -
     jsonb_array_length(coalesce(va.objection_snapshot, '[]'::jsonb)))::text
  FROM va, vb

  ORDER BY category, metric;
$$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 6: FULL CALIBRATION REPORT
-- ═══════════════════════════════════════════════════════════════════════════════
-- Single entry point that runs all analysis and returns a structured JSON report.
-- Usage: SELECT fn_cal_run_calibration_report();

CREATE OR REPLACE FUNCTION public.fn_cal_run_calibration_report(
  p_min_sample_size integer DEFAULT 5
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_report jsonb;
  v_dataset_count bigint;
  v_outcome_dist jsonb;
  v_orphan_count bigint;
  v_score_buckets jsonb;
  v_objection_outcomes jsonb;
  v_combo_analysis jsonb;
  v_thresholds jsonb;
  v_signals jsonb;
  v_suggestions jsonb;
BEGIN
  PERFORM public._ensure_internal();

  -- ── Data validation ────────────────────────────────────────────────────────
  SELECT count(*) INTO v_dataset_count FROM v_sales_calibration_dataset;

  SELECT jsonb_build_object(
    'won',         count(*) FILTER (WHERE outcome = 'won'),
    'lost',        count(*) FILTER (WHERE outcome = 'lost'),
    'no_decision', count(*) FILTER (WHERE outcome = 'no_decision'),
    'total',       count(*)
  ) INTO v_outcome_dist
  FROM v_sales_calibration_dataset;

  -- Orphans: completed sessions without any outcome
  SELECT count(*) INTO v_orphan_count
  FROM public.sales_sessions s
  WHERE s.status = 'completed'
    AND s.deleted_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.sales_session_outcomes o WHERE o.session_id = s.id
    );

  -- ── Score bucket analysis (all dimensions) ─────────────────────────────────
  SELECT jsonb_object_agg(dim, buckets) INTO v_score_buckets
  FROM (
    SELECT
      dim,
      jsonb_agg(row_to_json(b) ORDER BY b.bucket_floor) AS buckets
    FROM (VALUES
      ('score_pain'), ('score_maturity'), ('score_urgency'),
      ('score_fit'), ('score_budget_readiness'), ('score_objection')
    ) AS dims(dim)
    CROSS JOIN LATERAL fn_cal_score_buckets(dim, 15) b
    GROUP BY dim
  ) sub;

  -- ── Objection outcomes ─────────────────────────────────────────────────────
  SELECT jsonb_agg(row_to_json(r)) INTO v_objection_outcomes
  FROM fn_cal_objection_outcomes() r;

  -- ── Combo analysis ─────────────────────────────────────────────────────────
  SELECT jsonb_agg(row_to_json(r)) INTO v_combo_analysis
  FROM fn_cal_combo_analysis() r;

  -- ── Threshold sensitivity (all dimensions) ─────────────────────────────────
  SELECT jsonb_object_agg(dim, thresholds) INTO v_thresholds
  FROM (
    SELECT
      dim,
      jsonb_agg(row_to_json(t) ORDER BY t.cutoff) AS thresholds
    FROM (VALUES
      ('score_pain'), ('score_maturity'), ('score_urgency'),
      ('score_fit'), ('score_budget_readiness')
    ) AS dims(dim)
    CROSS JOIN LATERAL fn_cal_threshold_sensitivity(dim) t
    GROUP BY dim
  ) sub;

  -- ── Signal interpretation ──────────────────────────────────────────────────
  SELECT jsonb_agg(row_to_json(r)) INTO v_signals
  FROM fn_cal_interpret_signals(0.65, 0.65, p_min_sample_size) r;

  -- ── Calibration suggestions (auto-generated from signals) ──────────────────
  SELECT jsonb_build_object(
    'scoring_weight_changes',
    (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'signal', signal_name,
      'current_classification', classification,
      'action', recommendation,
      'win_rate', win_rate,
      'loss_rate', loss_rate,
      'sample_size', sample_size
    )), '[]'::jsonb)
    FROM fn_cal_interpret_signals(0.65, 0.65, p_min_sample_size)
    WHERE signal_source = 'score_dimension'
      AND classification IN ('strong_positive', 'strong_negative')),

    'objection_adjustments',
    (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'objection_type', signal_name,
      'classification', classification,
      'action', recommendation,
      'win_rate', win_rate,
      'loss_rate', loss_rate,
      'sample_size', sample_size
    )), '[]'::jsonb)
    FROM fn_cal_interpret_signals(0.65, 0.65, p_min_sample_size)
    WHERE signal_source = 'objection_presence'
      AND classification != 'neutral'),

    'recommendation_mapping',
    (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'pattern', signal_name,
      'classification', classification,
      'suggested_action', recommendation,
      'win_rate', win_rate,
      'loss_rate', loss_rate
    )), '[]'::jsonb)
    FROM fn_cal_interpret_signals(0.65, 0.65, p_min_sample_size)
    WHERE signal_source = 'combo'
      AND classification IN ('strong_positive', 'strong_negative')),

    'optimal_thresholds',
    (SELECT jsonb_object_agg(dim,
      (SELECT row_to_json(best)
       FROM (
         SELECT cutoff, separation_score, above_win_rate, below_win_rate
         FROM fn_cal_threshold_sensitivity(dim)
         WHERE above_count >= p_min_sample_size AND below_count >= p_min_sample_size
         ORDER BY separation_score DESC
         LIMIT 1
       ) best
      )
    )
    FROM (VALUES
      ('score_pain'), ('score_maturity'), ('score_urgency'),
      ('score_fit'), ('score_budget_readiness')
    ) AS dims(dim))
  ) INTO v_suggestions;

  -- ── Assemble report ────────────────────────────────────────────────────────
  v_report := jsonb_build_object(
    'generated_at',        now(),
    'dataset_size',        v_dataset_count,
    'minimum_sample_size', p_min_sample_size,

    'data_validation', jsonb_build_object(
      'outcome_distribution', v_outcome_dist,
      'orphan_sessions',      v_orphan_count
    ),

    'score_buckets',         v_score_buckets,
    'objection_outcomes',    v_objection_outcomes,
    'combo_analysis',        v_combo_analysis,
    'threshold_sensitivity', v_thresholds,
    'signal_interpretation', v_signals,
    'calibration_suggestions', v_suggestions
  );

  RETURN v_report;
END;
$$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 7: RECORD OUTCOME RPC
-- ═══════════════════════════════════════════════════════════════════════════════
-- Convenience function to record an outcome for a completed session.
-- Upserts (one outcome per session).

CREATE OR REPLACE FUNCTION public.fn_sales_record_outcome(
  p_session_id  uuid,
  p_outcome     text,
  p_reason      text DEFAULT NULL,
  p_deal_value  numeric DEFAULT NULL,
  p_close_date  date DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_status  text;
  v_id      uuid;
BEGIN
  PERFORM public._ensure_internal();

  -- Validate session exists and is completed
  SELECT status::text INTO v_status
  FROM public.sales_sessions WHERE id = p_session_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found: %', p_session_id;
  END IF;

  IF v_status != 'completed' THEN
    RAISE EXCEPTION 'Cannot record outcome for session with status: %', v_status;
  END IF;

  -- Validate outcome value
  IF p_outcome NOT IN ('won', 'lost', 'no_decision') THEN
    RAISE EXCEPTION 'Invalid outcome: %. Must be won, lost, or no_decision', p_outcome;
  END IF;

  -- Upsert outcome
  INSERT INTO public.sales_session_outcomes
    (session_id, outcome, reason, deal_value, close_date, created_by)
  VALUES
    (p_session_id, p_outcome, p_reason, p_deal_value, p_close_date, auth.uid())
  ON CONFLICT (session_id) DO UPDATE SET
    outcome    = EXCLUDED.outcome,
    reason     = EXCLUDED.reason,
    deal_value = EXCLUDED.deal_value,
    close_date = EXCLUDED.close_date,
    updated_at = now()
  RETURNING id INTO v_id;

  -- Log event
  INSERT INTO public.sales_session_events (session_id, event_type, payload, created_by)
  VALUES (
    p_session_id,
    'outcome_recorded',
    jsonb_build_object(
      'outcome',    p_outcome,
      'reason',     p_reason,
      'deal_value', p_deal_value,
      'close_date', p_close_date
    ),
    auth.uid()
  );

  RETURN v_id;
END;
$$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- GRANTS
-- ═══════════════════════════════════════════════════════════════════════════════

GRANT SELECT ON public.v_sales_calibration_dataset TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.fn_cal_score_buckets(text, numeric) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_cal_objection_outcomes() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_cal_combo_analysis() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_cal_threshold_sensitivity(text, numeric[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_cal_interpret_signals(numeric, numeric, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_cal_create_version(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_cal_compare_versions(integer, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_cal_run_calibration_report(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_sales_record_outcome(uuid, text, text, numeric, date) TO authenticated, service_role;

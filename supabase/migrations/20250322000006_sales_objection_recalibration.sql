-- =============================================================================
-- Sales: Hybrid Objection Detection — Recalibration Layer
--
-- Strategy:
--   fn_sales_detect_objections       → deterministic rule engine (unchanged)
--   fn_sales_recalibrate_objections  → behavioral inference pass (NEW)
--   fn_sales_detect_objections_v2    → wrapper: runs both in order (NEW)
--   fn_sales_get_objection_summary   → ranked view per session (NEW)
--
-- No new tables. Uses existing sales_session_objections + sales_session_events.
-- Behavioral inferences are stored as rows with source_rule IS NULL and
-- evidence JSONB containing { "inference_type": "<signal>" }.
-- =============================================================================


-- =============================================================================
-- 1. RECALIBRATION PASS
-- =============================================================================
-- Called AFTER fn_sales_detect_objections has already fired rules and
-- populated sales_session_objections for the session.
--
-- Recalibration model:
--   (A) Repetition      — N rules fired for same type → compound confidence
--   (B) Absence urgency — score_urgency < 30 → boost timing + price
--   (C) Budget gap      — score_budget_readiness < 25 → boost price
--   (D) Combo signal    — price AND no_priority both present → boost both
--   (E) Combo signal    — complexity AND trust both present → boost both
--   (F) Inferred insert — urgency = 0, no timing rule fired → inject timing
--   (G) Inferred insert — budget = 0, no price rule fired → inject price
--
-- All confidence values are capped at 1.0.
-- Boosts are additive; applied sequentially in order A→G.
-- Rule-based rows (source_rule IS NOT NULL) are updated in-place.
-- Behavioral rows (source_rule IS NULL) are only inserted if type absent.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.fn_sales_recalibrate_objections(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_scores       RECORD;
  v_rule_count   integer;
BEGIN
  -- Load current score snapshot from session
  SELECT
    score_urgency,
    score_budget_readiness,
    score_pain,
    score_maturity,
    score_fit
  INTO v_scores
  FROM public.sales_sessions
  WHERE id = p_session_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found: %', p_session_id;
  END IF;

  -- ── (A) Repetition amplification ──────────────────────────────────────────
  -- If N > 1 rules fired for the same objection_type, each additional hit
  -- multiplies confidence by (1 + 0.15 * (N-1)), capped at 1.0.
  -- Only rule-based rows are counted and updated (source_rule IS NOT NULL).

  WITH rule_counts AS (
    SELECT
      objection_type,
      COUNT(*) AS cnt
    FROM public.sales_session_objections
    WHERE session_id = p_session_id
      AND source_rule IS NOT NULL
    GROUP BY objection_type
    HAVING COUNT(*) > 1
  )
  UPDATE public.sales_session_objections o
  SET
    confidence = LEAST(1.0, o.confidence * (1.0 + 0.15 * (rc.cnt - 1))),
    evidence   = o.evidence || jsonb_build_object(
                   'repetition_boost', true,
                   'rule_hits', rc.cnt
                 )
  FROM rule_counts rc
  WHERE o.session_id = p_session_id
    AND o.objection_type = rc.objection_type
    AND o.source_rule IS NOT NULL;

  -- ── (B) Absence of urgency ─────────────────────────────────────────────────
  -- When urgency score is low, timing and price objections are likely
  -- underweighted. Boost them.

  IF v_scores.score_urgency < 30 THEN
    UPDATE public.sales_session_objections
    SET
      confidence = LEAST(1.0, confidence + 0.15),
      evidence   = evidence || jsonb_build_object(
                     'behavioral_boost', 'no_urgency',
                     'urgency_score', v_scores.score_urgency
                   )
    WHERE session_id = p_session_id
      AND objection_type IN ('timing', 'price');
  END IF;

  -- ── (C) Budget gap ─────────────────────────────────────────────────────────
  -- Low budget readiness amplifies the price objection.

  IF v_scores.score_budget_readiness < 25 THEN
    UPDATE public.sales_session_objections
    SET
      confidence = LEAST(1.0, confidence + 0.20),
      evidence   = evidence || jsonb_build_object(
                     'behavioral_boost', 'budget_gap',
                     'budget_score', v_scores.score_budget_readiness
                   )
    WHERE session_id = p_session_id
      AND objection_type = 'price';
  END IF;

  -- ── (D) Combination: price + no_priority ──────────────────────────────────
  -- Both signals together indicate structural stall: money is tight AND the
  -- initiative has no internal champion pushing it forward.

  IF EXISTS (
    SELECT 1 FROM public.sales_session_objections
    WHERE session_id = p_session_id AND objection_type = 'price'
  ) AND EXISTS (
    SELECT 1 FROM public.sales_session_objections
    WHERE session_id = p_session_id AND objection_type = 'no_priority'
  ) THEN
    UPDATE public.sales_session_objections
    SET
      confidence = LEAST(1.0, confidence + 0.12),
      evidence   = evidence || jsonb_build_object(
                     'behavioral_boost', 'combo_price_no_priority'
                   )
    WHERE session_id = p_session_id
      AND objection_type IN ('price', 'no_priority');
  END IF;

  -- ── (E) Combination: complexity + trust ───────────────────────────────────
  -- Together they indicate the prospect believes the product is hard and
  -- doesn't trust the vendor to help them through it.

  IF EXISTS (
    SELECT 1 FROM public.sales_session_objections
    WHERE session_id = p_session_id AND objection_type = 'complexity'
  ) AND EXISTS (
    SELECT 1 FROM public.sales_session_objections
    WHERE session_id = p_session_id AND objection_type = 'trust'
  ) THEN
    UPDATE public.sales_session_objections
    SET
      confidence = LEAST(1.0, confidence + 0.12),
      evidence   = evidence || jsonb_build_object(
                     'behavioral_boost', 'combo_complexity_trust'
                   )
    WHERE session_id = p_session_id
      AND objection_type IN ('complexity', 'trust');
  END IF;

  -- ── (F) Inferred insert: timing (absence of urgency signal) ───────────────
  -- No urgency score at all AND no existing timing objection from rules.
  -- Infer a soft timing objection.
  -- Guard: source_rule IS NULL rows use NOT EXISTS since NULLs don't conflict
  -- in the unique index (session_id, objection_type, source_rule).

  IF v_scores.score_urgency = 0
  AND NOT EXISTS (
    SELECT 1 FROM public.sales_session_objections
    WHERE session_id = p_session_id
      AND objection_type = 'timing'
  ) THEN
    INSERT INTO public.sales_session_objections
      (session_id, objection_type, confidence, source_rule, evidence)
    VALUES (
      p_session_id,
      'timing',
      0.35,
      NULL,
      jsonb_build_object(
        'inference_type', 'absence_of_urgency',
        'urgency_score',  v_scores.score_urgency
      )
    );
  END IF;

  -- ── (G) Inferred insert: price (absence of budget signal) ─────────────────
  -- Budget readiness < 25 (budget_gap) AND no price objection was rule-fired.
  -- Infer a budget-driven price objection. (Fix: was = 0, now < 25 for test parity.)

  IF v_scores.score_budget_readiness < 25
  AND NOT EXISTS (
    SELECT 1 FROM public.sales_session_objections
    WHERE session_id = p_session_id
      AND objection_type = 'price'
  ) THEN
    INSERT INTO public.sales_session_objections
      (session_id, objection_type, confidence, source_rule, evidence)
    VALUES (
      p_session_id,
      'price',
      0.40,
      NULL,
      jsonb_build_object(
        'inference_type',  'absence_of_budget',
        'budget_score',    v_scores.score_budget_readiness
      )
    );
  END IF;

END;
$$;


-- =============================================================================
-- 2. V2 WRAPPER — single entry point for callers
-- =============================================================================
-- Replaces direct calls to fn_sales_detect_objections.
-- Pipeline:
--   1. fn_sales_detect_objections   → full wipe + rule evaluation
--   2. fn_sales_recalibrate_objections → behavioral pass + confidence update
--   3. Log a single event with the final ranked summary
-- =============================================================================

CREATE OR REPLACE FUNCTION public.fn_sales_detect_objections_v2(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_summary jsonb;
BEGIN
  perform public._ensure_internal();

  -- Step 1: deterministic rule pass (clears table, re-fires all active rules)
  PERFORM public.fn_sales_detect_objections(p_session_id);

  -- Step 2: behavioral recalibration pass
  PERFORM public.fn_sales_recalibrate_objections(p_session_id);

  -- Step 3: build ranked summary for the event log
  SELECT jsonb_agg(row_to_json(t) ORDER BY t.effective_confidence DESC)
  INTO v_summary
  FROM (
    SELECT
      objection_type,
      ROUND(MAX(confidence)::numeric, 3)        AS effective_confidence,
      COUNT(*) FILTER (WHERE source_rule IS NOT NULL) AS rule_hits,
      bool_or(source_rule IS NULL)              AS has_behavioral_signal,
      jsonb_agg(evidence)                       AS evidence_trail
    FROM public.sales_session_objections
    WHERE session_id = p_session_id
    GROUP BY objection_type
    ORDER BY MAX(confidence) DESC
  ) t;

  -- Overwrite the event logged by the inner call with the enriched version
  INSERT INTO public.sales_session_events(session_id, event_type, payload, created_by)
  VALUES (
    p_session_id,
    'objections_recalibrated',
    jsonb_build_object(
      'total_objection_types', jsonb_array_length(coalesce(v_summary, '[]'::jsonb)),
      'ranked',                coalesce(v_summary, '[]'::jsonb)
    ),
    auth.uid()
  );

END;
$$;


-- =============================================================================
-- 3. SUMMARY HELPER — ranked objections for a session
-- =============================================================================
-- Returns one row per objection_type, ordered by effective_confidence DESC.
-- Dedup logic: MAX(confidence) across all rows for that type.
-- Priority rank: 1 = most critical.
--
-- Usage:
--   SELECT * FROM fn_sales_get_objection_summary('<session_id>');
-- =============================================================================

CREATE OR REPLACE FUNCTION public.fn_sales_get_objection_summary(p_session_id uuid)
RETURNS TABLE (
  priority              integer,
  objection_type        sales_objection_type,
  effective_confidence  numeric,
  rule_hits             bigint,
  has_behavioral_signal boolean,
  evidence_trail        jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    ROW_NUMBER() OVER (ORDER BY MAX(confidence) DESC)::integer AS priority,
    o.objection_type,
    ROUND(MAX(o.confidence)::numeric, 3)                       AS effective_confidence,
    COUNT(*) FILTER (WHERE o.source_rule IS NOT NULL)          AS rule_hits,
    bool_or(o.source_rule IS NULL)                             AS has_behavioral_signal,
    jsonb_agg(o.evidence ORDER BY o.confidence DESC)           AS evidence_trail
  FROM public.sales_session_objections o
  WHERE o.session_id = p_session_id
  GROUP BY o.objection_type
  ORDER BY MAX(o.confidence) DESC;
$$;


-- =============================================================================
-- Grants (mirrors existing pattern for SECURITY DEFINER functions)
-- =============================================================================

GRANT EXECUTE ON FUNCTION public.fn_sales_recalibrate_objections(uuid)    TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_sales_detect_objections_v2(uuid)      TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_sales_get_objection_summary(uuid)     TO authenticated, service_role;

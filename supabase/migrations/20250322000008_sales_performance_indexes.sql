-- =============================================================================
-- Sales: Performance Indexes + Redundant Write Elimination
--
-- Bottlenecks identified and addressed:
--
-- 1. Recalibration EXISTS checks — no index on (session_id, objection_type)
--    Pattern: WHERE session_id = ? AND objection_type = 'price'  ×4 per run
--    Fix: btree index covering both columns
--
-- 2. Recalibration GROUP BY + MAX(confidence) — index-only scan not possible
--    Pattern: GROUP BY objection_type ORDER BY MAX(confidence) DESC
--    Fix: covering index (session_id, objection_type, confidence)
--    Note: replaces the simple (session_id) index — the covering index serves both
--
-- 3. Rule evaluation: answer_option_id lookup in rule tables
--    Pattern: EXISTS (...WHERE question_id = ? AND answer_option_id = ANY(...))
--    Rule tables are small but the FK column has no index
--    Fix: partial btree index WHERE answer_option_id IS NOT NULL
--
-- 4. Admin Panel session list — soft-delete filter not indexed
--    Pattern: WHERE organization_id = ? AND deleted_at IS NULL ORDER BY created_at DESC
--    Existing idx_ss_org covers organization_id but not deleted_at or sort
--    Fix: partial covering index on (organization_id, created_at DESC) WHERE deleted_at IS NULL
--
-- 5. Pipeline filter: status + stage in pipeline board query
--    Pattern: WHERE organization_id = ? AND status = 'draft' AND deleted_at IS NULL
--    Fix: partial composite index (organization_id, status, commercial_stage) WHERE deleted_at IS NULL
--
-- 6. Redundant event: fn_sales_detect_objections logs 'objections_detected',
--    then fn_sales_detect_objections_v2 immediately logs 'objections_recalibrated'.
--    Two INSERT INTO sales_session_events per finalize call.
--    Fix: delete the inner event in v2 before writing the enriched version.
--
-- NOT changed:
--   - sales_session_scores dual-write — table kept for external audit consumers
--   - user_roles (auth via is_admin()) — no index needed for Sales; RPCs use _ensure_internal
--   - uq_answer_per_question — already covers rule inner EXISTS correctly
-- =============================================================================


-- =============================================================================
-- 1. sales_session_objections: covering index for recalibration + summary
-- =============================================================================
-- Replaces the simple idx_sso_session. The covering index on
-- (session_id, objection_type, confidence) supports:
--   - EXISTS checks by (session_id, objection_type)          — recalibration
--   - UPDATE WHERE session_id = ? AND objection_type IN (...) — recalibration
--   - GROUP BY objection_type ORDER BY MAX(confidence) DESC   — get_objection_summary
--   - SELECT WHERE session_id = ? (prefix scan)              — all existing queries

DROP INDEX IF EXISTS public.idx_sso_session;

CREATE INDEX idx_sso_session_type_conf
  ON public.sales_session_objections (session_id, objection_type, confidence DESC);


-- =============================================================================
-- 2. sales_scoring_rules: index on answer_option_id for rule evaluation
-- =============================================================================
-- Rule loop pattern:
--   FOR v_rule IN SELECT * FROM sales_scoring_rules WHERE questionnaire_id = ? ...
--   THEN: EXISTS (SELECT 1 FROM sales_session_answers WHERE ... AND v_rule.answer_option_id = ANY(...))
-- The EXISTS uses the answer table's unique index. But for rules that target
-- a specific option, a filter index lets the planner skip null-option rules
-- when building the rule set (less relevant now, important if rules grow to 100+).

CREATE INDEX IF NOT EXISTS idx_ssr_answer_option
  ON public.sales_scoring_rules (answer_option_id)
  WHERE answer_option_id IS NOT NULL;


-- =============================================================================
-- 3. sales_objection_rules: same pattern as scoring rules
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_sor_answer_option
  ON public.sales_objection_rules (answer_option_id)
  WHERE answer_option_id IS NOT NULL;


-- =============================================================================
-- 4. sales_sessions: partial covering index for list queries
-- =============================================================================
-- Primary Admin Panel list query:
--   SELECT ... FROM sales_sessions
--   WHERE organization_id = ? AND deleted_at IS NULL
--   ORDER BY created_at DESC
--
-- Existing idx_ss_org(organization_id) does not include deleted_at or created_at.
-- Planner must filter + sort separately. This partial covering index enables
-- an index-only scan for the list query.

CREATE INDEX IF NOT EXISTS idx_ss_org_active_created
  ON public.sales_sessions (organization_id, created_at DESC)
  WHERE deleted_at IS NULL;


-- =============================================================================
-- 5. sales_sessions: pipeline board query (status + stage filter)
-- =============================================================================
-- Admin pipeline board query:
--   SELECT ... FROM sales_sessions
--   WHERE organization_id = ? AND status = 'draft' AND deleted_at IS NULL
--
-- Existing idx_ss_status and idx_ss_stage are single-column — planner picks one
-- and post-filters with the other. A composite partial index eliminates the post-filter.

CREATE INDEX IF NOT EXISTS idx_ss_org_status_stage
  ON public.sales_sessions (organization_id, status, commercial_stage)
  WHERE deleted_at IS NULL;


-- =============================================================================
-- 6. fn_sales_detect_objections_v2: eliminate redundant event write
-- =============================================================================
-- Current behavior:
--   fn_sales_detect_objections()    → INSERT event 'objections_detected'
--   fn_sales_detect_objections_v2() → INSERT event 'objections_recalibrated'
-- = 2 events per finalize, first one has no value when called via v2.
--
-- Fix: delete the inner event immediately after the inner call, before
-- writing the richer 'objections_recalibrated' event.

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

  -- Step 1: deterministic rule pass (clears objections table, re-fires all rules)
  PERFORM public.fn_sales_detect_objections(p_session_id);

  -- Remove the generic event the inner function just wrote — we will log
  -- a richer version below after recalibration.
  DELETE FROM public.sales_session_events
  WHERE session_id = p_session_id
    AND event_type  = 'objections_detected';

  -- Step 2: behavioral recalibration
  PERFORM public.fn_sales_recalibrate_objections(p_session_id);

  -- Step 3: build enriched ranked summary for the audit log
  SELECT jsonb_agg(row_to_json(t) ORDER BY t.effective_confidence DESC)
  INTO v_summary
  FROM (
    SELECT
      objection_type,
      ROUND(MAX(confidence)::numeric, 3)        AS effective_confidence,
      COUNT(*) FILTER (WHERE source_rule IS NOT NULL) AS rule_hits,
      bool_or(source_rule IS NULL)              AS has_behavioral_signal
    FROM public.sales_session_objections
    WHERE session_id = p_session_id
    GROUP BY objection_type
    ORDER BY MAX(confidence) DESC
  ) t;

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

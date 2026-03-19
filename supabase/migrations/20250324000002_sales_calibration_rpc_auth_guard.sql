-- Sales Intelligence — Calibration RPC auth guard
-- Adds _ensure_internal() to calibration RPCs. Requires: 20250324000001, _ensure_internal.

-- ========== fn_cal_validation_summary ==========
CREATE OR REPLACE FUNCTION public.fn_cal_validation_summary()
RETURNS TABLE (
  total_sessions bigint,
  with_outcome bigint,
  without_outcome bigint,
  won bigint,
  lost bigint,
  no_decision bigint,
  win_rate numeric,
  loss_rate numeric,
  no_decision_rate numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public._ensure_internal();
  RETURN QUERY
  WITH ds AS (
    SELECT outcome FROM public.v_sales_calibration_dataset
  ),
  with_outcome AS (
    SELECT COUNT(*) AS n FROM ds WHERE outcome IS NOT NULL
  ),
  wo AS (
    SELECT COUNT(*) AS n FROM ds WHERE outcome IS NULL
  ),
  outcomes AS (
    SELECT
      COUNT(*) FILTER (WHERE outcome = 'won') AS won,
      COUNT(*) FILTER (WHERE outcome = 'lost') AS lost,
      COUNT(*) FILTER (WHERE outcome = 'no_decision') AS no_decision
    FROM ds WHERE outcome IS NOT NULL
  )
  SELECT
    (SELECT COUNT(*) FROM ds)::bigint AS total_sessions,
    (SELECT n FROM with_outcome)::bigint AS with_outcome,
    (SELECT n FROM wo)::bigint AS without_outcome,
    (SELECT won FROM outcomes)::bigint AS won,
    (SELECT lost FROM outcomes)::bigint AS lost,
    (SELECT no_decision FROM outcomes)::bigint AS no_decision,
    CASE WHEN (SELECT n FROM with_outcome) > 0
      THEN (SELECT won FROM outcomes)::numeric / (SELECT n FROM with_outcome)
      ELSE 0 END AS win_rate,
    CASE WHEN (SELECT n FROM with_outcome) > 0
      THEN (SELECT lost FROM outcomes)::numeric / (SELECT n FROM with_outcome)
      ELSE 0 END AS loss_rate,
    CASE WHEN (SELECT n FROM with_outcome) > 0
      THEN (SELECT no_decision FROM outcomes)::numeric / (SELECT n FROM with_outcome)
      ELSE 0 END AS no_decision_rate;
END;
$$;

-- ========== fn_cal_score_bucket_analysis ==========
CREATE OR REPLACE FUNCTION public.fn_cal_score_bucket_analysis()
RETURNS TABLE (
  dimension text,
  bucket text,
  session_count bigint,
  won bigint,
  lost bigint,
  no_decision bigint,
  win_rate numeric,
  signal text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public._ensure_internal();
  RETURN QUERY
  WITH ds AS (
    SELECT outcome, score_pain, score_maturity, score_urgency, score_fit, score_budget_readiness
    FROM public.v_sales_calibration_dataset
    WHERE outcome IS NOT NULL
  ),
  dims AS (
    SELECT 'pain' AS dim, score_pain AS score, outcome FROM ds
    UNION ALL SELECT 'maturity', score_maturity, outcome FROM ds
    UNION ALL SELECT 'urgency', score_urgency, outcome FROM ds
    UNION ALL SELECT 'fit', score_fit, outcome FROM ds
    UNION ALL SELECT 'budget_readiness', score_budget_readiness, outcome FROM ds
  ),
  bucketed AS (
    SELECT dim, outcome,
      CASE
        WHEN score IS NULL OR score < 20 THEN '0-19'
        WHEN score < 40 THEN '20-39'
        WHEN score < 60 THEN '40-59'
        WHEN score < 80 THEN '60-79'
        ELSE '80+'
      END AS bucket
    FROM dims
    WHERE score IS NOT NULL
  )
  SELECT
    b.dim::text AS dimension,
    b.bucket::text AS bucket,
    COUNT(*)::bigint AS session_count,
    COUNT(*) FILTER (WHERE b.outcome = 'won')::bigint AS won,
    COUNT(*) FILTER (WHERE b.outcome = 'lost')::bigint AS lost,
    COUNT(*) FILTER (WHERE b.outcome = 'no_decision')::bigint AS no_decision,
    COUNT(*) FILTER (WHERE b.outcome = 'won')::numeric / NULLIF(COUNT(*), 0) AS win_rate,
    public.fn_sales_interpret_signal(
      COUNT(*) FILTER (WHERE b.outcome = 'won')::numeric / NULLIF(COUNT(*), 0),
      COUNT(*) FILTER (WHERE b.outcome = 'lost')::numeric / NULLIF(COUNT(*), 0),
      COUNT(*)::bigint
    ) AS signal
  FROM bucketed b
  GROUP BY b.dim, b.bucket
  ORDER BY b.dim, b.bucket;
END;
$$;

-- ========== fn_cal_objection_analysis ==========
CREATE OR REPLACE FUNCTION public.fn_cal_objection_analysis()
RETURNS TABLE (
  objection_type text,
  count bigint,
  avg_confidence numeric,
  sessions_with_win bigint,
  sessions_with_loss bigint,
  loss_rate numeric,
  signal text,
  over_triggered boolean,
  high_risk boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public._ensure_internal();
  RETURN QUERY
  WITH sessions_with_outcome AS (
    SELECT s.id AS session_id, o.outcome
    FROM public.sales_sessions s
    JOIN public.sales_session_outcomes o ON o.session_id = s.id
    WHERE s.status = 'completed' AND s.deleted_at IS NULL
  ),
  obj_sessions AS (
    SELECT DISTINCT oo.session_id, oo.objection_type, oo.confidence
    FROM public.sales_session_objections oo
    JOIN sessions_with_outcome swo ON swo.session_id = oo.session_id
  ),
  with_stats AS (
    SELECT
      os.objection_type,
      COUNT(DISTINCT os.session_id)::bigint AS cnt,
      ROUND(AVG(os.confidence)::numeric, 4) AS avg_conf,
      COUNT(DISTINCT os.session_id) FILTER (WHERE swo.outcome = 'won')::bigint AS wins,
      COUNT(DISTINCT os.session_id) FILTER (WHERE swo.outcome = 'lost')::bigint AS losses
    FROM obj_sessions os
    JOIN sessions_with_outcome swo ON swo.session_id = os.session_id
    GROUP BY os.objection_type
  ),
  total_with_outcome AS (
    SELECT COUNT(*) AS n FROM sessions_with_outcome
  ),
  without_stats AS (
    SELECT
      ws.objection_type,
      (SELECT n FROM total_with_outcome) - ws.cnt AS cnt_without,
      (SELECT COUNT(*) FILTER (WHERE outcome = 'won') FROM sessions_with_outcome)
        - ws.wins AS wins_without
    FROM with_stats ws
  )
  SELECT
    ws.objection_type::text AS objection_type,
    ws.cnt::bigint AS count,
    ws.avg_conf AS avg_confidence,
    ws.wins::bigint AS sessions_with_win,
    ws.losses::bigint AS sessions_with_loss,
    (ws.losses::numeric / NULLIF(ws.cnt, 0)) AS loss_rate,
    public.fn_sales_interpret_signal(
      ws.wins::numeric / NULLIF(ws.cnt, 0),
      ws.losses::numeric / NULLIF(ws.cnt, 0),
      ws.cnt::bigint
    ) AS signal,
    (ws.cnt >= 5 AND ns.cnt_without >= 5
      AND (ws.wins::numeric / NULLIF(ws.cnt, 0)) > (ns.wins_without::numeric / NULLIF(ns.cnt_without, 0))) AS over_triggered,
    (ws.cnt >= 5 AND (ws.losses::numeric / NULLIF(ws.cnt, 0)) >= 0.6) AS high_risk
  FROM with_stats ws
  JOIN without_stats ns ON ns.objection_type = ws.objection_type
  ORDER BY (ws.losses::numeric / NULLIF(ws.cnt, 0)) DESC NULLS LAST;
END;
$$;

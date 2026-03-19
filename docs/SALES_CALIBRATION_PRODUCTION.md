# Sales Intelligence — Production Calibration Layer

---

## SECTION 1: CANONICAL DATASET DESIGN

### 1.1 Outcome multiplicity and canon

- **Constraint:** `sales_session_outcomes.session_id` is UNIQUE. At most one outcome row per session.
- **Canonical outcome:** The single row in `sales_session_outcomes` for that `session_id`. No selection logic needed.
- **Sessions without outcome:** Excluded from calibration analysis. Use `LEFT JOIN`; `outcome IS NULL` = not yet closed. Do not impute.

### 1.2 Objection aggregation per session

- **Schema:** `sales_session_objections` has `UNIQUE(session_id, objection_type, source_rule)`. Multiple rows per session (different types or rules).
- **Aggregation:**
  - `objection_count` = `COUNT(*)` per session
  - `objection_types` = `array_agg(DISTINCT objection_type::text ORDER BY objection_type::text)`
  - `max_objection_confidence` = `MAX(confidence)` per session
  - `objection_by_type` = one row per (session_id, objection_type) with `MAX(confidence)` per type

### 1.3 Recommendation aggregation per session

- **Schema:** `sales_session_recommendations` has `UNIQUE(session_id, recommendation_type, title)`. Multiple rows per session.
- **Aggregation:**
  - `rec_types` = `array_agg(DISTINCT recommendation_type ORDER BY recommendation_type)`
  - `rec_count` = `COUNT(*)` per session
  - `rec_titles` = `array_agg(title ORDER BY priority)` for pattern matching
  - `rec_signals` = `array_agg(DISTINCT payload->>'signal')` for signal-level analysis

### 1.4 Sessions without outcome

- **Included in:** `v_sales_calibration_dataset` (all completed sessions).
- **Excluded from:** All win/loss analysis queries. Filter `WHERE outcome IS NOT NULL`.
- **Orphan report:** Sessions with `status = 'completed'` and no row in `sales_session_outcomes`.

### 1.5 Events usage

- `sales_session_events` provides `event_type` and `created_at` for audit and funnel analysis.
- Use `event_type IN ('created', 'answer_saved', 'scores_recalculated', 'objections_detected', 'finalized')` to validate session lifecycle.

---

## SECTION 2: SQL VIEWS AND HELPERS

```sql
-- ========== CANONICAL CALIBRATION VIEW ==========
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

-- ========== INTERPRETATION HELPER ==========
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

-- ========== CONFIG (parameterizable) ==========
CREATE TABLE IF NOT EXISTS public.sales_calibration_config (
  key text PRIMARY KEY,
  value numeric NOT NULL,
  updated_at timestamptz DEFAULT now()
);
INSERT INTO public.sales_calibration_config (key, value) VALUES
  ('win_rate_strong_positive', 0.65),
  ('loss_rate_strong_negative', 0.65),
  ('min_sample_size', 15),
  ('scoring_weight_delta_max', 10),
  ('objection_confidence_delta_max', 0.15)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
```

---

## SECTION 3: CALIBRATION ANALYSIS QUERIES

```sql
-- 3.1 Win rate by score bucket (pain). Replace score_pain for other dimensions.
WITH ds AS (
  SELECT * FROM public.v_sales_calibration_dataset WHERE outcome IS NOT NULL
),
bucketed AS (
  SELECT outcome, score_pain,
    CASE
      WHEN score_pain < 20 THEN '0-19'
      WHEN score_pain < 40 THEN '20-39'
      WHEN score_pain < 60 THEN '40-59'
      WHEN score_pain < 80 THEN '60-79'
      ELSE '80+'
    END AS bucket
  FROM ds
)
SELECT bucket,
  COUNT(*) FILTER (WHERE outcome = 'won')::numeric / NULLIF(COUNT(*), 0) AS win_rate,
  COUNT(*) FILTER (WHERE outcome = 'lost')::numeric / NULLIF(COUNT(*), 0) AS loss_rate,
  COUNT(*) AS n,
  public.fn_sales_interpret_signal(
    COUNT(*) FILTER (WHERE outcome = 'won')::numeric / NULLIF(COUNT(*), 0),
    COUNT(*) FILTER (WHERE outcome = 'lost')::numeric / NULLIF(COUNT(*), 0),
    COUNT(*)::bigint
  ) AS signal
FROM bucketed GROUP BY bucket ORDER BY bucket;

-- 3.2 Loss rate by objection_type (sessions that received that objection)
WITH ds AS (
  SELECT d.session_id, d.outcome, unnest(d.objection_types) AS objection_type
  FROM public.v_sales_calibration_dataset d
  WHERE d.outcome IS NOT NULL
)
SELECT objection_type,
  COUNT(*) FILTER (WHERE outcome = 'lost')::numeric / NULLIF(COUNT(DISTINCT session_id), 0) AS loss_rate,
  COUNT(DISTINCT session_id) AS n,
  public.fn_sales_interpret_signal(
    1 - COUNT(*) FILTER (WHERE outcome = 'lost')::numeric / NULLIF(COUNT(DISTINCT session_id), 0),
    COUNT(*) FILTER (WHERE outcome = 'lost')::numeric / NULLIF(COUNT(DISTINCT session_id), 0),
    COUNT(DISTINCT session_id)::bigint
  ) AS signal
FROM ds GROUP BY objection_type ORDER BY loss_rate DESC;

-- 3.3 Win/loss WITH vs WITHOUT objection X
WITH ds AS (
  SELECT session_id, outcome,
    'price' = ANY(objection_types) AS has_price,
    'complexity' = ANY(objection_types) AS has_complexity,
    'compliance_fear' = ANY(objection_types) AS has_compliance_fear
  FROM public.v_sales_calibration_dataset
  WHERE outcome IS NOT NULL
)
SELECT 'price' AS obj, 'with' AS presence,
  COUNT(*) FILTER (WHERE outcome = 'won')::numeric / NULLIF(COUNT(*), 0) AS win_rate,
  COUNT(*) AS n FROM ds WHERE has_price
UNION ALL SELECT 'price', 'without'
  , COUNT(*) FILTER (WHERE outcome = 'won')::numeric / NULLIF(COUNT(*), 0), COUNT(*) FROM ds WHERE NOT has_price
UNION ALL SELECT 'complexity', 'with'
  , COUNT(*) FILTER (WHERE outcome = 'won')::numeric / NULLIF(COUNT(*), 0), COUNT(*) FROM ds WHERE has_complexity
UNION ALL SELECT 'complexity', 'without'
  , COUNT(*) FILTER (WHERE outcome = 'won')::numeric / NULLIF(COUNT(*), 0), COUNT(*) FROM ds WHERE NOT has_complexity
UNION ALL SELECT 'compliance_fear', 'with'
  , COUNT(*) FILTER (WHERE outcome = 'won')::numeric / NULLIF(COUNT(*), 0), COUNT(*) FROM ds WHERE has_compliance_fear
UNION ALL SELECT 'compliance_fear', 'without'
  , COUNT(*) FILTER (WHERE outcome = 'won')::numeric / NULLIF(COUNT(*), 0), COUNT(*) FROM ds WHERE NOT has_compliance_fear;

-- 3.4 Combination: low maturity + complexity
WITH ds AS (
  SELECT session_id, outcome, score_maturity,
    'complexity' = ANY(objection_types) AS has_complexity
  FROM public.v_sales_calibration_dataset WHERE outcome IS NOT NULL
)
SELECT 'low_maturity_complexity' AS pattern,
  COUNT(*) FILTER (WHERE outcome = 'won')::numeric / NULLIF(COUNT(*), 0) AS win_rate,
  COUNT(*) AS n
FROM ds WHERE score_maturity < 30 AND has_complexity;

-- 3.5 Threshold sensitivity (pain cutoffs 20, 30, 40, 50, 60)
WITH ds AS (
  SELECT session_id, outcome, score_pain
  FROM public.v_sales_calibration_dataset WHERE outcome IS NOT NULL
),
cutoffs AS (SELECT unnest(ARRAY[20,30,40,50,60]) AS cutoff)
SELECT c.cutoff,
  COUNT(*) FILTER (WHERE d.score_pain >= c.cutoff AND d.outcome = 'won')::numeric
    / NULLIF(COUNT(*) FILTER (WHERE d.score_pain >= c.cutoff), 0) AS win_rate_above,
  COUNT(*) FILTER (WHERE d.score_pain >= c.cutoff) AS n_above
FROM ds d CROSS JOIN cutoffs c GROUP BY c.cutoff ORDER BY c.cutoff;
```

---

## SECTION 4: RULE ADJUSTMENT FRAMEWORK

### 4.1 Scoring rules: candidates for adjustment

**Query: identify scoring rules whose answer-option bucket has strong_negative signal**

```sql
-- Step 1: Map session answers to scoring rules and compute outcome per rule
WITH rule_sessions AS (
  SELECT
    sr.id AS rule_id,
    sr.rule_code,
    sr.question_id,
    sr.answer_option_id,
    sr.score_dimension,
    sr.weight,
    s.id AS session_id,
    o.outcome
  FROM public.sales_scoring_rules sr
  JOIN public.sales_sessions s ON s.questionnaire_id = sr.questionnaire_id
  JOIN public.sales_session_answers sa ON sa.session_id = s.id AND sa.question_id = sr.question_id
  LEFT JOIN public.sales_session_outcomes o ON o.session_id = s.id
  WHERE s.status = 'completed' AND s.deleted_at IS NULL
    AND (sr.answer_option_id IS NULL OR sr.answer_option_id = ANY(sa.answer_option_ids))
),
rule_stats AS (
  SELECT rule_id, rule_code, question_id, answer_option_id, score_dimension, weight,
    COUNT(*)::bigint AS n,
    COUNT(*) FILTER (WHERE outcome = 'won')::numeric / NULLIF(COUNT(*), 0) AS win_rate,
    COUNT(*) FILTER (WHERE outcome = 'lost')::numeric / NULLIF(COUNT(*), 0) AS loss_rate
  FROM rule_sessions
  WHERE outcome IS NOT NULL
  GROUP BY rule_id, rule_code, question_id, answer_option_id, score_dimension, weight
)
SELECT rule_id, rule_code, score_dimension, weight, n, win_rate, loss_rate,
  public.fn_sales_interpret_signal(win_rate, loss_rate, n) AS signal
FROM rule_stats
WHERE n >= (SELECT value FROM public.sales_calibration_config WHERE key = 'min_sample_size')
  AND public.fn_sales_interpret_signal(win_rate, loss_rate, n) = 'strong_negative'
ORDER BY loss_rate DESC;
```

**Adjustment:** `weight` ± delta. Delta range: ±1 to ±10 (from config `scoring_weight_delta_max`). For strong_negative: decrease weight by 5–10. For strong_positive: increase by 5–10.

### 4.2 Objection rules: candidates for adjustment

**Query: identify objection rules with over-trigger (win_rate WITH > win_rate WITHOUT)**

```sql
WITH obj_types AS (
  SELECT DISTINCT unnest(objection_types) AS objection_type
  FROM public.v_sales_calibration_dataset
  WHERE outcome IS NOT NULL AND array_length(objection_types, 1) > 0
),
with_stats AS (
  SELECT d.session_id, d.outcome, unnest(d.objection_types) AS objection_type
  FROM public.v_sales_calibration_dataset d
  WHERE d.outcome IS NOT NULL
),
by_type AS (
  SELECT objection_type,
    COUNT(*) FILTER (WHERE outcome = 'won')::numeric / NULLIF(COUNT(DISTINCT session_id), 0) AS win_with,
    COUNT(DISTINCT session_id) AS n_with
  FROM with_stats GROUP BY objection_type
),
without_stats AS (
  SELECT d.session_id, d.outcome, t.objection_type
  FROM public.v_sales_calibration_dataset d
  CROSS JOIN obj_types t
  WHERE d.outcome IS NOT NULL
    AND NOT (t.objection_type = ANY(COALESCE(d.objection_types, '{}')))
),
win_without AS (
  SELECT objection_type,
    COUNT(*) FILTER (WHERE outcome = 'won')::numeric / NULLIF(COUNT(DISTINCT session_id), 0) AS win_without,
    COUNT(DISTINCT session_id) AS n_without
  FROM without_stats GROUP BY objection_type
)
SELECT b.objection_type, b.win_with, w.win_without, b.n_with, w.n_without,
  CASE WHEN b.win_with > w.win_without AND b.n_with >= 15 THEN 'over_triggered' ELSE NULL END AS recommendation
FROM by_type b
LEFT JOIN win_without w ON w.objection_type = b.objection_type
WHERE b.n_with >= 15 AND w.n_without >= 15
  AND b.win_with > w.win_without;
```

**Adjustment:** `confidence` −0.05 to −0.15 (from config). For under-detected (loss_rate WITH >> loss_rate WITHOUT): increase confidence +0.05 to +0.15.

### 4.3 Minimum sample size

- **Before any scoring rule change:** n ≥ 15 sessions with outcome where that rule fired.
- **Before any objection rule change:** n ≥ 15 sessions with outcome in both WITH and WITHOUT comparison.
- **Config:** `sales_calibration_config.min_sample_size = 15`.

### 4.4 Adjustment range

- **Scoring weight:** ±1 to ±10 (integer). Config: `scoring_weight_delta_max = 10`.
- **Objection confidence:** ±0.05 to ±0.15. Config: `objection_confidence_delta_max = 0.15`.

---

## SECTION 5: RECOMMENDATION CALIBRATION

```sql
-- 5.1 Win rate by recommendation_type (sessions that received that type)
WITH ds AS (
  SELECT d.session_id, d.outcome, unnest(d.rec_types) AS rec_type
  FROM public.v_sales_calibration_dataset d
  WHERE d.outcome IS NOT NULL
)
SELECT rec_type,
  COUNT(*) FILTER (WHERE outcome = 'won')::numeric / NULLIF(COUNT(DISTINCT session_id), 0) AS win_rate,
  COUNT(DISTINCT session_id) AS n,
  public.fn_sales_interpret_signal(
    COUNT(*) FILTER (WHERE outcome = 'won')::numeric / NULLIF(COUNT(DISTINCT session_id), 0),
    1 - COUNT(*) FILTER (WHERE outcome = 'won')::numeric / NULLIF(COUNT(DISTINCT session_id), 0),
    COUNT(DISTINCT session_id)::bigint
  ) AS signal
FROM ds GROUP BY rec_type ORDER BY win_rate DESC;

-- 5.2 Overused: high share of sessions but low win rate
WITH rec_share AS (
  SELECT rec_type,
    COUNT(DISTINCT session_id)::numeric / (SELECT COUNT(*) FROM public.v_sales_calibration_dataset WHERE outcome IS NOT NULL) AS share,
    COUNT(*) FILTER (WHERE outcome = 'won')::numeric / NULLIF(COUNT(DISTINCT session_id), 0) AS win_rate,
    COUNT(DISTINCT session_id) AS n
  FROM (
    SELECT d.session_id, d.outcome, unnest(d.rec_types) AS rec_type
    FROM public.v_sales_calibration_dataset d WHERE d.outcome IS NOT NULL
  ) t
  GROUP BY rec_type
)
SELECT rec_type, share, win_rate, n,
  CASE WHEN share > 0.5 AND win_rate < 0.4 AND n >= 15 THEN 'overused' ELSE NULL END AS flag
FROM rec_share ORDER BY share DESC;

-- 5.3 Underperform by segment: demo in low_maturity bucket
WITH ds AS (
  SELECT d.session_id, d.outcome, d.score_maturity,
    'demo' = ANY(d.rec_types) AS has_demo
  FROM public.v_sales_calibration_dataset d
  WHERE d.outcome IS NOT NULL
)
SELECT
  CASE WHEN score_maturity < 40 THEN 'low_maturity' ELSE 'high_maturity' END AS segment,
  has_demo,
  COUNT(*) FILTER (WHERE outcome = 'won')::numeric / NULLIF(COUNT(*), 0) AS win_rate,
  COUNT(*) AS n
FROM ds
WHERE has_demo
GROUP BY 1, 2
HAVING COUNT(*) >= 10
ORDER BY 1, 2;

-- 5.4 Win rate by rec signal (payload->>'signal')
WITH rec_expanded AS (
  SELECT d.session_id, d.outcome, unnest(d.rec_signals) AS rec_signal
  FROM public.v_sales_calibration_dataset d
  WHERE d.outcome IS NOT NULL AND cardinality(COALESCE(d.rec_signals, '{}')) > 0
)
SELECT rec_signal,
  COUNT(*) FILTER (WHERE outcome = 'won')::numeric / NULLIF(COUNT(DISTINCT session_id), 0) AS win_rate,
  COUNT(DISTINCT session_id) AS n
FROM rec_expanded
GROUP BY rec_signal
HAVING COUNT(DISTINCT session_id) >= 10
ORDER BY win_rate DESC;
```

---

## SECTION 6: VERSIONING TABLES AND QUERIES

```sql
-- 6.1 Version registry
CREATE TABLE IF NOT EXISTS public.sales_rule_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  description text,
  parent_version_id uuid REFERENCES public.sales_rule_versions(id),
  is_active boolean NOT NULL DEFAULT true
);

-- 6.2 Snapshot of applied rules (enables rollback)
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

-- 6.3 Record a version with snapshot
-- Usage: call after applying changes; snapshot_before = state before, snapshot_after = state after
INSERT INTO public.sales_rule_versions (version_id, description, parent_version_id)
VALUES ('v2', 'Reduce pain_reject_4plus weight after strong_negative signal', NULL);

INSERT INTO public.sales_rule_version_snapshots (version_id, rule_kind, rule_id, rule_code, snapshot_before, snapshot_after)
SELECT
  (SELECT id FROM public.sales_rule_versions WHERE version_id = 'v2'),
  'scoring',
  sr.id,
  sr.rule_code,
  jsonb_build_object('weight', sr.weight, 'question_id', sr.question_id, 'answer_option_id', sr.answer_option_id),
  jsonb_build_object('weight', sr.weight - 10, 'question_id', sr.question_id, 'answer_option_id', sr.answer_option_id)
FROM public.sales_scoring_rules sr
WHERE sr.rule_code = 'pain_reject_4plus';

-- 6.4 Rollback: apply snapshot_before to current rules
UPDATE public.sales_scoring_rules sr
SET weight = (s.snapshot_before->>'weight')::integer
FROM public.sales_rule_version_snapshots s
JOIN public.sales_rule_versions v ON v.id = s.version_id
WHERE s.rule_kind = 'scoring' AND s.rule_id = sr.id
  AND v.version_id = 'v2';

UPDATE public.sales_objection_rules opr
SET confidence = (s.snapshot_before->>'confidence')::numeric
FROM public.sales_rule_version_snapshots s
JOIN public.sales_rule_versions v ON v.id = s.version_id
WHERE s.rule_kind = 'objection' AND s.rule_id = opr.id
  AND v.version_id = 'v2';

-- 6.5 Compare version performance: sessions closed after version deploy
-- Requires: version deploy timestamp stored. Add to sales_rule_versions:
ALTER TABLE public.sales_rule_versions ADD COLUMN IF NOT EXISTS deployed_at timestamptz;

-- Compare win rate before vs after version
WITH version_deploy AS (
  SELECT deployed_at FROM public.sales_rule_versions WHERE version_id = 'v2' AND deployed_at IS NOT NULL
),
sessions_before AS (
  SELECT outcome FROM public.sales_sessions s
  JOIN public.sales_session_outcomes o ON o.session_id = s.id
  WHERE s.status = 'completed' AND s.created_at < (SELECT deployed_at FROM version_deploy)
),
sessions_after AS (
  SELECT outcome FROM public.sales_sessions s
  JOIN public.sales_session_outcomes o ON o.session_id = s.id
  WHERE s.status = 'completed' AND s.created_at >= (SELECT deployed_at FROM version_deploy)
)
SELECT
  'before' AS period,
  COUNT(*) FILTER (WHERE outcome = 'won')::numeric / NULLIF(COUNT(*), 0) AS win_rate,
  COUNT(*) AS n
FROM sessions_before
UNION ALL
SELECT 'after',
  COUNT(*) FILTER (WHERE outcome = 'won')::numeric / NULLIF(COUNT(*), 0),
  COUNT(*)
FROM sessions_after;

-- 6.6 Diff two versions (snapshot comparison)
SELECT
  s.rule_code,
  s.rule_kind,
  s.snapshot_before,
  s.snapshot_after,
  CASE s.rule_kind
    WHEN 'scoring' THEN (s.snapshot_after->>'weight')::integer - (s.snapshot_before->>'weight')::integer
    WHEN 'objection' THEN ((s.snapshot_after->>'confidence')::numeric - (s.snapshot_before->>'confidence')::numeric)::text
  END AS delta
FROM public.sales_rule_version_snapshots s
JOIN public.sales_rule_versions v ON v.id = s.version_id
WHERE v.version_id = 'v2';
```

---

## SECTION 7: OPERATIONAL CALIBRATION LOOP

1. **Collect** — Ensure ≥30 sessions with outcome in `sales_session_outcomes`. Run orphan query (1.3) to list sessions needing outcome.

2. **Validate** — Run 1.1, 1.2. Confirm `min_sample_size` (15) met for any segment before changes.

3. **Analyze** — Run Section 3 queries. Run Section 4.1 and 4.2 to get rule candidates. Run Section 5 for recommendation calibration.

4. **Adjust** — For each candidate in 4.1: apply weight delta per 4.4. For each in 4.2: apply confidence delta. Record changes in `sales_rule_version_snapshots` with `snapshot_before` and `snapshot_after`.

5. **Version** — Insert `sales_rule_versions` row. Set `deployed_at = now()`. Link snapshots to `version_id`.

6. **Deploy** — Apply `UPDATE` to `sales_scoring_rules` and `sales_objection_rules`. No migration needed if changes are data-only.

7. **Compare** — After next 30 sessions, run 6.5. Compare win_rate before vs after. If regression, run 6.4 Rollback using `snapshot_before`.

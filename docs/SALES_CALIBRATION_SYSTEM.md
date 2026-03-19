# Sales Intelligence — Calibration System

Deterministic, SQL-driven calibration layer. No ML. Learns from real commercial outcomes.

**Prerequisite:** Migration `20250323000001_sales_outcomes_and_calibration.sql` creates `sales_session_outcomes` (if missing), `v_sales_calibration_dataset`, config, and versioning tables. If `sales_session_outcomes` already exists with a different schema, align columns: `session_id`, `outcome` (enum: won|lost|no_decision), `deal_value`, `close_date`, `reason_lost`.

---

## SECTION 1: DATA VALIDATION QUERIES

```sql
-- 1.1 Count sessions with vs without outcome
SELECT
  CASE WHEN o.session_id IS NOT NULL THEN 'with_outcome' ELSE 'without_outcome' END AS bucket,
  COUNT(*) AS cnt
FROM public.sales_sessions s
LEFT JOIN public.sales_session_outcomes o ON o.session_id = s.id
WHERE s.status = 'completed' AND s.deleted_at IS NULL
GROUP BY 1;

-- 1.2 Distribution of outcomes (won/lost/no_decision)
SELECT outcome, COUNT(*) AS cnt
FROM public.sales_session_outcomes o
JOIN public.sales_sessions s ON s.id = o.session_id
WHERE s.status = 'completed' AND s.deleted_at IS NULL
GROUP BY outcome;

-- 1.3 Orphan sessions (completed, no outcome)
SELECT s.id, s.organization_id, s.created_at, s.score_total
FROM public.sales_sessions s
LEFT JOIN public.sales_session_outcomes o ON o.session_id = s.id
WHERE s.status = 'completed' AND s.deleted_at IS NULL AND o.session_id IS NULL
ORDER BY s.created_at DESC;

-- 1.4 Sessions with outcome but no scores (data integrity)
SELECT s.id, o.outcome
FROM public.sales_session_outcomes o
JOIN public.sales_sessions s ON s.id = o.session_id
WHERE s.status = 'completed'
  AND (s.score_total IS NULL OR s.score_total = 0);
```

---

## SECTION 2: ANALYTICAL DATASET (SQL)

```sql
-- View: v_sales_calibration_dataset (created in migration 20250323000001)
-- Columns: session_id, outcome, score_pain, score_maturity, score_urgency, score_fit,
--          score_budget_readiness, total_score, objection_count, max_objection_confidence, objection_types

-- Inline CTE version (no view dependency):
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
WHERE s.status = 'completed' AND s.deleted_at IS NULL;
```

---

## SECTION 3: ANALYSIS QUERIES

```sql
-- 3.1 Win rate by score bucket (pain)
WITH ds AS (
  SELECT * FROM public.v_sales_calibration_dataset WHERE outcome IS NOT NULL
),
bucketed AS (
  SELECT outcome,
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
  COUNT(*) FILTER (WHERE outcome = 'won')::float / NULLIF(COUNT(*), 0) AS win_rate,
  COUNT(*) FILTER (WHERE outcome = 'lost')::float / NULLIF(COUNT(*), 0) AS loss_rate,
  COUNT(*) AS n
FROM bucketed
GROUP BY bucket ORDER BY bucket;

-- 3.1b Same for maturity, urgency, fit, budget_readiness (replace score_pain)
-- Bucket function: same bins 0-19, 20-39, 40-59, 60-79, 80+

-- 3.2 Loss rate by objection_type
WITH ds AS (
  SELECT d.session_id, d.outcome, unnest(d.objection_types) AS objection_type
  FROM public.v_sales_calibration_dataset d
  WHERE d.outcome IS NOT NULL
)
SELECT objection_type,
  COUNT(*) FILTER (WHERE outcome = 'lost')::float / NULLIF(COUNT(DISTINCT session_id), 0) AS loss_rate,
  COUNT(DISTINCT session_id) AS sessions_with_obj
FROM ds
GROUP BY objection_type
ORDER BY loss_rate DESC;

-- 3.3 Win/loss: sessions WITH objection X vs WITHOUT
WITH ds AS (
  SELECT session_id, outcome,
    'price' = ANY(objection_types) AS has_price,
    'timing' = ANY(objection_types) AS has_timing,
    'complexity' = ANY(objection_types) AS has_complexity,
    'trust' = ANY(objection_types) AS has_trust,
    'compliance_fear' = ANY(objection_types) AS has_compliance_fear
  FROM public.v_sales_calibration_dataset
  WHERE outcome IS NOT NULL
)
SELECT 'price' AS objection_type,
  'with' AS presence,
  COUNT(*) FILTER (WHERE outcome = 'won')::float / NULLIF(COUNT(*), 0) AS win_rate,
  COUNT(*) AS n
FROM ds WHERE has_price
UNION ALL
SELECT 'price', 'without',
  COUNT(*) FILTER (WHERE outcome = 'won')::float / NULLIF(COUNT(*), 0),
  COUNT(*)
FROM ds WHERE NOT has_price;
-- Repeat for timing, complexity, trust, compliance_fear

-- 3.4 Combination: low maturity + high complexity
WITH ds AS (
  SELECT session_id, outcome, score_maturity,
    'complexity' = ANY(objection_types) AS has_complexity
  FROM public.v_sales_calibration_dataset
  WHERE outcome IS NOT NULL
)
SELECT
  COUNT(*) FILTER (WHERE outcome = 'won')::float / NULLIF(COUNT(*), 0) AS win_rate,
  COUNT(*) AS n
FROM ds
WHERE score_maturity < 30 AND has_complexity;

-- 3.4b Low budget + timing
WITH ds AS (
  SELECT session_id, outcome, score_budget_readiness,
    'timing' = ANY(objection_types) AS has_timing
  FROM public.v_sales_calibration_dataset
  WHERE outcome IS NOT NULL
)
SELECT
  COUNT(*) FILTER (WHERE outcome = 'won')::float / NULLIF(COUNT(*), 0) AS win_rate,
  COUNT(*) AS n
FROM ds
WHERE score_budget_readiness < 25 AND has_timing;

-- 3.4c High pain + compliance_fear
WITH ds AS (
  SELECT session_id, outcome, score_pain,
    'compliance_fear' = ANY(objection_types) AS has_compliance_fear
  FROM public.v_sales_calibration_dataset
  WHERE outcome IS NOT NULL
)
SELECT
  COUNT(*) FILTER (WHERE outcome = 'won')::float / NULLIF(COUNT(*), 0) AS win_rate,
  COUNT(*) AS n
FROM ds
WHERE score_pain >= 50 AND has_compliance_fear;

-- 3.5 Threshold sensitivity (pain example: cutoffs 20, 30, 40, 50, 60)
WITH ds AS (
  SELECT session_id, outcome, score_pain
  FROM public.v_sales_calibration_dataset
  WHERE outcome IS NOT NULL
),
cutoffs AS (SELECT unnest(ARRAY[20,30,40,50,60]) AS cutoff)
SELECT c.cutoff,
  COUNT(*) FILTER (WHERE d.score_pain >= c.cutoff AND d.outcome = 'won')::float
    / NULLIF(COUNT(*) FILTER (WHERE d.score_pain >= c.cutoff), 0) AS win_rate_above,
  COUNT(*) FILTER (WHERE d.score_pain >= c.cutoff) AS n_above
FROM ds d
CROSS JOIN cutoffs c
GROUP BY c.cutoff ORDER BY c.cutoff;
```

---

## SECTION 4: INTERPRETATION FRAMEWORK

Parameterizable thresholds (store in config table or pass as params):

| Signal | Condition | Default |
|-------|-----------|---------|
| Strong positive | win_rate > p_win_high | 0.65 |
| Strong negative | loss_rate > p_loss_high | 0.65 |
| Neutral / noise | n < p_min_sample | 10 |
| Weak positive | win_rate > 0.5 AND n >= p_min_sample | — |
| Weak negative | loss_rate > 0.5 AND n >= p_min_sample | — |

```sql
-- Config table (optional, minimal)
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

-- Interpretation helper (returns signal strength)
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
```

---

## SECTION 5: CALIBRATION SUGGESTIONS

Generated from analysis output. Format: deterministic rules.

### 5.1 Scoring suggestions

| Pattern | Suggestion | Source |
|---------|------------|--------|
| win_rate(bucket 60-79) > 0.65 | Increase weight for options mapping to this bucket | 3.1 |
| loss_rate(bucket 0-19) > 0.65 | Decrease weight or deprioritize | 3.1 |
| win_rate_above(40) >> win_rate_above(30) | Consider threshold 40 for deepening | 3.5 |
| n_above(cutoff) < 10 | Do not adjust; insufficient data | 3.5 |

### 5.2 Objection suggestions

| Pattern | Suggestion | Source |
|---------|------------|--------|
| loss_rate(objection_type) > 0.65 | Boost confidence or add rules; type is predictive | 3.2 |
| win_rate(with X) > win_rate(without X) | Over-triggered; lower confidence or remove rule | 3.3 |
| loss_rate(with X) >> loss_rate(without X) | Under-detected; add rules or raise confidence | 3.3 |

### 5.3 Recommendation mapping

| Pattern | Suggested action | Source |
|---------|------------------|--------|
| high pain + compliance_fear | EUDR-first demo | 3.4c |
| low maturity + complexity | Guided onboarding plan | 3.4 |
| low budget + timing | Timeline-focused pitch, ROI case | 3.4b |

---

## SECTION 6: VERSIONING DESIGN

```sql
CREATE TABLE IF NOT EXISTS public.sales_rule_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  description text,
  changes_applied jsonb,
  -- Snapshot of key params at deploy
  scoring_thresholds jsonb,
  objection_confidences jsonb
);

-- Compare versions: diff changes_applied
-- Rollback: restore from previous version's changes_applied; re-run migration/seed
-- Minimal: version_id = 'v1', 'v2', ...; changes_applied = { scoring_rules: [...], objection_rules: [...] }
```

Rollback process:
1. Select previous `version_id` from `sales_rule_versions`
2. Apply `changes_applied` to `sales_scoring_rules` / `sales_objection_rules` (manual or script)
3. Re-deploy questionnaire seed if needed

---

## SECTION 7: CALIBRATION LOOP

1. **Collect** — Ensure N sessions (e.g. 30–50) with outcomes in `sales_session_outcomes`
2. **Run** — Execute validation (1.x), then analysis (3.x)
3. **Interpret** — Apply `fn_sales_interpret_signal` to each bucket/objection
4. **Adjust** — Apply suggestions (5.x) to `sales_scoring_rules`, `sales_objection_rules`, recommendation logic
5. **Version** — Insert row into `sales_rule_versions` with `changes_applied`
6. **Deploy** — Apply migration/seed
7. **Compare** — After next N sessions, re-run analysis; compare win/loss rates vs previous version

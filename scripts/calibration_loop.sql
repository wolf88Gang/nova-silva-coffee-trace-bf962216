-- =====================================================================
-- Sales Calibration Loop — Repeatable Process
--
-- This script defines the step-by-step calibration process.
-- Run after collecting N completed sessions with recorded outcomes.
--
-- Prerequisites:
--   - Migration 20260319000001_sales_calibration_system.sql applied
--   - At least 30 sessions with outcomes recorded via fn_sales_record_outcome
--   - Auth context set (admin user)
-- =====================================================================


-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 0: DATA READINESS CHECK
-- ═══════════════════════════════════════════════════════════════════════════════

-- How many completed sessions have outcomes?
SELECT
  'completed_sessions'  AS metric,
  count(*)              AS value
FROM sales_sessions WHERE status = 'completed' AND deleted_at IS NULL
UNION ALL
SELECT
  'with_outcome',
  count(*)
FROM v_sales_calibration_dataset
UNION ALL
SELECT
  'orphan_sessions',
  count(*)
FROM sales_sessions s
WHERE s.status = 'completed' AND s.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM sales_session_outcomes o WHERE o.session_id = s.id)
UNION ALL
SELECT
  'outcome_won',
  count(*) FILTER (WHERE outcome = 'won')
FROM v_sales_calibration_dataset
UNION ALL
SELECT
  'outcome_lost',
  count(*) FILTER (WHERE outcome = 'lost')
FROM v_sales_calibration_dataset
UNION ALL
SELECT
  'outcome_no_decision',
  count(*) FILTER (WHERE outcome = 'no_decision')
FROM v_sales_calibration_dataset;

-- DECISION GATE: If total < 30, stop. Collect more data first.


-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 1: SNAPSHOT CURRENT RULES (before any changes)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Create version snapshot of current state
-- SELECT fn_cal_create_version('Pre-calibration snapshot — baseline before cycle N');


-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 2: RUN FULL CALIBRATION REPORT
-- ═══════════════════════════════════════════════════════════════════════════════

-- Full JSON report with all analysis dimensions
SELECT fn_cal_run_calibration_report(5);

-- Or run individual analysis queries for targeted investigation:

-- 2a. Score buckets per dimension
-- SELECT * FROM fn_cal_score_buckets('score_pain', 15);
-- SELECT * FROM fn_cal_score_buckets('score_maturity', 15);
-- SELECT * FROM fn_cal_score_buckets('score_urgency', 15);
-- SELECT * FROM fn_cal_score_buckets('score_fit', 15);
-- SELECT * FROM fn_cal_score_buckets('score_budget_readiness', 15);

-- 2b. Objection type outcomes
-- SELECT * FROM fn_cal_objection_outcomes();

-- 2c. Signal combinations
-- SELECT * FROM fn_cal_combo_analysis();

-- 2d. Threshold sensitivity
-- SELECT * FROM fn_cal_threshold_sensitivity('score_pain');
-- SELECT * FROM fn_cal_threshold_sensitivity('score_maturity');

-- 2e. Interpreted signals
-- SELECT * FROM fn_cal_interpret_signals(0.65, 0.65, 5);


-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 3: INTERPRET THE REPORT
-- ═══════════════════════════════════════════════════════════════════════════════
-- Classification rules:
--
--   win_rate >= 0.65 AND sample >= 5  → strong_positive → KEEP, consider boosting weight
--   loss_rate >= 0.65 AND sample >= 5 → strong_negative → FLAG, review rule, reduce weight or deactivate
--   win_rate >= 0.50, loss < 0.30     → weak_positive   → MONITOR, may become strong with more data
--   loss_rate >= 0.50, win < 0.30     → weak_negative   → MONITOR, watch for confirmation
--   neither                           → neutral          → LOW PRIORITY for calibration
--   sample < 5                        → insufficient     → WAIT for more data
--
-- For threshold sensitivity:
--   separation_score = |win_rate_above - win_rate_below|
--   Higher separation = better discriminating threshold
--   Pick the cutoff with highest separation_score as new threshold


-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 4: APPLY RULE CHANGES
-- ═══════════════════════════════════════════════════════════════════════════════
-- Based on the report, apply specific changes. Examples:

-- 4a. Adjust a scoring rule weight
-- UPDATE sales_scoring_rules SET weight = 18, updated_at = now() WHERE id = '<rule_id>';

-- 4b. Deactivate a useless scoring rule
-- UPDATE sales_scoring_rules SET is_active = false, updated_at = now() WHERE id = '<rule_id>';

-- 4c. Adjust an objection rule base_confidence
-- UPDATE sales_objection_rules SET base_confidence = 0.85, updated_at = now() WHERE id = '<rule_id>';

-- 4d. Deactivate an over-triggered objection rule
-- UPDATE sales_objection_rules SET is_active = false, updated_at = now() WHERE id = '<rule_id>';

-- 4e. Change a threshold in fn_sales_generate_recommendations
--     → Requires editing the function SQL and redeploying


-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 5: SNAPSHOT NEW RULES (after changes)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Record the new version with a description of what changed
-- SELECT fn_cal_create_version(
--   'Calibration cycle N — adjusted pain threshold to 55, deactivated OBJ rule X',
--   '{"changes": [
--     {"type": "scoring_weight", "rule_id": "...", "old": 15, "new": 18},
--     {"type": "objection_deactivated", "rule_id": "...", "reason": "0% win rate with N=12"}
--   ]}'::jsonb
-- );


-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 6: COMPARE VERSIONS
-- ═══════════════════════════════════════════════════════════════════════════════

-- After collecting 30+ more sessions under the new rules:
-- SELECT * FROM fn_cal_compare_versions(1, 2);
-- This shows the delta in baseline metrics between version 1 and 2.
-- If win_rate improved and loss_rate decreased → calibration was effective.
-- If not → rollback by restoring rules from version 1's snapshot.


-- ═══════════════════════════════════════════════════════════════════════════════
-- ROLLBACK PROCEDURE (if needed)
-- ═══════════════════════════════════════════════════════════════════════════════
-- To rollback to a previous version:
--
-- 1. Get the snapshot from the target version:
--    SELECT scoring_snapshot, objection_snapshot
--    FROM sales_rule_versions WHERE version_number = <N>;
--
-- 2. Deactivate all current rules:
--    UPDATE sales_scoring_rules SET is_active = false;
--    UPDATE sales_objection_rules SET is_active = false;
--
-- 3. Reactivate only the rules from the snapshot:
--    UPDATE sales_scoring_rules sr
--    SET is_active = true,
--        weight = (snap->>'weight')::numeric,
--        updated_at = now()
--    FROM (
--      SELECT (elem->>'id')::uuid AS rule_id, elem AS snap
--      FROM sales_rule_versions, jsonb_array_elements(scoring_snapshot) AS elem
--      WHERE version_number = <N>
--    ) v
--    WHERE sr.id = v.rule_id;
--
--    (Same pattern for objection_rules with base_confidence)
--
-- 4. Record the rollback as a new version:
--    SELECT fn_cal_create_version('Rollback to version <N>',
--      '{"rollback_from": <current>, "rollback_to": <N>}'::jsonb);


-- ═══════════════════════════════════════════════════════════════════════════════
-- CALIBRATION CADENCE
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- Recommended cycle:
--   1. Collect 30-50 sessions with outcomes (2-4 weeks typical)
--   2. Run STEP 2 (calibration report)
--   3. Review signals with classification = strong_positive or strong_negative
--   4. Apply targeted changes (STEP 4) — max 3-5 changes per cycle
--   5. Snapshot new version (STEP 5)
--   6. Wait for next 30-50 sessions
--   7. Compare versions (STEP 6)
--   8. Decide: keep, iterate, or rollback
--
-- RULES OF THUMB:
--   - Never change more than 5 rules per cycle
--   - Never act on signals with sample_size < 5
--   - Prefer adjusting weights over deactivating rules
--   - Prefer deactivating rules over deleting them
--   - Always snapshot before AND after changes
--   - Track deal_value to measure revenue impact, not just win/loss counts

# Calibration Review — Release Readiness

---

## Workspace Upgrade (P1 capabilities)

- **Score Analysis:** Win rate by bucket for pain, maturity, urgency, fit, budget_readiness
- **Objection Analysis:** Loss rate by type, count, W/L, avg confidence (proxy), over-triggered / high-risk badges
- **Rule Candidates:** Score weak discrimination, objection over-triggered, rec underperform
- **Analytics layer:** `calibrationAnalytics.ts` (pure functions over rows)
- **Presentation:** `CalibrationBlocks.tsx` (ScoreAnalysisBlock, ObjectionAnalysisBlock, RuleCandidatesBlock)

---

## SECTION 1: ROUTES AND NAVIGATION

| Route | Component | Guard |
|-------|-----------|-------|
| `/admin/sales/calibration` | CalibrationReviewPage | RequireAdmin (admin, superadmin) |

**Sidebar:** "Calibration Review" under Control Tower, icon BarChart3, url `/admin/sales/calibration`.

**Navigation:** Link from Sales Intelligence area; "Volver" returns to `/admin/sales`.

---

## SECTION 2: BACKEND DEPENDENCIES

### Required objects (migrations 20250323000001, 20250323000002, 20250324000001, 20250324000002)

| Object | Type | Migration |
|--------|------|-----------|
| `sales_session_outcomes` | table | 20250323000001 |
| `sales_outcome` | enum | 20250323000001 |
| `v_sales_calibration_dataset` | view | 20250323000001 (replaced by 20250323000002) |
| `sales_calibration_config` | table | 20250323000001 |
| `sales_rule_versions` | table | 20250323000001 |
| `fn_sales_interpret_signal` | function | 20250323000001 |
| `sales_rule_version_snapshots` | table | 20250323000002 |
| `fn_cal_validation_summary` | function | 20250324000001 (auth guard in 20250324000002) |
| `fn_cal_score_bucket_analysis` | function | 20250324000001 (auth guard in 20250324000002) |
| `fn_cal_objection_analysis` | function | 20250324000001 (auth guard in 20250324000002) |

### Prerequisite tables (from earlier migrations)

- `sales_sessions` (status, deleted_at, scores)
- `sales_session_objections` (session_id, objection_type, confidence)
- `sales_session_recommendations` (session_id, recommendation_type, payload)
- `platform_organizations` (for FK)
- `is_admin()` function
- `_ensure_internal()` function (20250322000004; used by calibration RPCs in 20250324000002)

### Missing backend objects

If `v_sales_calibration_dataset` does not exist, apply:

```sql
-- From 20250323000002_sales_calibration_production.sql
CREATE OR REPLACE VIEW public.v_sales_calibration_dataset AS
WITH obj_agg AS (
  SELECT session_id, COUNT(*)::int AS objection_count,
    MAX(confidence)::numeric AS max_objection_confidence,
    array_agg(DISTINCT objection_type::text ORDER BY objection_type::text) AS objection_types
  FROM public.sales_session_objections GROUP BY session_id
),
rec_agg AS (
  SELECT session_id, COUNT(*)::int AS rec_count,
    array_agg(DISTINCT recommendation_type ORDER BY recommendation_type) AS rec_types,
    array_remove(array_agg(DISTINCT payload->>'signal'), NULL) AS rec_signals
  FROM public.sales_session_recommendations GROUP BY session_id
)
SELECT s.id AS session_id, s.organization_id, s.questionnaire_id, s.commercial_stage, s.lead_type,
  s.created_at AS session_created_at, o.outcome, o.deal_value, o.close_date, o.reason_lost,
  s.score_pain, s.score_maturity, s.score_objection, s.score_urgency, s.score_fit, s.score_budget_readiness,
  s.score_total AS total_score, COALESCE(obj.objection_count, 0) AS objection_count,
  obj.max_objection_confidence, COALESCE(obj.objection_types, '{}') AS objection_types,
  COALESCE(rec.rec_count, 0) AS rec_count, COALESCE(rec.rec_types, '{}') AS rec_types,
  COALESCE(rec.rec_signals, '{}') AS rec_signals
FROM public.sales_sessions s
LEFT JOIN public.sales_session_outcomes o ON o.session_id = s.id
LEFT JOIN obj_agg obj ON obj.session_id = s.id
LEFT JOIN rec_agg rec ON rec.session_id = s.id
WHERE s.status = 'completed' AND s.deleted_at IS NULL;

GRANT SELECT ON public.v_sales_calibration_dataset TO authenticated;
```

If `sales_session_outcomes` does not exist, apply 20250323000001 first.

---

## SECTION 3: E2E STATE CHECK

| State | Trigger | UI behavior |
|-------|---------|-------------|
| **Loading** | useQuery fetching | Spinner + "Cargando…" |
| **Unavailable backend** | Supabase error (view missing, RLS deny) | Alert destructive + error message + hint to run migrations + "Volver" |
| **Empty data** | total === 0 | Cards show 0; empty state card with CTA to Sales Intelligence |
| **Normal data** | total > 0 | 4 summary cards (total, with_outcome, without_outcome, distribution); sample table (first 50 rows) |

---

## SECTION 4: FRONTEND DRIFT PRIORITY

| Computation | Location | Migration priority | Notes |
|-------------|----------|--------------------|------|
| with_outcome / without_outcome count | CalibrationService.getCalibrationSummary → frontend reduce | **P2** | Could be RPC `fn_cal_validation_summary` returning counts |
| outcome_distribution | Frontend reduce over rows | **P2** | Same RPC |
| Sample fetch | CalibrationService selects * limit 500 | **P3** | Pagination or RPC with limit param |
| Win rate by bucket | Not implemented in UI | **P1** | Docs have SQL; no frontend. Blocking only if calibration decisions need UI |
| Loss rate by objection | Not implemented in UI | **P1** | Same |
| Rule adjustment candidates | Not implemented in UI | **P1** | Section 4 of SALES_CALIBRATION_PRODUCTION.md |

**P1** = blocking for full calibration workflow in UI. **P2** = improves performance, reduces client work. **P3** = nice-to-have.

---

## SECTION 5: CODE CHANGES MADE

| File | Change |
|------|--------|
| `src/modules/sales/CalibrationService.ts` | **NEW** — getCalibrationSummary() fetches from v_sales_calibration_dataset |
| `src/pages/admin/CalibrationReviewPage.tsx` | **NEW** — Page with loading, error, empty, normal states |
| `src/App.tsx` | Added CalibrationReviewPage import and route `/admin/sales/calibration` |
| `src/components/admin/AdminSidebar.tsx` | Added "Calibration Review" nav item with BarChart3 icon |
| `supabase/migrations/20250323000002_sales_calibration_production.sql` | Added GRANT SELECT ON v_sales_calibration_dataset TO authenticated |

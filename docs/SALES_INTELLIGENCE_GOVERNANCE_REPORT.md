# Sales Intelligence — Governance Report

---

## SECTION 1: MISSING ARTIFACTS

| Artifact | exists_in_repo | exists_in_db | location |
|----------|----------------|--------------|----------|
| sales_schema_base (tables, enums) | yes | yes | supabase/migrations/20250322000001_sales_schema_base.sql |
| sales_questionnaires | yes | yes | 20250322000001 + seed 20250322000002 |
| sales_question_sections | yes | yes | 20250322000001 + seed 20250322000002 |
| sales_questions | schema only | yes | 20250322000001 — seed has 0 rows |
| sales_answer_options | schema only | yes | 20250322000001 — seed has 0 rows |
| sales_scoring_rules | schema only | yes | 20250322000001 — seed has 0 rows |
| sales_objection_rules | schema + 1 rule (conditional) | yes | 20250322000002 — rule requires questions/options |
| sales_sessions | yes | yes | 20250322000001 |
| sales_session_answers | yes | yes | 20250322000001 |
| sales_session_objections | yes | yes | 20250322000001 |
| sales_session_events | yes | yes | 20250322000001 |
| sales_session_recommendations | yes | yes | 20250322000001 |
| sales_session_question_snapshots | yes | yes | 20250322000001 |
| sales_session_scores | no | unknown | not in schema; comment in 20250322000008 |
| fn_sales_create_session | yes | yes | 20250322000003 |
| fn_sales_save_answer | yes | yes | 20250322000003 |
| fn_sales_recalculate_scores | yes | yes | 20250322000003 |
| fn_sales_detect_objections | yes | yes | 20250322000003 |
| fn_sales_recalibrate_objections | yes | yes | 20250322000006 |
| fn_sales_detect_objections_v2 | yes | yes | 20250322000006, 20250322000008 |
| fn_sales_get_objection_summary | yes | yes | 20250322000006 |
| fn_sales_generate_recommendations | yes | yes | 20250322000007 |
| fn_sales_finalize_session | yes | yes | 20250322000007 |
| _ensure_internal | yes | yes | 20250322000004 |
| RLS sales_* | yes | yes | 20250322000005 |
| seed: 49 questions | no | yes | — |
| seed: 112 options | no | yes | — |
| seed: 55 scoring_rules | no | yes | — |
| seed: 24 objection_rules | no | yes | — |
| 20260318000001 (worktree) | worktree only | — | .claude/worktrees/focused-hugle/supabase/migrations/ |
| 20260318000002 (worktree) | worktree only | — | .claude/worktrees/focused-hugle/supabase/migrations/ |
| 20260318000003 (worktree) | worktree only | — | .claude/worktrees/focused-hugle/supabase/migrations/ |

---

## SECTION 2: CONSOLIDATION PLAN

**Migrations in main flow (supabase/migrations/):**

| Order | Filename | Contains |
|-------|----------|----------|
| 1 | 20250322000001_sales_schema_base.sql | CREATE TYPE, CREATE TABLE (12 tables), indexes |
| 2 | 20250322000002_sales_seed_v1.sql | questionnaire, 8 sections, price rule (conditional) |
| 3 | 20250322000003_sales_rpc_core.sql | create_session, save_answer, recalculate_scores, detect_objections |
| 4 | 20250322000004_sales_auth_helper.sql | _ensure_internal() |
| 5 | 20250322000005_sales_rls.sql | RLS + policies for 12 tables |
| 6 | 20250322000006_sales_objection_recalibration.sql | recalibrate, v2, get_objection_summary, (G) fix |
| 7 | 20250322000007_sales_recommendations_redesign.sql | generate_recommendations, finalize_session |
| 8 | 20250322000008_sales_performance_indexes.sql | indexes, v2 with DELETE event |

**Worktree leftovers — IGNORE or DELETE:**
- .claude/worktrees/focused-hugle/supabase/migrations/20260318000001_sales_objection_recalibration.sql
- .claude/worktrees/focused-hugle/supabase/migrations/20260318000002_sales_recommendations_redesign.sql
- .claude/worktrees/focused-hugle/supabase/migrations/20260318000003_sales_performance_indexes.sql

**Gap:** 20250322000002 lacks questions, options, scoring_rules, objection_rules. Extract from DB:
```sql
-- Run against live DB, save output to new migration or append to 20250322000002
SELECT * FROM sales_questions WHERE questionnaire_id = (SELECT id FROM sales_questionnaires WHERE code='nova_sales_intel' AND version=1);
SELECT * FROM sales_answer_options WHERE question_id IN (...);
SELECT * FROM sales_scoring_rules WHERE questionnaire_id = ...;
SELECT * FROM sales_objection_rules WHERE questionnaire_id = ...;
```

---

## SECTION 3: SCORE DECISION

**Choice: B) Remove sales_session_scores**

| Location | sales_sessions.score_* | sales_session_scores |
|----------|-------------------------|----------------------|
| FlowEngineLoader.ts | SELECT score_* | — |
| SalesSessionService.ts | SELECT score_* | — |
| fn_sales_recalculate_scores | UPDATE sales_sessions | — |
| fn_sales_recalibrate_objections | SELECT from sales_sessions | — |
| fn_sales_generate_recommendations | SELECT from sales_sessions | — |
| 20250322000001 schema | CREATE TABLE sales_sessions (score_*) | no CREATE |

**Changes required:**
- SQL: None. sales_session_scores not in schema. If it exists in DB, run:
  ```sql
  DROP TABLE IF EXISTS public.sales_session_scores CASCADE;
  ```
- Code: None. No references to sales_session_scores.

---

## SECTION 4: PRICE BUG

**Root cause:** (G) inference required `score_budget_readiness = 0`. Test produced 35. No rule fires for price because: (a) seed has conditional rule BUD_CURRENT_SPEND=under_3k→price but questions/options don't exist in repo seed; (b) (G) threshold too strict.

**Minimal fix (already applied in 20250322000006):**
```sql
-- Line 192: was = 0, now < 25
IF v_scores.score_budget_readiness < 25
```
Test still has budget=35, so (G) does not fire.

**Additional minimal fix for test:** Change one BUD_* answer so score_budget_readiness < 25. Example: BUD_AVAILABLE = no, or BUD_RANGE = under_3k. Or complete seed with questions/options so rule bud_spend_low_price inserts and fires (test uses BUD_CURRENT_SPEND=under_3k).

**Do NOT:** Rebalance thresholds, add new objection types, change other rules.

---

## SECTION 5: RLS STATUS

| table | rls_enabled | policies_found | location |
|-------|-------------|----------------|----------|
| sales_questionnaires | yes | sales_catalog_admin (ALL, is_admin) | 20250322000005_sales_rls.sql |
| sales_question_sections | yes | sales_sections_admin | 20250322000005 |
| sales_questions | yes | sales_questions_admin | 20250322000005 |
| sales_answer_options | yes | sales_options_admin | 20250322000005 |
| sales_scoring_rules | yes | sales_scoring_rules_admin | 20250322000005 |
| sales_objection_rules | yes | sales_objection_rules_admin | 20250322000005 |
| sales_sessions | yes | sales_sessions_admin | 20250322000005 |
| sales_session_answers | yes | sales_answers_admin | 20250322000005 |
| sales_session_objections | yes | sales_objections_admin | 20250322000005 |
| sales_session_events | yes | sales_events_admin | 20250322000005 |
| sales_session_recommendations | yes | sales_recommendations_admin | 20250322000005 |
| sales_session_question_snapshots | yes | sales_snapshots_admin | 20250322000005 |

**Missing:** None. All 12 tables have RLS enabled and one policy each (FOR ALL USING is_admin()).

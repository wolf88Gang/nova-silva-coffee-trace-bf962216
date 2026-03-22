# Sales Intelligence — Master spec (Nova Silva repo)

**Purpose:** Single source of truth for Cursor / Supabase AI / LLMs to align **this codebase** with the backend.  
**Date:** 2026-03-20  
**Repo status:** Production-style frontend in `src/`; schema in `supabase/migrations/`.

> **Nota:** Otros documentos o prompts pueden describir rutas tipo `src/lib/salesSessionService.ts` o tablas simplificadas (`answer_value` jsonb). **Este archivo refleja el repositorio actual (worktree).** Si difieren, prevalece este doc + migraciones.

> **Doble función de este documento:** Las secciones **§1 en adelante** describen el **sistema real** (anti-drift). La **§0** define el **contrato de producto**: cómo debe *comportarse* el copilot. Una implementación puede ser técnicamente alineada con §1–§11 y aún fallar si no cumple §0.

---

## 0. PRODUCT BEHAVIOR CONTRACT (NON-NEGOTIABLE)

Sales Intelligence is a **commercial copilot**, not a diagnostic form.

All implementations must satisfy the following behavioral contract.

### 0.1 The system must help the seller make decisions early

After **2–4 answers**, the system must already:

- suggest a commercial direction  
- highlight at least one risk  
- indicate whether the lead is promising or not  

If this does not happen, the system is behaving **incorrectly** (product failure), even if the pipeline is technically correct.

### 0.2 Question selection must be driven by commercial value

The next question must be selected based on:

- what **reduces uncertainty** about the sale  
- what **clarifies** a potential objection  
- what **confirms or rejects** a plan-fit hypothesis  

**NOT** based on:

- unanswered fields for their own sake  
- questionnaire completeness as the goal  
- static ordering  

*(Implementation today: `priorityEngine` + gaps/signals — must be tuned and audited against this rule; see `docs/COPILOT_FUNCIONAL_AUDIT.md`.)*

### 0.3 Interpretation must be actionable

All interpretation outputs must:

- be **tied to specific answers** (or explicit lack of data)  
- **influence** a commercial decision  
- **guide** seller behavior  

The system must avoid:

- generic summaries  
- descriptive-only signals  
- non-actionable insights  

### 0.4 Objections must be operationalized

Each objection surfaced to the seller must include (in UI or adjacent copy):

- **label** (human language)  
- **evidence** (which answers or patterns triggered it)  
- **handling strategy** (what the seller should do next)  

If an objection does not change seller behavior, it is not valid for the copilot layer.

### 0.5 Route recommendation must be decisive

The system must always propose **one primary route** (examples: piloto, demo enfocada, discovery, no avanzar — exact labels may be product copy).

The recommendation must include:

- **why** this route fits  
- **what evidence** supports it  
- **what is still missing** to confirm or change the route  

### 0.6 UI must answer these 7 questions at all times

1. Qué sabemos ya del cliente  
2. Qué no sabemos todavía  
3. Qué importa más descubrir ahora  
4. Qué señales están apareciendo  
5. Qué objeciones debemos anticipar  
6. Qué plan o ruta parece más adecuada  
7. Qué pitch conviene usar  

If the UI does not answer these **clearly** (not buried in jargon), the system is **incomplete** from a product standpoint.

### 0.7 Anti-patterns (must never happen)

- Asking irrelevant questions for the lead type  
- Showing internal codes or raw technical labels to the seller (dev tools excepted)  
- Continuing questioning after **enough signal** is available to decide next step  
- Deferring all interpretation to the end of the flow  
- Showing scores **without** explanation of what they imply for the seller  

---

## 1. Module overview

Internal **adaptive commercial diagnostic**: catalog in PostgreSQL, **next question + scores** resolved client-side (`FlowEngineLoader` + `priorityEngine`), **Commercial Copilot** UI en `/admin/sales/new`.

**Routes** (`RequireAdmin` + `AdminLayout`):

| Route | Component | Role |
|-------|-----------|------|
| `/admin/sales` | redirect → `/admin/sales/new` | Entry |
| `/admin/sales/new` | `SalesCopilotPage` | **Primary** — Copilot + `useCopilotDiagnostic` |
| `/admin/sales/legacy-wizard` | `SalesWizardPage` | **Frozen fallback** — URL only, no nav |
| `/admin/sales/sessions/:sessionId` | `SalesSessionResultsPage` | Results + outcome |
| `/admin/sales/calibration` | `CalibrationReviewPage` | Calibration (RPCs + view) |

There is **no** `/admin/sales/diagnostic` in this repo (removed in favor of copilot). There is **no** `SalesIntelligenceIndex` session list route in `App.tsx` (may be added later).

---

## 2. Database schema (actual migrations)

**Do not rename** tables used by the app without updating `FlowEngineLoader` and RPCs.

### 2.1 `sales_sessions` (summary)

- `organization_id` → **`platform_organizations(id)`** (NOT `organizaciones` in base migration).
- `questionnaire_id`, `questionnaire_version` — required FK to catalog.
- `status` — enum `sales_session_status` (`draft` | `completed` | `archived`) in schema; app also uses soft delete `deleted_at`.
- Scores: `score_*` as **integer** defaults 0.
- `metadata` **jsonb** — e.g. `skipped_question_ids` for copilot skip.
- `lead_name`, `lead_company`, `lead_type`, `commercial_stage`, `owner_user_id`, timestamps.

### 2.2 `sales_session_answers`

- PK `(session_id, question_id)`.
- `question_id` **uuid** → `sales_questions(id)`.
- Columns: `answer_text`, `answer_number`, `answer_boolean`, `answer_option_ids uuid[]`, `answer_json`, `created_at`.

### 2.3 `sales_questions` / `sales_answer_options`

Normalized catalog: sections, options as rows, `metadata` jsonb on questions (skip/branch rules). **Not** a single `options jsonb` column on `sales_questions`.

### 2.4 `sales_session_objections`

- `objection_type`, `confidence`, `source_rule`, `evidence`, etc. (see `20250322000001`).

### 2.5 `sales_session_recommendations`

- `recommendation_type`, `title`, `description`, `payload`, `priority`, etc.

### 2.6 `sales_session_outcomes`

- `session_id` UNIQUE, `outcome`, `deal_value`, `close_date`, **`reason_lost`**, `recorded_at`, `recorded_by`.

### 2.7 Calibration

- `CalibrationService` uses RPCs such as `fn_cal_validation_summary`, `fn_cal_score_bucket_analysis`, `fn_cal_objection_analysis`, and view `v_sales_calibration_dataset` — see `CalibrationService.ts` and migrations `20250323*`, `20250324*`.

---

## 3. RPC contract (frontend usage)

**Service file:** `src/modules/sales/SalesSessionService.ts`  
**Parameter style:** Supabase RPC args use **`p_*` prefixes** (e.g. `p_organization_id`), not bare `organization_id`.

| Method | RPC | Notes |
|--------|-----|--------|
| `createSession` | `fn_sales_create_session` | Returns **uuid string** `session_id` in `data` |
| `saveAnswer` | `fn_sales_save_answer` | `p_session_id`, `p_question_id`, typed answer fields |
| `recalculateScores` | `fn_sales_recalculate_scores` | `p_session_id` — **called after each answer** in `useCopilotDiagnostic` |
| `finalizeSession` | `fn_sales_finalize_session` | `p_session_id` |
| `getNextStep` | **no RPC** | Loads tables + runs `loadFlowState` (priority engine) client-side |
| `getDiagnosticBundle` | **no RPC** | Same fetch as `getNextStep` + returns `questions`/`answers` for interpretation |

**Optional:** `fn_debug_sales_auth` — not used in current UI (removed from pages).

**Not implemented in this service:** `rpcFirstAvailable` fallback chain; **single** function name per operation. If you add fallbacks, document them here.

### 3.1 Direct Supabase from frontend (exceptions)

- `skipQuestion`: **read/update** `sales_sessions.metadata` for `skipped_question_ids` (not an RPC).
- Session summary / outcomes: **`.from()`** queries as in `SalesSessionService.getSessionSummary`, `upsertOutcome`.

---

## 4. Organization source

Hook: `useAdminOrganizations` / `useAdminOrganizations` in `src/hooks/admin/` — uses admin repository / `v_admin_organizations_summary` when available (see `docs/SUPABASE_BACKEND_NOTES.md` and admin repos).

**`organization_id` for `createSession` must be a UUID** validated in `SalesSessionService.createSession`.

---

## 5. RLS and SECURITY DEFINER

Migrations enable RLS on sales tables; policies typically **`is_admin()`**. RPCs for create/save/finalize should be **SECURITY DEFINER** with internal admin checks — see `supabase/migrations/20250322000003_sales_rpc_core.sql` and follow-ups.

---

## 6. Adaptive / priority engine (this repo)

**Not** `src/lib/diagnosticEngine.ts`.

| Piece | Path |
|-------|------|
| Loader + single fetch | `src/modules/sales/FlowEngineLoader.ts` → `loadFlowState`, `loadSalesDiagnosticBundle` |
| Next question | `src/modules/sales/priorityEngine.ts` + `priorityQuestionConfig.ts` |
| Copilot UI | `src/components/sales/copilot/CopilotLayout.tsx`, `ZoneA/B/C` |
| Session hook | `src/hooks/useCopilotDiagnostic.ts` |
| Interpretation (pure) | `src/modules/sales/InterpretationEngine.ts` |
| Notes heuristics | `src/modules/sales/adaptiveQuestionEngine.ts` (`interpretAnswer` only) |

Flow: create session → loop **saveAnswer → recalculateScores → refresh bundle** → finalize → results page.

---

## 7. Hard rules (this codebase)

1. **Prefer** `SalesSessionService` for RPCs; avoid new `supabase.rpc` in random components.
2. **`organization_id` required** — validated before create.
3. **Objections / recommendations** after finalize: populated by backend pipeline, not manual inserts from UI.
4. **Outcomes:** `upsertOutcome` on `sales_session_outcomes` from admin UI is allowed (see service).

---

## 8. Debugging

Verbose `[Sales DEBUG]` logging was **removed** from `createSession` and pages. Use Supabase logs or temporary logging if needed.

---

## 9. File map (actual)

| File | Purpose |
|------|---------|
| `src/modules/sales/SalesSessionService.ts` | All sales RPCs + summary queries |
| `src/modules/sales/FlowEngineLoader.ts` | Load session, questions, answers, objections; merge priority engine |
| `src/modules/sales/priorityEngine.ts` | Next-question scoring |
| `src/modules/sales/FlowEngine.ts` | Base flow (skip/deepen flags) |
| `src/hooks/useCopilotDiagnostic.ts` | Primary diagnostic hook |
| `src/hooks/useSalesWizard.ts` | Legacy wizard only |
| `src/pages/admin/SalesCopilotPage.tsx` | `/admin/sales/new` |
| `src/pages/admin/SalesWizardPage.tsx` | `/admin/sales/legacy-wizard` |
| `src/pages/admin/SalesSessionResultsPage.tsx` | Session detail |
| `src/pages/admin/CalibrationReviewPage.tsx` | Calibration |
| `src/modules/sales/CalibrationService.ts` | Calibration RPCs |
| `docs/COPILOT_FUNCIONAL_AUDIT.md` | Manual QA checklist + priority-engine audit |

---

## 10. Backend implementation checklist (align to migrations)

Use **`supabase/migrations/20250322000001`** and subsequent sales migrations as source of truth, not the simplified DDL from generic prompts.

- [ ] `sales_questionnaires`, `sales_question_sections`, `sales_questions`, `sales_answer_options`
- [ ] `sales_sessions` with `platform_organizations` FK + `questionnaire_id`
- [ ] `sales_session_answers` with typed columns + `answer_option_ids uuid[]`
- [ ] `sales_scoring_rules`, `sales_objection_rules`
- [ ] `fn_sales_create_session`, `fn_sales_save_answer`, `fn_sales_recalculate_scores`, `fn_sales_finalize_session`
- [ ] RLS + admin policies
- [ ] Seed questionnaire `nova_sales_intel` v1 if empty

---

## 11. Relation to the “generic master prompt”

If a document specifies:

- `src/lib/salesSessionService.ts` → in this repo use **`src/modules/sales/SalesSessionService.ts`**
- `answer_value` jsonb only → real schema uses **typed columns**
- `fn_sales_get_next_step` as primary → this app uses **client-side** `getNextStep` from DB rows
- `/admin/sales/diagnostic` as primary → use **`/admin/sales/new`** (Copilot)

Keep this file updated when routes or RPC signatures change.

---

## 12. Product acceptance (maps to §0)

Backend/schema checklist (§10) ≠ product done. Before calling Sales Intelligence “ready for sellers”, validate **§0** with real sessions (e.g. after **3 answers**, capture what Zone B shows — see `docs/COPILOT_FUNCIONAL_AUDIT.md`).

- [ ] §0.1 — Direction, risk, lead quality hinted early  
- [ ] §0.2 — Question order plausibly driven by value (not only coverage)  
- [ ] §0.3–0.4 — Interpretation and objections actionable  
- [ ] §0.5 — One clear primary route + evidence + gaps  
- [ ] §0.6 — Las 7 preguntas respondidas en UI de forma clara  
- [ ] §0.7 — Anti-patterns absent in a typical run  

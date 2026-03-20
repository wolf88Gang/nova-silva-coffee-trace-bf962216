# CURSOR / SUPABASE MASTER PROMPT — Sales Intelligence Module

> **Purpose**: This document describes the complete Sales Intelligence architecture in Nova Silva so that Cursor, Supabase AI, or any LLM-based tool can understand the frontend contract and implement or debug the backend accordingly.
>
> **Date**: 2026-03-20
> **Status**: Production-active frontend, backend RPCs partially deployed.

---

## 1. MODULE OVERVIEW

Sales Intelligence is Nova Silva's internal tool for **adaptive commercial diagnostics**. It replaces the legacy static questionnaire with a dynamic, context-aware conversation engine.

**Frontend routes** (all under `RequireAdmin` guard):

| Route | Component | Purpose |
|---|---|---|
| `/admin/sales` | `SalesIntelligenceIndex` | Session list + entry point |
| `/admin/sales/new` | `SalesNewSession` | Legacy new-session wizard (kept for compatibility) |
| `/admin/sales/diagnostic` | `SalesDiagnostic` | **Primary** — Adaptive diagnostic page |
| `/admin/sales/sessions/:id` | `SalesSessionDetail` | Session results + outcome capture |
| `/admin/sales/calibration` | `CalibrationOverview` | Calibration Review dashboard |

---

## 2. DATABASE SCHEMA (Expected)

The frontend expects these tables to exist. **Do NOT rename or restructure them.**

### 2.1 `sales_sessions`

```sql
CREATE TABLE sales_sessions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizaciones(id),
  created_by      uuid REFERENCES auth.users(id),
  lead_name       text,
  lead_company    text,
  lead_type       text,
  commercial_stage text,
  status          text DEFAULT 'in_progress',   -- 'in_progress' | 'completed' | 'finalized'
  questionnaire_code    text,
  questionnaire_version int,
  score_total           numeric,
  score_pain            numeric,
  score_maturity        numeric,
  score_objection       numeric,
  score_urgency         numeric,
  score_fit             numeric,
  score_budget_readiness numeric,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);
```

**Columns the frontend reads**: `id, organization_id, lead_name, lead_company, lead_type, commercial_stage, status, score_total, score_pain, score_maturity, score_objection, score_urgency, score_fit, score_budget_readiness, created_at, updated_at`

**Columns the frontend does NOT expect**: `org_name`, `org_type`, `contact_name`, `pain_score`, `total_score`, `detail`, `signal`

### 2.2 `sales_session_outcomes`

```sql
CREATE TABLE sales_session_outcomes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid NOT NULL REFERENCES sales_sessions(id),
  outcome     text NOT NULL,           -- 'won' | 'lost' | 'no_decision'
  deal_value  numeric,
  created_at  timestamptz DEFAULT now()
);
```

**Columns the frontend reads**: `id, session_id, outcome, deal_value, created_at`

**Columns the frontend does NOT expect**: `reason_lost`, `close_date`

### 2.3 `sales_session_objections`

```sql
CREATE TABLE sales_session_objections (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      uuid NOT NULL REFERENCES sales_sessions(id),
  objection_type  text NOT NULL,
  confidence      numeric,
  created_at      timestamptz DEFAULT now()
);
```

**Columns the frontend reads**: `id, session_id, objection_type, confidence, created_at`

**Columns the frontend does NOT expect**: `detail`

### 2.4 `sales_session_recommendations`

```sql
CREATE TABLE sales_session_recommendations (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          uuid NOT NULL REFERENCES sales_sessions(id),
  recommendation_type text NOT NULL,
  priority            int,
  created_at          timestamptz DEFAULT now()
);
```

**Columns the frontend reads**: `id, session_id, recommendation_type, priority, created_at`

**Columns the frontend does NOT expect**: `detail`, `signal`

### 2.5 `sales_session_answers`

```sql
CREATE TABLE sales_session_answers (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   uuid NOT NULL REFERENCES sales_sessions(id),
  question_id  text NOT NULL,
  answer_value jsonb,
  created_at   timestamptz DEFAULT now()
);
```

### 2.6 `sales_rule_versions` (Calibration)

```sql
CREATE TABLE sales_rule_versions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deployed_at     timestamptz,
  description     text,
  changes_applied jsonb,
  is_active       boolean DEFAULT false
);
```

**Columns the frontend reads**: `id, deployed_at, description, changes_applied, is_active`

**Columns the frontend does NOT expect**: `parent_version_id`, `snapshot_before`, `snapshot_after`

### 2.7 `sales_questions` (Optional — for backend-driven flow)

```sql
CREATE TABLE sales_questions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code              text,
  title             text NOT NULL,
  description       text,
  question_type     text NOT NULL,   -- 'single_select' | 'multi_select' | 'boolean' | 'number' | 'text' | 'textarea'
  required          boolean DEFAULT true,
  options           jsonb,           -- [{value, label}]
  min_value         numeric,
  max_value         numeric,
  placeholder       text,
  sort_order        int,
  questionnaire_code    text,
  questionnaire_version int
);
```

---

## 3. RPC CONTRACT (Backend Functions)

The frontend calls these RPCs via `supabase.rpc()`. The service layer tries multiple function names and uses the first one that exists (for backward compatibility).

### 3.1 `fn_sales_create_session`

**Purpose**: Create a new sales diagnostic session.

**Input parameters**:
```json
{
  "organization_id": "uuid (REQUIRED — NOT NULL)",
  "lead_name": "text | null",
  "lead_company": "text | null",
  "lead_type": "text | null",
  "questionnaire_code": "text (default: 'nova_sales_intel')",
  "questionnaire_version": "int (default: 1)"
}
```

**Expected return**: JSON with at least `session_id` (uuid string):
```json
{ "session_id": "uuid" }
```

Or can return just the UUID string directly.

**CRITICAL**: `organization_id` is NOT NULL in the table. The frontend validates this before calling. The RPC must also validate and reject if missing.

**Implementation guidance**:
```sql
CREATE OR REPLACE FUNCTION fn_sales_create_session(
  organization_id uuid,
  lead_name text DEFAULT NULL,
  lead_company text DEFAULT NULL,
  lead_type text DEFAULT NULL,
  questionnaire_code text DEFAULT 'nova_sales_intel',
  questionnaire_version int DEFAULT 1
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id uuid;
BEGIN
  IF organization_id IS NULL THEN
    RAISE EXCEPTION 'organization_id is required';
  END IF;

  INSERT INTO sales_sessions (
    organization_id, created_by, lead_name, lead_company, lead_type,
    questionnaire_code, questionnaire_version, status
  ) VALUES (
    organization_id, auth.uid(), lead_name, lead_company, lead_type,
    questionnaire_code, questionnaire_version, 'in_progress'
  ) RETURNING id INTO v_session_id;

  RETURN jsonb_build_object('session_id', v_session_id);
END;
$$;
```

### 3.2 `fn_sales_save_answer`

**Purpose**: Save a single answer to a session.

**Input**:
```json
{
  "session_id": "uuid",
  "question_id": "text",
  "answer_value": "jsonb (string | number | boolean | string[])"
}
```

**Expected return**: anything (frontend ignores return value).

**Fallback names tried**: `fn_sales_save_answer`, `fn_sales_submit_answer`

### 3.3 `fn_sales_recalculate_scores`

**Purpose**: Recalculate all score_* columns on the session based on current answers.

**Input**: `{ "session_id": "uuid" }`

**Expected return**: anything (optional — frontend treats as fire-and-forget).

**NOTE**: Frontend calls this after every answer. If the function doesn't exist, it silently continues.

### 3.4 `fn_sales_finalize_session`

**Purpose**: Mark session as finalized, compute final objections and recommendations.

**Input**: `{ "session_id": "uuid" }`

**Expected behavior**:
1. Update `sales_sessions.status = 'finalized'`
2. Compute and insert rows into `sales_session_objections`
3. Compute and insert rows into `sales_session_recommendations`
4. Update all `score_*` columns

**Fallback names tried**: `fn_sales_finalize_session`, `fn_sales_complete_session`

### 3.5 `fn_sales_get_session_summary`

**Purpose**: Return full session data with objections, recommendations, and outcome.

**Input**: `{ "session_id": "uuid" }`

**Expected return**:
```json
{
  "session": { /* sales_sessions row */ },
  "objections": [ { "id", "objection_type", "confidence" } ],
  "recommendations": [ { "id", "recommendation_type", "priority" } ],
  "outcome": { "id", "outcome", "deal_value" } | null
}
```

**NOTE**: If this RPC doesn't exist, the frontend falls back to direct table reads from `sales_sessions`, `sales_session_objections`, `sales_session_recommendations`, `sales_session_outcomes`.

**Fallback names tried**: `fn_sales_get_session_summary`, `fn_sales_session_summary`

### 3.6 `fn_sales_get_next_step` (Optional — legacy wizard flow)

**Purpose**: Return the next unanswered question for a session.

**Input**: `{ "session_id": "uuid" }`

**Expected return**:
```json
{
  "current_question": {
    "id": "uuid",
    "code": "text",
    "title": "text",
    "question_type": "single_select | multi_select | boolean | number | text | textarea",
    "options": [{ "value": "...", "label": "..." }],
    "required": true
  },
  "is_complete": false
}
```

**Fallback names tried**: `fn_sales_get_next_step`, `fn_sales_next_step`, `fn_sales_get_next_question`

### 3.7 `fn_debug_sales_auth` (Optional — debug only)

**Purpose**: Return current auth state for debugging.

**Input**: none

**Expected return**: anything (logged to console).

---

## 4. ORGANIZATION SOURCE

The frontend loads organizations for the org selector using this **cascading fallback**:

1. `v_admin_organizations_summary` (view) — preferred
2. `platform_organizations` (table) — fallback
3. `organizaciones` (table) — last resort

**Columns expected from any source** (normalized by frontend):
- `id` (or `organization_id`) → mapped to `id`
- `nombre` (or `organization_name`, `name`) → mapped to `nombre`
- `tipo` (or `org_type`, `organization_type`) → mapped to `tipo`

**Activity filter**: Frontend filters by `is_active = true` OR `activo = true` OR `status IN ('active', 'activo', 'trial')`. If none of these columns exist, all rows are included.

---

## 5. RLS REQUIREMENTS

All tables must have RLS enabled. Suggested policies:

```sql
-- Platform admins can do everything
CREATE POLICY "admin_full_access" ON sales_sessions
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Same pattern for sales_session_answers, sales_session_outcomes,
-- sales_session_objections, sales_session_recommendations
```

**CRITICAL**: `fn_sales_create_session` must use `SECURITY DEFINER` so it can insert regardless of RLS. The function internally checks `auth.uid()`.

---

## 6. ADAPTIVE DIAGNOSTIC ENGINE (Frontend-Only)

The `/admin/sales/diagnostic` page uses a **frontend-driven adaptive engine** (`src/lib/diagnosticEngine.ts`). Key concepts:

### 6.1 Lead Profile

A runtime object maintained in React state:

```typescript
interface LeadProfile {
  organization_type: string | null;     // 'cooperativa' | 'exportador' | 'beneficio_privado' | 'productor_empresarial'
  organization_id: string | null;       // UUID from org selector
  organization_name: string | null;
  scale: string | null;                 // 'micro' | 'small' | 'medium' | 'large'
  geography: string | null;
  commercialization_model: string | null;
  pain_points: string[];                // e.g. ['traceability', 'productivity']
  constraints: string[];
  signals: string[];                    // derived signals like 'budget_confirmed', 'urgency_immediate'
  notes: string[];
  confidence_scores: Record<string, number>;
  raw_answers: Record<string, unknown>;
}
```

### 6.2 Question Bank

Hardcoded question definitions with adaptive filters:
- `relevantFor: string[] | null` — which org types see this question
- `requiredFields: string[]` — profile fields that must be filled first
- `excludeIfSignals: string[]` — skip if these signals already detected
- `priority: number` — lower = asked first

### 6.3 Flow

```
User selects org_type → org_id → session is created via fn_sales_create_session
  → adaptive questions appear based on profile state
  → each answer: updates profile, saves via fn_sales_save_answer, recalculates scores
  → when no more questions: user clicks Finalize
  → fn_sales_finalize_session is called
  → redirect to /admin/sales/sessions/:id for results
```

### 6.4 Interpretation (Frontend)

After each answer, the frontend computes:
- **Pain signals**: mapped from selected pain points with confidence scores
- **Maturity level**: inferred from tool usage (pre-digital → emergent → transitioning)
- **Objection hypotheses**: detected from budget, timeline, and blocker answers
- **Positioning suggestions**: based on org type + pain combination
- **Recommendations**: based on maturity, scale, and pain count

This interpretation is displayed in a right-side panel. It is NOT stored in the database — it's ephemeral.

---

## 7. CALIBRATION REVIEW (Frontend)

The Calibration Review module reads **directly from tables** (no RPCs) with graceful fallback:

| Tab | Data Source | Columns Read |
|---|---|---|
| Overview | `sales_sessions` + `sales_session_outcomes` | scores, outcome, status |
| Scores | `sales_sessions` + `sales_session_outcomes` | all score_* columns |
| Bloqueadores | `sales_session_objections` + `sales_session_outcomes` | objection_type, confidence |
| Próximos pasos | `sales_session_recommendations` + `sales_session_outcomes` | recommendation_type, priority |
| Versiones | `sales_rule_versions` | id, deployed_at, description, changes_applied, is_active |
| Señales | computed from sessions + objections + recommendations | (frontend analytics) |

**Backend availability check**: If a table query returns error code `42P01`, `42501`, or `PGRST205`, the UI shows "Backend no disponible" instead of crashing.

---

## 8. SERVICE LAYER ARCHITECTURE

File: `src/lib/salesSessionService.ts`

This is the **ONLY** authorized way to interact with sales data from the frontend:

```
SalesSessionService.createSession()     → supabase.rpc('fn_sales_create_session', ...)
SalesSessionService.saveAnswer()        → supabase.rpc('fn_sales_save_answer', ...)
SalesSessionService.recalculateScores() → supabase.rpc('fn_sales_recalculate_scores', ...)
SalesSessionService.finalizeSession()   → supabase.rpc('fn_sales_finalize_session', ...)
SalesSessionService.getSessionSummary() → supabase.rpc('fn_sales_get_session_summary', ...) with table fallback
SalesSessionService.saveOutcome()       → direct upsert to sales_session_outcomes
SalesSessionService.getNextStep()       → supabase.rpc('fn_sales_get_next_step', ...)
```

**Key design pattern**: `rpcFirstAvailable(names[], params)` — tries multiple function names sequentially, stops at the first that exists. This allows backend to use any naming convention.

---

## 9. HARD RULES

1. **NO direct inserts** into `sales_sessions` — always use `fn_sales_create_session`
2. **`organization_id` is REQUIRED** and NOT NULL — frontend validates before RPC call
3. **All RPCs must be SECURITY DEFINER** — they resolve `auth.uid()` internally
4. **No `exec_sql`** — all logic in dedicated RPC functions
5. **Frontend never writes to `sales_session_objections` or `sales_session_recommendations`** — only `fn_sales_finalize_session` populates these
6. **Outcome capture** is the only direct table write from frontend (`sales_session_outcomes`)

---

## 10. DEBUGGING

The frontend logs to console on every session creation:

```
[Sales DEBUG] VITE_SUPABASE_URL      → confirms which Supabase project
[Sales DEBUG] session_user_id        → confirms authenticated user
[Sales DEBUG] supabase_auth_session  → full auth session object
[Sales DEBUG] fn_debug_sales_auth    → result of debug RPC (if exists)
[Sales DEBUG] fn_sales_create_session_payload → exact params sent
[Sales DEBUG] fn_sales_create_session result/error → response or error
```

---

## 11. COMMON ERRORS AND FIXES

| Error | Root Cause | Fix |
|---|---|---|
| `null value in column "organization_id"` | Frontend sent null org_id | Frontend bug — org selector not wired |
| `function fn_sales_create_session does not exist` | RPC not deployed | Deploy the function (see §3.1) |
| `permission denied for table sales_sessions` | RLS blocks direct insert | Use SECURITY DEFINER RPC instead |
| `column "detail" does not exist` | Frontend querying ghost column | Already fixed — remove from SELECT |
| `relation "sales_rule_versions" does not exist` | Table not created | Create table (see §2.6) |

---

## 12. FILE MAP

| File | Purpose |
|---|---|
| `src/lib/salesSessionService.ts` | Service layer — all backend calls |
| `src/lib/diagnosticEngine.ts` | Adaptive question engine + interpretation |
| `src/hooks/useAdminSalesOrganizations.ts` | Org loader with cascading fallback |
| `src/hooks/useCalibrationData.ts` | Calibration Review data hooks |
| `src/types/calibration.ts` | Type definitions for calibration tables |
| `src/pages/admin/sales/SalesDiagnostic.tsx` | Adaptive diagnostic page |
| `src/pages/admin/sales/SalesNewSession.tsx` | Legacy new-session wizard |
| `src/pages/admin/sales/SalesSessionDetail.tsx` | Session results page |
| `src/pages/admin/sales/SalesIntelligenceIndex.tsx` | Session list |
| `src/components/admin/sales/DiagnosticInputCard.tsx` | Hybrid input component |
| `src/components/admin/sales/DiagnosticInterpretationPanel.tsx` | Live interpretation panel |
| `src/components/admin/sales/SalesQuestionRenderer.tsx` | Legacy question renderer |
| `src/lib/calibrationAnalytics.ts` | Frontend analytics computations |

---

## 13. IMPLEMENTATION CHECKLIST FOR BACKEND

- [ ] Create `sales_sessions` table with exact columns from §2.1
- [ ] Create `sales_session_answers` table (§2.5)
- [ ] Create `sales_session_outcomes` table (§2.2)
- [ ] Create `sales_session_objections` table (§2.3)
- [ ] Create `sales_session_recommendations` table (§2.4)
- [ ] Create `sales_rule_versions` table (§2.6)
- [ ] Deploy `fn_sales_create_session` RPC (§3.1)
- [ ] Deploy `fn_sales_save_answer` RPC (§3.2)
- [ ] Deploy `fn_sales_recalculate_scores` RPC (§3.3)
- [ ] Deploy `fn_sales_finalize_session` RPC (§3.4)
- [ ] Deploy `fn_sales_get_session_summary` RPC (§3.5) — optional, frontend has table fallback
- [ ] Enable RLS on all tables (§5)
- [ ] Ensure `organizaciones` or `v_admin_organizations_summary` exists and is populated
- [ ] Test: create session → save answers → finalize → read summary

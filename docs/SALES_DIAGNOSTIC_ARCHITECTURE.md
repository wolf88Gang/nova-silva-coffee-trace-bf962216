# Sales Diagnostic — Adaptive Architecture

**Route:** `/admin/sales/diagnostic`

## 1. Architecture Changes

### Before (Static Questionnaire)
- Linear wizard: question 1 → 2 → 3 → … → N
- FlowEngine returns single `next_question` by position + skip rules
- Batch scoring only at finalize
- Fixed question order, irrelevant branches possible

### After (Adaptive Diagnostic)
- **Conversation-style UI**: Left = inputs, Right = live interpretation
- **lead_profile**: Frontend state object updated on every interaction
- **Adaptive engine**: Picks next question from pool based on:
  - `organization_type` (productor | cooperativa | exportador | beneficio)
  - Missing critical fields in lead_profile
  - Detected pain patterns
  - Contradictions
- **Continuous scoring**: `recalculateScores` after each answer
- **Live objections**: Progressive detection with confidence
- **Session creation**: Only after `organization_type` + `organization_id` selected

---

## 2. Component Structure

```
/admin/sales/diagnostic
├── SalesDiagnosticPage
│   ├── TOP: OrgTypeSelector + OrgSelector (required before session)
│   ├── LEFT: DiagnosticConversationPanel
│   │   ├── ConversationHistory (answered blocks)
│   │   └── HybridInputBlock (current step)
│   └── RIGHT: DiagnosticInterpretationPanel
│       ├── LeadProfileSummary
│       ├── DetectedSignals
│       ├── ScoresEvolving
│       ├── ObjectionsForming
│       └── RecommendationsEvolving
│
├── LeadProfileProvider (context)
├── useAdaptiveDiagnostic (hook: session + flow + profile)
└── adaptiveQuestionEngine (module: next question logic)
```

---

## 3. lead_profile Implementation

```ts
interface LeadProfile {
  organization_type: 'productor' | 'cooperativa' | 'exportador' | 'beneficio' | null;
  organization_id: string | null;
  scale: string | null;           // e.g. "pequeño", "mediano", "grande"
  geography: string | null;
  commercialization_model: string | null;
  pain_points: string[];
  constraints: string[];
  signals: string[];
  notes: string[];
  confidence_scores: Record<string, number>;
  updated_at: string;             // ISO
}
```

- **Storage**: React context (`LeadProfileContext`)
- **Updates**: `updateLeadProfile(partial)` merges into state
- **Derivation**: Each answer block → `interpretAnswer()` → updates profile + emits interpretation
- **Persistence**: Mapped to `sales_session_answers` when question_id exists; free-form stored in `answer_json` or notes

---

## 4. Adaptive Question Generation

1. **Question pool**: Load all active questions from FlowEngineLoader (same as before)
2. **Filter by organization_type**:
   - Questions have `metadata.applies_to?: ('productor'|'cooperativa'|'exportador'|'beneficio')[]`
   - If `applies_to` exists and doesn't include current org_type → skip
   - If no `applies_to` → show to all
3. **Filter by lead_profile gaps**:
   - Critical fields (org_type, scale) missing → prioritize questions that fill them
4. **FlowEngine integration**:
   - Pass filtered/sorted pool to `computeFlowState` OR
   - Use FlowEngine's skip/deepen logic on pre-filtered candidates
5. **Fallback**: If no DB question matches, show custom prompt from `ADAPTIVE_PROMPTS` config

---

## 5. What Was Removed / Disabled

| Removed | Reason |
|---------|--------|
| Rigid multi-step wizard | Replaced by conversation flow |
| Fixed question order | Replaced by adaptive selection |
| "Answer everything then compute" | Replaced by continuous scoring |
| Single next_question display | Replaced by contextual next step |
| Irrelevant branching | Pruned by organization_type filter |

**Kept (unchanged)**:
- `SalesWizardPage` at `/admin/sales/new` — still available for legacy flow
- `FlowEngine` — used as support (question pool, skip logic)
- `FlowEngineLoader` — data source
- `SalesSessionService` — createSession, saveAnswer, recalculateScores, finalizeSession

---

## 6. Backend Dependencies

| Dependency | Usage |
|------------|-------|
| `fn_sales_create_session` | Create session after org_id selected |
| `fn_sales_save_answer` | Persist each answer (question_id from pool) |
| `fn_sales_recalculate_scores` | Called after each save (continuous scoring) |
| `fn_sales_finalize_session` | When user completes diagnostic |
| `fn_sales_get_objection_summary` | Live objections (poll or on demand) |
| `loadFlowState` | Question pool + answers + scores + objections |
| `sales_questions` | Source of questions (filtered by org_type) |
| `sales_answer_options` | Options for single/multi select |
| `v_admin_organizations_summary` | Org dropdown |

**No new backend**: All logic uses existing RPCs and tables. Frontend drives adaptive selection.

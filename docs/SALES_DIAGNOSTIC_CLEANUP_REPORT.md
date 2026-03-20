# Sales Diagnostic Cleanup Report

## SECTION 1: DEAD CODE REMOVED

| File | Removed |
|------|---------|
| `src/pages/admin/SalesDiagnosticPage.tsx` | Entire page (duplicate diagnostic flow) |
| `src/hooks/useAdaptiveDiagnostic.ts` | Hook (order-based adaptive engine) |
| `src/components/sales/diagnostic/DiagnosticConversationPanel.tsx` | Component |
| `src/components/sales/diagnostic/DiagnosticInterpretationPanel.tsx` | Component |
| `src/components/sales/diagnostic/HybridInputBlock.tsx` | Component |
| `src/contexts/LeadProfileContext.tsx` | Context + provider |
| `src/modules/sales/adaptiveQuestionEngine.ts` | filterByOrganizationType, getNextAdaptiveQuestion, interpretAnswer |
| `src/modules/sales/FlowEngineLoader.ts` | loadDiagnosticState() |

**Debug code removed:**
- `SalesWizardPage.tsx`: useEffect with fn_debug_sales_auth, handleStart console.log, DEV org_id block, supabase import
- `SalesSessionService.ts`: createSession debug block (fn_debug_sales_auth, console.logs)
- `CalibrationReviewPage.tsx`: useEffect with fn_debug_sales_auth, supabase import

**Route removed:** `/admin/sales/diagnostic`

**Nav item removed:** "Diagnóstico adaptativo" from AdminSidebar

---

## SECTION 2: ACTIVE FLOW CONFIRMED

**Components in use:**
- `SalesWizardPage` — main diagnostic UI
- `QuestionRenderer` — question input (single/multi select, boolean, number, text, textarea)
- `SalesInsightPanel` — live commercial signals
- `useSalesWizard` — session state + createSession, saveAnswer, skipQuestion, finalizeAndComplete

**Flow:** Session setup → QuestionRenderer + SalesInsightPanel → signal-driven priority engine → finalize → results

**Routes working:**
- `/admin/sales` → redirect to `/admin/sales/new`
- `/admin/sales/new` → SalesWizardPage
- `/admin/sales/sessions/:sessionId` → SalesSessionResultsPage
- `/admin/sales/calibration` → CalibrationReviewPage

---

## SECTION 3: DUPLICATION REMOVED

| Consolidated | Details |
|--------------|---------|
| Single wizard flow | Removed duplicate SalesDiagnosticPage; one flow at /admin/sales/new |
| Question input | QuestionRenderer only (was shared by both flows; HybridInputBlock removed) |
| Session/answer logic | useSalesWizard only; useAdaptiveDiagnostic removed |
| Question selection | Priority engine (signal-driven) only; adaptiveQuestionEngine (order-based) removed |
| Profile/interpretation | SalesInsightPanel; LeadProfileContext + DiagnosticInterpretationPanel removed |

---

## SECTION 4: BUILD STATUS

- **Type check:** `npx tsc --noEmit` — PASS
- **Build:** `npm run build` — PASS (5.95s)

---

## SECTION 5: REMAINING RISKS

1. **Empty `src/components/sales/diagnostic/` folder** — All 3 files deleted; folder may be empty. Safe to delete directory if desired.

2. **Login redirect** — `Login.tsx` navigates to `/admin/sales/new` on success; route still valid.

3. **CalibrationReviewPage link** — "Ir a Sales Intelligence" points to `/admin/sales/new`; correct.

4. **salesDiagnostic.ts** — Types (LeadProfile, OrganizationType, etc.) retained; used by priority engine. No risk.

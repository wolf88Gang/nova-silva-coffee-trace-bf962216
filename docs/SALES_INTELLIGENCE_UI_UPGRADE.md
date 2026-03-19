# Sales Intelligence — UI Upgrade

## 1. UI Audit (Before)

### SalesWizardPage
- **Usable**: Flow logic, org picker, question display, progress bar
- **Rough**: Generic SectionCard layout, no session context after start, weak visual hierarchy
- **Gaps**: No insight panel, no real-time scores/objections, session context lost after create
- **State**: Error shown inline; no graceful empty-org handling; "Cargando" state minimal

### SalesSessionResultsPage
- **Usable**: Scores, objections, recommendations displayed
- **Rough**: Flat grid, recommendations buried below objections
- **Gaps**: No executive framing; no "what to do next" emphasis; no session metadata
- **State**: Basic loading/error; no partial-data handling

### QuestionRenderer
- **Usable**: single_select, multi_select
- **Rough**: Plain radio/checkbox, weak selected state
- **Gaps**: boolean, number, text, textarea showed "Tipo no soportado"

### SalesProgressBar
- **Usable**: answered/total, percentage
- **Rough**: Minimal styling

---

## 2. Implementation Plan (Executed)

1. Extend `useSalesWizard` saveAnswer for all answer types (option_ids, text, number, boolean)
2. Upgrade QuestionRenderer: all 6 types, card-style options, clear selected state
3. Add SalesInsightPanel: scores, objections, flags, session context, progress
4. Redesign SalesWizardPage: header with context, main + sticky panel layout, robust states
5. Redesign SalesSessionResultsPage: primary score, recommendations first, objections, breakdown, metadata
6. Improve state handling: no org, no questions, RPC failure, empty recommendations

---

## 3. Code Changes by File

### Modified

| File | Changes |
|------|---------|
| `src/hooks/useSalesWizard.ts` | saveAnswer accepts `SaveAnswerPayload` (option_ids \| text \| number \| boolean) |
| `src/components/sales/QuestionRenderer.tsx` | Full rewrite: single_select, multi_select, boolean, number, text, textarea; card-style options; `hasValidAnswer` |
| `src/components/sales/SalesProgressBar.tsx` | Cleaner layout, tabular-nums |
| `src/pages/admin/SalesWizardPage.tsx` | Session context, insight panel, Card layout, buildPayload, robust states |
| `src/pages/admin/SalesSessionResultsPage.tsx` | Executive layout: primary score, recommendations first, objections, breakdown, metadata |
| `src/modules/sales/SalesSessionService.ts` | getSessionSummary: add lead_name, lead_company, lead_type to select and response |

### New

| File | Purpose |
|------|---------|
| `src/components/sales/SalesInsightPanel.tsx` | Real-time scores, objections, flags, session context, progress |

---

## 4. UX Rationale

- **Diagnostic cockpit**: Session context (org, lead) always visible; insight panel shows live signals
- **Fast answering**: Card-style options with clear selected state; single click to choose
- **Recommendations first**: Results page answers "what should we do next?" immediately
- **Graceful degradation**: Empty orgs, no questions, RPC failure all have clear UI
- **Admin-panel consistency**: Reuses SectionCard, Card, Alert, Button; no new design language

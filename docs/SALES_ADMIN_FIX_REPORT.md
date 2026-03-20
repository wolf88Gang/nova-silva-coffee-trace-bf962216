# Sales Intelligence Admin UI — Fix Report

## 1. Root Causes Found

| Issue | Root Cause |
|-------|------------|
| **organization_id null** | When `useAdminOrganizations` falls back to mock data (ADMIN_ALLOW_MOCK_FALLBACK in DEV), mock orgs have `id: 'org-001'` etc. — not valid UUIDs. Passing these to `fn_sales_create_session` causes FK/null errors. Also: no frontend guard when org missing; no validation in service before RPC. |
| **Calibration "backend unavailable"** | CalibrationService errors were generic. When `v_sales_calibration_dataset` fails (depends on sales_session_objections, sales_session_recommendations), the raw error mentioned those tables, causing confusion. |
| **Org selector** | Already uses `v_admin_organizations_summary` via `useAdminOrganizations` → `adminOrganizationsRepository`. No explicit block when fallback; Evaluar could be clicked with mock orgs. |

## 2. Files Changed

| File | Changes |
|------|---------|
| `src/modules/sales/SalesSessionService.ts` | UUID validation before RPC; throw clear error if organization_id missing/invalid |
| `src/pages/admin/SalesWizardPage.tsx` | isFallbackOrgs guard; toast when org missing; toast when mock; disable Evaluar when isFallbackOrgs; debug block (org id + name); env debug on mount |
| `src/pages/admin/CalibrationReviewPage.tsx` | Env debug on mount; improved error copy |
| `src/modules/sales/CalibrationService.ts` | Clearer error messages naming fn_cal_* and v_sales_calibration_dataset |

## 3. Exact Fixes Applied

### SECTION 1: New Session

- **SalesSessionService.createSession()**: Added validation at top:
  ```ts
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!req.organization_id || typeof req.organization_id !== 'string' || !UUID_REGEX.test(req.organization_id)) {
    throw new Error('organization_id is required and must be a valid UUID from platform_organizations');
  }
  ```
- **SalesWizardPage.handleStart()**: Guard when `!organizationId` → toast "Selecciona una organización". Guard when `isFallbackOrgs` → toast "Backend no disponible" and return.
- **SalesWizardPage**: Button disabled when `isFallbackOrgs`. Alert when `isFallbackOrgs` and orgs loaded.
- **SalesWizardPage**: In DEV, debug line showing `organization_id` and org name when org selected.

### SECTION 2: Org Selector

- Uses `useAdminOrganizations` → `fetchOrganizations` → `fetchOrganizationsFromDb` → `v_admin_organizations_summary`.
- Loading state: `orgsQuery.isLoading` → "Cargando…".
- Empty state: `orgs.length === 0` → "Sin organizaciones. Ejecuta insert_demo_orgs.sql en Supabase.".
- Submit disabled until org selected and not fallback.
- Debug: org id and name shown in DEV when org selected.

### SECTION 3: Calibration Review Data Sources

CalibrationReviewPage has no tabs. Single query via `CalibrationService.getCalibrationSummary()`:

| Data | Source | Status |
|------|--------|--------|
| validation | fn_cal_validation_summary | ✓ RPC |
| score_bucket_analysis | fn_cal_score_bucket_analysis | ✓ RPC |
| objection_analysis | fn_cal_objection_analysis | ✓ RPC |
| sample, rows_for_rec | v_sales_calibration_dataset | ✓ View |

No direct table reads. All via RPCs and view.

### SECTION 4: Backend Availability Checks

- CalibrationService errors now name the failing dependency (fn_cal_validation_summary, fn_cal_score_bucket_analysis, fn_cal_objection_analysis, v_sales_calibration_dataset).
- View error explains that v_sales_calibration_dataset depends on sales_sessions, sales_session_objections, sales_session_recommendations, sales_session_outcomes.
- CalibrationReviewPage error copy lists RPCs and migrations.

### SECTION 5: Environment Validation

- SalesWizardPage: On mount, logs `[Sales DEBUG]` with VITE_SUPABASE_URL, user_id, fn_debug_sales_auth.
- CalibrationReviewPage: Same on mount as `[Calibration DEBUG]`.

## 4. Remaining Blockers

1. **v_admin_organizations_summary / platform_organizations**: If the view or tables fail (e.g. missing invoices, billing_usage_snapshots), orgs fall back to mock. Ensure migrations 20250318*, 20250318* are applied.
2. **Demo orgs**: Run `supabase/scripts/insert_demo_orgs.sql` so org dropdown has real UUIDs.
3. **Calibration**: Migrations 20250323000001, 20250323000002, 20250324000001, 20250324000002 must be applied for fn_cal_* and v_sales_calibration_dataset.

## 5. Manual Validation Steps

1. Open `/admin/sales/new`.
2. Confirm org dropdown loads (or shows "Cargando…" then options).
3. If "Sin organizaciones" → run `insert_demo_orgs.sql`.
4. Select an org.
5. In DEV, verify `[DEBUG] organization_id: <uuid> | org: <name>` appears.
6. Click **Evaluar**.
7. Verify session is created (no "null value in column organization_id").
8. Answer questions → finalize → results page.
9. Open **Calibration Review** (`/admin/sales/calibration`).
10. Verify each section loads real data or shows correct empty state (e.g. "No hay sesiones completadas"), not false "backend unavailable" for wrong tables.

---

## 6. Browser Validation Results (PASSED)

Validación E2E ejecutada contra backend real:

| Paso | Resultado |
|------|-----------|
| Login → /login | OK |
| Navegar a Sales Intel → /admin/sales | OK — "Datos en vivo (Supabase)" |
| Nueva evaluación → /admin/sales/new | OK |
| Org dropdown | OK — 7 organizaciones con UUIDs reales (no mock org-001) |
| Seleccionar org + lead + company | OK |
| Click Evaluar | OK |
| fn_sales_create_session | OK — sesión creada (488d1b7a...) |
| organization_id null | OK — no se produce |
| Wizard diagnóstico | OK — preguntas, respuestas guardadas, objeciones en tiempo real |
| Calibration Review → /admin/sales/calibration | OK — datos reales de RPCs |
| Sesiones completadas | OK — 3 |
| Con outcome | OK — 2 |
| Rule candidates | OK — 4 objeciones over-triggered |
| Sample table | OK — 4 sesiones con scores |

**Prerequisitos backend cumplidos:**
- `v_admin_organizations_summary` — 12 orgs
- `platform_organizations` sincronizado con `organizations` (FK para sales_sessions)
- `fn_cal_validation_summary`, `fn_cal_score_bucket_analysis`, `fn_cal_objection_analysis`
- `v_sales_calibration_dataset`

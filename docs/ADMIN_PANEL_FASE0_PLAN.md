# Admin Panel — FASE 0: Inspección y Plan

> Referencia: [Nova Silva Data Governance Admin Control Framework](https://www.notion.so/Nova-Silva-Data-Governance-Admin-Control-Framework-3265a29b09e880e9a499f1bbf04186e8)

---

## 1. Arquitectura detectada

### Esquema Supabase (migraciones)

| Tabla / Vista | Origen | Campos clave |
|---------------|--------|--------------|
| `platform_organizations` | 20250304210000 + 20250318000000 | id, name, display_name, org_type, tipo, plan, status, country, trial_ends_at, modules, created_at |
| `profiles` | Supabase Auth (trigger) + ALTER | user_id, organization_id, full_name, email, is_active, last_login_at |
| `user_roles` | 20250318000000 | user_id, role, organization_id |
| `org_billing_settings` | 20250318010000 | organization_id, plan_code, billing_cycle, status, trial_ends_at |
| `billing_plans` | 20250318010000 | code, default_monthly_price, default_annual_price |
| `billing_addons` | 20250318010000 | code, name |
| `org_billing_addons` | 20250318010000 | organization_id, addon_id, is_active |
| `billing_usage_snapshots` | 20250318010000 | organization_id, snapshot_month, metric_code, metric_value |
| `invoices` | 20250318010000 | organization_id, invoice_number, period_start, period_end, total_amount, status |
| `invoice_lines` | 20250318010000 | invoice_id, line_type, description, line_total |
| `payments` | 20250318010000 | organization_id, invoice_id, amount, payment_date, method |
| `admin_action_logs` | 20250318020000 | organization_id, target_user_id, action_type, action_payload |
| `v_admin_organizations_summary` | 20250318020000 | Vista resumen orgs |
| `v_admin_users_summary` | 20250318020000 | Vista resumen users |

### Helpers SQL existentes

- `get_user_organization_id(p_user_id)` → organization_id desde profiles
- `is_admin()` → true si user_roles tiene admin o superadmin
- `has_role(p_user_id, p_role)`
- `get_user_profile_role(p_user_id)`
- `log_admin_action(...)`
- `upsert_billing_usage_snapshot(...)`
- `recalculate_invoice_totals(p_invoice_id)`
- `mark_invoice_paid_if_fully_covered(p_invoice_id)`
- `generate_invoice_number()`

### Frontend actual

- **Servicios**: `adminOrganizationsService`, `adminUsersService`, `adminBillingService`, `adminComplianceService`, `adminPlatformService`, `adminGrowthService`
- **Estado**: Todos usan mocks (`MOCK_ORGANIZATIONS`, `MOCK_USERS`, etc.)
- **Supabase**: `@/integrations/supabase/client` — usado en otros módulos, no en admin
- **Auth**: `RequireAdmin` + `AuthContext` (role admin desde user_roles)

---

## 2. Esquema real vs esperado

| Dominio | Esperado (spec) | Real | Gap |
|---------|-----------------|------|-----|
| **Organizations** | id, name, tipo, plan, status, country, created_at | ✅ platform_organizations tiene todo (tipo, plan, status vía ALTER) | `org_type` (text) vs `tipo` (enum) — ambos existen |
| **Users** | profiles + user_roles, join org | ✅ profiles (user_id, organization_id), user_roles (user_id, role) | profiles puede no tener `name` — AuthContext usa `name`, migración añade `full_name` |
| **Billing** | org_billing_settings, invoices, payments | ✅ Todas existen | `admin_subscriptions` no existe — derivar de org_billing_settings + platform_organizations |
| **Compliance** | tabla issues | ❌ No existe `admin_compliance_issues` | Derivar de invoices (overdue), admin_action_logs, o crear vista |
| **Platform** | health / métricas | ❌ No hay tabla | Stub temporal |
| **Growth** | trials, feedback, oportunidades | ❌ No hay tablas | Stub temporal |

### Naming legacy a respetar

- `platform_organizations.org_type` (text) — legacy, no eliminar
- `platform_organizations.pais` — legacy, `country` añadido
- `profiles.name` vs `profiles.full_name` — AuthContext usa `name`, migración añade `full_name`

---

## 3. Plan de implementación

### FASE 1 — Organizations, Users (conectar a Supabase)

| Tarea | Archivos | Fuente datos |
|-------|----------|--------------|
| Repository organizations | `src/repositories/admin/adminOrganizationsRepository.ts` | `platform_organizations` o `v_admin_organizations_summary` |
| Repository users | `src/repositories/admin/adminUsersRepository.ts` | `v_admin_users_summary` |
| Mapper org | `src/mappers/admin/organizationMapper.ts` | DB row → AdminOrganization |
| Mapper user | `src/mappers/admin/userMapper.ts` | DB row → AdminUser |
| Service org | Refactor `adminOrganizationsService` | repository + mapper |
| Service user | Refactor `adminUsersService` | repository + mapper |
| Hooks | `useAdminOrganizations`, `useAdminOrganizationDetail`, `useAdminUsers` | services |
| UI | Sin cambios (ya consume servicios) | — |

### FASE 2 — Billing

| Tarea | Archivos | Fuente datos |
|-------|----------|--------------|
| Repository billing | `adminBillingRepository.ts` | org_billing_settings, invoices, payments, v_admin_organizations_summary |
| Mapper billing | `billingMapper.ts` | DB → AdminSubscription, AdminInvoice, AdminPayment |
| Service billing | Refactor | repository + mapper |
| Hooks | `useAdminBilling`, `useAdminRevenueSnapshot` | services |

### FASE 3 — Overview, Compliance, Platform

| Tarea | Archivos | Fuente datos |
|-------|----------|--------------|
| Overview | RPC o agregación | v_admin_organizations_summary, invoices |
| Compliance | Vista derivada o RPC | invoices (overdue), admin_action_logs |
| Platform | Stub | Provider temporal |

### FASE 4 — Cleanup

- Eliminar mocks de UI (fallback opcional si error)
- Tipado estricto
- TODOs resueltos

---

## 4. Estructura de carpetas objetivo

```
src/
├── types/admin/           # Ya existe en types/admin.ts — puede modularizarse
├── repositories/admin/    # NUEVO
│   ├── adminOrganizationsRepository.ts
│   ├── adminUsersRepository.ts
│   ├── adminBillingRepository.ts
│   └── index.ts
├── mappers/admin/         # NUEVO
│   ├── organizationMapper.ts
│   ├── userMapper.ts
│   ├── billingMapper.ts
│   └── index.ts
├── services/admin/        # EXISTE — refactor para usar repo + mapper
├── hooks/admin/           # NUEVO
│   ├── useAdminOrganizations.ts
│   ├── useAdminOrganizationDetail.ts
│   ├── useAdminUsers.ts
│   ├── useAdminBilling.ts
│   └── useAdminOverview.ts
└── data/admin/           # mockData — mantener como fallback temporal
```

---

## 5. Reglas críticas (checklist)

- [ ] organization_id es la única fuente de aislamiento
- [ ] profiles.organization_id define acceso
- [ ] NUNCA auth.uid() como organization_id
- [ ] NO queries directas en componentes — solo hooks
- [ ] NO mocks mezclados en UI — fallback explícito en service/hook
- [ ] repository / service / mapper / hook / UI separados
- [ ] RLS respetado (is_admin() para admin panel)
- [ ] Rutas existentes intactas

---

## 6. Riesgos técnicos

| Riesgo | Mitigación |
|--------|------------|
| profiles no existe en proyecto nuevo | Supabase Auth crea profiles por trigger; migración ALTER asume existencia |
| v_admin_organizations_summary usa columnas tipo/plan/status | Migración 20250318000000 las añade; si no aplicada, fallará |
| invoice_status enum: 'sent' vs 'issued' | Tipos admin usan 'sent'; DB usa 'issued' — mapper normalizar |
| user_roles.role es text, no app_role enum | user_roles usa text; app_role es enum para admin_action_type |

---

## 7. FASE 1 — Completada

**Archivos creados:**
- `src/repositories/admin/adminOrganizationsRepository.ts`
- `src/repositories/admin/adminUsersRepository.ts`
- `src/repositories/admin/index.ts`
- `src/mappers/admin/organizationMapper.ts`
- `src/mappers/admin/userMapper.ts`
- `src/mappers/admin/index.ts`
- `src/hooks/admin/useAdminOrganizations.ts`
- `src/hooks/admin/useAdminOrganizationDetail.ts`
- `src/hooks/admin/useAdminUsers.ts`
- `src/hooks/admin/index.ts`
- `supabase/migrations/20250318040000_admin_view_users_created_at.sql`

**Modificados:**
- `src/services/admin/adminOrganizationsService.ts` — usa repo + mapper, fallback mock
- `src/services/admin/adminUsersService.ts` — usa repo + mapper, fallback mock
- `src/pages/admin/AdminOrganizationsPage.tsx` — useAdminOrganizations
- `src/pages/admin/AdminOrganizationDetailPage.tsx` — useAdminOrganizationDetail, useAdminUsers
- `src/pages/admin/AdminUsersPage.tsx` — useAdminUsers, useAdminOrganizations

**Conectado a Supabase:**
- Organizations list: `v_admin_organizations_summary` + `org_billing_settings`
- Organization detail: `platform_organizations` + `v_admin_organizations_summary` + `org_billing_settings`
- Users: `v_admin_users_summary`

**Próximo paso:** FASE 2 — Billing.

# Admin Panel — Resumen completo (Fase 1 en adelante)

> Documento de referencia con todo lo implementado desde la Fase 1 hasta la fecha.

---

## 1. Arquitectura

- **Repositories**: acceso a Supabase (tablas, vistas, RPC)
- **Mappers**: fila DB → tipo de dominio (AdminOrganization, AdminInvoice, etc.)
- **Services**: orquestación; fallback a mock solo en desarrollo (prod: throw)
- **Hooks**: React Query, sin queries directas en componentes
- **UI**: páginas consumen solo hooks

---

## 2. FASE 1 — Organizations y Users

### Repositories
- `adminOrganizationsRepository.ts` — `v_admin_organizations_summary`, `platform_organizations`, `org_billing_settings`
- `adminUsersRepository.ts` — `v_admin_users_summary`

### Mappers
- `organizationMapper.ts` — DB → AdminOrganization
- `userMapper.ts` — DB → AdminUser

### Services
- `adminOrganizationsService` — fetchOrganizations, fetchOrganizationById
- `adminUsersService` — fetchUsers

### Hooks
- `useAdminOrganizations` — lista de organizaciones
- `useAdminOrganizationDetail` — detalle de organización
- `useAdminUsers` — usuarios por organización

### Páginas
- `/admin/organizations` — lista
- `/admin/organizations/:id` — detalle
- `/admin/users` — usuarios

### Migraciones
- `20250318040000_admin_view_users_created_at.sql` — añade `created_at` a `v_admin_users_summary`

---

## 3. FASE 2 — Billing

### Repository
- `adminBillingRepository.ts` — `v_admin_organizations_summary`, `org_billing_settings`, `invoices`, `payments`
  - `fetchSubscriptionsFromDb`, `fetchInvoicesFromDb`, `fetchPaymentsFromDb`
  - `insertPaymentInDb` — registrar pago + `log_admin_action('registrar_pago')`
  - `insertInvoiceInDb` — crear factura manual + `log_admin_action('emitir_factura')`

### Mapper
- `billingMapper.ts` — AdminSubscription, AdminInvoice, AdminPayment

### Service
- `adminBillingService` — fetchSubscriptions, fetchInvoices, fetchPayments, fetchRevenueSnapshot, registerPayment, createInvoice

### Hooks
- `useAdminBilling` — revenue, subscriptions, invoices, payments
- `useAdminRegisterPayment` — mutación registrar pago
- `useAdminCreateInvoice` — mutación crear factura

### Páginas
- `/admin/billing` — facturación, simulador, botones Crear factura / Registrar pago

### Componentes
- `RegisterPaymentDialog` — formulario registrar pago
- `CreateInvoiceDialog` — formulario crear factura manual

---

## 4. FASE 3 — Overview, Compliance, Platform, Growth

### Compliance
- `adminComplianceRepository.ts` — issues derivados de invoices (overdue/issued)
- `adminComplianceService`, `useAdminCompliance`, `AdminCompliancePage`

### Growth
- `adminGrowthRepository.ts` — `admin_feedback`, `admin_opportunities`, trial metrics desde `v_admin_organizations_summary`
- `adminGrowthService`, `useAdminGrowth`, `AdminGrowthPage`

### Platform
- `adminPlatformRepository.ts` — RPC `get_platform_status`
- `adminPlatformService`, `useAdminPlatform`, `AdminPlatformPage`

### Overview
- `useAdminOverview` — agregación de organizaciones, billing, compliance

### Migraciones
- `20250318050000_admin_growth_tables.sql` — `admin_feedback`, `admin_opportunities`
- `20250318060000_admin_platform_rpc.sql` — `get_platform_status()`

---

## 5. FASE 4 — Cleanup y acciones admin

### Cambiar estado de organización
- `updateOrganizationStatusInDb` en repository
- `updateOrganizationStatus` en service
- `useAdminUpdateOrganizationStatus` — mutación
- Botones **Suspender** / **Reactivar** en detalle de org
- `log_admin_action` al suspender/reactivar

### Cambiar plan
- `updateOrganizationPlanInDb` en repository
- `updateOrganizationPlan` en service
- `useAdminUpdateOrganizationPlan` — mutación
- Dropdown **Cambiar plan** (Lite, Smart, Plus, Sin plan) en detalle de org
- `log_admin_action('cambiar_plan')`

### Registrar pago
- `insertPaymentInDb` — insert en `payments`
- `log_admin_action('registrar_pago')` con amount, method, invoice_id, reference
- `RegisterPaymentDialog` + botón en AdminBillingPage

### Crear factura manual
- `insertInvoiceInDb` — insert en `invoices` + `invoice_lines`
- Trigger asigna `invoice_number` (NS-YYYYMM-NNNNNN)
- `log_admin_action('emitir_factura')`
- `CreateInvoiceDialog` + botón en AdminBillingPage

### Migraciones
- `20250318070000_admin_panel_update_policies.sql` — RLS UPDATE para `platform_organizations`, `org_billing_settings`; INSERT para `payments`
- `20250318080000_admin_invoices_insert.sql` — RLS INSERT para `invoices`, `invoice_lines`; trigger `invoice_number`

---

## 6. FASE 5 — Auditoría y seguridad

### Migraciones
- `20250318110000_admin_audit_and_views.sql` — vistas consolidadas, `v_admin_compliance_issues`, RPC `get_admin_compliance_metrics`
- `20250318120000_admin_rls_hardening.sql` — RLS hardening (7 tablas); ninguna política usa `organization_id = auth.uid()`

### Compliance con fuentes reales
- **v_admin_compliance_issues**: issues desde `invoices` (overdue, issued)
- **get_admin_compliance_metrics()**: `invoices_overdue_count`, `invoices_pending_count`, `parcelas_sin_poligono_count` (si existe tabla)
- AdminCompliancePage: 5 SectionCards; métricas reales o "Pendiente de integración" explícito

### Producción vs desarrollo
- `src/config/adminEnv.ts`: `ADMIN_ALLOW_MOCK_FALLBACK = import.meta.env.DEV`
- **Producción**: servicios hacen `throw` en error; no mock silencioso; UI muestra error verificable
- **Desarrollo**: fallback permitido con banner degradado

### Documentación
- `docs/ADMIN_AUDIT_AND_SECURITY_ENTREGABLES.md` — entregables, riesgos residuales

---

## 7. Migraciones Admin Panel (orden)

| Migración | Contenido |
|-----------|-----------|
| `20250318000000` | Enums, `platform_organizations` (ALTER), `profiles` (ALTER), `user_roles`, helpers, RLS base |
| `20250318010000` | `billing_plans`, `org_billing_settings`, `invoices`, `invoice_lines`, `payments` |
| `20250318020000` | `admin_action_logs`, `v_admin_organizations_summary`, `v_admin_users_summary` |
| `20250318030000` | Políticas RLS SELECT para admin |
| `20250318040000` | `created_at` en `v_admin_users_summary` |
| `20250318050000` | `admin_feedback`, `admin_opportunities` |
| `20250318060000` | RPC `get_platform_status` |
| `20250318070000` | Políticas UPDATE/INSERT para admin |
| `20250318080000` | Políticas INSERT invoices/invoice_lines; trigger `invoice_number` |
| `20250318100000` | Admin schema alignment |
| `20250318110000` | Auditoría y vistas (v_admin_compliance_issues, get_admin_compliance_metrics) |
| `20250318120000` | RLS hardening |

---

## 8. Rutas y fuentes de datos

| Ruta | Fuente Supabase |
|------|-----------------|
| `/admin/overview` | v_admin_organizations_summary, org_billing_settings, invoices |
| `/admin/organizations` | v_admin_organizations_summary, org_billing_settings |
| `/admin/organizations/:id` | platform_organizations, v_admin_organizations_summary, org_billing_settings, v_admin_users_summary |
| `/admin/users` | v_admin_users_summary |
| `/admin/billing` | v_admin_organizations_summary, org_billing_settings, invoices, payments |
| `/admin/platform` | RPC get_platform_status |
| `/admin/compliance` | v_admin_compliance_issues, RPC get_admin_compliance_metrics |
| `/admin/growth` | admin_feedback, admin_opportunities, v_admin_organizations_summary |

---

## 9. Estructura de archivos

```
src/
├── types/admin.ts
├── repositories/admin/
│   ├── adminOrganizationsRepository.ts
│   ├── adminUsersRepository.ts
│   ├── adminBillingRepository.ts
│   ├── adminComplianceRepository.ts
│   ├── adminGrowthRepository.ts
│   ├── adminPlatformRepository.ts
│   └── index.ts
├── mappers/admin/
│   ├── organizationMapper.ts
│   ├── userMapper.ts
│   ├── billingMapper.ts
│   ├── complianceMapper.ts
│   ├── growthMapper.ts
│   └── index.ts
├── services/admin/
│   ├── adminOrganizationsService.ts
│   ├── adminUsersService.ts
│   ├── adminBillingService.ts
│   ├── adminComplianceService.ts
│   ├── adminGrowthService.ts
│   └── adminPlatformService.ts
├── hooks/admin/
│   ├── useAdminOrganizations.ts
│   ├── useAdminOrganizationDetail.ts
│   ├── useAdminUsers.ts
│   ├── useAdminBilling.ts
│   ├── useAdminOverview.ts
│   ├── useAdminCompliance.ts (incl. useAdminComplianceMetrics)
│   ├── useAdminPlatform.ts
│   ├── useAdminGrowth.ts
│   ├── useAdminUpdateOrganizationStatus.ts
│   ├── useAdminUpdateOrganizationPlan.ts
│   ├── useAdminRegisterPayment.ts
│   ├── useAdminCreateInvoice.ts
│   └── index.ts
├── config/
│   └── adminEnv.ts
├── components/admin/
│   ├── RegisterPaymentDialog.tsx
│   ├── CreateInvoiceDialog.tsx
│   ├── PageHeader.tsx, SectionCard.tsx, MetricCard.tsx, etc.
│   └── ...
└── pages/admin/
    ├── AdminPanel.tsx
    ├── AdminOverviewPage.tsx
    ├── AdminOrganizationsPage.tsx
    ├── AdminOrganizationDetailPage.tsx
    ├── AdminUsersPage.tsx
    ├── AdminBillingPage.tsx
    ├── AdminCompliancePage.tsx
    ├── AdminPlatformPage.tsx
    └── AdminGrowthPage.tsx
```

---

## 10. Acciones admin con auditoría

| Acción | RPC log_admin_action | UI |
|--------|----------------------|-----|
| Suspender cuenta | suspender_cuenta | Botón en detalle org |
| Reactivar cuenta | activar_cuenta | Botón en detalle org |
| Cambiar plan | cambiar_plan | Dropdown en detalle org |
| Registrar pago | registrar_pago | RegisterPaymentDialog |
| Crear factura | emitir_factura | CreateInvoiceDialog |

---

## 11. Fallback a mock (condicional)

- **Desarrollo** (`import.meta.env.DEV`): fallback permitido con banner degradado
- **Producción**: `throw` en error; no mock silencioso; UI muestra error verificable
- Config: `src/config/adminEnv.ts` → `ADMIN_ALLOW_MOCK_FALLBACK`

---

## 12. Seguridad

- RLS en todas las tablas (is_admin() o get_user_organization_id)
- organization_id como única fuente de aislamiento
- profiles.organization_id define acceso
- **Fase 5**: ninguna política usa `organization_id = auth.uid()`; se usa `get_user_organization_id(auth.uid())`

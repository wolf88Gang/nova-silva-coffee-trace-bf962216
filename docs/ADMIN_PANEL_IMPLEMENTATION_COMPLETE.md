# Admin Panel — Implementación Completa

> Conectado a Supabase. Arquitectura: repository / service / mapper / hook / UI.

---

## 1. Resumen ejecutivo

El panel de administración interno de Nova Silva está **conectado a Supabase** siguiendo la arquitectura obligatoria:

- **Repositories**: acceso a datos (Supabase client)
- **Mappers**: DB row → tipo de dominio
- **Services**: orquestación, fallback a mock en error
- **Hooks**: React Query, sin queries directas en componentes
- **UI**: páginas consumen solo hooks

---

## 2. Rutas y fuentes de datos

| Ruta | Fuente Supabase | Estado |
|------|-----------------|--------|
| `/admin/overview` | v_admin_organizations_summary, org_billing_settings, invoices, platform (stub) | ✅ Conectado |
| `/admin/organizations` | v_admin_organizations_summary, org_billing_settings | ✅ Conectado |
| `/admin/organizations/:id` | platform_organizations, v_admin_organizations_summary, org_billing_settings, v_admin_users_summary | ✅ Conectado |
| `/admin/users` | v_admin_users_summary | ✅ Conectado |
| `/admin/billing` | v_admin_organizations_summary, org_billing_settings, invoices, payments | ✅ Conectado |
| `/admin/platform` | Stub (MOCK_SERVICE_STATUS) | ⏳ Temporal |
| `/admin/compliance` | invoices (overdue/issued) → issues derivados | ✅ Conectado |
| `/admin/growth` | Stub (MOCK_FEEDBACK, MOCK_OPPORTUNITIES) | ⏳ Temporal |

---

## 3. Archivos creados

### Repositories
- `src/repositories/admin/adminOrganizationsRepository.ts` — v_admin_organizations_summary, platform_organizations, org_billing_settings
- `src/repositories/admin/adminUsersRepository.ts` — v_admin_users_summary
- `src/repositories/admin/adminBillingRepository.ts` — v_admin_organizations_summary, org_billing_settings, invoices, payments
- `src/repositories/admin/adminComplianceRepository.ts` — invoices (overdue) → issues derivados
- `src/repositories/admin/index.ts`

### Mappers
- `src/mappers/admin/organizationMapper.ts` — DB → AdminOrganization
- `src/mappers/admin/userMapper.ts` — DB → AdminUser
- `src/mappers/admin/billingMapper.ts` — DB → AdminSubscription, AdminInvoice, AdminPayment
- `src/mappers/admin/complianceMapper.ts` — DB → AdminComplianceIssue
- `src/mappers/admin/index.ts`

### Hooks
- `src/hooks/admin/useAdminOrganizations.ts`
- `src/hooks/admin/useAdminOrganizationDetail.ts`
- `src/hooks/admin/useAdminUsers.ts`
- `src/hooks/admin/useAdminBilling.ts`
- `src/hooks/admin/useAdminOverview.ts`
- `src/hooks/admin/useAdminCompliance.ts`
- `src/hooks/admin/useAdminPlatform.ts`
- `src/hooks/admin/useAdminGrowth.ts`
- `src/hooks/admin/index.ts`

### Migraciones
- `supabase/migrations/20250318040000_admin_view_users_created_at.sql` — añade created_at a v_admin_users_summary

---

## 4. Archivos modificados

### Services (refactor)
- `adminOrganizationsService.ts` — repo + mapper, fallback mock
- `adminUsersService.ts` — repo + mapper, fallback mock
- `adminBillingService.ts` — repo + mapper, fallback mock
- `adminComplianceService.ts` — repo + mapper, fallback mock

### Páginas (wire a hooks)
- `AdminOrganizationsPage.tsx` — useAdminOrganizations
- `AdminOrganizationDetailPage.tsx` — useAdminOrganizationDetail, useAdminUsers
- `AdminUsersPage.tsx` — useAdminUsers, useAdminOrganizations
- `AdminBillingPage.tsx` — useAdminBilling
- `AdminOverviewPage.tsx` — useAdminOverview
- `AdminCompliancePage.tsx` — useAdminCompliance
- `AdminPlatformPage.tsx` — useAdminPlatform
- `AdminGrowthPage.tsx` — useAdminGrowth

---

## 5. Qué está conectado a datos reales

| Dominio | Tablas/Vistas | Fallback |
|---------|---------------|----------|
| Organizations | v_admin_organizations_summary, platform_organizations, org_billing_settings | MOCK_ORGANIZATIONS |
| Users | v_admin_users_summary | MOCK_USERS |
| Billing | v_admin_organizations_summary, org_billing_settings, invoices, payments | MOCK_SUBSCRIPTIONS, MOCK_INVOICES, MOCK_PAYMENTS |
| Compliance | invoices (overdue/issued) | MOCK_COMPLIANCE_ISSUES |

---

## 6. Qué es temporal (stub)

| Dominio | Fuente actual | Próximo paso |
|---------|---------------|---------------|
| Platform | MOCK_SERVICE_STATUS | Endpoint health o tabla platform_metrics |
| Growth | MOCK_FEEDBACK, MOCK_OPPORTUNITIES, fetchTrialMetrics | Tablas admin_feedback, admin_opportunities o cálculo desde uso |

---

## 7. Normalización de estados

- **OrgStatus**: activo, en_prueba, vencido, suspendido, cerrado
- **InvoiceStatus**: issued → sent, void → cancelled (mapper)
- **PaymentMethod**: transferencia → transfer, stripe → card (mapper)

---

## 8. Seguridad

- RLS en todas las tablas admin (is_admin() o get_user_organization_id)
- organization_id como única fuente de aislamiento
- profiles.organization_id define acceso
- No se usa auth.uid() como organization_id

---

## 9. Acciones admin preparadas (no activas)

- `updateOrganizationStatus` — stub, listo para implementar
- Cambiar plan, activar trial, suspender cuenta, registrar pago, cambiar rol — UI presente, lógica pendiente

---

## 10. Continuación (última fase)

### Implementado
- **updateOrganizationStatus**: Repository + service. Botón Suspender/Reactivar en detalle de org.
- **Growth**: Tablas `admin_feedback`, `admin_opportunities`. Repository, mapper, service conectados. Trial metrics desde `v_admin_organizations_summary`.
- **Platform**: RPC `get_platform_status`. Repository + service. Retorna `operational` (extensible).

### Migraciones añadidas
- `20250318050000_admin_growth_tables.sql` — admin_feedback, admin_opportunities
- `20250318060000_admin_platform_rpc.sql` — get_platform_status()

---

## 11. Riesgos técnicos

| Riesgo | Mitigación |
|--------|------------|
| v_admin_organizations_summary requiere columnas tipo/plan/status | Migración 20250318000000 las añade |
| profiles.created_at en vista | Migración 20250318040000 la añade |
| Sin tablas feedback/opportunities | Growth usa mock; crear tablas en fase siguiente |

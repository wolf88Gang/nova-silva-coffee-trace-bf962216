# Admin Panel — Implementación entregable

## 1. Contenido exacto de `01_admin_schema_alignment.sql`

**Archivo:** `supabase/migrations/20250318100000_admin_schema_alignment.sql`

```sql
-- Admin Panel — Convergencia mínima: profiles.created_at
-- Idempotente. No crea tablas, enums ni columnas sombra.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
```

---

## 2. Archivos frontend modificados

| Archivo | Cambios |
|---------|---------|
| `src/types/adminData.ts` | **Nuevo** — AdminDataResult, adminSuccess, adminFallback |
| `src/components/admin/DegradedModeBanner.tsx` | **Nuevo** — Banner "Datos no verificados" |
| `src/components/admin/LimitedDataNotice.tsx` | **Nuevo** — Aviso "Pendiente de integración" |
| `src/services/admin/adminBillingService.ts` | Retorna AdminDataResult; isFallback en catch |
| `src/services/admin/adminOrganizationsService.ts` | Retorna AdminDataResult; isFallback en catch |
| `src/services/admin/adminUsersService.ts` | Retorna AdminDataResult; isFallback en catch |
| `src/services/admin/adminComplianceService.ts` | Retorna AdminDataResult; isFallback en catch |
| `src/services/admin/adminGrowthService.ts` | Retorna AdminDataResult; isFallback en catch |
| `src/services/admin/adminPlatformService.ts` | fetchServiceStatus siempre adminFallback; fetchPlatformGlobalStatus AdminDataResult |
| `src/hooks/admin/useAdminPlatform.ts` | Unwrap globalStatus.data?.data |
| `src/pages/admin/AdminBillingPage.tsx` | Unwrap data; DegradedModeBanner |
| `src/pages/admin/AdminOrganizationsPage.tsx` | Unwrap data; DegradedModeBanner |
| `src/pages/admin/AdminUsersPage.tsx` | Unwrap data; DegradedModeBanner |
| `src/pages/admin/AdminOrganizationDetailPage.tsx` | Unwrap data; DegradedModeBanner; AlertDialog confirmar suspender/reactivar/cambiar plan |
| `src/pages/admin/AdminOverviewPage.tsx` | Unwrap data; DegradedModeBanner |
| `src/pages/admin/AdminCompliancePage.tsx` | Unwrap data; DegradedModeBanner; LimitedDataNotice; métricas "—" pendiente |
| `src/pages/admin/AdminGrowthPage.tsx` | Unwrap data; DegradedModeBanner; LimitedDataNotice |
| `src/pages/admin/AdminPlatformPage.tsx` | LimitedDataNotice; "Pendiente de integración" servicios; estado global desde RPC |

---

## 3. Rutas donde sigue existiendo modo degradado

El banner **DegradedModeBanner** se muestra cuando **cualquier** query de la ruta usa fallback (isFallback: true).

| Ruta | Condición de modo degradado |
|------|-----------------------------|
| `/admin/overview` | Si organizations, revenue, compliance o platformStatus usan fallback |
| `/admin/organizations` | Si fetchOrganizations usa fallback |
| `/admin/organizations/:id` | Si fetchOrganizationById usa fallback |
| `/admin/users` | Si fetchUsers o fetchOrganizations usan fallback |
| `/admin/billing` | Si revenue, subscriptions, invoices o payments usan fallback |
| `/admin/compliance` | Si fetchComplianceIssues usa fallback |
| `/admin/growth` | Si trialMetrics, feedback u opportunities usan fallback |
| `/admin/platform` | fetchServiceStatus **siempre** es fallback; se muestra "Datos limitados" en sección servicios |

---

## 4. Rutas 100% conectadas a datos reales

Ninguna ruta está 100% libre de fallback, porque **todos** los services tienen try/catch que devuelve mock en error. Las rutas muestran datos reales cuando Supabase responde correctamente; si hay error, usan fallback y muestran el banner.

**Rutas que pueden ser 100% reales** (cuando Supabase OK y tablas pobladas):

| Ruta | Fuente real | Notas |
|------|-------------|-------|
| `/admin/organizations` | v_admin_organizations_summary, org_billing_settings | 100% real si DB OK |
| `/admin/organizations/:id` | platform_organizations, v_admin_organizations_summary, org_billing_settings, v_admin_users_summary | 100% real si DB OK |
| `/admin/users` | v_admin_users_summary | 100% real si DB OK |
| `/admin/billing` | v_admin_organizations_summary, org_billing_settings, invoices, payments | 100% real si DB OK |
| `/admin/compliance` | invoices (overdue/issued) → issues derivados | Cola de revisión real; métricas Integridad/Cumplimiento/Regulatorio pendientes |
| `/admin/growth` | v_admin_organizations_summary, admin_feedback, admin_opportunities | Trial metrics real; feedback/opportunities pueden estar vacíos |
| `/admin/platform` | RPC get_platform_status | Estado global real; detalle por servicio **siempre** pendiente (no hay platform_health_checks) |
| `/admin/overview` | Agregación de las anteriores | Depende de organizations, revenue, compliance, platformStatus |

**Resumen:** Todas las rutas consumen Supabase cuando está disponible. El modo degradado solo aparece si hay error de red/DB. La excepción es `/admin/platform` en la sección "Estado de servicios", que siempre muestra "Pendiente de integración" porque no existe `platform_health_checks`.

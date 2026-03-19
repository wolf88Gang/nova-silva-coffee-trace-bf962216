# Panel de Administración — Implementación

## Resumen

Panel de administración interno enterprise para Nova Silva, operativo con mocks y preparado para conexión a Supabase.

## Archivos creados

### Tipos
- `src/types/admin.ts` — Tipos de dominio (Organization, User, Billing, Platform, Compliance, Growth)

### Datos mock
- `src/data/admin/mockData.ts` — Datos realistas en español, contexto latinoamericano

### Servicios (interfaces + mock)
- `src/services/admin/adminOrganizationsService.ts`
- `src/services/admin/adminUsersService.ts`
- `src/services/admin/adminBillingService.ts`
- `src/services/admin/adminPlatformService.ts`
- `src/services/admin/adminComplianceService.ts`
- `src/services/admin/adminGrowthService.ts`

### Componentes reutilizables
- `src/components/admin/AdminLayout.tsx`
- `src/components/admin/AdminSidebar.tsx`
- `src/components/admin/AdminTopbar.tsx`
- `src/components/admin/PageHeader.tsx`
- `src/components/admin/MetricCard.tsx`
- `src/components/admin/StatusBadge.tsx`
- `src/components/admin/HealthBadge.tsx`
- `src/components/admin/RiskBadge.tsx`
- `src/components/admin/SectionCard.tsx`
- `src/components/admin/EmptyState.tsx`

### Páginas
- `src/pages/admin/AdminOverviewPage.tsx` — /admin/overview
- `src/pages/admin/AdminOrganizationsPage.tsx` — /admin/organizations
- `src/pages/admin/AdminOrganizationDetailPage.tsx` — /admin/organizations/:id
- `src/pages/admin/AdminUsersPage.tsx` — /admin/users
- `src/pages/admin/AdminBillingPage.tsx` — /admin/billing
- `src/pages/admin/AdminPlatformPage.tsx` — /admin/platform
- `src/pages/admin/AdminCompliancePage.tsx` — /admin/compliance
- `src/pages/admin/AdminGrowthPage.tsx` — /admin/growth

### Modificados
- `src/App.tsx` — Rutas admin con AdminLayout, redirect /admin → /admin/overview

## Rutas

| Ruta | Contenido |
|------|-----------|
| /admin | Redirect a /admin/overview |
| /admin/overview | Estado plataforma, revenue, actividad, riesgo, alertas |
| /admin/organizations | Tabla organizaciones con filtros |
| /admin/organizations/:id | Detalle org con tabs (Resumen, Usuarios, Uso, Facturación, Licencias, Riesgo) |
| /admin/users | Tabla usuarios global |
| /admin/billing | Suscripciones, facturas, pagos, simulador pricing |
| /admin/platform | Estado servicios, módulos |
| /admin/compliance | Integridad, cola de revisión |
| /admin/growth | Trials, feedback, oportunidades |
| /admin/modules | Module Explorer (existente) |
| /admin/components | Component Playground (existente) |
| /admin/directorio | Placeholder (existente) |

## Confidencialidad y auditoría

La información del panel es **confidencial**. Ver `docs/ADMIN_AUDIT_PRIVACY_GUIDE.md` para:
- Qué compartir con auditor de privacidad/gobernanza
- Minimización de PII en logs
- Exports anonimizados

## Supuestos

1. **Auth**: RequireAdmin ya existente; role `admin` en profiles.
2. **Organizaciones**: Tabla `platform_organizations` con campos compatibles.
3. **Usuarios**: `profiles` + `usuarios_org` para multi-tenant.
4. **Billing**: Tablas `subscriptions`, `invoices`, `payments` a crear.
5. **Platform**: Endpoint de health o tabla de métricas.
6. **Compliance**: Tabla de issues o vista materializada.

## TODOs para conexión real a Supabase

1. **adminOrganizationsService**: `supabase.from('platform_organizations').select(...)` con RLS admin
2. **adminUsersService**: `supabase.from('profiles').select('*, organization:platform_organizations(name)')`
3. **adminBillingService**: Crear tablas `admin_subscriptions`, `admin_invoices`, `admin_payments` o mapear a existentes
4. **adminPlatformService**: Edge Function de health check o tabla `platform_metrics`
5. **adminComplianceService**: Tabla `admin_compliance_issues` o vista desde auditoría
6. **adminGrowthService**: Tabla `admin_feedback`, `admin_opportunities` o cálculo desde uso
7. **Permisos**: Política RLS `is_admin()` o `role = 'admin'` para todas las tablas admin

## Mejoras siguientes

- Acciones reales: cambiar estado org, registrar pago, suspender cuenta
- Drawer/modal de detalle de usuario
- Export CSV de tablas
- Filtros avanzados y persistencia en URL
- Paginación en tablas grandes
- Búsqueda full-text cuando Supabase esté conectado

# Admin Panel — Auditoría y Seguridad: Entregables

## 1. SQL exacto de ambas migraciones

### 03_admin_audit_and_views.sql
Archivo: `supabase/migrations/20250318110000_admin_audit_and_views.sql`

- **v_admin_organizations_summary**: consolidada; consumo: `/admin/overview`, `/admin/organizations`, `/admin/billing`, `/admin/growth`
- **v_admin_users_summary**: consolidada; consumo: `/admin/users`, `/admin/organizations/:id`
- **v_admin_compliance_issues**: nueva; consumo: `/admin/compliance`; fuentes: `invoices` (overdue, issued)
- **get_admin_compliance_metrics()**: RPC SECURITY DEFINER; retorna `invoices_overdue_count`, `invoices_pending_count`, `parcelas_sin_poligono_count`, `parcelas_sin_poligono_status`

### 04_admin_rls_hardening.sql
Archivo: `supabase/migrations/20250318120000_admin_rls_hardening.sql`

Políticas revisadas para:
- `platform_organizations`
- `profiles`
- `org_billing_settings`
- `invoices`
- `invoice_lines`
- `payments`
- `admin_action_logs`

Regla aplicada: ninguna política usa `organization_id = auth.uid()`; se usa `get_user_organization_id(auth.uid())`.

---

## 2. Archivos modificados

| Archivo | Cambios |
|---------|---------|
| `src/config/adminEnv.ts` | Nuevo: `ADMIN_ALLOW_MOCK_FALLBACK = import.meta.env.DEV` |
| `src/services/admin/adminBillingService.ts` | Fallback condicional: throw en prod |
| `src/services/admin/adminComplianceService.ts` | Fallback condicional; `fetchComplianceMetrics` |
| `src/services/admin/adminUsersService.ts` | Fallback condicional |
| `src/services/admin/adminOrganizationsService.ts` | Fallback condicional |
| `src/services/admin/adminPlatformService.ts` | Fallback condicional; `fetchServiceStatus` throw en prod |
| `src/services/admin/adminGrowthService.ts` | Fallback condicional |
| `src/hooks/admin/useAdminCompliance.ts` | Nuevo: `useAdminComplianceMetrics` |
| `src/pages/admin/AdminCompliancePage.tsx` | Métricas reales; error/loading; 5 SectionCards |
| `src/components/admin/AdminErrorAlert.tsx` | Nuevo: alerta de error reutilizable |
| `src/hooks/admin/index.ts` | Export useAdminComplianceMetrics, useAdminCreateInvoice |

---

## 3. Rutas admin afectadas

| Ruta | Cambios |
|------|---------|
| `/admin/compliance` | Métricas reales (invoices, parcelas); error verificable en prod si falla |
| `/admin/overview` | Fallback condicional (prod: throw) |
| `/admin/organizations` | Fallback condicional |
| `/admin/organizations/:id` | Fallback condicional |
| `/admin/users` | Fallback condicional |
| `/admin/billing` | Fallback condicional |
| `/admin/platform` | Fallback condicional; `fetchServiceStatus` throw en prod |
| `/admin/growth` | Fallback condicional |

---

## 4. Métricas compliance reales

| Métrica | Fuente | Estado |
|---------|--------|--------|
| Facturas vencidas | `invoices` (status=overdue) | Real |
| Facturas pendientes | `invoices` (status=issued) | Real |
| Parcelas sin polígono | `parcelas.poligono_geojson` (si existe tabla) | Real si tabla existe; si no, "pendiente de integración" |

---

## 5. Métricas pendientes de integración

| Métrica | Nota |
|---------|------|
| Integridad de datos | Pendiente de integración |
| Estado regulatorio EUDR | Pendiente de integración |

En la UI se muestra explícitamente "Pendiente de integración" en lugar de "—" ambiguo.

---

## 6. Riesgos residuales para auditoría

1. **get_user_organization_id**: puede retornar NULL si el usuario no tiene `profiles.organization_id`; las políticas no devolverán filas en ese caso.
2. **is_admin()**: depende de `user_roles.role IN ('admin','superadmin')`; verificar que `superadmin` existe.
3. **Admins globales**: típicamente sin `organization_id`; `is_admin()` les da acceso completo.
4. **Vistas admin**: no tienen RLS propio; heredan permisos de las tablas base. Las vistas solo son accesibles vía PostgREST si el usuario tiene SELECT en las tablas subyacentes; el RPC `get_admin_compliance_metrics` usa `is_admin()` explícitamente.
5. **Fallback en producción**: si `ADMIN_ALLOW_MOCK_FALLBACK` se compila como `false` (prod), cualquier error de Supabase provocará throw y la UI mostrará error verificable; no hay mock silencioso.

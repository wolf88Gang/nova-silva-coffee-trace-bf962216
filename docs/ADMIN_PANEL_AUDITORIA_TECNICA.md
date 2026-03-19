# Admin Panel — Auditoría técnica y plan de convergencia

> Diagnóstico completo del Admin Panel y esquema Supabase. Sin implementación — solo plan.

---

## 1. Inspección del Admin Panel

### 1.1 Rutas que consumen datos reales (Supabase)

| Ruta | Fuente Supabase | Escribe en DB |
|------|-----------------|---------------|
| `/admin/overview` | v_admin_organizations_summary, org_billing_settings, invoices | No |
| `/admin/organizations` | v_admin_organizations_summary, org_billing_settings | No |
| `/admin/organizations/:id` | platform_organizations, v_admin_organizations_summary, org_billing_settings, v_admin_users_summary | Sí: UPDATE platform_organizations, org_billing_settings; log_admin_action |
| `/admin/users` | v_admin_users_summary | No |
| `/admin/billing` | v_admin_organizations_summary, org_billing_settings, invoices, payments | Sí: INSERT payments, invoices, invoice_lines; log_admin_action |
| `/admin/compliance` | invoices, platform_organizations | No |
| `/admin/growth` | v_admin_organizations_summary, admin_feedback, admin_opportunities | No |
| `/admin/platform` | RPC get_platform_status | No |

### 1.2 Rutas con fallback a mock

**Todas** las rutas tienen fallback a mock en el service cuando Supabase falla:

| Ruta | Mock usado | Condición de fallback |
|------|------------|------------------------|
| Overview | Agregación de MOCK_ORGANIZATIONS, MOCK_INVOICES, MOCK_COMPLIANCE | Cualquier error en fetch |
| Organizations | MOCK_ORGANIZATIONS | Error en fetchOrganizations |
| Organization Detail | MOCK_ORGANIZATIONS | Error en fetchOrganizationById |
| Users | MOCK_USERS | Error en fetchUsers |
| Billing | MOCK_SUBSCRIPTIONS, MOCK_INVOICES, MOCK_PAYMENTS | Error en fetchSubscriptions/fetchInvoices/fetchPayments/fetchRevenueSnapshot |
| Compliance | MOCK_COMPLIANCE_ISSUES | Error en fetchComplianceIssues |
| Growth | MOCK_FEEDBACK, MOCK_OPPORTUNITIES, trial metrics mock | Error en fetchTrialMetrics/fetchFeedback/fetchOpportunities |
| Platform | MOCK_SERVICE_STATUS | Siempre para detalle por servicio; RPC fallback a 'operational' |

### 1.3 Tablas y vistas consumidas por ruta

| Ruta | Tablas/Vistas |
|------|---------------|
| Overview | v_admin_organizations_summary, org_billing_settings, invoices, admin_compliance (derivado) |
| Organizations | v_admin_organizations_summary, org_billing_settings |
| Organization Detail | platform_organizations, v_admin_organizations_summary, org_billing_settings, v_admin_users_summary |
| Users | v_admin_users_summary |
| Billing | v_admin_organizations_summary, org_billing_settings, invoices, payments, platform_organizations (org names) |
| Compliance | invoices, platform_organizations |
| Growth | v_admin_organizations_summary, admin_feedback, admin_opportunities, platform_organizations (org names) |
| Platform | RPC get_platform_status |

### 1.4 Acciones que escriben en Supabase

| Acción | Tablas afectadas | RPC |
|--------|------------------|-----|
| Suspender cuenta | platform_organizations, org_billing_settings (UPDATE) | log_admin_action |
| Reactivar cuenta | platform_organizations, org_billing_settings (UPDATE) | log_admin_action |
| Cambiar plan | platform_organizations, org_billing_settings (UPDATE) | log_admin_action |
| Registrar pago | payments (INSERT) | log_admin_action |
| Crear factura | invoices (INSERT), invoice_lines (INSERT) | log_admin_action |

### 1.5 Hooks y services con aproximaciones temporales

| Hook/Service | Aproximación | Detalle |
|--------------|--------------|---------|
| adminPlatformService.fetchServiceStatus | Mock puro | Siempre devuelve MOCK_SERVICE_STATUS; no hay tabla platform_health_checks |
| adminPlatformService.fetchPlatformGlobalStatus | RPC real con fallback | get_platform_status retorna 'operational' hardcodeado |
| adminGrowthService | Fallback mock en error | admin_feedback y admin_opportunities pueden estar vacías; trial metrics calculados desde vista |
| adminComplianceService | Fallback mock en error | Issues derivados de invoices; no hay tabla estructurada de incidentes |
| Todos los services | try/catch → mock | En cualquier error de Supabase, se devuelve mock en lugar de propagar error |

---

## 2. Inspección del esquema real

### 2.1 Tablas existentes y reutilizables

| Tabla | Origen | Estado | Notas |
|-------|--------|-------|-------|
| platform_organizations | 20250304210000 + ALTER 20250318000000 | Existe | Tiene org_type (text), pais (text) + tipo (enum), plan (enum), status (enum), country — duplicación semántica |
| profiles | Supabase Auth / trigger | Existe (asumido) | user_id, organization_id; ALTER añade full_name, email, is_active, last_login_at, updated_at. created_at puede faltar |
| user_roles | 20250225110001 o 20250318000000 | Existe | user_id, role (text), organization_id. role es text, no usa enum app_role |
| org_billing_settings | 20250318010000 | Creada por admin | plan_code, status, billing_cycle, etc. |
| billing_usage_snapshots | 20250318010000 | Creada por admin | |
| invoices | 20250318010000 | Creada por admin | |
| invoice_lines | 20250318010000 | Creada por admin | |
| payments | 20250318010000 | Creada por admin | |
| admin_action_logs | 20250318020000 | Creada por admin | |
| admin_feedback | 20250318050000 | Creada por admin | |
| admin_opportunities | 20250318050000 | Creada por admin | |
| billing_plans | 20250318010000 | Creada por admin | |
| billing_addons | 20250318010000 | Creada por admin | |
| org_billing_addons | 20250318010000 | Creada por admin | |

### 2.2 Vistas existentes

| Vista | Origen | Dependencias |
|-------|--------|--------------|
| v_admin_organizations_summary | 20250318020000 | platform_organizations, invoices, profiles, billing_usage_snapshots |
| v_admin_users_summary | 20250318040000 | profiles, platform_organizations, user_roles |

### 2.3 Duplicaciones y columnas sombra detectadas

| Objeto | Problema |
|--------|----------|
| platform_organizations.org_type vs tipo | org_type (text) y tipo (enum) — semántica duplicada |
| platform_organizations.pais vs country | pais y country — duplicación |
| platform_organizations | plan y status en org; también en org_billing_settings — redundancia intencional (org = fuente, obs = override) |
| user_roles.role | text, no usa enum app_role — inconsistencia |

### 2.4 Columnas que podrían faltar

| Tabla | Columna | Riesgo |
|-------|---------|--------|
| profiles | created_at | v_admin_users_summary la usa; si no existe, la vista falla |
| profiles | organization_id | Usada por get_user_organization_id; típicamente existe |
| profiles | user_id | FK a auth.users; típicamente existe |

### 2.5 Enums existentes (admin)

| Enum | Valores |
|------|---------|
| org_tipo | cooperativa, exportador, certificadora, interna |
| org_plan | lite, smart, plus, none |
| org_status | en_prueba, activo, vencido, suspendido, cerrado |
| app_role | admin, superadmin, cooperativa_admin, ... |
| billing_cycle | mensual, anual |
| invoice_status | draft, issued, overdue, paid, void |
| payment_method_type | transferencia, efectivo, cheque, stripe, otro |
| admin_action_type | activar_trial, suspender_cuenta, cambiar_plan, ... |

### 2.6 Políticas RLS existentes

| Tabla | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| platform_organizations | admin_orgs_select | — | admin_orgs_update | — |
| profiles | admin_profiles_select | — | — | — |
| user_roles | admin_user_roles_select | — | — | — |
| org_billing_settings | admin_obs_select | — | admin_obs_update | — |
| org_billing_addons | admin_oba_select | — | — | — |
| billing_usage_snapshots | admin_bus_select | — | — | — |
| invoices | admin_invoices_select | admin_invoices_insert | — | — |
| invoice_lines | admin_invoice_lines_select | admin_invoice_lines_insert | — | — |
| payments | admin_payments_select | admin_payments_insert | — | — |
| admin_action_logs | admin_aal_select | — | — | — |
| admin_feedback | admin_feedback_select | — | — | — |
| admin_opportunities | admin_opportunities_select | — | — | — |
| billing_plans | admin_bp_select (authenticated) | — | — | — |
| billing_addons | admin_ba_select (authenticated) | — | — | — |

### 2.7 Tablas NO usadas por Admin (fuera de alcance)

- `organizations` — usada por productores, parcelas, lotes (legacy). Admin usa solo platform_organizations.
- No hay tablas `ns_*` en el proyecto.
- No hay columnas `*_new` o `status_new`, `plan_new`, `tipo_new`.

---

## 3. Estrategia de convergencia mínima

### Principios

1. **Reutilizar** tablas existentes: platform_organizations, profiles, user_roles, org_billing_settings, invoices, payments, admin_action_logs, vistas.
2. **Agregar** solo columnas estrictamente faltantes (ej. profiles.created_at si no existe).
3. **Crear** solo lo imprescindible (ej. platform_health_checks si se quiere detalle de Platform).
4. **No duplicar** semántica: converger org_type → tipo o viceversa; no mantener ambos como fuentes de verdad.
5. **No crear** tablas ns_* ni columnas sombra.
6. **No duplicar** user_roles.

### Convergencia de columnas

| Decisión | Acción |
|----------|--------|
| org_type vs tipo | Mantener tipo como fuente para admin. org_type legacy para onboarding — documentar; no eliminar org_type sin migración de datos. |
| pais vs country | Mantener country para admin. pais legacy. No tocar en convergencia mínima. |
| user_roles.role | Mantener text. app_role es para admin_action_type; user_roles.role es libre. No cambiar. |
| profiles.created_at | Añadir si no existe (ALTER ADD COLUMN IF NOT EXISTS). |

---

## 4. Migraciones SQL mínimas propuestas

### 01_admin_schema_alignment.sql

| Elemento | Acción |
|----------|--------|
| Tablas tocadas | profiles |
| Columnas nuevas | profiles.created_at (IF NOT EXISTS) |
| Enums nuevos | Ninguno |
| Funciones nuevas | Ninguna |
| Vistas nuevas | Ninguna |
| Políticas RLS | Ninguna |
| Riesgo | Bajo. ADD COLUMN IF NOT EXISTS es idempotente. Si created_at ya existe, no hace nada. |

### 02_admin_billing_alignment.sql

| Elemento | Acción |
|----------|--------|
| Tablas tocadas | Ninguna (billing ya creado por 20250318*) |
| Columnas nuevas | Ninguna |
| Enums nuevos | Ninguno |
| Funciones nuevas | Ninguna |
| Vistas nuevas | Ninguna |
| Políticas RLS | Ninguna |
| Riesgo | N/A. Esta migración sería un no-op si el billing ya está aplicado. **Alternativa**: consolidar verificación de que billing_plans, org_billing_settings, invoices, payments existen y tienen estructura correcta. Si ya aplicado, omitir. |

**Nota**: Si el esquema actual ya tiene todas las migraciones 20250318* aplicadas, 02 puede ser solo un script de verificación o omitirse.

### 03_admin_audit_and_views.sql

| Elemento | Acción |
|----------|--------|
| Tablas tocadas | admin_action_logs (verificar), v_admin_* (recrear si necesario) |
| Columnas nuevas | Ninguna |
| Enums nuevos | Ninguno |
| Funciones nuevas | log_admin_action (verificar firma) |
| Vistas nuevas | v_admin_organizations_summary, v_admin_users_summary (CREATE OR REPLACE) |
| Políticas RLS | Ninguna |
| Riesgo | Medio. CREATE OR REPLACE VIEW puede fallar si dependencias (profiles.created_at) no existen. Orden: ejecutar 01 antes. |

### 04_admin_rls_hardening.sql

| Elemento | Acción |
|----------|--------|
| Tablas tocadas | Todas las del admin |
| Columnas nuevas | Ninguna |
| Enums nuevos | Ninguno |
| Funciones nuevas | is_admin (verificar que incluye superadmin) |
| Vistas nuevas | Ninguna |
| Políticas RLS | Revisar/consolidar SELECT, INSERT, UPDATE para admin. Asegurar que invoice_lines INSERT permite admin. |
| Riesgo | Medio. Cambiar políticas puede bloquear acceso. Probar en staging. |

---

## 5. Tabla comparativa de objetos

| Objeto | Ya existe | Se reutiliza | Se altera | Se crea nuevo | Notas |
|--------|-----------|--------------|----------|---------------|-------|
| platform_organizations | Sí | Sí | No (en convergencia mínima) | No | Mantener tipo, plan, status. org_type/pais legacy. |
| profiles | Sí | Sí | Sí (created_at si falta) | No | ADD COLUMN created_at IF NOT EXISTS |
| user_roles | Sí | Sí | No | No | No duplicar. role sigue como text. |
| org_billing_settings | Sí | Sí | No | No | |
| billing_usage_snapshots | Sí | Sí | No | No | |
| invoices | Sí | Sí | No | No | |
| invoice_lines | Sí | Sí | No | No | |
| payments | Sí | Sí | No | No | |
| admin_action_logs | Sí | Sí | No | No | |
| billing_plans | Sí | Sí | No | No | |
| billing_addons | Sí | Sí | No | No | |
| org_billing_addons | Sí | Sí | No | No | |
| admin_feedback | Sí | Sí | No | No | |
| admin_opportunities | Sí | Sí | No | No | |
| v_admin_organizations_summary | Sí | Sí | No (CREATE OR REPLACE) | No | |
| v_admin_users_summary | Sí | Sí | No (CREATE OR REPLACE) | No | |
| get_platform_status | Sí | Sí | No | No | |
| log_admin_action | Sí | Sí | No | No | |
| ns_* (cualquier tabla) | No | — | — | **No** | No crear. |
| *_new, status_new, plan_new, tipo_new | No | — | — | **No** | No crear. |
| platform_health_checks | No | — | — | Opcional | Solo si se quiere detalle de Platform. |
| admin_compliance_issues (tabla) | No | — | — | Opcional | Compliance actual es derivado de invoices. |

---

## 6. Correcciones recomendadas para auditoría (Admin Panel)

### 6.1 Rutas con mock

| Problema | Recomendación |
|----------|---------------|
| Fallback silencioso a mock en error | Mostrar indicador "Modo degradado" o toast de error cuando se usa mock. No presentar datos mock como si fueran reales. |
| Platform detalle siempre mock | Crear tabla platform_health_checks o eliminar sección de detalle hasta tener datos reales. |
| Growth con tablas vacías → mock | Si admin_feedback y admin_opportunities están vacías, mostrar estado vacío en lugar de mock. |

### 6.2 Compliance demasiado débil

| Problema | Recomendación |
|----------|---------------|
| Solo issues derivados de invoices overdue/issued | Definir si se necesita tabla estructurada admin_compliance_issues para incidentes manuales, auditorías, etc. |
| No hay severidad/categoría persistente | Actualmente se infiere en código. Para auditoría, considerar persistir. |
| Sin flujo de resolución | Añadir acciones "Marcar resuelto" con persistencia. |

### 6.3 Growth temporal

| Problema | Recomendación |
|----------|---------------|
| admin_feedback y admin_opportunities vacías por defecto | Sin datos, mostrar "Sin feedback" / "Sin oportunidades" en lugar de mock. |
| Trial metrics calculados en cliente | Considerar vista o RPC para consistencia. |
| Sin INSERT para feedback/opportunities | Si se quiere que admin cree feedback u oportunidades, añadir políticas INSERT y UI. |

### 6.4 Acciones sin confirmación de persistencia

| Problema | Recomendación |
|----------|---------------|
| Suspender cuenta sin confirmación | Añadir AlertDialog "¿Suspender cuenta de X? Esta acción puede afectar el acceso." |
| Reactivar sin confirmación | Añadir confirmación breve. |
| Cambiar plan sin confirmación | Confirmar antes de mutar. |
| Registrar pago / Crear factura | Formularios en modal; OK. Considerar toast de éxito con "Factura NS-XXX creada" para confirmación visual. |

### 6.5 Inconsistencias frontend–base de datos

| Problema | Recomendación |
|----------|---------------|
| invoice_status: DB usa 'issued', frontend muestra 'sent' | Mapper ya normaliza. Documentar en tipos. |
| org.plan puede venir de platform_organizations o org_billing_settings | Lógica actual: obs.plan_code prevalece. Documentar fuente canónica. |
| profiles.created_at en vista | Garantizar que profiles tiene created_at (migración 01). |
| get_user_role usa p.id en algunos entornos | Ver SUPABASE_BACKEND_NOTES: corregir a user_id. |

### 6.6 Otros

| Problema | Recomendación |
|----------|---------------|
| Sin indicador de "datos en vivo" vs "modo degradado" | Badge o banner cuando se usa fallback mock. |
| Mutaciones sin invalidación completa | Revisar que todas las mutaciones invalidan las queries afectadas (ya implementado en hooks). |
| log_admin_action sin validar éxito | Considerar verificar que el RPC no falló antes de considerar éxito la acción. |

---

## 7. Resumen ejecutivo

- **Esquema**: No hay tablas ns_* ni columnas sombra. Hay duplicación semántica (org_type/tipo, pais/country) que se mantiene por compatibilidad.
- **Convergencia mínima**: Una migración para profiles.created_at; el resto del esquema admin ya está creado por 20250318*.
- **Admin Panel**: Todas las rutas tienen fallback a mock; Platform detalle es mock puro; Compliance es derivado; Growth depende de tablas que pueden estar vacías.
- **Auditoría**: Añadir confirmaciones para acciones destructivas; indicador de modo degradado; revisar compliance y growth para producción.

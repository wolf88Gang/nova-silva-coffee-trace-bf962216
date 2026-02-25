# PR Diff — Refactor Tenant (Fase 1)

## Resumen

Migración de modelo coop-centric a tenant genérico (`tenant_org_id`). Incluye migraciones SQL defensivas, RLS, y cambios de tipos/hooks en frontend.

---

## Archivos nuevos

| Archivo | Descripción |
|---------|-------------|
| `docs/REFACTOR_TENANT_PLAN.md` | Plan paso a paso |
| `docs/REFACTOR_CHECKLIST.md` | Checklist y queries de validación |
| `docs/REFACTOR_PR_DIFF.md` | Este archivo |
| `supabase/migrations/20250225100001_add_tenant_org_id.sql` | Añade columna tenant_org_id |
| `supabase/migrations/20250225100002_backfill_tenant_org_id.sql` | Backfill desde cooperativa_id/joins |
| `supabase/migrations/20250225100003_rls_tenant_policies.sql` | RLS policies por tenant |
| `src/hooks/useTenantOrg.ts` | Hook para obtener tenant del usuario |

---

## Archivos modificados

### `src/types/index.ts`

```diff
 export interface Productor {
   id: string;
-  cooperativaId: string;
+  /** @deprecated Use tenantOrgId. Kept for backward compatibility during Fase 1. */
+  cooperativaId?: string;
+  /** Tenant organization (coop, hacienda, etc.). Preferred over cooperativaId. */
+  tenantOrgId?: string;
   nombre: string;
   ...
 }

 export interface Parcela {
   id: string;
   productorId: string;
+  /** Tenant org (from productor). Used for RLS. */
+  tenantOrgId?: string;
   nombre: string;
   ...
 }
```

---

## Archivos a cambiar (cuando existan queries reales)

Actualmente el repo solo usa `profiles` y `user_roles` desde Supabase. El resto es demo-data. Cuando se conecten las tablas operacionales:

| Archivo | Cambio |
|---------|--------|
| Queries de productores | `.eq('tenant_org_id', tenantOrgId)` con fallback `.eq('cooperativa_id', cooperativaId)` si null |
| Queries de parcelas, entregas, etc. | Idem |
| Hooks de datos | Usar `useTenantOrg()` para obtener tenant y filtrar |
| Edge Functions | Pasar `tenant_org_id` en body; validar membership |

---

## Migraciones — Orden de ejecución

1. `20250225100001_add_tenant_org_id.sql`
2. `20250225100002_backfill_tenant_org_id.sql`
3. `20250225100003_rls_tenant_policies.sql`

---

## Comandos

```bash
# Aplicar migraciones (con Supabase CLI)
npx supabase db push

# O manualmente en SQL Editor
# Ejecutar cada archivo en orden
```

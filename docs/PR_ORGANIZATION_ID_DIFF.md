# PR Diff — Refactor organization_id (Fase 1)

## Archivos nuevos

| Archivo | Descripción |
|---------|-------------|
| `supabase/migrations/20250225110001_organization_id_refactor.sql` | Migración: add organization_id, backfill, helpers, RLS |
| `scripts/run_organization_id_refactor.sql` | Script único para SQL Editor |
| `src/hooks/useCurrentOrgId.ts` | Hook que lee user.organizationId (desde profiles) |
| `src/lib/org-terminology.ts` | getSociosLabel(tipo): "Socios" si coop, "Proveedores" si no |
| `docs/ORGANIZATION_ID_REFACTOR.md` | Documentación y checklist |
| `docs/PR_ORGANIZATION_ID_DIFF.md` | Este archivo |

## Archivos modificados

### `src/contexts/AuthContext.tsx`

```diff
 interface User {
   ...
   organizationName?: string;
+  organizationId?: string;
 }

 async function getUserProfile(userId: string) {
-  const { data, error } = await supabase.from('profiles').select('name, organization_name')...
+  const { data, error } = await supabase.from('profiles').select('name, organization_name, organization_id')...
   return data ? { name: data.name, organizationName: data.organization_name, organizationId: data.organization_id } : null;
 }

 return {
   ...
+  organizationId: profile?.organizationId || undefined,
 };
```

### `src/types/index.ts`

```diff
 export interface Productor {
   id: string;
-  cooperativaId?: string;
-  tenantOrgId?: string;
+  cooperativaId?: string;  // @deprecated
+  organizationId?: string;
   ...
 }

 export interface Parcela {
   ...
-  tenantOrgId?: string;
+  organizationId?: string;
   ...
 }
```

## Uso en componentes

```tsx
import { useCurrentOrgId, getOrgFilterValue } from '@/hooks/useCurrentOrgId';
import { getSociosLabel } from '@/lib/org-terminology';

// En componente
const { organizationId } = useCurrentOrgId();
const orgId = getOrgFilterValue(organizationId, null);

// Query (cuando se conecte Supabase)
const { data } = await supabase
  .from('productores')
  .select('*')
  .or(orgId ? `organization_id.eq.${orgId},cooperativa_id.eq.${orgId}` : '');

// UI: "Socios" vs "Proveedores"
const label = getSociosLabel(orgTipo);  // orgTipo desde organizations.tipo
```

## Ejecución

1. Supabase SQL Editor → pegar `scripts/run_organization_id_refactor.sql` → Run
2. Verificar: `SELECT routine_name FROM information_schema.routines WHERE routine_name IN ('current_org_id','is_admin','_can_access_org');`

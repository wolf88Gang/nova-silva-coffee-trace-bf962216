# Phase 3: Constraints + org-only RLS

## Status: READY TO EXECUTE

## Prerequisites
- [x] `ORG_ID_ONLY = true` in frontend
- [x] Backfill complete (0 NULLs)
- [x] Frontend uses `.eq('organization_id', ...)` exclusively
- [ ] **RLS smoke test 24/24 PASS** (run before executing)

## What this phase does

### 1. NOT NULL constraints
`ALTER COLUMN organization_id SET NOT NULL` on 8 core tables.

### 2. Foreign keys
`FOREIGN KEY (organization_id) REFERENCES platform_organizations(id) ON UPDATE CASCADE ON DELETE RESTRICT` — prevents orphan rows.

### 3. Composite indexes
Performance optimization for RLS queries:
- `productores(organization_id, id)`
- `parcelas(organization_id, productor_id)`
- `entregas(organization_id, productor_id, fecha)`
- `documentos(organization_id, productor_id, parcela_id)`
- `profiles(user_id)`, `profiles(organization_id)`

### 4. RLS simplification
Replaces all legacy/fallback policies with clean `org_only_*`:
```sql
USING (is_admin(auth.uid()) OR organization_id = get_user_organization_id(auth.uid()))
```
No `cooperativa_id` in any policy.

### 5. Trigger cleanup
Drops `trg_sync_org_id_*` triggers (dual-write no longer needed). Retains function for rollback.

## Scripts
| Script | Purpose |
|--------|---------|
| `scripts/run_org_id_phase3_constraints.sql` | Execute Phase 3 |
| `scripts/verify_org_id_phase3.sql` | Verify results |

## Rollback

### Revert NOT NULL
```sql
ALTER TABLE public.<table> ALTER COLUMN organization_id DROP NOT NULL;
```

### Revert FK
```sql
ALTER TABLE public.<table> DROP CONSTRAINT IF EXISTS fk_<table>_organization_id;
```

### Revert RLS (restore fallback)
Re-run Phase 1 script (`run_org_id_unification_phase1.sql`) which creates `orgid_*` policies with legacy fallback.

### Restore triggers
```sql
DO $$ DECLARE t text;
BEGIN FOREACH t IN ARRAY ARRAY['productores','parcelas','entregas','documentos','lotes_acopio','lotes_comerciales','contratos','cooperativa_exportadores'] LOOP
  EXECUTE format('CREATE TRIGGER trg_sync_org_id_%s BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.sync_org_id_from_legacy_cols()', t, t);
END LOOP; END $$;
```

## Post-execution checklist
- [ ] `verify_org_id_phase3.sql` shows NOT NULL = YES for all tables
- [ ] FK constraints listed for all 8 tables
- [ ] Only `org_only_*` policies present (no legacy)
- [ ] 0 triggers with `trg_sync_org_id` prefix
- [ ] DevTenantInspector RLS Smoke Test passes

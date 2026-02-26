# ORG_ID_ONLY Cutoff — Phase 2 Complete

## Status: ✅ ACTIVE

`ORG_ID_ONLY = true` since Phase 2 cleanup.

## What changed

1. **`applyOrgFilter`** now uses `.eq('organization_id', orgId)` only — no `.or()` fallback
2. **`orgWriteFields`** returns only `{ organization_id }` — no `cooperativa_id`
3. **`getTenantColumn`** always returns `'organization_id'` (deprecated)
4. **Types**: `organizationId` is now required (not optional) on `Productor`, `Parcela`
5. **DevTenantInspector**: Shows `ORG_ID_ONLY: ON`, legacy fallback `DISABLED`

## Prerequisites (backend)
- [x] `organization_id` column exists on all tenant tables
- [x] Backfill complete (0 NULLs in critical tables)
- [x] Dual-write triggers active (`trg_sync_org_id_*`)
- [x] RLS org-first policies active (`orgid_*`)

## QA Checklist

### Cross-org isolation
- [ ] Login org1 → list productores → only org1 data
- [ ] Login org2 → list productores → only org2 data
- [ ] org1 cannot see org2 data
- [ ] org2 cannot see org1 data

### Writes
- [ ] INSERT productor → sends `organization_id` only (no `cooperativa_id`)
- [ ] INSERT entrega → sends `organization_id` only

### Network
- [ ] No request includes `cooperativa_id` as filter param
- [ ] All requests go to `qbwmsarqewxjuwgkdfmg.supabase.co`

### DevTenantInspector
- [ ] ORG_ID_ONLY badge shows `ON`
- [ ] Legacy fallback badge shows `DISABLED`
- [ ] RLS Smoke Test passes

## Next: Phase 3 (backend)
When ready:
1. `ALTER COLUMN organization_id SET NOT NULL` on critical tables
2. `ADD FOREIGN KEY REFERENCES platform_organizations(id)`
3. Drop dual-write triggers
4. Deprecate `cooperativa_id` columns

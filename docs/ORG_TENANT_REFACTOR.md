# Organization-based Multi-Tenant Refactor

## Status: Security Milestone Closed

RLS isolation validated for all three core tables via PostgREST + JWT (no `set_config`).

## Architecture

- **Tenant key**: `cooperativa_id` (UUID) in `productores`, `parcelas`, `entregas`
- **Resolution**: `get_user_organization_id(auth.uid())` maps authenticated user → org UUID
- **Enforcement**: Postgres RLS policies on SELECT, INSERT, UPDATE, DELETE
- **Frontend**: `useProductores()` hook queries Supabase; RLS filters automatically by org

## RLS Test Results (2026-02-26)

### org1 = Cooperativa (00000000-0000-0000-0000-000000000001)
### org2 = Exportador (00000000-0000-0000-0000-000000000002)

| Table | Operation | org1 → org1 | org1 → org2 | org2 → org1 | org2 → org2 |
|-------|-----------|:-----------:|:-----------:|:-----------:|:-----------:|
| productores | SELECT | rows ✅ | 0 rows ✅ | 0 rows ✅ | rows ✅ |
| productores | INSERT | OK ✅ | 403 RLS ✅ | 403 RLS ✅ | OK ✅ |
| parcelas | SELECT | rows ✅ | 0 rows ✅ | 0 rows ✅ | rows ✅ |
| parcelas | INSERT | OK ✅ | 403 RLS ✅ | 403 RLS ✅ | OK ✅ |
| entregas | SELECT | rows ✅ | 0 rows ✅ | 0 rows ✅ | rows ✅ |
| entregas | INSERT | OK ✅ | 403 RLS ✅ | 403 RLS ✅ | OK ✅ |

**24/24 checks PASS.**

## Manual Verification Steps

### 1. Login cooperativa (org1) — should see own productores

```bash
# Ensure demo user exists
curl -X POST 'https://qbwmsarqewxjuwgkdfmg.supabase.co/functions/v1/ensure-demo-user' \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"role":"cooperativa"}'

# Login
curl -X POST 'https://qbwmsarqewxjuwgkdfmg.supabase.co/auth/v1/token?grant_type=password' \
  -H "apikey: <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"email":"demo.cooperativa@novasilva.com","password":"demo123456"}'
# → access_token for org1

# Verify: should return productores for org1 only
curl 'https://qbwmsarqewxjuwgkdfmg.supabase.co/rest/v1/productores?select=id,nombre' \
  -H "apikey: <ANON_KEY>" \
  -H "Authorization: Bearer <TOKEN>"
```

### 2. Login exportador (org2) — should see own productores, NOT org1's

Same flow with `demo.exportador@novasilva.com`. Should return different productores.

### 3. Cross-org insert — should be blocked

```bash
# As org1, try to insert into org2
curl -X POST 'https://qbwmsarqewxjuwgkdfmg.supabase.co/rest/v1/productores' \
  -H "apikey: <ANON_KEY>" \
  -H "Authorization: Bearer <TOKEN_ORG1>" \
  -H "Content-Type: application/json" \
  -d '{"cooperativa_id":"00000000-0000-0000-0000-000000000002","nombre":"should_fail"}'
# → 403 "new row violates row-level security policy"
```

### 4. UI verification

1. Navigate to `http://localhost:8080/demo`
2. Select **Cooperativa** → Dashboard → Productoras/es → see org1 productores
3. Logout → Select **Exportador** → different dashboard, no access to org1 productores

## Frontend Migration Status

| Component | Status | Data Source |
|-----------|--------|-------------|
| ProductoresHub | ✅ Migrated | `useProductores()` → Supabase |
| VitalCooperativa | ⏳ Pending | `DEMO_PRODUCTORES` |
| ClimaDashboard | ⏳ Pending | `DEMO_PRODUCTORES` |
| TecnicoProductores | ⏳ Pending | `DEMO_PRODUCTORES` |
| DashboardTecnico | ⏳ Pending | `DEMO_PRODUCTORES` |
| TecnicoVital | ⏳ Pending | `DEMO_PRODUCTORES` |

## Notes

- `*_select_by_membership` policies kept intentionally — useful for future multi-user org flows.
- `cooperativa_id` column name kept in DB for backward compatibility; conceptually = `organization_id`.
- Enum `tipo_cafe`: valid values are `arabica`, `robusta`, `mixed`.

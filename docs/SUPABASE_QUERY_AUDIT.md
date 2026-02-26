# Supabase Query Audit

**Date**: 2026-02-26
**Scope**: Full repository scan of all Supabase client interactions

---

## Summary

| Category | Count | Details |
|----------|-------|---------|
| `supabase.from()` SELECTs | 4 | 2 auth-context, 2 data queries |
| `supabase.from()` mutations | 0 | No inserts/updates/deletes via frontend |
| `supabase.rpc()` | 0 | No RPC calls |
| `supabase.functions.invoke()` | 1 | `ensure-demo-user` only |
| `supabase.auth.*` | 6 | Standard auth operations |
| **Unfiltered org queries** | **0** | All data queries protected by RLS |

---

## Detailed Inventory

### 1. Data Queries (`supabase.from()`)

| # | File | Table | Operation | Org Filter | Notes |
|---|------|-------|-----------|:----------:|-------|
| 1 | `src/contexts/AuthContext.tsx:39` | `profiles` | SELECT | N/A | Filtered by `user_id` — per-user, not per-org |
| 2 | `src/contexts/AuthContext.tsx:45` | `user_roles` | SELECT | N/A | Filtered by `user_id` — per-user, not per-org |
| 3 | `src/hooks/useProductores.ts:39` | `productores` | SELECT | RLS ✅ | RLS enforces `cooperativa_id = get_user_organization_id(auth.uid())` |
| 4 | `src/hooks/useProductores.ts:50` | `parcelas` | SELECT | RLS ✅ | Filtered by `productor_id IN (...)` from RLS-filtered productores |

### 2. Mutations (INSERT/UPDATE/DELETE)

**None found in `src/`.** The frontend currently has zero write operations to data tables via PostgREST.

The only writes happen in:
- `supabase/functions/ensure-demo-user/index.ts` — server-side with admin client (profiles, user_roles upserts)
- `supabase/functions/rls-smoke-test/index.ts` — test-only, cleans up after itself

### 3. RPC Calls (`supabase.rpc()`)

**None found.** No RPC calls exist in the codebase.

### 4. Edge Function Invocations

| # | File | Function | Auth | Purpose |
|---|------|----------|------|---------|
| 1 | `src/pages/DemoLogin.tsx:58` | `ensure-demo-user` | Anon (no JWT required) | Creates/ensures demo user exists before login |

### 5. Auth Operations (`supabase.auth.*`)

| # | File | Method | Purpose |
|---|------|--------|---------|
| 1 | `AuthContext.tsx:80` | `getSession()` | Init session on mount |
| 2 | `AuthContext.tsx:86` | `onAuthStateChange()` | Listen for auth events |
| 3 | `AuthContext.tsx:104` | `signUp()` | User registration |
| 4 | `AuthContext.tsx:119` | `signInWithPassword()` | Login |
| 5 | `AuthContext.tsx:124` | `signOut()` | Logout |
| 6 | `Login.tsx:41` | `resetPasswordForEmail()` | Password reset |
| 7 | `DemoLogin.tsx:72` | `signInWithPassword()` | Demo login |

---

## Risk Assessment

### ✅ No unfiltered org queries
All data queries (productores, parcelas) go through RLS. There are no queries that bypass org isolation.

### ✅ No frontend mutations without org context
There are zero write operations from the frontend. When mutations are added, they must include `cooperativa_id` (= organization_id) and will be validated by RLS `WITH CHECK`.

### ⚠️ `applyOrgFilter` does not exist
The utility `applyOrgFilter`, `useOrgContext`, `ORG_ID_ONLY`, and `DevTenantInspector` referenced in prior planning **do not exist in this codebase**. They are not needed yet because:
1. RLS handles all filtering server-side
2. There are only 2 data queries, both read-only
3. There are zero frontend mutations

### ⚠️ Future mutation risk
When write operations are added to the frontend, each mutation MUST include `cooperativa_id`. Recommended pattern:

```typescript
// When adding mutations, always include org context
const { data, error } = await supabase
  .from('productores')
  .insert({ cooperativa_id: orgId, nombre: '...' });
// RLS WITH CHECK will reject if orgId doesn't match user's org
```

### Recommended before adding mutations
1. Create `useOrgId()` hook that resolves the current user's `organization_id`
2. Create `useMutateProductor()` (and similar) hooks that auto-inject `cooperativa_id`
3. Consider adding `applyOrgFilter()` utility if query count grows significantly

---

## Files Scanned

All `.ts` and `.tsx` files in `src/` and `supabase/functions/`.

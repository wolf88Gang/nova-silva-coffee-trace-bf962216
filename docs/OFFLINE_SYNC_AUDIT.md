# Offline Sync Audit

**Date**: 2026-02-26
**Status**: No offline sync infrastructure exists

---

## Current State

| Component | Exists | Details |
|-----------|:------:|---------|
| Service Worker | ❌ | No `sw.js`, no workbox, no `navigator.serviceWorker` registration |
| IndexedDB / localForage | ❌ | No client-side database for offline data |
| Sync queue / outbox | ❌ | No pending operations queue |
| Offline detection | Stub only | `NetworkStatusBadge` is a stub that renders `null` |
| PWA manifest | ❌ | No `manifest.json` or PWA configuration |
| Cache API | ❌ | No cache-first or stale-while-revalidate strategies |

### Evidence

```
src/components/common/NetworkStatusBadge.tsx:
  // Stub — implementar después con OfflineContext
  export const NetworkStatusBadge = () => null;
```

React Query (`@tanstack/react-query`) is used for data fetching with `staleTime: 30_000` (30s) in `useProductores`, but this is an in-memory cache only — it does not persist across page reloads or work offline.

---

## Risk Analysis

### Q: Where are operations stored when offline?
**A:** Nowhere. There is no offline operation queue. If the user is offline, Supabase requests will fail with network errors. React Query will show the cached data if available in the current session, but won't retry mutations.

### Q: How are conflicts reconciled?
**A:** They aren't. There is no conflict resolution logic because there is no offline write capability. Currently there are zero frontend mutations (INSERT/UPDATE/DELETE) — the frontend is read-only.

### Q: What happens if `organization_id` changes offline?
**A:** Not applicable. Organization assignment is a server-side operation and cannot happen offline.

### Q: What happens if `actor_id` is created offline?
**A:** Not possible. User creation goes through `supabase.auth.signUp()` which requires network connectivity. There is no offline user/actor creation flow.

---

## Recommendation

Offline-first is **not implemented** and should not be claimed. The current app is a standard online SPA with in-memory caching.

### If offline-first is required for field technicians:

1. **Add a service worker** with workbox for static asset caching
2. **Add IndexedDB storage** via Dexie.js or localForage for local data persistence
3. **Implement an outbox pattern** for mutations:
   - Queue writes in IndexedDB when offline
   - Sync when connection is restored
   - Handle conflicts with last-write-wins or manual resolution
4. **Add `organization_id` validation** on sync:
   - Server rejects any queued write where `cooperativa_id` doesn't match the user's current org
   - RLS naturally enforces this, but the sync layer should handle the 403 gracefully
5. **Add optimistic UI** with rollback on sync failure

### Minimum viable offline (phase 1):
- Cache static assets (service worker)
- Persist React Query cache to IndexedDB (`persistQueryClient`)
- Read-only offline access to previously loaded data
- Show clear "offline" indicator

### Full offline sync (phase 2):
- Outbox queue for mutations
- Background sync on reconnect
- Conflict resolution strategy
- Delta sync for large datasets

---

## Conclusion

**There is no offline sync to audit.** The `NetworkStatusBadge` stub and the "offline-first" narrative in project planning are aspirational — the implementation does not exist. This must be communicated clearly to stakeholders before piloting with field technicians who may have unreliable connectivity.

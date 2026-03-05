# Nova Silva - Agent Instructions

## Cursor Cloud specific instructions

Nova Silva is a React/TypeScript SPA for agricultural cooperative compliance and traceability. It connects to a **remote hosted Supabase** instance — no local database setup is required.

### Services

| Service | How to run | Notes |
|---------|-----------|-------|
| Vite Dev Server | `npm run dev` | Runs on port 8080. This is the only service needed locally. |
| Supabase | Hosted remotely | `qbwmsarqewxjuwgkdfmg.supabase.co` — no local setup needed |

### Common Commands

See `package.json` scripts. Key commands:
- **Dev server**: `npm run dev` (port 8080)
- **Lint**: `npm run lint` (ESLint 9 — has pre-existing warnings/errors in the codebase)
- **Test**: `npm run test` (Vitest)
- **Build**: `npm run build`

### Demo Access

The app has a built-in demo mode at `/demo` that does not require real authentication. Select any role (Productor, Tecnico, Cooperativa, Exportador, Certificadora) to explore the corresponding dashboard with mock data.

### Architecture Contract

The canonical architecture document is `NOVA_SILVA_ARCHITECTURE.md` (shared externally, not committed). Key constraints:
- **URL**: hardcoded in `src/integrations/supabase/client.ts` -- never use `import.meta.env`
- **Tenant column**: always `organization_id`, never `cooperativa_id` (`ORG_ID_ONLY = true` in `src/config/featureFlags.ts`)
- **Roles**: stored in `user_roles` table, not in `profiles` or JWT claims
- **Org filtering**: use `applyOrgFilter()` from `src/lib/orgFilter.ts`
- **Org context**: use `useOrgContext()` from `src/hooks/useOrgContext.ts` as single source of truth
- **Permissions**: `organizacion_usuarios` table with `rol_interno` + 8 boolean `permiso_*` columns. Config in `src/config/orgPermissions.ts`
- **Modules**: resolved via `src/lib/org-modules.ts`, guarded by `ModuleGuard` component
- **Terminology**: adaptive labels via `src/lib/org-terminology.ts`
- **SQL helpers**: `get_user_organization_id(_uid)`, `is_org_admin(_uid)`, `is_admin(_uid)` -- all SECURITY DEFINER
- **RLS pattern**: `organization_id = get_user_organization_id(auth.uid()) OR is_admin(auth.uid())`
- **New tables**: must always include `organization_id` FK, RLS, and index

### Gotchas

- ESLint has 7 pre-existing errors and 9 warnings (mostly `no-explicit-any`, `no-empty-object-type`, and `react-refresh/only-export-components`). These are in the existing codebase and are not blocking.
- The Vite config sets `server.host: "::"` (IPv6 dual-stack) and disables the HMR overlay.
- Path alias `@/` maps to `./src/` (configured in both `tsconfig.json` and `vite.config.ts`).

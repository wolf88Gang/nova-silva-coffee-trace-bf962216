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

### Gotchas

- ESLint has 7 pre-existing errors and 9 warnings (mostly `no-explicit-any`, `no-empty-object-type`, and `react-refresh/only-export-components`). These are in the existing codebase and are not blocking.
- The Vite config sets `server.host: "::"` (IPv6 dual-stack) and disables the HMR overlay.
- Path alias `@/` maps to `./src/` (configured in both `tsconfig.json` and `vite.config.ts`).

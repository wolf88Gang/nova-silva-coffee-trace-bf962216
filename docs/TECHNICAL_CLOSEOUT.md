# Technical Closeout — Prompt 8 Checklist

## ✅ Supabase External Guarantee
- [ ] App tiene UN solo `createClient` en `src/integrations/supabase/client.ts`
- [ ] URL hardcodeada: `https://qbwmsarqewxjuwgkdfmg.supabase.co`
- [ ] `assertSupabaseHost()` se ejecuta en dev y bloquea si host no coincide
- [ ] `scripts/audit-supabase-host.ts` muestra 0 foreign hosts
- [ ] Network tab muestra auth/rest apuntando al host externo

## ✅ ModuleGuard en rutas
- [ ] Rutas VITAL envueltas en `ModuleGuard(module="vital")`
- [ ] Rutas EUDR envueltas en `ModuleGuard(module="eudr")`
- [ ] Rutas Créditos envueltas en `ModuleGuard(module="creditos")`
- [ ] Módulo apagado → pantalla "Módulo no activado", sin ejecutar hooks

## ✅ RoleGuard
- [ ] `RoleGuard` creado en `src/components/auth/RoleGuard.tsx`
- [ ] Usado en botones "Nuevo" (create actions)
- [ ] `showDenied` mode para pages completas
- [ ] No reemplaza RLS — solo mejora UX

## ✅ Legacy Wrappers
- [ ] `DashboardCooperativa` → wrapper a `OrganizationDashboard`
- [ ] `DashboardExportador` → wrapper a `OrganizationDashboard`
- [ ] `DashboardProductor` → wrapper a `OrganizationDashboard`
- [ ] `DashboardTecnico` → wrapper a `OrganizationDashboard`
- [ ] `ProductoresHub` → wrapper a `ActorsHub`
- [ ] `MiFinca` → wrapper a `ParcelasHub`
- [ ] `TecnicoParcelas` → wrapper a `ParcelasHub`
- [ ] Wrappers NO contienen lógica, hooks, ni texto

## ✅ Hooks Consolidados
- [ ] `useOrgContext` es la fuente única de verdad
- [ ] `useTenantOrg` eliminado (deprecated)
- [ ] `useCurrentOrgId` eliminado (deprecated)
- [ ] Hooks de datos usan `organizationId` de `useOrgContext`

## ✅ Terminología
- [ ] `terminology.ts` — diccionario central
- [ ] `org-terminology.ts` — helpers rápidos
- [ ] Ningún header dice "Dashboard Cooperativa"
- [ ] Labels dinámicos por orgTipo

## ✅ Build
- [ ] Build limpio sin errores
- [ ] Sin imports a componentes legacy eliminados

# Terminology Normalization — QA Checklist

## Resumen
Eliminación de referencias coop-centric en toda la UI. "Cooperativa" es ahora un tipo de organización, no el modelo mental base.

## Archivos

### Nuevos
- `src/lib/terminology.ts` — Diccionario central consolidado con `getActorLabels()`, `getOrgLabel()`, `getOrgSubtitle()`, `TOOLTIPS`
- `scripts/audit-terminology.ts` — Script de auditoría de terminología

### Modificados
- `src/pages/cooperativa/InclusionEquidad.tsx` — "en la cooperativa" → "en la organización"
- `src/pages/cooperativa/UsuariosOrg.tsx` — emails @cooperativa.com → @organizacion.com
- `src/pages/DemoLogin.tsx` — "Gestión de cooperativa" → "Gestión de organización"

### Archivos existentes que ya usan terminología dinámica
- `src/lib/org-terminology.ts` — Helpers existentes (getActorsLabel, getActorLabel, etc.)
- `src/components/layout/Sidebar.tsx` — Ya usa getActorsNavLabel + getOrgTypeLabel
- `src/pages/actors/ActorsHub.tsx` — Ya usa getActorsLabel dinámico
- `src/components/dashboard/OrganizationDashboard.tsx` — Ya usa OrgHeader dinámico

## Relación terminology.ts vs org-terminology.ts
- `org-terminology.ts`: helpers rápidos existentes (getActorsLabel, getActorLabel, etc.)
- `terminology.ts`: diccionario completo con ActorLabelSet, tooltips, microcopy
- Ambos coexisten; `terminology.ts` es el canonical para nuevos componentes

## QA Checklist

### ✅ Exportador
- [ ] No ve "cooperativa" en ningún título visible
- [ ] Ve "Proveedores" como label de actores
- [ ] Dashboard dice "Dashboard" (no "Dashboard Cooperativa")

### ✅ Productor Empresarial
- [ ] Ve "Unidades Productivas" o "Mis Fincas"
- [ ] No ve "socios" en ningún lugar

### ✅ Sidebar
- [ ] Badge muestra tipo de org (Cooperativa/Exportador/etc.), no el role técnico
- [ ] Navegación basada en módulos + terminología dinámica

### ✅ Dashboard
- [ ] Ningún header dice "Dashboard Cooperativa"
- [ ] Header muestra nombre org + badge tipo

### ✅ Inclusión y Equidad
- [ ] Dice "en la organización" (no "en la cooperativa")

### ✅ Demo Login
- [ ] Descripción de cooperativa: "Gestión de organización"

### ✅ Usuarios y Permisos
- [ ] Emails de ejemplo no usan @cooperativa.com

### ✅ No se rompe nada
- [ ] Auth sigue funcionando
- [ ] RLS no se toca
- [ ] Rutas /cooperativa/* siguen accesibles
- [ ] Queries sin cambios

## Audit Script
Ejecutar: `npx tsx scripts/audit-terminology.ts`
Busca strings hardcodeados como "Dashboard Cooperativa", "Nuevo productor", etc.

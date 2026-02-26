# Module Activation Refactor — QA Checklist

## Resumen
Implementación de activación modular dinámica por organización.
La UI renderiza menús, rutas y componentes según: `role` + `orgTipo` + `activeModules`.

## Archivos creados/modificados

### Nuevos
- `src/lib/org-modules.ts` — Sistema central de módulos: tipos, defaults por orgTipo, helpers
- `src/components/auth/ModuleGuard.tsx` — Guard component que bloquea acceso a módulos inactivos

### Modificados
- `src/contexts/AuthContext.tsx` — User ahora incluye `activeModules`, `isEudrActive`, `isVitalActive`
- `src/hooks/useOrgContext.ts` — Expone `activeModules: OrgModule[]` resueltos
- `src/components/layout/Sidebar.tsx` — Nav items filtrados por `activeModules`, zero hardcoded role checks
- `src/components/dev/DevTenantInspector.tsx` — Muestra módulos activos

## Arquitectura de módulos

```
activeModules = resolve(org.modules || legacyFlags || defaultsByOrgTipo)
```

### Resolución:
1. Si `org.modules` (jsonb) tiene datos → usar directamente
2. Si vacío → usar flags legacy (`is_eudr_active`, `is_vital_active`)
3. Si todo null → `getOrgDefaultModules(orgTipo)` provee defaults

### Separación de concerns:
- **`activeModules`** → controla VISIBILIDAD (qué se renderiza)
- **`role`** → controla PERMISOS (qué puede hacer dentro del módulo)
- Son **ortogonales**: un módulo puede estar activo pero el rol tener solo lectura

## Defaults por tipo de organización

| orgTipo | Módulos incluidos |
|---------|------------------|
| cooperativa | core, productores, parcelas, entregas, lotes_acopio, calidad, vital, finanzas, creditos, jornales, inventario, mensajes, inclusion |
| exportador (operativo) | core, productores, parcelas, entregas, lotes_acopio, lotes_comerciales, contratos, calidad, eudr, finanzas, mensajes |
| beneficio_privado | core, productores, parcelas, entregas, lotes_acopio, calidad, vital, finanzas, jornales, inventario, mensajes |
| productor | core, parcelas, vital, finanzas, inventario, mensajes |
| aggregator | core, productores, entregas, lotes_acopio, lotes_comerciales, finanzas, mensajes |
| certificadora | core, vital, eudr |
| tecnico | core, productores, parcelas, vital |

> Un exportador "trading-only" tendría `org.modules = ['lotes_comerciales', 'contratos', 'eudr', 'finanzas']` configurado explícitamente.

## QA Checklist

### ✅ Cooperativa (orgTipo=cooperativa)
- [ ] Sidebar muestra: Panel, Productoras/es, Acopio, Operaciones, Finanzas, Comunicación, Nova Cup, VITAL, Inclusión, Usuarios
- [ ] Todos los módulos por default están habilitados
- [ ] DevTenantInspector muestra ~13 módulos activos

### ✅ Exportador operativo (orgTipo=exportador, modules=null → defaults)
- [ ] Sidebar muestra: Panel, Gestión de Café, Red de Proveedores, Gestión Comercial, Nova Cup, Administración, Mensajes
- [ ] Incluye módulos de campo (productores, parcelas, entregas)
- [ ] Incluye módulos comerciales (lotes_comerciales, contratos, eudr)

### ✅ Exportador trading-only (orgTipo=exportador, modules=['lotes_comerciales','contratos','eudr','finanzas'])
- [ ] Sidebar NO muestra Gestión de Café (lotes_acopio not in modules) 
- [ ] Sidebar NO muestra Red de Proveedores (productores not in modules)
- [ ] Solo ve módulos comerciales y compliance

### ✅ Productor (orgTipo=productor)
- [ ] Sidebar muestra: Panel, Producción, Finanzas, Sostenibilidad, Comunidad
- [ ] NO ve módulos de org (productores, acopio, jornales)

### ✅ Técnico (orgTipo=cooperativa, role=tecnico)
- [ ] Sidebar muestra: Panel, Productores Asignados, VITAL, Parcelas, Agenda
- [ ] Módulos limitados a lo que necesita

### ✅ ModuleGuard
- [ ] Envuelve una página con `<ModuleGuard module="vital">`
- [ ] Si vital no activo → muestra "Módulo no activado" con botón Volver
- [ ] Si vital activo → renderiza children normalmente
- [ ] Soporta array: `module={['finanzas','creditos']}` pasa si cualquiera activo

### ✅ Admin
- [ ] Ve todos los nav items sin filtrar (admin bypasses module filtering)

### ✅ No se rompe nada
- [ ] Login demo cooperativa sigue funcionando
- [ ] Login demo exportador sigue funcionando
- [ ] Login demo productor sigue funcionando
- [ ] Login demo técnico sigue funcionando
- [ ] Rutas existentes siguen accesibles
- [ ] No hay hardcode de `role === 'cooperativa'` en Sidebar
- [ ] No se modifican queries ni RLS

# Actors Hub Refactor — QA Checklist

## Resumen
Una sola página universal `ActorsHub` reemplaza páginas separadas de productores/proveedores.
Labels, columnas, acciones y tabs se adaptan por `orgTipo`, `activeModules` y `role`.

## Archivos

### Nuevos
- `src/pages/actors/ActorsHub.tsx` — Página universal de actores
- `src/lib/org-terminology.ts` — Expandido con `getActorKind`, `getActorsEmptyState`

### Modificados (wrappers)
- `src/pages/cooperativa/ProductoresHub.tsx` → wrapper de ActorsHub
- `src/pages/exportador/ExportadorProveedores.tsx` → wrapper de ActorsHub

## QA Checklist

### ✅ Cooperativa
- [ ] Título: "Socios"
- [ ] Subtítulo: "X socios registrados"
- [ ] Botón: "Nuevo Socio"
- [ ] Columnas EUDR y VITAL visibles (módulos activos por default)
- [ ] Search placeholder: "Buscar socio por nombre o documento..."

### ✅ Exportador
- [ ] Título: "Proveedores"
- [ ] Botón: "Nuevo Proveedor"
- [ ] Columna EUDR visible, VITAL oculta (no en defaults exportador)
- [ ] Search placeholder: "Buscar proveedor por nombre o documento..."

### ✅ Productor Empresarial
- [ ] Título: "Fincas"
- [ ] Botón: "Nueva Finca"
- [ ] Modal de creación no pide cédula
- [ ] Si role=productor, solo ve su propio registro

### ✅ Certificadora
- [ ] Título: "Actores" (fallback)
- [ ] Vista de solo lectura

### ✅ Columnas dinámicas
- [ ] EUDR column: solo si módulo eudr activo
- [ ] VITAL column: solo si módulo vital activo
- [ ] Summary cards: EUDR/VITAL solo si módulo activo

### ✅ Permisos (frontend)
- [ ] admin/cooperativa/exportador: pueden crear actores
- [ ] productor: solo ve, no crea
- [ ] tecnico: solo ve, no crea

### ✅ Detail dialog
- [ ] Click en row abre dialog con tabs
- [ ] Tabs: Resumen siempre visible
- [ ] Tab Parcelas: solo si módulo parcelas activo
- [ ] Tab Entregas: solo si módulo entregas activo
- [ ] Tab Créditos: solo si módulo creditos activo
- [ ] Tab VITAL: solo si módulo vital activo

### ✅ Create dialog
- [ ] Campos base: nombre, teléfono, comunidad
- [ ] Cédula: oculta para productor_empresarial
- [ ] Hectáreas: visible para cooperativa/productor_empresarial
- [ ] Estado EUDR: solo si módulo eudr activo

### ✅ Multi-tenant
- [ ] Filtrado por cooperativa_id = organizationId (cuando se conecte a Supabase real)
- [ ] Org1 no ve actores de Org2

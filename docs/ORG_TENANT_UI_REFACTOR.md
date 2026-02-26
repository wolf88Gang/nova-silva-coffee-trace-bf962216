# Org-Tenant UI Refactor — QA Checklist

## Resumen
Refactor del frontend para modelo org-centric (tenant = organization_id) en lugar de coop-centric.

## Cambios realizados

### 1. AuthContext (src/contexts/AuthContext.tsx)
- Ahora fetches `profiles.productor_id` y lo expone en `user.productorId`
- Fetches `organizaciones` (tabla externa) para obtener `tipo_organizacion` → `user.orgTipo`
- Demo users incluyen `orgTipo` para simulación correcta

### 2. useOrgContext (src/hooks/useOrgContext.ts) — NUEVO
- Hook central para contexto tenant
- Expone: `organizationId`, `productorId`, `role`, `orgTipo`, `orgName`, `isReady`
- Helper `getTenantColumn(tableName)` para saber qué columna usar al filtrar por tenant

### 3. org-terminology.ts — EXPANDIDO
- `getActorsLabel(orgTipo)`: Socios / Proveedores / Fincas / Actores
- `getActorLabel(orgTipo)`: singular
- `getNewActorLabel(orgTipo)`: "Nuevo Socio" / "Nueva Finca"
- `getActorsNavLabel(orgTipo)`: para nav sidebar
- `getOrgTypeLabel(orgTipo)`: display label del tipo

### 4. Sidebar — REFACTORED
- Usa `useOrgContext()` para `orgTipo`
- Labels dinámicos en navegación (ej. "Productoras/es" → dinámico según orgTipo)
- Badge de rol muestra tipo de org, no el role técnico

### 5. DevTenantInspector — NUEVO
- Componente dev-only (no se renderiza en PROD)
- Muestra organizationId, productorId, role, orgTipo
- Botón para ejecutar queries de prueba de aislamiento

## QA Checklist

### ✅ Login demo cooperativa (org1)
- [ ] Sidebar muestra "Productoras/es" (orgTipo=cooperativa)
- [ ] Badge muestra "Cooperativa"
- [ ] DevTenantInspector muestra organizationId correcto
- [ ] Queries de productores filtran por cooperativa_id = organizationId (no user.id)
- [ ] No ve datos de org2

### ✅ Login demo exportador (org2)
- [ ] Sidebar muestra "Red de Proveedores" (orgTipo=exportador)
- [ ] Badge muestra "Exportador"
- [ ] DevTenantInspector muestra organizationId diferente a org1
- [ ] No ve datos de org1

### ✅ Login demo productor
- [ ] Sidebar muestra menú de productor (6 items)
- [ ] Si tiene productorId, solo ve sus datos
- [ ] DevTenantInspector muestra productorId no-null

### ✅ Seguridad
- [ ] `user.id` NUNCA se usa como `cooperativa_id` en INSERT/UPDATE/DELETE
- [ ] Todas las queries usan `organizationId` de `useOrgContext()` para tenant filtering
- [ ] No hay hardcode de "cooperativa" como concepto obligatorio
- [ ] No hay `service_role` key en el frontend
- [ ] Si no hay session/JWT, no se disparan queries

### ✅ Compatibilidad
- [ ] Rutas existentes siguen funcionando (/cooperativa/*, /exportador/*, etc.)
- [ ] Columnas legacy `cooperativa_id` se tratan como `tenant_id` semántico
- [ ] `getTenantColumn()` retorna el nombre correcto para cada tabla
- [ ] No se renombran tablas ni columnas en esta fase

## Notas técnicas
- La tabla externa es `organizaciones` (no `platform_organizations`)
- Campos relevantes: `nombre`, `tipo_organizacion`, `tipo`
- `cooperativa_id` en tablas legacy = `organization_id` semántico
- RLS ya funciona por `get_user_organization_id(auth.uid())`

# Refactor Org Tenant (Frontend)

## Objetivo
Dejar de ser coop-centric: usar `organizationId` desde `profiles.organization_id` como tenant. Filtrar por `cooperativa_id = organizationId`. Terminología dinámica: "Socios" vs "Proveedores" según `platform_organizations.tipo`.

## Cambios realizados

### Hook useOrgContext()
- `organizationId` — desde profiles.organization_id
- `productorId` — desde profiles.productor_id (rol productor)
- `role` — desde user_roles
- `orgTipo` — desde platform_organizations.tipo (Lovable canonical)

### Filtros de queries
- productores: `eq('cooperativa_id', organizationId)`
- parcelas: `eq('cooperativa_id', organizationId)`
- entregas: `eq('cooperativa_id', organizationId)` (+ `eq('productor_id', productorId)` si rol productor)

### Terminología UI
- `getSociosLabel(orgTipo)`: "Socios" si tipo=cooperativa, "Proveedores" si no
- Aplicado en: ProductoresHub, Sidebar (nav cooperativa), DashboardCooperativaContent

## Checklist de pruebas

### 3 usuarios demo
| Usuario | Rol | organizationId | productorId | Esperado |
|---------|-----|----------------|-------------|----------|
| demo.cooperativa@novasilva.com | cooperativa | org coop | — | Ve "Socios", lista productores de su org |
| demo.exportador@novasilva.com | exportador | org exportador | — | Ve "Proveedores", lista proveedores |
| demo.productor@novasilva.com | productor | — | productor_id | Ve solo sus entregas si filterByProductorId |

### Caso org2 (hacienda/finca no-coop)
- Org con `platform_organizations.tipo != 'cooperativa'`
- Sidebar debe mostrar "Proveedores" en lugar de "Socios"
- ProductoresHub título: "Proveedores"
- Dashboard: "Proveedores Activos"

### Verificaciones
- [ ] Login como cooperativa → nav "Socios", hub "Socios"
- [ ] Login como exportador → nav "Red de Proveedores", labels "Proveedores"
- [ ] Login como productor → sin org en sidebar, vistas propias
- [ ] Org tipo hacienda → "Proveedores" en toda la UI
- [ ] platform_organizations ausente → fallback "Productores"

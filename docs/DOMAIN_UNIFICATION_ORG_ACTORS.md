# Domain Unification: Organization + Actors

## Core Concepts

### 1. Tenant = Organization (`platform_organizations`)
The **tenant** is always an `organization`. Every data row belongs to exactly one tenant via `organization_id`.

| Organization Type | Description |
|---|---|
| `cooperativa` | Coffee cooperative managing member producers |
| `beneficio_privado` | Private mill buying from external suppliers |
| `productor_empresarial` | Single enterprise farm (self-managed) |
| `exportador` | Exporter/trader sourcing from origins |
| `certificadora` | Certification body auditing supply chains |
| `aggregator` | Consolidator/distributor |

### 2. Actor = Productive Entity (`productores` table)
An **Actor** is any person or unit that produces, supplies, or is managed by the tenant. The DB table remains `productores` for compatibility.

| Org Type | Actor Means | UI Label |
|---|---|---|
| `cooperativa` | Member producer | "Socio" |
| `beneficio_privado` | External supplier | "Proveedor" |
| `productor_empresarial` | Own farm/unit | "Unidad Productiva" |
| `exportador` | Origin supplier | "Proveedor" |
| `certificadora` | Audited unit | "Unidad Auditada" |

### 3. Asset = Parcela (`parcelas` table)
A **Parcela** (plot) belongs to an Actor and is the unit of geolocation, EUDR compliance, and production tracking.

### 4. Transaction = Entrega (`entregas` table)
An **Entrega** (delivery) is a receipt of coffee from an Actor to the tenant's collection point.

## Data Model (current)

```
platform_organizations (tenant)
  ├── productores (actors)     → organization_id, user_id?
  │     ├── parcelas (assets)  → organization_id, productor_id
  │     └── entregas (txns)    → organization_id, productor_id
  ├── documentos               → organization_id
  ├── lotes_acopio             → organization_id
  ├── lotes_comerciales        → organization_id
  └── contratos                → organization_id
```

## Productor Empresarial Case
A `productor_empresarial` is a tenant that IS ALSO an actor:
- On org creation, 1 default Actor is created (tipo_actor = "propio")
- This Actor's `user_id` = admin user's ID
- UI shows "Mis Fincas" instead of "Socios"
- Same modules apply (parcelas, entregas, VITAL)

## Exportador Case
An `exportador` is a tenant that:
- Has Actors = origin suppliers
- Uses `lotes_comerciales`, `contratos`, `paquetes_eudr`
- May or may not manage parcelas directly
- UI shows "Proveedores" / "Red de Proveedores"

## Terminology System
Two complementary files handle dynamic labels:

### `src/lib/terminology.ts` (canonical)
- `getActorLabels(orgTipo)` → `{ plural, singular, articleSingular, emptyStateTitle, emptyStateBody }`
- `getOrgLabel(orgTipo)` → "Cooperativa" / "Exportador" / etc.
- `getOrgSubtitle(orgTipo)` → descriptive subtitle
- `TOOLTIPS` → microcopy for common concepts

### `src/lib/org-terminology.ts` (navigation & UI)
- `getActorsLabel(tipo)` → plural for lists
- `getActorLabel(tipo)` → singular
- `getNewActorLabel(tipo)` → "Nuevo Socio" / "Nueva Finca"
- `getActorsNavLabel(tipo)` → sidebar label
- `getActorKind(tipo)` → `socio | proveedor | unidad_propia | auditado`

## RLS & Permissions
- **Tenant scope**: `organization_id = get_user_organization_id(auth.uid())`
- **Actor scope** (role=productor): additionally filter by `productor_id` from `profiles.productor_id`
- **Admin**: bypasses org filter via `is_admin(auth.uid())`

## Demo Data
`src/lib/demoSeed.ts` provides coherent datasets per org type:
- Cooperativa: 8 socios, 6 parcelas, 5 entregas
- Exportador: 2 proveedores, 2 lotes comerciales
- Productor empresarial: 1 unidad, 3 entregas

## Future DB Rename (Phase 4, not now)
When stable:
1. Rename `productores` → `actors` (with view for compat)
2. Rename `productor_id` → `actor_id` in parcelas, entregas
3. Drop `cooperativa_id` columns entirely
4. This requires migration + frontend PR + views

## Routes
Current routes use `/cooperativa/*` for the cooperativa role. These remain as-is because:
- The role IS "cooperativa" in `user_roles`
- Routes are role-scoped, not tenant-type-scoped
- Wrappers like `ProductoresHub` → `ActorsHub` handle abstraction

## Status
- [x] Terminology abstraction (org-terminology.ts, terminology.ts)
- [x] ActorsHub renders dynamically per orgTipo
- [x] Demo seeds per org type
- [x] organization_id as sole tenant key (ORG_ID_ONLY = true)
- [x] RLS org-only policies
- [ ] DB rename productores → actors (Phase 4)

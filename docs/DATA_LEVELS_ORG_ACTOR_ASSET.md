# Data Levels: ORG → ACTOR → ASSET

## Three-Level Hierarchy

Every data point in Nova Silva belongs to one of three levels:

```
ORG (tenant)                   ← platform_organizations.id
 └── ACTOR (member/supplier)   ← productores.id + organization_id
      ├── ASSET (plot/farm)    ← parcelas.id + productor_id + organization_id
      └── EVENT (delivery)     ← entregas.id + productor_id + organization_id
```

### Level A: ORG (Tenant)
- **Table**: `platform_organizations`
- **Key**: `id` (UUID)
- **Purpose**: Tenant isolation. Every query MUST filter by `organization_id`.
- **Examples**: Cooperativa X, Exportador Y, Beneficio Z

### Level B: ACTOR (Person/Unit)
- **Table**: `productores` (legacy name; conceptually = actors)
- **Key**: `id` (UUID), FK: `organization_id`
- **Purpose**: The productive entity within a tenant
- **Examples**: Socio, Proveedor, Finca propia, Unidad auditada

### Level C: ASSET / EVENT
- **ASSET**: `parcelas` — FK: `productor_id` + `organization_id`
- **EVENT**: `entregas` — FK: `productor_id` + `organization_id`
- **DOCUMENT**: `documentos` — FK: `parcela_id` and/or `productor_id` + `organization_id`

## Module Scope Declarations

| Module | Primary Scope | Required FKs | Drilldown Path |
|---|---|---|---|
| core_actors | ACTOR | organization_id | Org → Actor list → Actor detail |
| core_plots | ASSET | organization_id, productor_id | Actor → Parcela list → Parcela detail |
| core_deliveries | EVENT | organization_id, productor_id | Actor → Entregas list |
| eudr | ASSET + LOT | organization_id, parcela_id, lote_id | Org EUDR → Lote → Parcelas |
| vital_clima | ACTOR + ASSET | organization_id, productor_id | Org → Actor VITAL → Parcela scores |
| nova_guard | ORG + ACTOR + ASSET | organization_id, entidad_tipo, entidad_id | Org alerts → Actor alerts → Parcela alerts |
| credits | ACTOR | organization_id, productor_id | Org summary → Actor créditos |
| quality_cupping | LOT + ACTOR | organization_id, lote_id, productor_id | Org quality → Lote → Actor origen |
| finance | ORG | organization_id | Org → Transacciones |
| exporter_trade | ORG + LOT | organization_id, lote_id | Org → Lotes comerciales → Contratos |

## Query Rules

1. **ALWAYS** filter by `organization_id` first
2. If in Actor detail view, add `.eq('productor_id', actorId)`
3. If in Parcel detail view, add `.eq('parcela_id', parcelId)`
4. Use `src/lib/keys.ts` constants: `ORG_KEY`, `ACTOR_KEY`, `ASSET_KEY`
5. Use `applyScopeFilter(query, { organizationId, actorId?, assetId? })`

## Centralized Keys

```typescript
// src/lib/keys.ts
export const ORG_KEY = 'organization_id';
export const ACTOR_KEY = 'productor_id';    // legacy DB name
export const ASSET_KEY = 'parcela_id';
export const LOT_KEY = 'lote_id';
```

## Drilldown Routes (Target)

```
/org/actors                         → Actor list (org scope)
/org/actors/:actorId                → Actor detail
/org/actors/:actorId/plots          → Actor's parcelas
/org/actors/:actorId/deliveries     → Actor's entregas
/org/plots/:plotId                  → Parcel detail
/org/plots/:plotId/documents        → Parcel documents
/org/deliveries                     → All deliveries (org scope)
/org/eudr                           → EUDR packages (org scope)
/org/alerts                         → Alerts (org scope)
```

Currently routes use role-prefixed paths (`/cooperativa/productores-hub`).
The above `/org/*` routes are the target; wrappers handle the mapping.

## Cross-Module Intersections

### Actor Detail shows:
- Parcelas (core_plots)
- Entregas (core_deliveries)
- Créditos (credits) — if module active
- VITAL score (vital_clima) — if module active
- Alertas (nova_guard) — if module active
- EUDR status (eudr) — if module active

### Parcel Detail shows:
- Documentos legales
- Evidencias EUDR — if module active
- VITAL ficha — if module active
- Alertas — if module active

### Org Dashboard shows:
- Aggregated KPIs from all active modules
- Recent alerts (nova_guard)
- VITAL semáforo (vital_clima)
- EUDR compliance % (eudr)
- Credit portfolio (credits)

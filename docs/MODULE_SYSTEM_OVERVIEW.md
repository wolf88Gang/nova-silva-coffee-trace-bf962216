# Module System Overview

## Architecture

The module system is a **single registry** (`src/modules/registry.ts`) that controls what each user sees and can do. No per-orgTipo forks in code.

### Key Files
| File | Purpose |
|---|---|
| `src/modules/registry.ts` | Module definitions (routes, permissions, flags) |
| `src/modules/useActiveModules.ts` | Hook: resolves active modules for current user |
| `src/modules/dashboardWidgets.ts` | Widget definitions per module |
| `src/config/featureFlags.ts` | Feature flags consumed by registry |
| `src/lib/org-modules.ts` | Legacy module resolver (still used by Sidebar) |

### Resolution Flow
```
User logs in → AuthContext loads profile + org
  → useOrgContext() exposes orgTipo, role, activeModules
  → useActiveModules() filters MODULE_REGISTRY by:
      1. orgTipo match
      2. role match
      3. feature flags
      4. dependencies
  → Returns: activeModules[], navItems[], canAccess(), getPermission()
```

## Module × OrgTipo Matrix

| Module | cooperativa | exportador | beneficio_privado | productor | productor_empresarial | certificadora | aggregator |
|---|---|---|---|---|---|---|---|
| core | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| core_actors | ✅ | ✅ | ✅ | — | ✅ | — | ✅ |
| core_plots | ✅ | ✅ | ✅ | ✅ | ✅ | — | — |
| core_deliveries | ✅ | ✅ | ✅ | — | ✅ | — | ✅ |
| eudr | ✅ | ✅ | ✅ | — | — | — | ✅ |
| vital_clima | ✅ | — | ✅ | ✅ | ✅ | ✅ | — |
| nova_guard | ✅ | — | ✅ | ✅ | ✅ | — | — |
| credits | ✅ | — | — | — | — | — | — |
| labor_jornales | ✅ | — | ✅ | — | ✅ | — | — |
| inventory | ✅ | — | ✅ | — | ✅ | — | — |
| finance | ✅ | ✅ | ✅ | — | ✅ | — | — |
| quality_cupping | ✅ | ✅ | ✅ | — | — | — | — |
| exporter_trade | — | ✅ | — | — | — | — | ✅ |
| governance | ✅ | — | — | — | — | — | — |
| platform_admin | (admin only) | | | | | | |

## Role × Permission Matrix (per resource)

| Resource | cooperativa | exportador | productor | tecnico | certificadora | admin |
|---|---|---|---|---|---|---|
| productores | write | write | read | read | read | admin |
| parcelas | write | write | read | write | read | admin |
| entregas | write | write | read | none | read | admin |
| creditos | write | none | read | none | none | admin |
| cataciones | write | write | read | none | read | admin |
| lotes_comerciales | none | write | none | none | none | admin |
| alertas | write | none | read | write | none | admin |

## Module Intersections (Data Flows)

### Nova Guard → VITAL
- Nova Guard generates alerts → can trigger VITAL plan_acciones
- Alert resolution may update clima_scores

### VITAL → Dashboard
- Produces scores and semáforo indicators
- Feeds KPI widgets and actor health status

### Credits → Entregas + EUDR
- Credit risk uses delivery history + EUDR compliance
- Active credits shown in actor profile

### EUDR → Parcelas + Documentos
- Requires geo-data from parcelas
- Requires legal docs from documentos
- Generates paquetes_eudr for export

### Quality (cataciones) → Lotes
- Linked via lote_id
- Also linked to actor (productor_id) for traceability

### Labor/Jornales
- Applies to orgs with own agricultural operations
- cooperativa (cuadrillas) and productor_empresarial

### Inventario/Finanzas
- Typically cooperativa or beneficio_privado operations
- Input supplies, equipment tracking

## Feature Flags

| Flag | Default | Controls |
|---|---|---|
| `ORG_ID_ONLY` | true | All queries use organization_id only |
| `ENABLE_CREDITS` | true | Credits module visibility |
| `ENABLE_NOVA_GUARD` | false | Nova Guard alerts (not yet implemented) |
| `ENABLE_VITAL` | true | Protocolo VITAL module |
| `ENABLE_QUALITY` | true | Nova Cup / cataciones |
| `ENABLE_EXPORTER_MODULE` | true | Exporter trade features |
| `ENABLE_EVIDENCE_BLOCKCHAIN` | false | Blockchain evidence (future) |

## Incremental Strategy

1. **Phase 1** (done): Modules resolved from org record + legacy booleans
2. **Phase 2** (done): ORG_ID_ONLY, org-centric model
3. **Phase 3** (current): Registry with fine-grained permissions
4. **Phase 4** (future): DB-stored module config per org, admin UI to toggle

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Registry drift from actual routes | Sidebar still uses legacy nav definitions; gradual migration |
| Permission bypass | RLS enforces server-side; registry is UI-only gating |
| Flag sprawl | Keep flags minimal; prefer orgTipo-based gating |
| Performance | Registry is static; resolution is O(n) with n < 20 modules |

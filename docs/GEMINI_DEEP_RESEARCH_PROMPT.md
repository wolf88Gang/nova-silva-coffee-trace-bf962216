# Gemini Deep Research Prompt — Domain Unification: Org + Actors

> **Instructions**: Copy everything below this line and paste into Gemini Deep Research.

---

## Contexto

Estoy construyendo **Nova Silva**, un SaaS ag-tech offline-first para trazabilidad, cumplimiento EUDR, riesgo climático/agronómico y operación de origen (cooperativas, beneficios privados, exportadores y productores empresariales). El sistema corre sobre **Supabase/Postgres**, con **RLS multi-tenant por `organization_id`**.

## Problema actual

En el producto hablamos de "cooperativas" como si fueran el cliente principal, y modelamos "productores" como entidades dentro de cooperativas. Sin embargo, hay clientes potenciales que:

- **No son cooperativas** (beneficios privados, empresas compradoras).
- Son **productores grandes** que compran a terceros y exportan directo, sin cooperativa.
- **Exportadores** que compran directo y pueden necesitar trazabilidad y EUDR.

Por esto necesito una arquitectura de dominio que no sea "coop-centric". Quiero un modelo unificado que trate al **cliente pagador como ORGANIZACIÓN (tenant)** y a "productores" como **ACTORES** (socios/proveedores/unidades productivas) vinculados a esa organización. También debo soportar el caso donde un **productor empresarial es una organización cliente (tenant)** y además tiene actores internos (fincas propias) y/o proveedores externos.

## Estado técnico actual (confirmado)

- Multi-tenant por `organization_id` ya funciona y fue probado con RLS real usando JWT (tests 24/24 PASS).
- Tablas core existentes: `productores`, `parcelas`, `entregas`, `documentos`, `lotes_acopio`, `lotes_comerciales`, `contratos`, `cooperativa_exportadores`, `profiles`, `user_roles`.
- `organization_id` existe en `profiles` y funciones helper:
  - `get_user_organization_id(uuid)`
  - `get_user_productor_id(uuid)` (lee `profiles.productor_id`)
  - `has_role(uuid, app_role)`
  - `is_admin(uuid)`
- RLS actual: por `organization_id` con helpers, cross-org bloqueado. Se mantiene legacy membership en algunas tablas pero el aislamiento base está correcto.
- Frontend: ya filtrado por `organization_id` con `ORG_ID_ONLY = true`. No hay fallback a `cooperativa_id`.
- **Module Registry**: sistema de módulos por `orgTipo` + `role` + feature flags controla visibilidad de nav, dashboard widgets, y permisos por recurso.
- **Data Scopes**: 3 niveles definidos (ORG → ACTOR → ASSET) con hooks centralizados (`useActorDetail`, `useActorAssets`, `useActorEvents`, etc.) y constantes de keys (`ORG_KEY`, `ACTOR_KEY`, `ASSET_KEY`).

## Modelo de datos (conceptual)

```
platform_organizations (tenant)
  ├── productores (actors)       → organization_id, user_id?
  │     ├── parcelas (assets)    → organization_id, productor_id
  │     └── entregas (events)    → organization_id, productor_id
  ├── documentos                  → organization_id, parcela_id?, productor_id?
  ├── lotes_acopio               → organization_id
  ├── lotes_comerciales          → organization_id
  ├── contratos                   → organization_id
  ├── paquetes_eudr              → organization_id
  └── creditos                    → organization_id, productor_id
```

- **Tenant**: `platform_organizations.id` (`organization_id` en todas las tablas).
- **Actor** (hoy "productor"): `productores.id`, pertenece a `organization_id`.
- **Asset**: `parcelas.id`, pertenece a actor (`productor_id`) y a org.
- **Event**: `entregas.id`, pertenece a actor y a org.
- **EUDR**: documentos/evidencias/paquetes_eudr se conectan con parcelas, lotes y org.
- **Exportador**: `lotes_comerciales`/`contratos`/`paquetes_eudr` como módulo, no como tenant separado (aunque exportador puede ser tenant si es cliente).

## Objetivo de producto

Quiero que "cooperativa" sea solo un **tipo de organización** (`orgTipo`), no un concepto estructural. El sistema debe servir igual para:

- **A) Cooperativa** (actores = socios)
- **B) Beneficio privado / comprador** (actores = proveedores)
- **C) Productor empresarial** (actores = fincas/unidades propias y opcionalmente proveedores)
- **D) Exportador** (módulo comercial + actores si compra directo)

## Necesito que propongas (con evidencia y referencias si es posible):

### 1. Alternativas de modelado

- **Opción 1**: Organización (tenant) + Actor (proveedor/socio) como tabla única; productor empresarial crea actor default. Relación 1:N org→actors.

- **Opción 2**: Organización + Actor polimórfico con tipos (`propio`/`externo`/`coop_member`) y relaciones `actor_org_link` (many-to-many) si un actor vende a varios compradores.

- **Opción 3**: Organización unificada, y "productor" como user profile (cuando aplica) + actor como entidad productiva, separando "persona" vs "finca/unidad".

### 2. Tradeoffs clave

- **Simplicidad vs flexibilidad** (smallholder vs multi-buyer).
- Riesgo de **duplicar actores** cuando un proveedor vende a varios compradores.
- Implicaciones de **trazabilidad y EUDR** (polígonos únicos por finca, evidencia, no duplicar).
- Implicaciones de **offline-first y sincronización** (IDs, merges, conflict resolution).
- **Performance y RLS en Postgres** (índices, policies aditivas, minimización de OR).

### 3. Estrategia de transición por fases (sin romper producción)

- **Fase 0** (DONE): Cambiar lenguaje UI a org/actors sin renombrar tablas.
- **Fase 1** (DONE): Garantizar `organization_id` everywhere + triggers dual-write + RLS org-first.
- **Fase 2** (DONE): `ORG_ID_ONLY` frontend + constraints `NOT NULL`/FK.
- **Fase 3** (DONE): Module registry + data scope system.
- **Fase 4** (NEXT): Opcional renombre DB + views compatibilidad (`productores` → `actors`).
- **Fase 5** (FUTURE): Opcional `actor_org_link` para escenarios multi-buyer.

### 4. Implicaciones comerciales y UX

- Cómo venderlo sin hablar de "cooperativas".
- Cómo presentar el producto a un productor empresarial y a un beneficio privado sin crear flujos separados.
- Qué **métricas/KPIs cambian** (Socios vs Proveedores, Compras vs Entregas, etc).
- Cómo manejar el **onboarding** para que cada tipo de org configure sus módulos relevantes.

### 5. Riesgos y mitigaciones

- **Data duplication**: actor vendiendo a múltiples organizaciones.
- **Auditoría EUDR**: garantizar que evidencia de deforestación y polígonos no se fragmenten.
- **Roles**: productor como usuario logueado vs productor como actor (entity vs identity).
- **Edge cases**: cooperativa que también exporta directo; exportador con estaciones de compra; actor que cambia de organización.
- **Regulatory**: EUDR requiere "operator" vs "trader" — ¿cómo se refleja en el modelo?

### 6. Restricciones reales

- Estoy **time y capital constrained**. No puedo reescribir todo.
- Necesito un **plan incremental** con máximo reuse del stack actual (Supabase, Postgres RLS, React frontend).
- Debe ser **defendible ante clientes e inversionistas**, sin vender humo.
- El sistema ya está en uso con datos reales de cooperativas.

## Entregable que necesito de tu análisis

1. **Recomendación principal** (una opción concreta) y por qué.
2. **Modelo ERD lógico** en texto (entidades y relaciones).
3. **Lista de decisiones irreversibles** y reversibles.
4. **Plan de implementación por fases** (qué tocar primero).
5. **Lista de preguntas abiertas** que debo responder con usuarios reales.

**Por favor incluye referencias a patrones existentes en:**
- Supply chain traceability (coffee/cocoa)
- EUDR/due diligence systems (EU Regulation 2023/1115)
- Multi-tenant SaaS con RLS
- Offline-first data sync patterns
- Domain-driven design para agricultural platforms

---

> **End of Gemini prompt**

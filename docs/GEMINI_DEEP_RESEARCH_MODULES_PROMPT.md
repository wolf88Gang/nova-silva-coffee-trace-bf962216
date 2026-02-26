# Gemini Deep Research Prompt — Módulos, Intersecciones y Arquitectura Estratégica

> **Instructions**: Copy everything below this line and paste into Gemini Deep Research.

---

## Contexto general

Estoy construyendo **Nova Silva**, un SaaS ag-tech offline-first para cooperativas, beneficios privados, exportadores y productores empresariales en América Latina. El sistema cubre:

- Trazabilidad y cumplimiento EUDR
- Diagnóstico organizacional (VITAL)
- Riesgo climático y agronómico
- Estimación de cosecha (Nova Yield)
- Alertas tempranas (Nova Guard)
- Créditos y diligencia debida digital (DDD)
- Gestión de jornales
- Evidencia digital y blockchain anchor
- Calidad (cataciones)
- Inventarios e insumos
- Finanzas operativas

El sistema corre en **Supabase/Postgres con RLS multi-tenant por `organization_id`**.

He migrado conceptualmente el sistema de "cooperativa + productores" a **"Organización (tenant) + Actores (socios/proveedores/unidades productivas)"**.

Necesito un análisis profundo sobre cómo estructurar la arquitectura modular bajo este nuevo modelo.

## Modelo actual simplificado

**Nivel ORG (tenant):**
- `platform_organizations`
- `organization_id` en todas las tablas

**Nivel ACTOR:**
- `productores` (tabla actual)
- `organization_id`
- `productor_id` (actor_id)

**Nivel ASSET:**
- `parcelas` (ligadas a actor)

**Nivel EVENTO:**
- `entregas`
- `documentos`
- `lotes`
- `evidencias`

**Nivel COMERCIAL:**
- `lotes_comerciales`
- `contratos`
- `paquetes_eudr`

**Nivel DIAGNÓSTICO:**
- vital scores
- alertas (Nova Guard)
- yield estimations
- credit scoring

## Módulos actuales y cómo se cruzan

Quiero que analices cómo deberían modelarse e integrarse los siguientes módulos bajo el modelo Organización + Actores:

### A) Nova Guard (alertas tempranas)

Puede dispararse por:
- Parcela específica
- Actor específico
- Organización completa

Alimenta:
- Dashboard
- VITAL
- Posible evaluación crediticia

**Riesgo**: multiplicar eventos y perder trazabilidad cruzada

### B) VITAL / Diagnóstico organizacional

Evalúa:
- Gobernanza organizacional
- Riesgo climático
- Prácticas agronómicas

Puede operar a nivel:
- ORG (estructura)
- ACTOR (capacidad individual)

Impacta:
- Créditos
- EUDR readiness
- Score comercial

### C) Créditos y DDD

Créditos pueden otorgarse a:
- Actor (productor)
- Organización (beneficio/cooperativa)

Inputs:
- Historial de entregas
- Cumplimiento EUDR
- Alertas Nova Guard
- Diagnóstico VITAL

**Riesgo**: mezclar scoring individual con scoring organizacional

### D) EUDR + Evidencia + Blockchain

- Polígonos por parcela
- Documentos por actor/parcela
- Paquetes por lote
- Exportador puede consumir paquete sin ser el tenant original

**Riesgo**: duplicación de evidencia si actor vende a múltiples organizaciones

### E) Nova Yield (estimación de cosecha)

- Basado en conteo por árbol/parcela
- Output a nivel parcela/actor

Puede alimentar:
- Planificación logística
- Crédito
- Alertas de sobreestimación

### F) Calidad / Catación

Vinculada a:
- Lote comercial
- Actor origen

Impacta:
- Precio
- Score comercial
- Crédito

### G) Jornales / Labor

Relevante para:
- Productor empresarial
- Cooperativa con operación agrícola
- No siempre relevante para beneficio privado comprador

## Preguntas estratégicas que necesito responder

1. ¿Qué módulos deben ser **ORG-scoped** vs **ACTOR-scoped**?

2. ¿Debe existir un **"score maestro"** que combine:
   - VITAL
   - Yield
   - Alertas
   - Calidad
   - Crédito?

3. ¿Cómo evitar inconsistencias cuando:
   - Un actor vende a múltiples organizaciones?
   - Un exportador compra directo y necesita EUDR?

4. ¿Cómo diseñar módulos **desacoplados pero interoperables**?

5. ¿Qué arquitectura modular recomiendas:
   - Monolito modular
   - Micro-modules por dominio
   - Event-driven con tablas de eventos?

6. ¿Qué implicaciones tiene esto para:
   - RLS
   - Índices
   - Performance
   - Offline-first sync?

## Entregable que necesito

Quiero que tu respuesta incluya:

1. **Mapa conceptual modular** (en texto estructurado).
2. **Propuesta de arquitectura modular** clara.
3. **Clasificación por nivel** (ORG / ACTOR / ASSET / EVENTO).
4. **Propuesta de "data contract"** entre módulos.
5. **Identificación de riesgos** de complejidad técnica.
6. **Recomendación de qué simplificar primero**.
7. **Propuesta de roadmap 12–18 meses** modular.

## Restricciones reales

- Bootstrapped.
- Stack actual no se puede reescribir.
- Multi-tenant ya funciona.
- Debe servir para cooperativas y empresas privadas.
- Debe ser defendible frente a exportadores e inversionistas.

**Incluye referencias a:**
- Traceability systems (coffee/cocoa)
- EUDR implementation architectures (EU Regulation 2023/1115)
- Risk scoring modular systems
- Multi-tenant RLS best practices
- Offline-first data sync patterns

---

> **End of Gemini prompt**

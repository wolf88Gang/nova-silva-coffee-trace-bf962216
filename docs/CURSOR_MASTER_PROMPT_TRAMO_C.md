# CURSOR MASTER PROMPT — TRAMO C: Edge Functions Nutrición Avanzada + Heatmaps

> **Propósito**: Guía para Cursor AI para implementar las Edge Functions y lógica backend del módulo Nutrición v2 + Heatmaps.
> **Fecha**: 2026-03-08
> **Prerequisito**: Migraciones del `SUPABASE_AI_PROMPT_TRAMO_C.md` ejecutadas.

---

## ARQUITECTURA DE SERVICIOS

El backend se divide en funciones modulares, NO un monolito:

```
supabase/functions/
├── generate_nutrition_plan_v1/    ← PRINCIPAL
│   ├── index.ts                   ← Orquestador
│   ├── types.ts
│   ├── validators.ts
│   ├── loaders.ts                 ← load_plot_context, load_soil_context, load_yield_context
│   ├── soil.ts                    ← interpret_soil_analysis (inline)
│   ├── yield.ts                   ← load_yield_context, blend sources
│   ├── guard.ts                   ← load_guard_context (disease pressure)
│   ├── vital.ts                   ← load_vital_context (resilience)
│   ├── demand.ts                  ← calculate_nutrient_demand (Liebig)
│   ├── balance.ts                 ← calculate_balance_and_deficits
│   ├── products.ts                ← convert_to_products
│   ├── calendar.ts                ← build_schedule
│   ├── economics.ts               ← calculate_economic_outputs
│   ├── explain.ts                 ← build_explain_steps
│   ├── hash.ts                    ← idempotency key + SHA256
│   ├── persist.ts                 ← save plan + children tables
│   ├── constants.ts
│   └── tests/
├── interpret_soil_analysis_v1/    ← Independiente/reutilizable
│   └── index.ts
├── approve_nutrition_plan_v1/
│   └── index.ts
├── create_nutrition_tasks_v1/
│   └── index.ts
├── register_nutrition_execution_v1/
│   └── index.ts
├── evaluate_nutrition_outcome_v1/
│   └── index.ts
├── simulate_nutrition_scenario_v1/  ← Fase 2
│   └── index.ts
└── generate_soil_heatmap_v1/        ← Fase 2
    └── index.ts
```

---

## PRIORIDAD DE IMPLEMENTACIÓN

| Orden | Función | Estado |
|-------|---------|--------|
| 1 | `interpret_soil_analysis_v1` | 🔨 Crear |
| 2 | `generate_nutrition_plan_v1` | 🔨 Crear (orquestador 17 pasos) |
| 3 | `approve_nutrition_plan_v1` | 🔨 Crear |
| 4 | `create_nutrition_tasks_v1` | 🔨 Crear |
| 5 | `register_nutrition_execution_v1` | 🔨 Crear (reemplaza log_nutrition_execution_v1) |
| 6 | `evaluate_nutrition_outcome_v1` | 🔨 Crear |
| 7 | `simulate_nutrition_scenario_v1` | 🔨 Fase 2 |
| 8 | `generate_soil_heatmap_v1` | 🔨 Fase 2 |

Las primeras 5 ya dan un módulo funcional serio.

---

## 1. interpret_soil_analysis_v1

### Input
```json
{
  "org_id": "uuid",
  "plot_id": "uuid",
  "soil_analysis_id": "uuid",
  "ruleset_id": "uuid"
}
```

### Pipeline
1. Validar identidad (org, plot ownership)
2. Cargar análisis de `ag_soil_analyses`
3. Normalizar resultados (unidades, métodos)
4. Clasificar pH: `strongly_acidic` | `acidic_high` | `acidic_moderate` | `neutral` | `alkaline`
5. Clasificar CEC y saturación de Al
6. Clasificar cada nutriente contra `ag_ruleset_sufficiency_thresholds`
7. Identificar alertas estructurales (toxicidad Al, pH < 5.0)
8. Construir `soil_context` completo

### Output
```json
{
  "success": true,
  "soil_context": {
    "mode": "lab",
    "confidence_score": 0.88,
    "ph_class": "acidic_high",
    "ph_value": 4.8,
    "organic_matter_pct": 5.2,
    "cec_cmol_kg": 12.4,
    "al_saturation_pct": 18,
    "structural_flags": ["moderate_aluminum_constraint"],
    "nutrient_statuses": {
      "N": "medium", "P": "low", "K": "low",
      "Ca": "medium_low", "Mg": "medium", "S": "medium"
    },
    "liming_recommendation_kg_ha": 450,
    "ifbs_score": 0.62
  }
}
```

### Lógica clave
- **Kamprath** para encalado: `lime_kg_ha = Al_cmol * 1.5 * 1000` (ajustado por textura)
- **IFBS** (Índice de Fertilidad Biológica del Suelo): combina MO, pH, CEC, actividad microbiana
- **Bloqueo**: Si pH < 5.0 Y Al > 0.3 meq → flag `critical_aluminum_toxicity`

---

## 2. generate_nutrition_plan_v1 — Pipeline de 17 pasos

### Contrato de entrada

```json
{
  "schema_version": "1.0.0",
  "org_id": "uuid",
  "user_id": "uuid",
  "plot_id": "uuid",
  "ruleset_id": "uuid",
  "scenario": "expected",
  "yield_mode": "auto",
  "allow_heuristics": true,
  "soil_analysis_id": "uuid (optional)",
  "yield_estimate_id": "uuid (optional)",
  "override_inputs": {
    "coffee_price_per_kg": 2.85,
    "labor_cost_per_day": 24.0
  }
}
```

Campos mínimos requeridos: `org_id`, `user_id`, `plot_id`, `ruleset_id`, `scenario`, `yield_mode`, `allow_heuristics`.

### Validaciones iniciales (antes del pipeline)

**Identidad:**
- org_id existe
- user_id pertenece a org_id
- plot_id pertenece a org_id

**Integridad:**
- Lote activo, área positiva

**Consistencia:**
- Si soil_analysis_id → debe pertenecer al lote
- Si yield_estimate_id → debe pertenecer al lote
- scenario debe ser válido (`expected`|`conservative`|`optimistic`)

### Idempotencia (antes de calcular)

Construir `idempotency_key` con: `org_id + plot_id + ruleset_id + soil_analysis_id + yield_estimate_id + scenario + engine_version`. Buscar con `get_existing_nutrition_plan_by_idempotency()`. Si existe → devolver plan existente sin recalcular.

### Paso 1: `load_plot_context`
```sql
SELECT id, productor_id, nombre, area_hectareas, altitud, municipio, departamento, latitud, longitud
FROM parcelas WHERE id = $plot_id AND organization_id = $org_id
```
Congelar en `ag_plot_context_snapshots` con `snapshot_type = 'nutrition_plan_input'`.

### Paso 2: `load_or_resolve_soil_context`
- Si `soil_analysis_id` → usar ese de `ag_soil_analyses`
- Si no → buscar último válido de `v_latest_valid_soil_analysis`
- Si no hay y `allow_heuristics = true` → perfil heurístico (degradar `confidence_score`)
- Si no hay y `allow_heuristics = false` → ERROR `INSUFFICIENT_SOIL_DATA`

### Paso 3: `load_yield_context`
Combinar fuentes con pesos:
```json
{
  "mode": "blended",
  "expected_qq_ha": 28,
  "low_qq_ha": 23,
  "high_qq_ha": 32,
  "confidence_score": 0.71,
  "sources": { "nova_yield": 0.55, "historical": 0.30, "regional": 0.15 }
}
```

### Paso 4: `load_guard_context`
```json
{
  "rust_incidence_pct": 34,
  "broca_incidence_pct": 6,
  "defoliation_score": 0.22,
  "disease_pressure_index": 0.31,
  "flags": ["moderate_rust_pressure"]
}
```
Si no hay datos → dejar vacío, degradar confianza. NO inventar presión sanitaria.

### Paso 5: `load_vital_context`
```json
{
  "resilience_index": 0.58,
  "water_stress_risk_score": 0.61,
  "leaching_risk_score": 0.72,
  "soil_health_score": 0.63
}
```

### Paso 6: `build_agronomic_snapshot`
Consolidar pasos 1-5 en un solo objeto JSON. Este es el input del motor. NO hacer cálculos complejos antes de tener este snapshot cerrado.

### Paso 7: `calculate_nutrient_demand`
Fórmula por nutriente:
```
demand = base_extraction × yield_target × variety_factor × age_factor × density_factor × altitude_factor
```
Usar datos de `ag_crop_nutrient_extraction` y coeficientes de `ag_altitude_coefficients`, `ag_age_coefficients`.

Output por nutriente:
```json
{ "N": { "demand_kg_ha": 118.4, "trace": { "base_extraction": 45, "yield_target_t_ha": 1.8, "variety_factor": 1.02, "age_factor": 1.04, "density_factor": 1.00, "altitude_factor": 0.97 } } }
```

### Paso 8: `estimate_soil_supply`
NO usar valor crudo del laboratorio. Traducir a aporte esperado:
- P: ajustar por fijación según pH
- K: ajustar por CEC
- N: estimar desde MO (MO% × 20 × tasa mineralización)

### Paso 9: `estimate_organic_supply`
Fuentes: compost, cobertura, podas, pulpa. Si no hay datos → 0 (conservador). NO sobreestimar.

### Paso 10: `calculate_balance_and_deficits`
```
deficit = demand - soil_supply - organic_supply
```
Si déficit < 0 → recomendación = 0 (pero registrar en trace).

### Paso 11: `apply_efficiency_and_loss_factors`
Ajustar por: textura, pendiente, lluvia, lixiviación, pH, método de aplicación.
```
final_required = deficit / effective_efficiency × loss_factor
```
Usar datos de `ag_nutrient_efficiency`.

### Paso 12: `detect_limiting_nutrients`
Calcular `sufficiency_index`, `limitation_index`, `limitation_rank`. El limitante principal es el que más restringe yield (Ley de Liebig). NO decidir solo por "valor de suelo más bajo" — considerar impacto sobre yield.

### Paso 13: `apply_contextual_adjustments`
Ajustes por: roya, broca, defoliación, sequía, lixiviación, resiliencia. Cada ajuste debe quedar con trace explícito en `ag_nut_adjustments`.

### Paso 14: `apply_constraints`
- N máximo regional (ej. 200 kg/ha)
- Bloqueo de micronutrientes por baja evidencia en modo heurístico
- Límites de razonabilidad
- **Compliance Layer 4**: cruzar con `get_my_blocked_ingredients()` para ingredientes prohibidos

### Paso 15: `convert_to_products`
Modos: `pure_nutrient` | `generic_formula` | `commercial_product`. En v1: nutrientes + genéricos. Persistir en `ag_nut_plan_products`.

### Paso 16: `build_schedule`
Generar calendario de fraccionamientos con:
- `sequence_no`, `window_code`, `target_date`, `products_json`
- Estimación de jornales, sensibilidad climática
Debe quedar estructurado para crear tareas reales.

### Paso 17: `calculate_economic_outputs`
- Costo de insumos, jornales, logística
- Ingreso incremental esperado
- ROI, punto de equilibrio (breakeven yield)
Persistir en `ag_nut_plan_financial_snapshots`.

### Persist final
Guardar en paralelo:
1. Plan → `ag_nut_plans`
2. Nutrientes → `ag_nut_plan_nutrients`
3. Productos → `ag_nut_plan_products`
4. Schedule → `ag_nut_schedule`
5. Financiero → `ag_nut_plan_financial_snapshots`
6. Explain → `ag_nut_explain_steps`
7. Audit → `ag_nut_plan_audit_events` (evento `generated`)
8. Context snapshot → `ag_plot_context_snapshots`

---

## 3. approve_nutrition_plan_v1

### Input
```json
{ "plan_id": "uuid", "approved_by": "uuid", "notes": "text optional" }
```

### Pipeline
1. Validar plan existe y pertenece a org del usuario
2. Verificar estado es `generated` o `under_review`
3. Cambiar estado a `approved`, set `approved_by`, `approved_at`
4. Registrar `ag_nut_plan_audit_events` con tipo `approved`
5. Si hay plan anterior activo para la misma parcela → `mark_nutrition_plan_superseded()`

---

## 4. create_nutrition_tasks_v1

### Input
```json
{ "plan_id": "uuid" }
```

### Pipeline
1. Validar plan aprobado
2. Leer `ag_nut_schedule` del plan
3. Por cada fraccionamiento, crear tarea en sistema de jornales (si existe tabla de tareas)
4. Actualizar estado del plan a `scheduled`
5. Registrar audit event `scheduled`

---

## 5. register_nutrition_execution_v1

### Input
```json
{
  "schedule_id": "uuid",
  "plan_id": "uuid",
  "execution_date": "YYYY-MM-DD",
  "actual_products_json": {},
  "actual_quantity_total": 45.5,
  "labor_days_actual": 0.5,
  "weather_conditions": "soleado",
  "observations": "text",
  "evidence_files": ["path1", "path2"]
}
```

### Pipeline
1. Validar plan aprobado/scheduled/in_execution
2. Crear registro en `ag_nut_executions`
3. Si hay evidence_files → crear registros en `ag_nut_execution_evidence`
4. Actualizar estado del schedule_id a `completed`
5. Recalcular % de ejecución del plan
6. Si todos los schedules completados → plan estado `executed`
7. Registrar audit event

---

## 6. evaluate_nutrition_outcome_v1

### Input
```json
{ "plan_id": "uuid", "harvest_result_id": "uuid" }
```

### Pipeline
1. Cargar plan, ejecuciones, cosecha
2. Calcular `execution_completeness_score` (% de schedule completado)
3. Calcular `yield_error_pct` = (actual - expected) / expected
4. Calcular `agronomic_success_score` y `economic_success_score`
5. Asignar `outcome_label`: successful | partial_success | low_execution | overfertilized | underfed | inconclusive
6. Persistir en `ag_nut_outcomes`
7. Si score > threshold → insertar en `ag_nut_pattern_training_queue`

---

## CONTRATO DE ERRORES ESTÁNDAR

### Éxito
```json
{ "success": true, "data": { ... }, "engine_version": "1.0.0" }
```

### Error
```json
{
  "success": false,
  "error_code": "INVALID_PLOT_CONTEXT",
  "message": "El lote no tiene contexto suficiente.",
  "details": { "missing_fields": ["crop_id", "country_code"] }
}
```

### Códigos de error
| Código | Significado |
|--------|-------------|
| `INVALID_ORG` | org_id no existe |
| `UNAUTHORIZED_PLOT` | plot no pertenece a org |
| `INSUFFICIENT_SOIL_DATA` | Sin análisis y heurísticos deshabilitados |
| `PLAN_ALREADY_EXISTS` | Idempotency key duplicada (devolver plan existente) |
| `INVALID_PLAN_STATE` | Operación no permitida en estado actual |
| `BLOCKED_INGREDIENT` | Ingrediente prohibido por compliance |
| `REGIONAL_LIMIT_EXCEEDED` | Excede máximo regional de nutriente |

---

## REGLAS DE IMPLEMENTACIÓN

1. **Nunca** hacer todo en `index.ts` — modularizar por responsabilidad
2. **Siempre** congelar contexto en snapshot antes de calcular
3. **Siempre** verificar idempotency_key antes de crear plan
4. **Nunca** mutar planes aprobados — superseder
5. **Siempre** usar `supabaseAdmin` (service_role) para writes dentro de Edge Functions
6. **Siempre** validar que el usuario pertenece a la org (JWT → `get_user_organization_id`)
7. **Registrar** cada decisión del motor en `ag_nut_explain_steps`
8. **Compliance**: Antes de recomendar productos, cruzar con Layer 4 de agroquímicos
9. **Invocación desde frontend**: Usar `fetch()` con URL completa + headers manuales (NO `supabase.functions.invoke()`)

---

## FRONTEND (LOVABLE) — Componentes pendientes

### Tabs existentes que necesitan datos reales de Tramo C:
| Tab | Fuente de datos |
|-----|----------------|
| PlanesTab | `ag_nut_plans` + `ag_nut_plan_nutrients` + `ag_nut_plan_products` |
| EjecucionTab | `ag_nut_executions` + `ag_nut_execution_evidence` |
| HistorialTab | `ag_nut_plans` + `ag_nut_outcomes` |
| ProtocoloMuestreoTab | `ag_soil_sampling_protocol_logs` + `ag_soil_sample_points` |
| SoilHealthTab | `ag_soil_analyses` + `ag_heatmap_runs` + `ag_management_zones` |
| DemandaTab | Motor de demanda (Tramo A) — funcional |

### Componentes nuevos necesarios:
| Componente | Propósito |
|-----------|-----------|
| `NutrientBreakdownChart` | Recharts stacked bar: demanda vs suministro por nutriente |
| `ExplainStepsAccordion` | Accordion con pasos de decisión del motor |
| `PlanFinancialSummary` | Card con ROI, breakeven, costos |
| `PlanApprovalFlow` | UI para aprobar/rechazar plan con notas |
| `ScheduleTimeline` | Timeline visual de fraccionamientos |
| `ExecutionLogger` | Formulario para registrar ejecución + evidencias |
| `HeatmapViewer` | Visualización de grid_json como mapa de calor |
| `ManagementZonesPanel` | Lista de zonas con recomendaciones |
| `SoilSamplePointsMap` | Mapa de puntos de muestreo (Leaflet o similar) |
| `OutcomeSummaryCard` | Resumen de resultado de ciclo |

---

## BLOQUES PENDIENTES (páginas 51+)

Los siguientes bloques del documento original NO están cubiertos aquí y requieren lectura adicional:
- **BLOQUE 20**: Integración con Nova Yield, Nova Guard y VITAL
- **BLOQUE 21**: Arquitectura del módulo Heatmaps (detalle)
- **BLOQUE 22**: Frontend completo en Lovable
- **BLOQUE 23**: Arquitectura offline-first
- **BLOQUE 24**: Sistema de aprendizaje y captura de datos
- **BLOQUE 25**: Roadmap técnico de implementación

# CURSOR MASTER PROMPT — TRAMO C: Edge Functions Nutrición Avanzada + Heatmaps

> **Propósito**: Guía para Cursor AI para implementar las Edge Functions y lógica backend del módulo Nutrición v2 + Heatmaps.  
> **Fecha**: 2026-03-07  
> **Prerequisito**: Edge Function `generate_nutrition_plan_v2` y `log_nutrition_execution_v1` ya existen.

---

## ARQUITECTURA DE SERVICIOS

El backend se divide en funciones modulares, NO un monolito:

```
supabase/functions/
├── generate_nutrition_plan_v2/    ← YA EXISTE — EXTENDER
│   ├── index.ts
│   ├── types.ts
│   ├── validators.ts
│   ├── loaders.ts          ← load_plot_context, load_soil_context, load_yield_context
│   ├── soil.ts             ← interpret_soil_analysis (inline)
│   ├── yield.ts            ← load_yield_context, blend sources
│   ├── guard.ts            ← load_guard_context (disease pressure)
│   ├── vital.ts            ← load_vital_context (resilience)
│   ├── demand.ts           ← calculate_nutrient_demand (Liebig)
│   ├── balance.ts          ← calculate_balance_and_deficits
│   ├── products.ts         ← convert_to_products
│   ├── calendar.ts         ← build_schedule
│   ├── economics.ts        ← calculate_economic_outputs
│   ├── explain.ts          ← build_explain_steps
│   ├── hash.ts             ← idempotency key + SHA256
│   ├── persist.ts          ← save plan + children tables
│   └── constants.ts
├── interpret_soil_analysis_v1/    ← NUEVO
│   └── index.ts
├── approve_nutrition_plan_v1/     ← NUEVO
│   └── index.ts
├── create_nutrition_tasks_v1/     ← NUEVO
│   └── index.ts
├── log_nutrition_execution_v1/    ← YA EXISTE — EXTENDER
│   └── index.ts
├── evaluate_nutrition_outcome_v1/ ← NUEVO
│   └── index.ts
└── generate_soil_heatmap_v1/      ← NUEVO (fase 2)
    └── index.ts
```

---

## PRIORIDAD DE IMPLEMENTACIÓN

| Orden | Función | Estado |
|-------|---------|--------|
| 1 | `interpret_soil_analysis_v1` | 🔨 Crear nuevo |
| 2 | `generate_nutrition_plan_v2` — extender persist | 🔧 Modificar |
| 3 | `approve_nutrition_plan_v1` | 🔨 Crear nuevo |
| 4 | `create_nutrition_tasks_v1` | 🔨 Crear nuevo |
| 5 | `log_nutrition_execution_v1` — extender evidence | 🔧 Modificar |
| 6 | `evaluate_nutrition_outcome_v1` | 🔨 Crear nuevo |
| 7 | `generate_soil_heatmap_v1` | 🔨 Crear (fase 2) |

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
2. Cargar análisis de `nutricion_analisis_suelo`
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

## 2. generate_nutrition_plan_v2 — Pipeline completo (17 pasos)

### Paso 1: `load_plot_context`
```sql
SELECT plot_id, crop_code, variety_code, area_ha, altitude_m,
       slope_pct, plant_density_per_ha, age_years, country_code
FROM parcelas WHERE id = $plot_id AND organization_id = $org_id
```
Congelar en `ag_plot_context_snapshots` (o `nutricion_parcela_contexto`).

### Paso 2: `load_or_resolve_soil_context`
- Si `soil_analysis_id` → usar ese
- Si no → buscar último válido de `nutricion_analisis_suelo`
- Si no hay y `allow_heuristics = true` → perfil heurístico
- Si no hay y `allow_heuristics = false` → ERROR `INSUFFICIENT_SOIL_DATA`

### Paso 3: `load_yield_context`
Combinar fuentes con pesos:
```json
{
  "mode": "blended",
  "expected_qq_ha": 28,
  "sources": {
    "nova_yield": 0.55,
    "historical": 0.30,
    "regional": 0.15
  }
}
```

### Paso 4: `load_guard_context`
```sql
SELECT rust_severity, broca_severity, defoliation_pct
FROM disease_assessments
WHERE parcela_id = $plot_id ORDER BY created_at DESC LIMIT 1
```

### Paso 5: `load_vital_context`
```sql
SELECT resilience_index, water_stress_score, soil_health_score
FROM resilience_assessments
WHERE parcela_id = $plot_id ORDER BY created_at DESC LIMIT 1
```

### Paso 6: `build_agronomic_snapshot`
Consolidar pasos 1-5 en un solo objeto JSON. Este es el input del motor.

### Paso 7: `calculate_nutrient_demand`
Fórmula por nutriente:
```
demand = base_extraction × yield_target × variety_factor × age_factor × density_factor × altitude_factor
```
Usar datos de `ag_crop_nutrient_extraction` y coeficientes de `ag_altitude_coefficients`, `ag_age_coefficients`.

### Paso 8: `estimate_soil_supply`
NO usar valor crudo del lab. Traducir a aporte esperado considerando:
- P: ajustar por fijación según pH
- K: ajustar por CEC
- N: estimar desde materia orgánica (MO% × 20 × mineralización)

### Paso 9: `estimate_organic_supply`
Fuentes: compost, cobertura, podas, pulpa. Si no hay datos → 0 (conservador).

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
Calcular `sufficiency_index` y `limitation_rank`. El limitante principal es el que más restringe yield (Ley de Liebig).

### Paso 13: `apply_contextual_adjustments`
Ajustes por: roya, broca, defoliación, sequía, lixiviación, resiliencia.
Cada ajuste debe quedar con trace explícito en `ag_nut_adjustments`.

### Paso 14: `apply_constraints`
- N máximo regional (ej. 200 kg/ha)
- Bloqueo de micronutrientes por baja evidencia en modo heurístico
- Límites de razonabilidad
- **Compliance Layer 4**: cruzar con `get_my_blocked_ingredients()` para ingredientes prohibidos

### Paso 15: `convert_to_products`
Modos: `pure_nutrient` | `generic_formula` | `commercial_product`
Persistir en `ag_nut_plan_products`.

### Paso 16: `build_schedule`
Generar calendario de fraccionamientos con:
- `sequence_no`, `window_code`, `target_date`, `products_json`
- Estimación de jornales, sensibilidad climática

### Paso 17: `calculate_economic_outputs`
- Costo de insumos, jornales, logística
- Ingreso incremental esperado
- ROI, punto de equilibrio (breakeven yield)
Persistir en `ag_nut_plan_financial_snapshots`.

### Persist final
Guardar en paralelo:
1. Plan principal → `nutricion_planes` (actualizar con columnas extendidas)
2. Nutrientes → `ag_nut_plan_nutrients`
3. Productos → `ag_nut_plan_products`
4. Financiero → `ag_nut_plan_financial_snapshots`
5. Explain → `ag_nut_explain_steps`
6. Audit → `ag_nut_plan_audit_events` (evento `generated`)
7. Context snapshot → `nutricion_parcela_contexto`

---

## 3. approve_nutrition_plan_v1

### Input
```json
{
  "plan_id": "uuid",
  "approved_by": "uuid",
  "notes": "text optional"
}
```

### Pipeline
1. Validar plan existe y pertenece a org del usuario
2. Verificar estado es `generated` o `under_review`
3. Cambiar estado a `approved`
4. Registrar `ag_nut_plan_audit_events` con tipo `approved`
5. Si hay plan anterior activo para la misma parcela → marcar como `superseded`

---

## 4. create_nutrition_tasks_v1

### Input
```json
{
  "plan_id": "uuid"
}
```

### Pipeline
1. Validar plan aprobado
2. Leer `nutricion_fraccionamientos` del plan
3. Por cada fraccionamiento, crear tarea en sistema de jornales (si existe `field_tasks`)
4. Actualizar estado del plan a `scheduled`

---

## 5. evaluate_nutrition_outcome_v1

### Input
```json
{
  "plan_id": "uuid",
  "harvest_result_id": "uuid"
}
```

### Pipeline
1. Cargar plan, ejecuciones, cosecha
2. Calcular `execution_completeness_score` (% de schedule completado)
3. Calcular `yield_error_pct` = (actual - expected) / expected
4. Calcular `agronomic_success_score` y `economic_success_score`
5. Asignar `outcome_label`: successful | partial_success | low_execution | overfertilized | underfed | inconclusive
6. Persistir en `nutrition_outcomes`
7. Si score > threshold → insertar en `ag_nut_pattern_training_queue`
8. Registrar en `cycle_learning_log`

---

## CONTRATO DE ERRORES ESTÁNDAR

Todas las funciones devuelven:

### Éxito
```json
{
  "success": true,
  "data": { ... },
  "engine_version": "2.1.0"
}
```

### Error
```json
{
  "success": false,
  "error_code": "INVALID_PLOT_CONTEXT",
  "message": "El lote no tiene contexto suficiente.",
  "details": {
    "missing_fields": ["crop_id", "country_code"]
  }
}
```

### Códigos de error estándar
| Código | Significado |
|--------|-------------|
| `INVALID_ORG` | org_id no existe |
| `UNAUTHORIZED_PLOT` | plot no pertenece a org |
| `INSUFFICIENT_SOIL_DATA` | Sin análisis y heurísticos deshabilitados |
| `PLAN_ALREADY_EXISTS` | Idempotency key duplicada |
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

## FRONTEND (LOVABLE) — Bloques pendientes

### Tabs existentes que necesitan datos reales de Tramo C:
| Tab | Fuente de datos |
|-----|----------------|
| PlanesTab | `nutricion_planes` + `ag_nut_plan_nutrients` + `ag_nut_plan_products` |
| EjecucionTab | `nutricion_aplicaciones` + `ag_nut_execution_evidence` |
| HistorialTab | `nutricion_planes` + `nutrition_outcomes` |
| ProtocoloMuestreoTab | `ag_sampling_protocol_logs` + `ag_soil_sample_points` |
| SoilHealthTab | `nutricion_analisis_suelo` + `ag_heatmap_runs` + `ag_management_zones` |
| DemandaTab | Motor de demanda (Tramo A) — funcional |

### Componentes nuevos necesarios:
| Componente | Propósito |
|-----------|-----------|
| `NutrientBreakdownChart` | Recharts stacked bar de demanda vs suministro por nutriente |
| `ExplainStepsAccordion` | Accordion con pasos de decisión del motor |
| `PlanFinancialSummary` | Card con ROI, breakeven, costos |
| `HeatmapViewer` | Visualización de grid_json como mapa de calor |
| `ManagementZonesPanel` | Lista de zonas con recomendaciones |
| `SoilSamplePointsMap` | Mapa de puntos de muestreo (Leaflet o similar) |

---

## NOTAS DE RECONCILIACIÓN

- `nutricion_planes.estado` usa español (`generado`, `aprobado`, etc.) — los nuevos enums usan inglés
- Mantener compatibilidad: el frontend lee `estado` existente; nuevas funcionalidades usan `nutrition_plan_status` enum
- Las tablas hijas (`ag_nut_plan_nutrients`, etc.) referencian `nutricion_planes.id` como `plan_id`
- NO crear `ag_nut_plans` separada — extender `nutricion_planes` con columnas faltantes

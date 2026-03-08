# Orden de Implementación Correcto — Nutrición + Heatmaps

> Última actualización: 2026-03-08
> Fuente de verdad: Notion "Motor Nutricional Nova Silva Tramo A" + esquema canónico existente

---

## Estado actual del sistema

### Ya existe en Supabase (NO recrear)
- **Catálogos científicos**: `ag_nutrients`, `ag_crops`, `ag_crop_varieties`, `ag_crop_nutrient_extraction`, `ag_nutrient_efficiency`, `ag_fertilizers`, `ag_rulesets`, `ag_ruleset_versions`, `ag_ruleset_sufficiency_thresholds`, `ag_altitude_coefficients`, `ag_age_coefficients`, `ag_reglas_suelo`
- **Planes y ejecución**: `nutricion_planes` (con `idempotency_key`), `nutricion_aplicaciones`, `nutricion_fraccionamientos`, `nutricion_analisis_suelo`, `nutricion_analisis_foliar`, `nutricion_parcela_contexto`
- **Hijas/complementos (Tramo C)**: `ag_nut_plan_nutrients`, `ag_nut_plan_products`, `ag_nut_plan_financial_snapshots`, `ag_nut_explain_steps`, `ag_nut_executions`, `ag_nut_execution_evidence`, `ag_nut_adjustments`
- **Transaccionales**: `harvest_results`, `yield_estimates`, `nutrition_outcomes`, `nutrition_adjustments`, `plot_module_snapshot`, `disease_assessments`, `resilience_assessments`, `cycle_learning_log`
- **PostGIS/Heatmaps**: `ag_soil_sample_points`, `ag_heatmap_runs`, `ag_management_zones`
- **Helpers RLS**: `get_user_organization_id()`, `is_admin()`, `is_org_admin()`
- **Vista**: `v_nutricion_aplicaciones_min`

### Ya existe en frontend (Lovable)
- Motor determinístico: `nutritionDemandEngine.ts` (672 líneas, Liebig, 11 nutrientes, calendario, ROI)
- Motor de suelos: `soilIntelligenceEngine.ts` (489 líneas, Kamprath, IFBS, toxicidad)
- Motor inter-modular: `interModuleEngine.ts` (yield ajustado)
- Motor yield: `yieldEngine.ts` (126 líneas)
- Generador de plan: `GeneratePlanV2.tsx` (548 líneas, invoca Edge Function v2)
- 10 pestañas funcionales en `NutricionDashboard.tsx`

### Ya existe en Edge Functions
- `generate-nutrition-plan-v2` (con idempotencia SHA-256)
- `log_nutrition_execution_v1` (registro de aplicaciones con evidencia)

---

## Fase 1 — Núcleo funcional (Supabase → Cursor → Lovable)

### Objetivo
Cerrar el flujo mínimo: **análisis de suelo → plan → aprobación → tarea → ejecución**

### 1.1 Supabase (primero)

| Prioridad | Acción | Justificación |
|-----------|--------|---------------|
| P0 | Verificar columnas faltantes en `nutricion_planes`: `status` (enum completo), `superseded_by_plan_id`, `parent_plan_id`, `approved_at`, `approved_by` | Máquina de estados del plan |
| P0 | Crear vista `v_plan_status_summary` (plan + parcela + último estado) | Dashboard operativo |
| P0 | Crear RPC `approve_nutrition_plan(plan_id, user_id)` — SECURITY DEFINER | Transición atómica: status → approved, approved_at, approved_by |
| P0 | Crear RPC `supersede_nutrition_plan(old_plan_id, new_plan_id)` | Inmutabilidad: no borrar planes, solo reemplazar |
| P1 | Agregar `ag_nut_schedule` si no existe (calendario de aplicaciones ligado al plan) | Puente entre plan y ejecución |
| P1 | Crear RPC `get_plan_detail(plan_id)` — devuelve plan + nutrients + products + explain + schedule | Lectura unificada para frontend |
| P1 | Verificar que `ag_nut_plan_audit_events` exista (bitácora de transiciones) | Auditoría obligatoria |

### 1.2 Cursor (después de Supabase)

| Prioridad | Acción | Justificación |
|-----------|--------|---------------|
| P0 | Refactorizar `generate-nutrition-plan-v2` para persistir en tablas hijas (`ag_nut_plan_nutrients`, `ag_nut_plan_products`, `ag_nut_explain_steps`) en una transacción | Hoy persiste solo en `nutricion_planes.plan_json`; las tablas hijas quedan vacías |
| P0 | Agregar persistencia de `ag_nut_schedule` desde el calendario generado | Habilita flujo de ejecución estructurado |
| P0 | Implementar `approve-nutrition-plan` como Edge Function o usar la RPC directamente | Flujo de aprobación |
| P1 | Implementar `supersede-nutrition-plan` | Versionado de planes |
| P1 | Agregar registro en `ag_nut_plan_audit_events` en cada transición de estado | Trazabilidad |

### 1.3 Lovable (después de Cursor)

| Prioridad | Acción | Justificación |
|-----------|--------|---------------|
| P0 | Agregar badge de estado del plan en `PlanesTab` (generated → approved → scheduled → executed) | El usuario necesita ver la máquina de estados |
| P0 | Botón "Aprobar plan" en la vista de detalle del plan | Cierra flujo de aprobación |
| P1 | Vista de detalle del plan con las 8 secciones (resumen, diagnóstico, nutrientes, productos, calendario, economía, explain, historial) | Renderiza el contrato JSON ya existente |

### Dependencias Fase 1
```
Supabase (esquema + RPCs) → Cursor (Edge Functions) → Lovable (UI)
```

---

## Fase 2 — Operación y ejecución de campo

### 2.1 Supabase
- Verificar que `ag_nut_schedule` tenga columna `journal_task_id` (enlace a jornales)
- Crear RPC `get_pending_applications(org_id)` — aplicaciones pendientes por fecha
- Crear vista `v_execution_completeness` — % de plan ejecutado

### 2.2 Cursor
- Extender `log_nutrition_execution_v1` para actualizar `ag_nut_schedule.status` al registrar ejecución
- Crear Edge Function `schedule-to-labor-task` que genera tarea en módulo de jornales al aprobar plan

### 2.3 Lovable
- Panel de ejecución en `EjecucionTab` con lista de tareas pendientes del plan aprobado
- Formulario de registro de ejecución real (producto, cantidad, fecha, evidencia)
- Timeline cronológico del ciclo del plan

### Dependencias Fase 2
```
Fase 1 completa → Supabase (schedule/RPCs) → Cursor (execution logic) → Lovable (UI ejecución)
```

---

## Fase 3 — Integraciones con Yield, Guard y VITAL

### 3.1 Supabase
- Verificar que `plot_module_snapshot` tenga campos para yield, guard y vital
- Crear vista `v_parcela_contexto_integrado` (une parcela + último análisis + último snapshot + último plan)

### 3.2 Cursor
- Refactorizar `generate-nutrition-plan-v2` para consumir `plot_module_snapshot` y poblar `phytosanitary_context` y `vital_context` en el plan
- Implementar ajuste de yield por disease_factor y water_factor usando `interModuleEngine.ts` en backend

### 3.3 Lovable
- Mostrar señales de Guard y VITAL en la vista de detalle del plan
- Mostrar ajustes contextuales aplicados en el panel Explain

### Dependencias Fase 3
```
Fase 2 completa → Supabase (vistas integradas) → Cursor (consumo de snapshots) → Lovable (visualización)
```

---

## Fase 4 — Outcomes y retroalimentación

### 4.1 Supabase
- Verificar que `nutrition_outcomes` tenga campos: `execution_completeness_score`, `roi_actual`, `outcome_label`
- Crear RPC `evaluate_plan_outcome(plan_id, harvest_result_id)` — compara plan vs cosecha real

### 4.2 Cursor
- Crear Edge Function `evaluate-nutrition-outcome` que calcula yield_error, ROI real y clasifica outcome
- Persistir en `nutrition_outcomes` y marcar plan como `evaluated`

### 4.3 Lovable
- Panel de resultados en `HistorialTab` con comparación plan vs real
- Indicadores de éxito agronómico y económico

### Dependencias Fase 4
```
Fase 3 completa + harvest_results con datos reales → Cursor (evaluación) → Lovable (visualización)
```

---

## Fase 5 — Heatmaps y zonificación

### 5.1 Supabase
- Verificar extensión PostGIS habilitada
- Verificar tablas: `ag_soil_sample_points` (geometry), `ag_heatmap_runs`, `ag_management_zones`
- Crear RPC `get_heatmap_data(plot_id, nutrient_code)` — devuelve puntos + zonas

### 5.2 Cursor
- Crear Edge Function `generate-heatmap-v1`:
  - Recibe puntos de muestreo georreferenciados
  - Calcula interpolación (IDW o Kriging simplificado)
  - Genera zonas de manejo (3 niveles)
  - Persiste en `ag_heatmap_runs` y `ag_management_zones`

### 5.3 Lovable
- Visualización de mapa con capas de nutrientes (usando Mapbox/Leaflet)
- Selector de nutriente para capa
- Panel de zonas de manejo con recomendaciones diferenciadas

### Dependencias Fase 5
```
Fase 1 completa + PostGIS + datos georreferenciados → Cursor (interpolación) → Lovable (mapa)
```

---

## Fase 6 — Simulación y aprendizaje (NO implementar todavía)

### Qué NO debe hacerse todavía
- `retrain_nutrition_pattern_model` — requiere dataset real de outcomes
- `suggest_regional_recipe_matches` — requiere base de patrones
- `generate_heatmap_recommendation_v1` con ML — requiere validación de IDW primero
- `ag_nut_pattern_training_queue` — solo tiene sentido con >50 outcomes reales
- Blockchain anchoring — no hay volumen justificable
- Simulación "what-if" — el motor determinístico debe estabilizarse primero

### Prerrequisitos para Fase 6
- Mínimo 2 ciclos productivos con datos reales
- >50 planes ejecutados con outcomes evaluados
- Validación agronómica con técnicos en piloto

---

## Resumen de secuencia

```
Fase 1: Supabase → Cursor → Lovable  (núcleo: plan → aprobación)
Fase 2: Supabase → Cursor → Lovable  (operación: schedule → ejecución)
Fase 3: Supabase → Cursor → Lovable  (integración: Yield + Guard + VITAL)
Fase 4: Supabase → Cursor → Lovable  (outcomes: plan vs cosecha real)
Fase 5: Supabase → Cursor → Lovable  (heatmaps: zonificación espacial)
Fase 6: NO IMPLEMENTAR AÚN            (ML, simulación, blockchain)
```

---

## Regla de oro

**No avanzar a la siguiente fase sin que la anterior funcione end-to-end con datos reales o demo verificados.**

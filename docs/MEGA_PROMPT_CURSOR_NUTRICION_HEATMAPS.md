# Mega Prompt — Cursor — Nutrición + Heatmaps

> Pega este documento completo como contexto en Cursor antes de ejecutar tareas del módulo nutricional.
> Última actualización: 2026-03-08

---

## 1. Contexto del módulo

Eres un backend engineer trabajando en **Nova Silva**, una plataforma agronómica multi-tenant para café de especialidad. El módulo de **Nutrición** es el motor de decisiones más complejo del sistema. Calcula planes de fertilización basados en análisis de suelo, rendimiento objetivo, contexto del lote y reglas regionales.

El módulo interactúa con:
- **Nova Yield** — estimaciones de cosecha
- **Nova Guard** — presión fitosanitaria (roya, broca)
- **Protocolo VITAL** — resiliencia y riesgo hídrico
- **Jornales** — tareas de aplicación
- **Inventario** — disponibilidad de insumos
- **Finanzas** — costos y ROI
- **Cumplimiento** — restricciones de ingredientes activos

---

## 2. Principios no negociables

1. **Multi-tenant**: toda tabla transaccional lleva `organization_id uuid NOT NULL`. Catálogos globales (`ag_*` sin prefijo `nut`) NO llevan org_id.
2. **RLS activo**: usar helpers existentes `get_user_organization_id(auth.uid())`, `is_admin(auth.uid())`, `is_org_admin(auth.uid())`.
3. **Planes inmutables**: un plan generado NUNCA se edita destructivamente. Un nuevo cálculo crea un nuevo plan. Los ajustes técnicos crean registros en `ag_nut_adjustments`.
4. **Idempotencia**: usar SHA-256 del contrato de solicitud como `idempotency_key` en `nutricion_planes`. Si el mismo request ya generó un plan vigente, devolver el existente.
5. **Determinismo**: mismo input → mismo output → mismo hash. Sin randomización.
6. **Explicabilidad**: toda decisión importante del motor debe quedar en `ag_nut_explain_steps` y en `plan_json.explain`.
7. **Degradación controlada**: si faltan datos, degradar confianza y ajustar modo, no crashear.
8. **Backend-first**: todo cálculo agronómico crítico vive en Edge Functions, no en frontend.
9. **Sin hardcodes opacos**: todo coeficiente sale de tablas de catálogo o constantes versionadas.
10. **Transaccionalidad**: la persistencia de un plan (plan + nutrients + products + schedule + explain + audit) debe ser atómica.

---

## 3. Conexión a Supabase

```typescript
// SIEMPRE usar URL hardcodeada — NO variables de entorno para URL
const SUPABASE_URL = "https://qbwmsarqewxjuwgkdfmg.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Invocación de Edge Functions: SIEMPRE fetch manual, NUNCA supabase.functions.invoke()
const response = await fetch(`${SUPABASE_URL}/functions/v1/nombre-funcion`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
  },
  body: JSON.stringify(payload),
});
```

---

## 4. Estructura de carpetas y archivos

```
supabase/functions/
├── generate-nutrition-plan-v2/
│   ├── index.ts          ← Orquestador principal
│   ├── types.ts          ← Tipos compartidos
│   ├── validators.ts     ← Validación de request
│   ├── loaders.ts        ← Carga de contexto (plot, soil, yield, snapshots)
│   ├── demand.ts         ← Cálculo de demanda nutricional
│   ├── soil-supply.ts    ← Estimación de aporte del suelo
│   ├── efficiency.ts     ← Factores de eficiencia y pérdidas
│   ├── limiting.ts       ← Detección de nutriente limitante (Liebig)
│   ├── adjustments.ts    ← Ajustes contextuales (variedad, edad, sanidad, clima)
│   ├── constraints.ts    ← Restricciones ambientales y normativas
│   ├── products.ts       ← Conversión a fertilizantes
│   ├── calendar.ts       ← Fraccionamiento y calendario fenológico
│   ├── economics.ts      ← Costo, ROI, snapshot financiero
│   ├── explain.ts        ← Construcción de traza explicativa
│   ├── confidence.ts     ← Cálculo de confianza por componente
│   ├── hash.ts           ← Canonicalización + SHA-256
│   └── persist.ts        ← Persistencia transaccional
├── log-nutrition-execution-v1/
│   └── index.ts          ← Registro de aplicación real
├── approve-nutrition-plan/
│   └── index.ts          ← Transición de estado: approved
├── evaluate-nutrition-outcome/
│   └── index.ts          ← Comparación plan vs cosecha
├── generate-heatmap-v1/   ← FASE 5, NO CONSTRUIR AÚN
│   └── index.ts
```

---

## 5. Edge Functions a construir — Fase 1

### 5.1 `generate-nutrition-plan-v2` (REFACTORIZAR — ya existe)

**Objetivo**: Refactorizar para persistir en tablas hijas además de `nutricion_planes.plan_json`.

**Pipeline completo (17 pasos)**:

```
1.  validate_request()          → Validar JWT, org, plot, permisos
2.  check_idempotency()         → Buscar plan existente con mismo hash
3.  load_plot_context()         → Cargar parcela + variedad + ubicación
4.  load_soil_analysis()        → Último análisis válido o modo heurístico
5.  load_yield_context()        → Nova Yield, histórico o benchmark
6.  load_phyto_context()        → Snapshot de Nova Guard (roya, broca)
7.  load_vital_context()        → Snapshot de VITAL (resiliencia, estrés hídrico)
8.  load_ruleset()              → Reglas regionales activas
9.  build_agronomic_snapshot()  → Objeto unificado congelado
10. calculate_nutrient_demand() → Extracción × yield × coeficientes
11. estimate_soil_supply()      → Aporte del suelo interpretado
12. apply_efficiency_factors()  → Eficiencia de absorción + pérdidas
13. detect_limiting_nutrient()  → Ley de Liebig: índice de suficiencia
14. apply_constraints()         → Límites ambientales, certificaciones
15. convert_to_products()       → Traducción a fertilizantes comerciales
16. split_calendar()            → Fraccionamiento por fase fenológica
17. calculate_economics()       → Costo de insumos + labor + ROI
18. build_explain_trace()       → Traza explicativa estructurada
19. calculate_confidence()      → Score por componente + overall
20. build_canonical_json()      → JSON estable para hash
21. hash_plan()                 → SHA-256
22. persist_plan()              → Transacción: plan + nutrients + products + schedule + explain + audit
```

### 5.2 `approve-nutrition-plan` (NUEVA)

**Input**:
```json
{
  "plan_id": "uuid",
  "user_id": "uuid"
}
```

**Lógica**:
1. Verificar que el plan existe y pertenece a la org del usuario
2. Verificar que el estado actual es `generated` o `under_review`
3. Actualizar `nutricion_planes.status = 'approved'`, `approved_at = now()`, `approved_by = user_id`
4. Insertar evento en `ag_nut_plan_audit_events` con `event_type = 'approved'`
5. Devolver `{ success: true, plan_id, status: 'approved' }`

### 5.3 `evaluate-nutrition-outcome` (FASE 4, planificar pero no construir aún)

---

## 6. Contrato de entrada — `generate-nutrition-plan-v2`

```json
{
  "schema_version": "1.0.0",
  "org_id": "uuid",
  "plot_id": "uuid",
  "user_id": "uuid",
  "ruleset_id": "uuid | null",
  "scenario": "conservador | esperado | intensivo",
  "yield_mode": "auto | manual",
  "yield_manual_qq_ha": "number | null",
  "allow_heuristics": true,
  "soil_analysis_id": "uuid | null",
  "override_inputs": {
    "coffee_price_per_kg": "number | null",
    "labor_cost_per_day": "number | null"
  }
}
```

**Reglas**:
- `org_id` y `plot_id` son obligatorios
- Si `yield_mode = 'auto'`, el motor busca Nova Yield o histórico
- Si `soil_analysis_id` es null, busca el más reciente válido
- Si `ruleset_id` es null, busca el ruleset default activo para el país/cultivo del plot

---

## 7. Contrato de salida — `generate-nutrition-plan-v2`

### Respuesta HTTP resumida (siempre):
```json
{
  "success": true,
  "plan_id": "uuid",
  "cached": false,
  "hash_receta": "sha256...",
  "engine_version": "nutrition-engine-v2.0",
  "modo_calculo": "full_evidence | assisted | heuristic | restricted",
  "nivel_confianza": "alta | media | baja",
  "nutriente_limitante": {
    "code": "K",
    "nombre": "Potasio",
    "indice": 0.53,
    "impacto": "Limita llenado de fruto y rendimiento"
  },
  "warnings_count": 2,
  "schedule_count": 4
}
```

### `plan_json` completo (persistido en DB):
```json
{
  "schema_version": "1.0.0",
  "plan_id": "uuid",
  "engine_version": "nutrition-engine-v2.0",
  "ruleset_version": "CR_COFFEE_DEFAULT@1",
  "scenario": "esperado",
  "agronomic_snapshot": { ... },
  "diagnosis": {
    "primary_limiting_nutrient": "K",
    "secondary_limiting_nutrients": ["P", "Ca"],
    "soil_correction_priority": "high | medium | low | none",
    "nutrient_status_summary": { "N": "medium", "P": "low", ... }
  },
  "yield_plan": {
    "expected_qq_ha": 28.0,
    "low_qq_ha": 23.0,
    "high_qq_ha": 32.0
  },
  "nutrient_plan": {
    "nutrients": [
      {
        "nutrient_code": "N",
        "demand_kg_ha": 118.4,
        "soil_supply_kg_ha": 28.0,
        "organic_supply_kg_ha": 12.0,
        "effective_efficiency": 0.62,
        "final_recommended_kg_ha": 88.3,
        "sufficiency_index": 0.84,
        "limitation_rank": 3,
        "constraint_applied": false
      }
    ]
  },
  "product_plan": {
    "products": [
      {
        "product_name": "Urea 46-0-0",
        "quantity_kg_ha": 180.0,
        "quantity_total_kg": 315.0,
        "nutrient_contribution": { "N": 82.8 },
        "estimated_cost": 195.3
      }
    ]
  },
  "schedule_plan": {
    "applications": [
      {
        "sequence_no": 1,
        "window_code": "pre_flowering",
        "target_date": "2026-04-10",
        "products": [...],
        "labor_days_estimate": 1.5,
        "priority_score": 0.94
      }
    ]
  },
  "economic_plan": {
    "currency_code": "USD",
    "estimated_input_cost": 420.00,
    "estimated_labor_cost": 110.00,
    "estimated_total_cost": 560.00,
    "expected_roi": 1.41
  },
  "explain": {
    "summary": "Plan ajustado por K bajo y riesgo alto de lixiviación.",
    "decision_steps": [
      {
        "step_order": 1,
        "step_code": "soil_constraint_check",
        "decision": "Se priorizó corrección de suelo por pH 5.1",
        "severity": "high"
      }
    ]
  },
  "confidence": {
    "overall_score": 0.78,
    "soil_score": 0.88,
    "yield_score": 0.71,
    "economic_score": 0.58,
    "confidence_band": "high"
  },
  "warnings": [
    { "code": "SOIL_ANALYSIS_AGE_WARNING", "severity": "medium", "message": "..." }
  ]
}
```

---

## 8. Tablas que debe usar (ya existen)

### Catálogos (lectura, sin org_id)
| Tabla | Propósito |
|-------|-----------|
| `ag_nutrients` | Lista de nutrientes (N, P, K, Ca, Mg, S, B, Zn, Cu, Fe, Mn) |
| `ag_crops` | Catálogo de cultivos |
| `ag_crop_varieties` | Variedades con coeficiente nutricional |
| `ag_crop_nutrient_extraction` | Extracción kg/ton por nutriente |
| `ag_nutrient_efficiency` | Eficiencia de absorción por contexto |
| `ag_fertilizers` | Catálogo de fertilizantes comerciales |
| `ag_rulesets` | Reglas regionales versionadas |
| `ag_ruleset_sufficiency_thresholds` | Umbrales de suficiencia por nutriente |
| `ag_altitude_coefficients` | Coeficientes por rango altitudinal |
| `ag_age_coefficients` | Coeficientes por edad de plantación |
| `ag_reglas_suelo` | Reglas de interpretación edáfica |

### Transaccionales (con org_id)
| Tabla | Propósito |
|-------|-----------|
| `nutricion_planes` | Tabla principal de planes (con `idempotency_key`, `plan_json`) |
| `ag_nut_plan_nutrients` | Detalle por nutriente del plan |
| `ag_nut_plan_products` | Productos recomendados del plan |
| `ag_nut_plan_financial_snapshots` | Snapshot económico congelado |
| `ag_nut_explain_steps` | Pasos explicativos del razonamiento |
| `ag_nut_schedule` | Calendario de aplicaciones (si existe, verificar) |
| `ag_nut_executions` | Registro de ejecución real |
| `ag_nut_execution_evidence` | Evidencia de ejecución (fotos, facturas) |
| `ag_nut_adjustments` | Ajustes técnicos a planes |
| `nutricion_aplicaciones` | Registro legacy de aplicaciones |
| `nutricion_analisis_suelo` | Análisis de suelo |
| `nutricion_parcela_contexto` | Contexto de parcela para nutrición |

### Contexto de parcela y snapshots
| Tabla | Propósito |
|-------|-----------|
| `parcelas` | Tabla maestra de parcelas (usa `cooperativa_id`) |
| `productores` | Tabla maestra de productores |
| `plot_module_snapshot` | Snapshots inter-modulares (yield, guard, vital) |
| `harvest_results` | Cosecha real |
| `yield_estimates` | Estimaciones de Nova Yield |
| `disease_assessments` | Evaluaciones de Nova Guard |
| `resilience_assessments` | Evaluaciones de VITAL |

---

## 9. Reglas de persistencia transaccional

Al generar un plan, persistir todo en una sola transacción lógica:

```typescript
// Usar service_role client para transacción
const { data: plan, error: planErr } = await supabase
  .from('nutricion_planes')
  .insert({ ... })
  .select()
  .single();

if (planErr) throw planErr;

// Persistir hijas en paralelo
await Promise.all([
  supabase.from('ag_nut_plan_nutrients').insert(nutrientRows),
  supabase.from('ag_nut_plan_products').insert(productRows),
  supabase.from('ag_nut_explain_steps').insert(explainRows),
  supabase.from('ag_nut_plan_financial_snapshots').insert(financialSnapshot),
]);

// Si falla alguna hija, el plan queda huérfano — registrar warning
```

**Nota**: Supabase no soporta transacciones atómicas multi-tabla desde el cliente. Usar `service_role` y manejar errores con compensación (borrar plan si falla persistencia de hijas).

---

## 10. Reglas de versionado, explain, warnings, confidence y hash

### Versionado
- `engine_version`: string semver (ej: `nutrition-engine-v2.0`)
- `ruleset_version`: código + versión (ej: `CR_COFFEE_DEFAULT@1`)
- Ambos se persisten en `nutricion_planes` y en `plan_json`

### Explain
- Array de `decision_steps` ordenado por `step_order`
- Cada step tiene: `step_code`, `title`, `decision` (texto), `evidence` (array), `severity`
- Se persiste en `ag_nut_explain_steps` Y dentro de `plan_json.explain`

### Warnings
- Array de objetos con `code`, `severity` (low/medium/high/critical), `message`
- Códigos estandarizados: `MISSING_SOIL_ANALYSIS`, `LOW_SAMPLING_QUALITY`, `PH_CRITICAL`, `ALUMINUM_TOXICITY_RISK`, `EXECUTION_OVERDUE`, etc.
- Se persiste en `plan_json.warnings`

### Confidence
- Componentes: `soil_score`, `yield_score`, `context_score`, `economic_score`, `ruleset_score`
- Fórmula: `overall = 0.35*soil + 0.20*yield + 0.15*context + 0.10*ruleset + 0.10*execution + 0.10*economic`
- Bandas: very_high (0.85+), high (0.70+), medium (0.55+), low (0.35+), very_low (<0.35)
- Se persiste en `plan_json.confidence`

### Hash
1. Construir JSON canónico (llaves ordenadas, decimales normalizados)
2. Serializar con `JSON.stringify()` determinístico
3. SHA-256
4. Guardar en `nutricion_planes.hash_receta` y devolver al cliente

---

## 11. Reglas de integración con parcelas, organizaciones, profiles

### Parcelas
- Tabla: `parcelas` (legacy, usa `cooperativa_id`)
- Mapeo: `cooperativa_id` → `organization_id` via `map_coop_to_org()` o via joins con `platform_organizations`
- Campos relevantes: `nombre`, `area_ha`, `altitud_msnm`, `variedad`, `edad_anios`, `densidad_plantas_ha`

### Organizaciones
- Tabla: `platform_organizations`
- Helper: `get_user_organization_id(auth.uid())` — devuelve UUID
- Toda query transaccional DEBE filtrar por `organization_id`

### Profiles
- Tabla: `profiles` (ligada a `auth.users`)
- Usar `user.id` del JWT para identificar al usuario

### Yield (Nova Yield)
- Tabla: `yield_estimates` — buscar la más reciente por `parcela_id`
- Fallback: usar historial de `harvest_results` o benchmark regional

### Guard (Nova Guard)
- Tabla: `disease_assessments` — última evaluación por parcela
- Campos: `roya_pct`, `broca_pct`, `defoliacion_pct`

### VITAL
- Tabla: `resilience_assessments` — última evaluación por parcela
- Campos: scores de resiliencia y estrés hídrico

---

## 12. Errores estándar

```typescript
const ERRORS = {
  MISSING_AUTH: { status: 401, code: 'AUTH_REQUIRED', message: 'Missing or invalid Authorization header' },
  INVALID_TOKEN: { status: 401, code: 'INVALID_TOKEN', message: 'Invalid token' },
  MISSING_ORG: { status: 403, code: 'NO_ORG', message: 'User does not belong to any organization' },
  PLOT_NOT_FOUND: { status: 404, code: 'PLOT_NOT_FOUND', message: 'Plot not found or access denied' },
  PLOT_NOT_IN_ORG: { status: 403, code: 'PLOT_NOT_IN_ORG', message: 'Plot does not belong to user organization' },
  NO_RULESET: { status: 422, code: 'NO_RULESET', message: 'No active ruleset found for this region/crop' },
  PLAN_ALREADY_EXISTS: { status: 200, code: 'IDEMPOTENT_HIT', message: 'Plan already exists with this configuration' },
  PLAN_NOT_FOUND: { status: 404, code: 'PLAN_NOT_FOUND', message: 'Nutrition plan not found' },
  INVALID_TRANSITION: { status: 422, code: 'INVALID_TRANSITION', message: 'Invalid status transition' },
  PERSIST_FAILED: { status: 500, code: 'PERSIST_FAILED', message: 'Failed to persist plan data' },
} as const;
```

---

## 13. Qué NO debe hacer Cursor

1. **NO crear tablas**: las tablas las crea Supabase AI/migrations. Cursor solo lee y escribe datos.
2. **NO duplicar lógica de frontend**: el motor `nutritionDemandEngine.ts` de Lovable es una versión de referencia, no la fuente de verdad. La Edge Function es la autoridad.
3. **NO usar `supabase.functions.invoke()`**: siempre `fetch` manual con URL completa.
4. **NO usar variables de entorno para SUPABASE_URL**: siempre hardcode `https://qbwmsarqewxjuwgkdfmg.supabase.co`.
5. **NO crear tablas paralelas si ya existe equivalente** (ej: no crear `ag_soil_analyses` si ya existe `nutricion_analisis_suelo`).
6. **NO implementar ML, heatmaps ni simulación** en Fase 1-2.
7. **NO editar destructivamente un plan existente**: crear nuevo plan + marcar viejo como `superseded`.
8. **NO meter lógica agronómica compleja en triggers**: los triggers solo deben hacer operaciones simples (timestamps, status sync).
9. **NO asumir datos completos**: siempre manejar nulls con fallbacks documentados.
10. **NO generar UUIDs en el cliente**: usar `gen_random_uuid()` de PostgreSQL.
11. **NO concentrar todo en `index.ts`**: usar la estructura modular definida.
12. **NO usar console.log en producción**: usar formato estructurado para logs.

---

## 14. Checklist de validación post-implementación

- [ ] El motor produce el mismo hash con el mismo input
- [ ] Los planes se persisten en `nutricion_planes` + tablas hijas
- [ ] La idempotencia funciona (segundo request devuelve plan existente)
- [ ] Un plan con pH < 4.8 activa corrección de suelo como prioridad
- [ ] K bajo + yield alto → K identificado como limitante principal
- [ ] Sin análisis de suelo → modo heurístico + confianza baja
- [ ] Los explain_steps son legibles y trazables
- [ ] La aprobación cambia el estado y registra evento de auditoría
- [ ] No hay números mágicos sin referencia a tabla o constante

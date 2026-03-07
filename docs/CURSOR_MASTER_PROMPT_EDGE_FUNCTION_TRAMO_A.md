# Cursor Master Prompt — Edge Function: generate_nutrition_plan_v2

> **Para Cursor IA**: Copia este prompt completo antes de pedir la implementación.
> Última actualización: 2026-03-07

---

## Contexto del Proyecto

**Nova Silva** es una plataforma SaaS multi-tenant para cadenas de valor de café. El módulo de Nutrición implementa un motor determinístico que calcula planes nutricionales basados en análisis de suelo, contexto de parcela, variedades, clima y restricciones ambientales.

### Infraestructura existente

- **Supabase externo**: `https://qbwmsarqewxjuwgkdfmg.supabase.co`
- **Edge Functions existentes**: `log_nutrition_execution_v1`, `ensure-demo-user`
- **Tablas Fase 1**: `nutricion_parcela_contexto`, `nutricion_analisis_suelo`, `nutricion_planes`, `nutricion_fraccionamientos`, `nutricion_aplicaciones`, `nutricion_variedades`
- **Tablas Fase 2**: `nutricion_analisis_foliar`, `ag_plan_events`, `v_nutricion_aplicaciones_min`
- **Tablas Tramo A (nuevas)**: `ag_nutrients`, `ag_crop_nutrient_extraction`, `ag_nutrient_efficiency`, `ag_fertilizers`, `ag_rulesets`, `ag_altitude_coefficients`, `ag_age_coefficients`, `harvest_results`, `yield_estimates`, `nutrition_outcomes`, `nutrition_adjustments`
- **RPC existente**: `generar_plan_nutricional_v1` (SQL, básico)
- **Motor frontend**: `src/lib/nutritionDemandEngine.ts` (modelo matemático determinístico), `src/lib/soilIntelligenceEngine.ts` (diagnóstico edáfico)

### Funciones Helper SQL disponibles

```sql
get_user_organization_id(auth.uid()) → uuid
is_admin(auth.uid()) → boolean
is_org_admin(auth.uid()) → boolean
get_altitude_coefficient(_altitud integer) → numeric
get_age_coefficient(_edad integer) → numeric
calc_nutrient_demand(_nutrient_code text, _yield_ton numeric, _altitud integer, _edad integer) → numeric
calc_full_nutrient_demand(_yield_ton numeric, _altitud integer, _edad integer) → TABLE
```

---

## Objetivo

Crear la Edge Function `generate_nutrition_plan_v2` en `supabase/functions/generate_nutrition_plan_v2/index.ts` que implemente el motor nutricional completo del Tramo A.

---

## Arquitectura de Submotores

```
generate_nutrition_plan_v2
├── validateRequestContext()     -- Permisos, pertenencia org, idempotencia
├── loadPlotContext()            -- parcelas + nutricion_parcela_contexto
├── loadScientificRuleset()      -- ag_rulesets por región
├── buildAgronomicSnapshot()     -- Merge soil + foliar + plot data
├── estimateTargetYield()        -- yield_estimates o cálculo
├── calculateNutrientDemand()    -- ag_crop_nutrient_extraction × yield / efficiency
├── estimateSoilSupply()         -- nutricion_analisis_suelo
├── estimateOrganicSupply()      -- MO, cobertura, podas, compost
├── applyEfficiencyAndLossFactors()
├── detectLimitingNutrient()     -- Liebig's Law
├── applyContextualAdjustments() -- variedad, altitud, edad, densidad, estrés
├── applyEnvironmentalConstraints() -- ruleset limits
├── convertNutrientsToProducts() -- ag_fertilizers
├── splitApplicationsByCalendar() -- Fenología café
├── estimateEconomicOutputs()    -- Costo, ROI
├── buildExplainTrace()          -- Trazabilidad
├── buildCanonicalPlanJson()     -- JSON auditable
├── hashPlan()                   -- SHA-256 idempotencia
└── persistPlanAndSchedule()     -- INSERT nutricion_planes + fraccionamientos
```

---

## Contrato de Entrada (Request Body)

```typescript
interface NutritionPlanRequest {
  org_id: string;          // UUID, obligatorio
  plot_id: string;         // UUID, obligatorio
  ruleset_id?: string;     // UUID, opcional (auto-detect por región)
  yield_mode: 'auto' | 'manual';
  yield_manual_ton?: number;
  scenario: 'conservador' | 'esperado' | 'intensivo';
  allow_heuristics: boolean;
  user_id: string;         // UUID del usuario autenticado
  // Opcionales
  soil_analysis_id?: string;
  yield_estimate_id?: string;
  target_harvest_date?: string;
  override_inputs?: {
    coffee_price_per_kg?: number;
    labor_cost_per_day?: number;
  };
}
```

---

## Contrato de Salida (Response Body)

```typescript
interface NutritionPlanResponse {
  plan_id: string;
  cached: boolean;
  hash_receta: string;
  engine_version: string;
  modo_calculo: string;
  nivel_confianza: 'alta' | 'media' | 'baja';
  yield_target: { ton_ha: number; intervalo: number; fuente: string };
  data_quality: { completeness: string; missing: string[] };
  nutriente_limitante: { code: string; nombre: string; indice: number; impacto: string } | null;
  demanda: Record<string, {
    demanda_base: number;
    ajustes: { altitud: number; edad: number; variedad: number; estres: number };
    aporte_suelo: number;
    aporte_organico: number;
    eficiencia: number;
    dosis_final: number;
    indice_suficiencia: number;
  }>;
  fertilizantes: Array<{
    nombre: string;
    tipo: string;
    cantidad_kg_ha: number;
    cantidad_total: number;
    costo_usd: number | null;
  }>;
  cronograma: Array<{
    fase: string;
    numero_aplicacion: number;
    fecha_programada: string | null;
    nutrientes: Record<string, number>;
    tipo_aplicacion: string;
    mano_de_obra_jornales: number;
  }>;
  economia: {
    costo_fertilizantes_usd: number;
    costo_mano_obra_usd: number;
    costo_total_usd: number;
    roi_estimado: number | null;
  };
  restricciones_aplicadas: string[];
  flags: Array<{ code: string; severity: string; message: string }>;
  explain_trace: string[];
}
```

---

## Reglas de Implementación

1. **CORS obligatorio**: Incluir headers Access-Control para preflight.
2. **Auth manual**: Verificar JWT desde header `Authorization`. NO usar `verify_jwt = true`.
3. **Supabase client**: Crear con `createClient(url, serviceRoleKey)` para leer tablas con RLS bypass. Validar `org_id` del usuario manualmente.
4. **Idempotencia**: Calcular SHA-256 del request normalizado. Si existe un plan con el mismo hash en las últimas 24h, retornar el existente con `cached: true`.
5. **Tolerancia a datos incompletos**: Si falta análisis de suelo, usar heurísticas y marcar `allow_heuristics: true`. Reportar en `data_quality.missing`.
6. **Persist**: Insertar resultado en `nutricion_planes` con `plan_json` y en `nutricion_fraccionamientos` para cada aplicación del calendario.
7. **NO importar desde `src/`**: La Edge Function es independiente. Replicar la lógica matemática del `nutritionDemandEngine.ts` dentro de la función.
8. **Config.toml**: Agregar entry:
   ```toml
   [functions.generate-nutrition-plan-v2]
   verify_jwt = false
   ```

---

## Tablas de Lectura (SELECT)

| Tabla | Datos obtenidos |
|---|---|
| `parcelas` | area_hectareas, altitud, municipio |
| `nutricion_parcela_contexto` | variedad, edad, densidad, textura, pendiente, sombra |
| `nutricion_analisis_suelo` | pH, MO, P, K, Ca, Mg, S, CICE, Al |
| `nutricion_variedades` | coeficiente_nutricional, coeficiente_vigor |
| `ag_rulesets` | max_n_kg_ha, max_p_kg_ha, parametros |
| `ag_crop_nutrient_extraction` | extraccion por nutriente |
| `ag_nutrient_efficiency` | eficiencia de absorción |
| `ag_altitude_coefficients` | coeficiente por rango altitudinal |
| `ag_age_coefficients` | coeficiente por edad plantación |
| `ag_fertilizers` | catálogo de productos |
| `yield_estimates` | estimación más reciente |

## Tablas de Escritura (INSERT)

| Tabla | Datos escritos |
|---|---|
| `nutricion_planes` | Plan completo con plan_json |
| `nutricion_fraccionamientos` | Cada aplicación del calendario |

---

## Flujo de Ejecución Detallado

### 1. Validación
```typescript
// Verificar que org_id existe
// Verificar que plot_id pertenece a org_id
// Verificar que user_id tiene acceso (organizacion_usuarios)
// Verificar idempotencia (hash últimas 24h)
```

### 2. Carga de contexto
```typescript
// SELECT parcela + contexto nutricional
// SELECT último análisis de suelo (o null)
// SELECT yield estimate más reciente (o null)
// SELECT ruleset activo para la región
// SELECT coeficientes de catálogos
```

### 3. Motor de cálculo
```typescript
// Para cada nutriente (N, P, K, Ca, Mg, S):
//   demanda_base = extracción × yield_target
//   demanda_ajustada = base × coef_altitud × coef_edad × coef_variedad × coef_estres
//   dosis_neta = max(0, ajustada - aporte_suelo - aporte_organico) / eficiencia
//   dosis_con_perdidas = neta × factor_textura
//   dosis_final = min(dosis_con_perdidas, max_ruleset)
```

### 4. Nutriente limitante
```typescript
// indice_suficiencia = (aporte_suelo + organico) / demanda_ajustada
// El nutriente con menor índice es el limitante
```

### 5. Conversión a fertilizantes
```typescript
// Para cada nutriente principal, buscar producto óptimo en ag_fertilizers
// Calcular kg/ha necesarios del producto
```

### 6. Calendario
```typescript
// Dividir dosis anual en 4 aplicaciones fenológicas
// Calcular fecha estimada desde fecha_inicio o target_harvest_date
```

### 7. Persistencia
```typescript
// INSERT INTO nutricion_planes (organization_id, parcela_id, plan_json, hash_receta, ...)
// INSERT INTO nutricion_fraccionamientos (plan_id, numero_aplicacion, ...)
```

---

## Ejemplo de Invocación desde Frontend

```typescript
const SUPABASE_URL = 'https://qbwmsarqewxjuwgkdfmg.supabase.co';

const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-nutrition-plan-v2`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
    'apikey': SUPABASE_ANON_KEY,
  },
  body: JSON.stringify({
    org_id: organizationId,
    plot_id: selectedParcela,
    yield_mode: 'auto',
    scenario: 'esperado',
    allow_heuristics: true,
    user_id: session.user.id,
  }),
});
```

---

## Validación Post-Implementación

1. Invocar con parcela demo y verificar respuesta completa
2. Verificar que `nutricion_planes` tiene nuevo registro
3. Verificar idempotencia: segunda llamada idéntica retorna `cached: true`
4. Verificar con parcela sin análisis de suelo: `data_quality.missing` incluye 'soil_analysis'
5. Verificar restricciones ambientales: N no excede `max_n_kg_ha` del ruleset

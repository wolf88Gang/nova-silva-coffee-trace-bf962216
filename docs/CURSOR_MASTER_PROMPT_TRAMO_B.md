# Cursor Master Prompt — Tramo B: Integración Sistémica Inter-Modular

> **Para Cursor IA**: Copia este prompt completo antes de implementar cualquier componente del Tramo B.
> Última actualización: 2026-03-07

---

## Contexto del Proyecto

**Nova Silva** es una plataforma SaaS multi-tenant para cadenas de valor de café. El Tramo B implementa la integración profunda entre los cuatro motores principales: **Nova Yield**, **Nova Guard**, **Nutrición** y **Protocolo VITAL**. Cada dato agronómico debe circular entre módulos y alimentar múltiples decisiones.

### Infraestructura existente (Tramos anteriores)

- **Supabase externo**: `https://qbwmsarqewxjuwgkdfmg.supabase.co`
- **Frontend**: React + Vite + Tailwind + TypeScript
- **Hook central**: `useOrgContext()` → `organizationId`, `role`, `orgTipo`, `activeModules`
- **Motor nutricional**: `src/lib/nutritionDemandEngine.ts`, `src/lib/soilIntelligenceEngine.ts`
- **Edge Function v2**: `generate_nutrition_plan_v2` (Tramo A)
- **Tablas Tramo A**: `ag_nutrients`, `ag_crop_nutrient_extraction`, `ag_nutrient_efficiency`, `ag_fertilizers`, `ag_rulesets`, `ag_altitude_coefficients`, `ag_age_coefficients`, `harvest_results`, `yield_estimates`, `nutrition_outcomes`, `nutrition_adjustments`
- **Tablas Nutrición**: `nutricion_planes` (con `idempotency_key`), `nutricion_aplicaciones`, `nutricion_fraccionamientos`, `nutricion_analisis_suelo`, `nutricion_analisis_foliar`, `nutricion_parcela_contexto`
- **Constantes**: `src/lib/keys.ts` (ORG_KEY, ACTOR_KEY, ASSET_KEY, TABLE)

### Funciones Helper SQL

```sql
get_user_organization_id(auth.uid()) → uuid
is_admin(auth.uid()) → boolean
is_org_admin(auth.uid()) → boolean
calc_nutrient_demand(_nutrient_code, _yield_ton, _altitud, _edad) → numeric
calc_full_nutrient_demand(_yield_ton, _altitud, _edad) → TABLE
```

---

## Arquitectura Tramo B: Sistema Agronómico Iterativo

Los módulos NO son pipelines independientes. Operan en un **grafo de dependencias agronómicas**.

### Cuatro tipos de dependencias

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| **Estructural** | Un módulo no puede calcular sin otro | Nova Yield → Nutrición (yield necesario para demanda) |
| **De ajuste** | Un módulo modifica el resultado de otro | Nova Guard (roya severa) → reduce yield esperado |
| **De señal** | Modifica interpretación/advertencias, no cálculo base | VITAL (riesgo hídrico) → aumenta relevancia de K |
| **De aprendizaje** | Histórico ajusta modelos futuros | nutrición alta + yield bajo → factor limitante ≠ nutrición |

### Variables compartidas entre módulos

```typescript
interface InterModuleVariables {
  // Nova Yield
  yield_expected: number;       // qq/ha, valor medio
  yield_uncertainty: number;    // ± error en qq
  yield_potential: number;      // máximo bajo condiciones ideales
  yield_adjusted: number;       // después de aplicar todos los factores

  // Nova Guard
  disease_pressure_index: number;  // 0-1 (0=sin presión, 1=máxima)
  roya_incidence: number;          // 0-1
  broca_incidence: number;         // 0-1
  defoliation_level: number;       // 0-1
  stress_symptoms: number;         // 0-1
  disease_factor: number;          // factor multiplicativo (0.5-1.0)

  // Nutrición
  nutrient_limitation_score: number;  // 0-1 (min sufficiency ratio)
  nutrient_factor: number;            // factor multiplicativo

  // Protocolo VITAL
  resilience_index: number;        // 0-1
  soil_health_score: number;       // 0-1
  water_stress_index: number;      // 0-1
  water_factor: number;            // factor multiplicativo

  // Calculado
  productivity_gap: number;        // yield_expected - yield_real
}
```

### Fórmula central de yield ajustado

```
yield_adjusted = yield_estimated × nutrient_factor × disease_factor × water_factor
```

Cada factor debe estar en rango [0.5, 1.0] para evitar ajustes extremos.

---

## Tablas nuevas del Tramo B (creadas por Supabase AI)

### `plot_module_snapshot` — Snapshot inter-modular por parcela/ciclo

```sql
-- Almacena las variables compartidas para cada ciclo productivo
-- Es la tabla central de integración
id uuid PK
organization_id uuid NOT NULL
parcela_id uuid NOT NULL → parcelas(id)
ciclo text NOT NULL                    -- '2025-2026'
-- Nova Yield
yield_expected numeric
yield_uncertainty numeric
yield_potential numeric
yield_method text                      -- 'conteo_frutos' | 'historico' | 'manual'
yield_date date
-- Nova Guard
disease_pressure_index numeric         -- 0-1
roya_incidence numeric
broca_incidence numeric
defoliation_level numeric
disease_factor numeric                 -- 0.5-1.0
guard_assessment_date date
-- Nutrición
nutrient_limitation_score numeric      -- 0-1 (min sufficiency)
limiting_nutrient text                 -- 'K', 'N', etc.
nutrient_factor numeric                -- 0.5-1.0
-- VITAL
resilience_index numeric               -- 0-1
soil_health_score numeric
water_stress_index numeric
water_factor numeric                   -- 0.5-1.0
-- Calculados
yield_adjusted numeric                 -- yield × nutrient × disease × water
yield_real numeric                     -- cosecha real (post-ciclo)
productivity_gap numeric               -- expected - real
-- Meta
computed_at timestamptz DEFAULT now()
computed_by uuid                       -- user o 'system'
version integer DEFAULT 1
UNIQUE(organization_id, parcela_id, ciclo, version)
```

### `disease_assessments` — Evaluaciones fitosanitarias (Nova Guard)

```sql
id uuid PK
organization_id uuid NOT NULL
parcela_id uuid NOT NULL
ciclo text NOT NULL
evaluador_id uuid                      -- técnico
fecha_evaluacion date NOT NULL
roya_incidence numeric CHECK (0..1)
broca_incidence numeric CHECK (0..1)
defoliation_level numeric CHECK (0..1)
stress_symptoms numeric CHECK (0..1)
disease_pressure_index numeric         -- calculado: 0.4*roya + 0.3*broca + 0.2*defo + 0.1*stress
disease_factor numeric                 -- 1 - (pressure × sensitivity)
sensitivity numeric DEFAULT 0.6        -- parametrizable
notas text
created_at timestamptz
```

### `resilience_assessments` — Evaluaciones VITAL de resiliencia

```sql
id uuid PK
organization_id uuid NOT NULL
parcela_id uuid NOT NULL
ciclo text NOT NULL
evaluador_id uuid
fecha_evaluacion date NOT NULL
soil_health numeric CHECK (0..1)
organic_matter_score numeric CHECK (0..1)
biodiversity numeric CHECK (0..1)
water_management numeric CHECK (0..1)
erosion_control numeric CHECK (0..1)
shade_coverage numeric CHECK (0..1)
resilience_index numeric               -- ponderado
resilience_level text                  -- 'fragil' | 'baja' | 'moderada' | 'alta'
notas text
created_at timestamptz
```

### `cycle_learning_log` — Aprendizaje del sistema por ciclo

```sql
id uuid PK
organization_id uuid NOT NULL
parcela_id uuid NOT NULL
ciclo text NOT NULL
yield_expected numeric
yield_real numeric
plan_nutricional_id uuid → nutricion_planes(id)
nutrient_factor numeric
disease_factor numeric
water_factor numeric
yield_adjusted numeric
productivity_gap numeric
-- Aprendizaje inferido
inferred_limiting_factor text          -- 'nutricion' | 'sanidad' | 'hidrico' | 'manejo' | 'genetico'
confidence numeric                    -- 0-1
learning_notes text
created_at timestamptz
```

---

## Implementación Frontend

### 1. Motor de integración inter-modular

Crear `src/lib/interModuleEngine.ts`:

```typescript
/**
 * Motor de integración inter-modular.
 * Consume datos de Nova Yield, Nova Guard, Nutrición y VITAL
 * para producir un snapshot integrado por parcela/ciclo.
 */

export interface ModuleSnapshot {
  // Nova Yield
  yieldExpected: number;
  yieldUncertainty: number;
  yieldPotential: number;
  // Nova Guard
  diseasePressureIndex: number;
  diseaseFactor: number;
  // Nutrición
  nutrientLimitationScore: number;
  limitingNutrient: string | null;
  nutrientFactor: number;
  // VITAL
  resilienceIndex: number;
  waterStressIndex: number;
  waterFactor: number;
  // Resultado
  yieldAdjusted: number;
}

// Cálculo de disease_pressure_index
export function calcDiseasePressure(
  roya: number, broca: number, defoliation: number, stress: number
): number {
  return 0.4 * roya + 0.3 * broca + 0.2 * defoliation + 0.1 * stress;
}

// Conversión a factor productivo
export function calcDiseaseFactor(pressure: number, sensitivity = 0.6): number {
  return Math.max(0.5, 1 - pressure * sensitivity);
}

// Cálculo de resilience_index ponderado
export function calcResilienceIndex(components: {
  soilHealth: number;
  organicMatter: number;
  biodiversity: number;
  waterManagement: number;
  erosionControl: number;
}): number {
  return (
    0.25 * components.soilHealth +
    0.20 * components.organicMatter +
    0.20 * components.biodiversity +
    0.20 * components.waterManagement +
    0.15 * components.erosionControl
  );
}

// Nivel de resiliencia
export function getResilienceLevel(index: number): string {
  if (index < 0.3) return 'fragil';
  if (index < 0.5) return 'baja';
  if (index < 0.7) return 'moderada';
  return 'alta';
}

// Nivel de presión fitosanitaria
export function getDiseasePressureLevel(pressure: number): string {
  if (pressure < 0.15) return 'baja';
  if (pressure < 0.35) return 'moderada';
  if (pressure < 0.6) return 'alta';
  return 'severa';
}

// Fórmula central de yield ajustado
export function calcYieldAdjusted(
  yieldEstimated: number,
  nutrientFactor: number,
  diseaseFactor: number,
  waterFactor: number,
): number {
  const clamp = (v: number) => Math.max(0.5, Math.min(1.0, v));
  return yieldEstimated * clamp(nutrientFactor) * clamp(diseaseFactor) * clamp(waterFactor);
}

// Convergencia iterativa yield-nutrición
export function iterateYieldNutrition(
  yieldInitial: number,
  calcSufficiency: (yield_qq: number) => number, // returns min sufficiency ratio
  maxIterations = 5,
  threshold = 0.5, // qq
): { yieldFinal: number; iterations: number } {
  let yieldCurrent = yieldInitial;
  let iterations = 0;
  for (let i = 0; i < maxIterations; i++) {
    const sufficiency = calcSufficiency(yieldCurrent);
    const nutrientFactor = Math.max(0.5, Math.min(1.0, sufficiency));
    const yieldNew = yieldInitial * nutrientFactor;
    iterations = i + 1;
    if (Math.abs(yieldNew - yieldCurrent) < threshold) {
      yieldCurrent = yieldNew;
      break;
    }
    yieldCurrent = yieldNew;
  }
  return { yieldFinal: yieldCurrent, iterations };
}
```

### 2. Hook `useModuleSnapshot`

Crear `src/hooks/useModuleSnapshot.ts` para cargar/guardar snapshots:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from '@/hooks/useOrgContext';

export function useModuleSnapshot(parcelaId: string | null, ciclo: string) {
  const { organizationId } = useOrgContext();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['module-snapshot', organizationId, parcelaId, ciclo],
    enabled: !!organizationId && !!parcelaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plot_module_snapshot')
        .select('*')
        .eq('organization_id', organizationId!)
        .eq('parcela_id', parcelaId!)
        .eq('ciclo', ciclo)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const upsert = useMutation({
    mutationFn: async (snapshot: Record<string, unknown>) => {
      const { error } = await supabase
        .from('plot_module_snapshot')
        .upsert({
          organization_id: organizationId,
          parcela_id: parcelaId,
          ciclo,
          ...snapshot,
          computed_at: new Date().toISOString(),
        }, { onConflict: 'organization_id,parcela_id,ciclo,version' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-snapshot'] });
    },
  });

  return { snapshot: query.data, isLoading: query.isLoading, upsertSnapshot: upsert.mutate };
}
```

### 3. Componentes UI del Tramo B

#### `src/components/insights/ModuleIntegrationCard.tsx`
Tarjeta que muestra el snapshot inter-modular con:
- Yield estimado vs ajustado (barra visual)
- Factores de ajuste: nutrición, sanidad, hídrico (chips con color semafórico)
- Nutriente limitante (badge)
- Resiliencia (progreso con nivel)

#### `src/components/guard/DiseaseAssessmentForm.tsx`
Formulario para capturar evaluación fitosanitaria:
- Sliders para roya, broca, defoliación, estrés (0-100%)
- Cálculo automático de `disease_pressure_index` y `disease_factor`
- Muestra impacto estimado en yield

#### `src/components/vital/ResilienceAssessmentForm.tsx`
Formulario para evaluación VITAL de resiliencia:
- 5 componentes con sliders
- Cálculo automático de `resilience_index`
- Nivel de resiliencia con color

#### `src/components/insights/ProductivityGapChart.tsx`
Gráfico Recharts que muestra:
- Yield esperado vs real por ciclo
- Factores de ajuste apilados
- Tendencia del productivity_gap

#### `src/components/insights/InsightsPanel.tsx`
Panel "Nova Silva Insights" que responde preguntas estratégicas:
- "Qué limita la productividad de esta parcela"
- "Qué inversión tiene mayor retorno"
- "Qué lotes tienen mayor riesgo"

---

## Reglas de Implementación

### Convenciones obligatorias

1. **Multi-tenant**: Toda query filtra por `organization_id` vía `useOrgContext()`
2. **Terminología**: Usar español profesional. "Campaña" (no "ciclo" en UI), "Socios" (cooperativa), "Parcelas" (no "lotes" para fincas)
3. **Colores semafóricos**: Usar tokens CSS (`--destructive`, `--warning`, `--success`), NO colores directos
4. **Patrón Interpretación Nova Silva**: `bg-primary/5 border-primary/20` para análisis automatizados
5. **Sin emojis ni sparkles** en interpretaciones
6. **Toasts**: Centralizados en `src/lib/toastMessages.ts`
7. **Edge Functions**: Invocar con `fetch()` manual, NO `supabase.functions.invoke()`
8. **Keys canónicas**: Importar de `src/lib/keys.ts`

### Estrategia de implementación

El Tramo B se implementa en fases:

1. **Fase 1**: Tablas + motor matemático (`interModuleEngine.ts`) + hook `useModuleSnapshot`
2. **Fase 2**: UI de evaluaciones (Nova Guard + VITAL) + formularios de captura
3. **Fase 3**: Integración en `generate_nutrition_plan_v2` (ajustes por disease/water/resilience)
4. **Fase 4**: Panel de Insights + gráficos de productividad + aprendizaje
5. **Fase 5**: Iteración yield-nutrición convergente en Edge Function

### Umbrales parametrizables

| Variable | Rango | Clasificación |
|----------|-------|---------------|
| `disease_pressure_index` | 0-0.15 | baja |
| | 0.15-0.35 | moderada |
| | 0.35-0.6 | alta |
| | >0.6 | severa |
| `resilience_index` | 0-0.3 | frágil |
| | 0.3-0.5 | baja |
| | 0.5-0.7 | moderada |
| | >0.7 | alta |
| Factores (disease/nutrient/water) | 0.5-1.0 | clamp obligatorio |
| Convergencia yield | umbral = 0.5 qq | máx 5 iteraciones |

### Estrategia nutricional por nivel de presión fitosanitaria

| Presión | Estrategia |
|---------|------------|
| Baja | Plan estándar, sin ajustes |
| Moderada | Reforzar K y Ca, mantener N |
| Alta | Reducir N 15-20%, priorizar K/Ca/Mg, aumentar fraccionamiento |
| Severa | Reducir N 30%+, priorizar recuperación fisiológica, no esperar ROI normal |

### Nutrientes como mitigadores de estrés

| Nutriente | Función de resiliencia |
|-----------|----------------------|
| K | Regulación hídrica |
| Ca | Integridad celular |
| Mg | Función fotosintética |
| Si | Defensa estructural |

---

## Archivos clave del proyecto

```
src/lib/interModuleEngine.ts          -- NUEVO: Motor de integración
src/lib/nutritionDemandEngine.ts      -- Existente: Motor nutricional Tramo A
src/lib/soilIntelligenceEngine.ts     -- Existente: Diagnóstico edáfico
src/lib/yieldEngine.ts                -- Existente: Estimaciones yield
src/hooks/useModuleSnapshot.ts        -- NUEVO: Hook snapshot inter-modular
src/hooks/useOrgContext.ts            -- Existente: Contexto de organización
src/lib/keys.ts                       -- Existente: Constantes de tablas/columnas
src/config/featureFlags.ts            -- Existente: Feature flags
```

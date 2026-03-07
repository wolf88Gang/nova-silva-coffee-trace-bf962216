# Cursor Prompt Consolidado — Tramo B Completo (Pendientes)

> **Para Cursor IA**: Este prompt contiene TODO lo pendiente del Tramo B.
> Las tablas de Supabase ya están desplegadas. Este prompt solo cubre código frontend.
> Fecha: 2026-03-07

---

## Contexto del Proyecto

**Nova Silva** — plataforma SaaS multi-tenant para cadenas de valor de café.

### Infraestructura existente
- **Supabase externo**: `https://qbwmsarqewxjuwgkdfmg.supabase.co`
- **Client**: `src/integrations/supabase/client.ts` (hardcoded, NO usar `import.meta.env`)
- **Hook central**: `useOrgContext()` → `organizationId`, `role`, `orgTipo`, `activeModules`
- **Motor nutricional**: `src/lib/nutritionDemandEngine.ts`, `src/lib/soilIntelligenceEngine.ts`
- **Edge Function**: `generate_nutrition_plan_v2` (Tramo A, ya desplegada)
- **Keys canónicas**: `src/lib/keys.ts` (ORG_KEY, ACTOR_KEY, ASSET_KEY, TABLE)
- **OperacionesHub**: `src/pages/cooperativa/OperacionesHub.tsx` — actualmente 4 tabs: Nova Guard, Jornales, Inventario, Nutrición
- **Toasts**: Centralizados en `src/lib/toastMessages.ts`

### Tablas Supabase ya desplegadas (NO crear migraciones, solo consumir)

**Tramo B — Inter-modular:**
- `plot_module_snapshot` — snapshot integrado por parcela/ciclo (yield, guard, nutrición, VITAL)
- `disease_assessments` — evaluaciones fitosanitarias con columnas STORED (disease_pressure_index, pressure_level) y trigger calc_disease_factor
- `resilience_assessments` — evaluaciones de resiliencia con columnas STORED (resilience_index, resilience_level)
- `cycle_learning_log` — aprendizaje del sistema por ciclo
- Vista: `v_parcelas_riesgo_alto`

**Agroquímicos — Cumplimiento:**
- `ag_active_ingredients` — catálogo de ~48 moléculas con flags HHP/Estocolmo/Rotterdam
- `ag_commercial_products` — productos comerciales
- `ag_product_ingredients` — puente ingredientes ↔ productos
- `ag_market_mrls` — LMR por ingrediente × mercado (EU, USA, JAPAN, CHINA, KOREA, CODEX)
- `ag_certification_rules` — reglas por ingrediente × certificadora (fairtrade, gcp, rainforest_alliance)
- `org_certifications` — certificaciones activas por organización (tenant)
- `org_export_markets` — mercados de exportación por organización (tenant)

**RPCs disponibles:**
```sql
-- Inter-modular
calc_yield_adjusted(_yield_estimated, _nutrient_factor, _disease_factor, _water_factor) → numeric
get_latest_snapshot(_parcela_id, _ciclo) → plot_module_snapshot
get_latest_disease_assessment(_parcela_id, _ciclo) → disease_assessments
get_latest_resilience_assessment(_parcela_id, _ciclo) → resilience_assessments
get_cohort_learning(_org_id, _variedad, _altitud_rango) → TABLE

-- Cumplimiento agroquímico
get_blocked_ingredients(_org_id) → (ingredient_id, nombre_comun, clase_funcional, bloqueado_por, nivel, detalle)
check_ingredient_compliance(_org_id, _ingredient_id) → (is_allowed, bloqueado_por, nivel, detalle)
get_phaseout_ingredients(_org_id) → (ingredient_id, nombre_comun, certificadora, nivel_restriccion, fecha_phase_out, dias_restantes)
```

### Helpers SQL existentes
```sql
get_user_organization_id(auth.uid()) → uuid
is_admin(auth.uid()) → boolean
is_org_admin(auth.uid()) → boolean
```

---

## REGLAS OBLIGATORIAS

1. **Multi-tenant**: Toda query filtra por `organization_id` vía `useOrgContext()`
2. **Colores**: NUNCA usar colores directos (`text-red-500`, `bg-green-100`). Usar tokens semánticos (`text-destructive`, `bg-primary/5`, `border-primary/20`, `text-muted-foreground`)
3. **Edge Functions**: Invocar con `fetch()` manual, NUNCA `supabase.functions.invoke()`
4. **Supabase**: Importar de `src/integrations/supabase/client.ts`, NUNCA usar `import.meta.env`
5. **Terminología**: Español profesional. "Campaña" (no "ciclo" en UI), "Socios" (cooperativa)
6. **Sin emojis** en interpretaciones del sistema
7. **Keys**: Importar de `src/lib/keys.ts`
8. **Patrón Interpretación**: `bg-primary/5 border-primary/20 rounded-lg p-4` para análisis automatizados

---

## IMPLEMENTACIÓN: 6 Fases

---

### FASE 1: Motor de integración + Hooks

#### 1.1 `src/lib/interModuleEngine.ts`

```typescript
/**
 * Motor de integración inter-modular.
 * Consume datos de Nova Yield, Nova Guard, Nutrición y VITAL
 * para producir un snapshot integrado por parcela/ciclo.
 */

export interface ModuleSnapshot {
  yieldExpected: number;
  yieldUncertainty: number;
  yieldPotential: number;
  diseasePressureIndex: number;
  diseaseFactor: number;
  nutrientLimitationScore: number;
  limitingNutrient: string | null;
  nutrientFactor: number;
  resilienceIndex: number;
  waterStressIndex: number;
  waterFactor: number;
  yieldAdjusted: number;
}

export function calcDiseasePressure(
  roya: number, broca: number, defoliation: number, stress: number
): number {
  return 0.4 * roya + 0.3 * broca + 0.2 * defoliation + 0.1 * stress;
}

export function calcDiseaseFactor(pressure: number, sensitivity = 0.6): number {
  return Math.max(0.5, 1 - pressure * sensitivity);
}

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

export function getResilienceLevel(index: number): string {
  if (index < 0.3) return 'frágil';
  if (index < 0.5) return 'baja';
  if (index < 0.7) return 'moderada';
  return 'alta';
}

export function getDiseasePressureLevel(pressure: number): string {
  if (pressure < 0.15) return 'baja';
  if (pressure < 0.35) return 'moderada';
  if (pressure < 0.6) return 'alta';
  return 'severa';
}

export function calcYieldAdjusted(
  yieldEstimated: number,
  nutrientFactor: number,
  diseaseFactor: number,
  waterFactor: number,
): number {
  const clamp = (v: number) => Math.max(0.5, Math.min(1.0, v));
  return yieldEstimated * clamp(nutrientFactor) * clamp(diseaseFactor) * clamp(waterFactor);
}

export function iterateYieldNutrition(
  yieldInitial: number,
  calcSufficiency: (yield_qq: number) => number,
  maxIterations = 5,
  threshold = 0.5,
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

/** Map DB row to ModuleSnapshot (camelCase) */
export function plotSnapshotToModuleSnapshot(row: Record<string, unknown>): ModuleSnapshot {
  return {
    yieldExpected: (row.yield_expected as number) ?? 0,
    yieldUncertainty: (row.yield_uncertainty as number) ?? 0,
    yieldPotential: (row.yield_potential as number) ?? 0,
    diseasePressureIndex: (row.disease_pressure_index as number) ?? 0,
    diseaseFactor: (row.disease_factor as number) ?? 1,
    nutrientLimitationScore: (row.nutrient_limitation_score as number) ?? 0,
    limitingNutrient: (row.limiting_nutrient as string) ?? null,
    nutrientFactor: (row.nutrient_factor as number) ?? 1,
    resilienceIndex: (row.resilience_index as number) ?? 0,
    waterStressIndex: (row.water_stress_index as number) ?? 0,
    waterFactor: (row.water_factor as number) ?? 1,
    yieldAdjusted: (row.yield_adjusted as number) ?? 0,
  };
}
```

#### 1.2 `src/hooks/useModuleSnapshot.ts`

Hook con `useQuery` para cargar el snapshot más reciente de una parcela/ciclo, y `useMutation` para upsert.
- Filtrar por `organization_id` vía `useOrgContext()`
- Query: `supabase.from('plot_module_snapshot').select('*').eq('organization_id', orgId).eq('parcela_id', parcelaId).eq('ciclo', ciclo).order('version', { ascending: false }).limit(1).maybeSingle()`
- Upsert: `supabase.from('plot_module_snapshot').upsert({...}, { onConflict: 'organization_id,parcela_id,ciclo,version' })`
- Invalidar query key `['module-snapshot']` on success

#### 1.3 `src/hooks/usePlotSnapshotsHistory.ts`

Hook para cargar historial de snapshots por parcela (todos los ciclos).
- Query: `supabase.from('plot_module_snapshot').select('*').eq('organization_id', orgId).eq('parcela_id', parcelaId).order('ciclo', { ascending: true })`
- Usado por `ProductivityGapChart`

#### 1.4 `src/hooks/useComplianceEngine.ts`

```typescript
// useBlockedIngredients() — llama RPC get_blocked_ingredients(_org_id)
// usePhaseoutIngredients() — llama RPC get_phaseout_ingredients(_org_id)
// isIngredientBlocked(blocked, ingredientId) — filtro in-memory
// staleTime: 30 min (catálogos cambian poco)
```

---

### FASE 2: Componentes UI — Insights

#### 2.1 `src/components/insights/ModuleIntegrationCard.tsx`
Tarjeta que muestra el snapshot inter-modular:
- Yield estimado vs ajustado (barra visual con Progress de shadcn)
- 3 chips de factores: nutrición, sanidad, hídrico (color semafórico con tokens CSS)
  - Factor > 0.85 → `bg-primary/10 text-primary`
  - Factor 0.7-0.85 → `bg-accent/10 text-accent-foreground`
  - Factor < 0.7 → `bg-destructive/10 text-destructive`
- Badge del nutriente limitante
- Progress de resiliencia con nivel textual
- Si no hay snapshot: estado vacío con mensaje

#### 2.2 `src/components/insights/ProductivityGapChart.tsx`
Gráfico Recharts (BarChart):
- X: campaña (ciclo)
- 3 barras: yield_expected, yield_adjusted, yield_real
- Colores: `hsl(var(--primary))`, `hsl(var(--chart-2))`, `hsl(var(--muted-foreground))`
- Tooltip con detalles de cada factor
- Estado vacío cuando no hay datos
- Usa `usePlotSnapshotsHistory`

#### 2.3 `src/components/insights/InsightsPanel.tsx`
Panel "Nova Silva Insights" con análisis transversal:
- Encabezado con `bg-primary/5 border border-primary/20 rounded-lg p-4`
- 3 preguntas estratégicas con respuestas calculadas del snapshot:
  1. "¿Qué limita la productividad?" → muestra factor más bajo + nutriente limitante
  2. "¿Qué inversión tiene mayor retorno?" → compara gaps de cada factor
  3. "¿Qué nivel de riesgo tiene esta parcela?" → badge de riesgo basado en v_parcelas_riesgo_alto
- Badges para factor limitante, inversión sugerida, nivel de riesgo

---

### FASE 3: Formularios de evaluación

#### 3.1 `src/components/guard/DiseaseAssessmentForm.tsx`
Formulario para capturar evaluación fitosanitaria:
- 4 sliders (shadcn Slider): roya, broca, defoliación, estrés (0-100%)
- Cálculo en tiempo real de `disease_pressure_index` y `disease_factor` usando `calcDiseasePressure()` y `calcDiseaseFactor()`
- Muestra nivel de presión con badge de color (getDiseasePressureLevel)
- Muestra impacto estimado: "Reducción estimada del rendimiento: X%"
- Textarea para notas
- Botón "Guardar evaluación":
  - INSERT en `disease_assessments` (organization_id, parcela_id, ciclo, evaluador_id, fecha_evaluacion, roya_incidence, broca_incidence, defoliation_level, stress_symptoms, sensitivity, notas)
  - Nota: disease_pressure_index y pressure_level son STORED, disease_factor es calculado por trigger. NO enviarlos en el INSERT.
  - Después del INSERT, UPDATE `plot_module_snapshot` con los nuevos valores de guard

#### 3.2 `src/components/vital/ResilienceAssessmentForm.tsx`
Formulario para evaluación VITAL de resiliencia:
- 5 sliders: salud del suelo, materia orgánica, biodiversidad, manejo hídrico, control de erosión (0-100%)
- Slider opcional: cobertura de sombra
- Cálculo en tiempo real de `resilience_index` y nivel usando `calcResilienceIndex()` y `getResilienceLevel()`
- Textarea para notas
- Botón "Guardar evaluación":
  - INSERT en `resilience_assessments` (organization_id, parcela_id, ciclo, evaluador_id, fecha_evaluacion, soil_health, organic_matter_score, biodiversity, water_management, erosion_control, shade_coverage, notas)
  - Nota: resilience_index y resilience_level son STORED. NO enviarlos.
  - Después del INSERT, UPDATE `plot_module_snapshot` con los nuevos valores de resiliencia

---

### FASE 4: Componentes de Cumplimiento Agroquímico

#### 4.1 `src/components/cumplimiento/ComplianceStatusBadge.tsx`
Badge según nivel de restricción:
- `prohibido` / `lista_roja` / `cancelado` → badge variant destructive
- `lista_naranja` / `restringido` / `phase_out_2026` → badge variant outline con clase de warning
- `lista_amarilla` / `phase_out_2030` → badge variant outline
- `permitido` → badge variant default

#### 4.2 `src/components/cumplimiento/BlockedIngredientsPanel.tsx`
Panel con lista de ingredientes bloqueados:
- Usa `useBlockedIngredients()`
- Agrupa por `bloqueado_por` (secciones: Mercado, Certificación, Convenio Internacional)
- Cada fila: nombre_comun, clase_funcional, ComplianceStatusBadge, detalle en tooltip
- Estado vacío: "No hay ingredientes bloqueados para su organización"
- Estado sin certificaciones/mercados configurados: mensaje para configurarlos

#### 4.3 `src/components/cumplimiento/PhaseoutAlertsCard.tsx`
Card de alertas de phase-out:
- Usa `usePhaseoutIngredients()`
- Lista ingredientes ordenados por fecha_phase_out ASC
- `dias_restantes < 180` → `text-destructive` + icono AlertTriangle
- `dias_restantes < 365` → color warning
- Muestra certificadora + fecha de phase-out
- Si no hay: "Sin alertas de phase-out activas"

#### 4.4 `src/components/cumplimiento/OrgCertificationsManager.tsx`
CRUD de certificaciones de la organización:
- Tabla con certificaciones activas (certificadora, código, fecha emisión, vencimiento)
- Botón "Agregar certificación" → Dialog con Select de certificadoras + campos de texto
- INSERT/UPDATE en `org_certifications`
- Toggle activo/inactivo
- Solo visible para admin_org

#### 4.5 `src/components/cumplimiento/OrgExportMarketsManager.tsx`
CRUD de mercados de exportación:
- Chips/badges de mercados activos (EU, USA, JAPAN, CHINA, KOREA, CODEX)
- Toggle para activar/desactivar cada mercado
- Marcar mercado principal
- INSERT/DELETE en `org_export_markets`
- Solo visible para admin_org

---

### FASE 5: Tabs en OperacionesHub

Modificar `src/pages/cooperativa/OperacionesHub.tsx`:

#### 5.1 Tab "Insights"
```tsx
import { Lightbulb } from 'lucide-react';
// Tab: value="insights", icon=Lightbulb, label="Insights"
```

Crear `src/components/cooperativa/operaciones/InsightsTab.tsx`:
- Selector de parcela (dropdown de parcelas de la org)
- Selector de campaña (text input o select con opciones tipo '2024-2025', '2025-2026')
- Layout:
  - Fila 1: `ModuleIntegrationCard` (snapshot actual)
  - Fila 2: `InsightsPanel` (análisis estratégico)
  - Fila 3: `ProductivityGapChart` (historial)
  - Fila 4 (collapsible): `DiseaseAssessmentForm` + `ResilienceAssessmentForm` lado a lado
- Ambos formularios guardan en Supabase y actualizan el snapshot

#### 5.2 Tab "Cumplimiento"
```tsx
import { ShieldCheck } from 'lucide-react';
// Tab: value="cumplimiento", icon=ShieldCheck, label="Cumplimiento"
```

Crear `src/components/cooperativa/operaciones/CumplimientoTab.tsx`:
- Layout:
  - Fila 1: `OrgCertificationsManager` + `OrgExportMarketsManager` (lado a lado en desktop)
  - Fila 2: `BlockedIngredientsPanel` (resultado dinámico basado en certs + mercados)
  - Fila 3: `PhaseoutAlertsCard`
- Nota explicativa: "El sistema cruza sus certificaciones y mercados de exportación para determinar automáticamente qué ingredientes activos están prohibidos o en fase de eliminación."

---

### FASE 6: Actualizar keys.ts

Agregar al objeto `TABLE` en `src/lib/keys.ts`:

```typescript
// Tramo B — Inter-modular
PLOT_MODULE_SNAPSHOT: 'plot_module_snapshot',
DISEASE_ASSESSMENTS: 'disease_assessments',
RESILIENCE_ASSESSMENTS: 'resilience_assessments',
CYCLE_LEARNING_LOG: 'cycle_learning_log',
// Agroquímicos — Cumplimiento
AG_ACTIVE_INGREDIENTS: 'ag_active_ingredients',
AG_COMMERCIAL_PRODUCTS: 'ag_commercial_products',
AG_PRODUCT_INGREDIENTS: 'ag_product_ingredients',
AG_MARKET_MRLS: 'ag_market_mrls',
AG_CERTIFICATION_RULES: 'ag_certification_rules',
ORG_CERTIFICATIONS: 'org_certifications',
ORG_EXPORT_MARKETS: 'org_export_markets',
```

---

## Estructura de archivos resultante

```
src/
├── lib/
│   └── interModuleEngine.ts              ← NUEVO
├── hooks/
│   ├── useModuleSnapshot.ts              ← NUEVO
│   ├── usePlotSnapshotsHistory.ts        ← NUEVO
│   └── useComplianceEngine.ts            ← NUEVO
├── components/
│   ├── insights/
│   │   ├── ModuleIntegrationCard.tsx      ← NUEVO
│   │   ├── ProductivityGapChart.tsx       ← NUEVO
│   │   └── InsightsPanel.tsx             ← NUEVO
│   ├── guard/
│   │   └── DiseaseAssessmentForm.tsx     ← NUEVO
│   ├── vital/
│   │   └── ResilienceAssessmentForm.tsx  ← NUEVO
│   ├── cumplimiento/
│   │   ├── ComplianceStatusBadge.tsx     ← NUEVO
│   │   ├── BlockedIngredientsPanel.tsx   ← NUEVO
│   │   ├── PhaseoutAlertsCard.tsx        ← NUEVO
│   │   ├── OrgCertificationsManager.tsx  ← NUEVO
│   │   └── OrgExportMarketsManager.tsx   ← NUEVO
│   └── cooperativa/operaciones/
│       ├── InsightsTab.tsx               ← NUEVO
│       └── CumplimientoTab.tsx           ← NUEVO
├── pages/cooperativa/
│   └── OperacionesHub.tsx                ← MODIFICAR (agregar 2 tabs)
```

---

## Umbrales parametrizables (referencia rápida)

| Variable | Rango | Clasificación |
|----------|-------|---------------|
| `disease_pressure_index` | 0-0.15 / 0.15-0.35 / 0.35-0.6 / >0.6 | baja / moderada / alta / severa |
| `resilience_index` | 0-0.3 / 0.3-0.5 / 0.5-0.7 / >0.7 | frágil / baja / moderada / alta |
| Factores (disease/nutrient/water) | clamp [0.5, 1.0] | obligatorio |
| Convergencia yield | umbral = 0.5 qq, máx 5 iteraciones | |

## Estrategia nutricional por presión fitosanitaria

| Presión | Estrategia |
|---------|------------|
| Baja | Plan estándar, sin ajustes |
| Moderada | Reforzar K y Ca, mantener N |
| Alta | Reducir N 15-20%, priorizar K/Ca/Mg, más fraccionamiento |
| Severa | Reducir N 30%+, priorizar recuperación fisiológica |

## Nutrientes como mitigadores de estrés

| Nutriente | Función |
|-----------|---------|
| K | Regulación hídrica |
| Ca | Integridad celular |
| Mg | Función fotosintética |
| Si | Defensa estructural |

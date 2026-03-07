/**
 * Motor de integración inter-modular (Tramo B).
 * Consume datos de Nova Yield, Nova Guard, Nutrición y VITAL
 * para producir un snapshot integrado por parcela/ciclo.
 *
 * Fórmula central: yield_adjusted = yield_estimated × nutrient_factor × disease_factor × water_factor
 * Factores en rango [0.5, 1.0].
 */
export interface InterModuleVariables {
  yieldExpected: number;
  yieldUncertainty: number;
  yieldPotential: number;
  yieldAdjusted: number;
  diseasePressureIndex: number;
  royaIncidence: number;
  brocaIncidence: number;
  defoliationLevel: number;
  stressSymptoms: number;
  diseaseFactor: number;
  nutrientLimitationScore: number;
  nutrientFactor: number;
  resilienceIndex: number;
  soilHealthScore: number;
  waterStressIndex: number;
  waterFactor: number;
  productivityGap: number;
}

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

export interface ResilienceComponents {
  soilHealth: number;
  organicMatter: number;
  biodiversity: number;
  waterManagement: number;
  erosionControl: number;
}

/** Convierte PlotModuleSnapshot (DB) a ModuleSnapshot (motor) */
export function plotSnapshotToModuleSnapshot(raw: Record<string, unknown> | null): ModuleSnapshot | null {
  if (!raw) return null;
  const n = (v: unknown) => (typeof v === 'number' && !Number.isNaN(v) ? v : 0);
  const s = (v: unknown) => (typeof v === 'string' ? v : null);
  return {
    yieldExpected: n(raw.yield_expected),
    yieldUncertainty: n(raw.yield_uncertainty),
    yieldPotential: n(raw.yield_potential),
    diseasePressureIndex: n(raw.disease_pressure_index),
    diseaseFactor: n(raw.disease_factor) || 1,
    nutrientLimitationScore: n(raw.nutrient_limitation_score),
    limitingNutrient: s(raw.limiting_nutrient),
    nutrientFactor: n(raw.nutrient_factor) || 1,
    resilienceIndex: n(raw.resilience_index),
    waterStressIndex: n(raw.water_stress_index),
    waterFactor: n(raw.water_factor) || 1,
    yieldAdjusted: n(raw.yield_adjusted) || n(raw.yield_expected),
  };
}

/** Índice de presión fitosanitaria (0-1) */
export function calcDiseasePressure(
  roya: number,
  broca: number,
  defoliation: number,
  stress: number
): number {
  return 0.4 * roya + 0.3 * broca + 0.2 * defoliation + 0.1 * stress;
}

/** Factor productivo por sanidad (0.5-1.0) */
export function calcDiseaseFactor(pressure: number, sensitivity = 0.6): number {
  return Math.max(0.5, Math.min(1.0, 1 - pressure * sensitivity));
}

/** Índice de resiliencia ponderado (0-1) */
export function calcResilienceIndex(components: ResilienceComponents): number {
  return (
    0.25 * components.soilHealth +
    0.2 * components.organicMatter +
    0.2 * components.biodiversity +
    0.2 * components.waterManagement +
    0.15 * components.erosionControl
  );
}

/** Nivel de resiliencia (UI: frágil; DB usa fragil) */
export function getResilienceLevel(index: number): 'frágil' | 'baja' | 'moderada' | 'alta' {
  if (index < 0.3) return 'frágil';
  if (index < 0.5) return 'baja';
  if (index < 0.7) return 'moderada';
  return 'alta';
}

/** Nivel de presión fitosanitaria */
export function getDiseasePressureLevel(pressure: number): 'baja' | 'moderada' | 'alta' | 'severa' {
  if (pressure < 0.15) return 'baja';
  if (pressure < 0.35) return 'moderada';
  if (pressure < 0.6) return 'alta';
  return 'severa';
}

/** Fórmula central de yield ajustado */
export function calcYieldAdjusted(
  yieldEstimated: number,
  nutrientFactor: number,
  diseaseFactor: number,
  waterFactor: number
): number {
  const clamp = (v: number) => Math.max(0.5, Math.min(1.0, v));
  return yieldEstimated * clamp(nutrientFactor) * clamp(diseaseFactor) * clamp(waterFactor);
}

/** Convergencia iterativa yield-nutrición */
export function iterateYieldNutrition(
  yieldInitial: number,
  calcSufficiency: (yield_qq: number) => number,
  maxIterations = 5,
  threshold = 0.5
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

/** Estrategia nutricional por nivel de presión fitosanitaria */
export function getNutritionStrategyByPressure(pressure: number): string {
  const level = getDiseasePressureLevel(pressure);
  const strategies: Record<string, string> = {
    baja: 'Plan estándar, sin ajustes',
    moderada: 'Reforzar K y Ca, mantener N',
    alta: 'Reducir N 15-20%, priorizar K/Ca/Mg, aumentar fraccionamiento',
    severa: 'Reducir N 30%+, priorizar recuperación fisiológica, no esperar ROI normal',
  };
  return strategies[level] ?? 'Plan estándar';
}

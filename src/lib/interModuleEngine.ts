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

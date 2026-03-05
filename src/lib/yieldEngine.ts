/**
 * Nova Yield — Motor de Estimación de Cosecha
 * Formula: Y_final = (N_árboles × Prom_ramas × Prom_frutos × M_occ × P_fruto × (1 - L_clima)) × FC_c-o
 */

// ── Constants ──

const FACTOR_OCLUSION = 1.25;           // Compensates invisible fruits in 2D photo
const PESO_FRUTO_KG = 0.0016;           // 1.6g per cherry
const FACTOR_CONVERSION_ORO = 0.18;     // Cherry to green (5.5:1)
const ARBOLES_MUESTREO = 30;            // Recommended sample size
const FACTOR_KY_CAFE = 0.58;            // Water sensitivity factor (FAO)
const MAX_PERDIDA_CLIMA = 0.30;

// ── Types ──

export interface SampleInput {
  totalRamas: number;
  conteoFrutosRamaMedia: number;
  conteoFrutosBaja?: number;
  conteoFrutosAlta?: number;
}

export interface YieldInput {
  arbolesTotal: number;
  areaHa: number;
  muestras: SampleInput[];
  diasSevero?: number;         // Severe stress days
  diasModerado?: number;       // Moderate stress days
  diasVentanaCritica?: number; // Critical window (default 60)
}

export interface YieldResult {
  estimacionCerezaKg: number;
  estimacionOroKg: number;
  estimacionOroQQ: number;
  rendimientoKgHa: number;
  factorClimatico: number;
  confianza: 'alta' | 'media' | 'baja';
  muestrasTomadas: number;
  jornalesEstimados: number;
}

// ── Climate stress ──

export function calculateClimateStressFactor(
  diasSevero: number = 0,
  diasModerado: number = 0,
  diasVentanaCritica: number = 60,
): number {
  const stressIndex = (diasSevero * 1.0 + diasModerado * 0.5) / Math.max(1, diasVentanaCritica);
  const loss = Math.min(MAX_PERDIDA_CLIMA, stressIndex * FACTOR_KY_CAFE);
  return loss;
}

// ── Density helper ──

export function estimateDensityFromLinearCount(
  arbolesPor10m: number,
  espacioEntreHileras: number = 2,
): number {
  const arbolesPerM = arbolesPor10m / 10;
  return Math.round(arbolesPerM * (10000 / espacioEntreHileras));
}

// ── Labor estimation ──

export function calculateLaborDays(
  kgCerezaEstimados: number,
  capacidadDiaria: number = 80,
): number {
  return Math.ceil(kgCerezaEstimados / capacidadDiaria);
}

// ── Main engine ──

export function estimateYield(input: YieldInput): YieldResult {
  const { arbolesTotal, areaHa, muestras } = input;

  // Average branches and fruits from samples
  let avgFrutos = 0;
  let avgRamas = 0;

  if (muestras.length > 0) {
    let totalRamas = 0;
    let totalFrutos = 0;

    for (const m of muestras) {
      totalRamas += m.totalRamas;
      // Weighted average: baja=0.25, media=0.50, alta=0.25
      const frutosProm = m.conteoFrutosBaja !== undefined && m.conteoFrutosAlta !== undefined
        ? m.conteoFrutosBaja * 0.25 + m.conteoFrutosRamaMedia * 0.50 + m.conteoFrutosAlta * 0.25
        : m.conteoFrutosRamaMedia;
      totalFrutos += frutosProm;
    }

    avgRamas = totalRamas / muestras.length;
    avgFrutos = totalFrutos / muestras.length;
  }

  // Climate loss
  const climaLoss = calculateClimateStressFactor(
    input.diasSevero,
    input.diasModerado,
    input.diasVentanaCritica,
  );

  // Core formula
  const cerezaKg = arbolesTotal * avgRamas * avgFrutos * FACTOR_OCLUSION * PESO_FRUTO_KG * (1 - climaLoss);
  const oroKg = cerezaKg * FACTOR_CONVERSION_ORO;
  const oroQQ = oroKg / 46; // 1 QQ = 46 kg

  // Confidence based on sample size
  const confianza = muestras.length >= ARBOLES_MUESTREO ? 'alta' : muestras.length >= 15 ? 'media' : 'baja';

  return {
    estimacionCerezaKg: Math.round(cerezaKg),
    estimacionOroKg: Math.round(oroKg),
    estimacionOroQQ: Math.round(oroQQ * 10) / 10,
    rendimientoKgHa: areaHa > 0 ? Math.round(oroKg / areaHa) : 0,
    factorClimatico: Math.round(climaLoss * 100) / 100,
    confianza,
    muestrasTomadas: muestras.length,
    jornalesEstimados: calculateLaborDays(cerezaKg),
  };
}

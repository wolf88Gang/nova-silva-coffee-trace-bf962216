/**
 * ROI Digital Twin — Simulación Monte Carlo
 * 5,000 corridas con XORShift32 reproducible para evaluar riesgo financiero.
 */

// ── Constantes calibradas (FAO/Cenicafé) ──

const CALIBRATED_DEFAULTS = {
  intervention: { yieldLiftMean: 0.25, yieldLiftStd: 0.10 },
  climate: { probability: 0.25, yieldLossMean: 0.30, yieldLossStd: 0.10 },
  pest: { probability: 0.15, yieldLossMean: 0.25, yieldLossStd: 0.12 },
  price: { mean: 0, std: 0.15 },
  simulation: { defaultN: 5000, defaultSeed: 42 },
};

// ── XORShift32 PRNG (reproducible) ──

function xorshift32(seed: number) {
  let x = seed | 0;
  return () => {
    x ^= x << 13; x |= 0;
    x ^= x >>> 17; x |= 0;
    x ^= x << 5; x |= 0;
    return (x >>> 0) / 4294967296;
  };
}

// Box-Muller transform for normal distribution
function normalRandom(rng: () => number, mean: number, std: number): number {
  const u1 = rng();
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(Math.max(1e-10, u1))) * Math.cos(2 * Math.PI * u2);
  return mean + std * z;
}

// ── Types ──

export interface RoiSimInput {
  areaHa: number;
  baseYieldKgHa: number;
  pricePerKg: number;           // USD
  totalDebtService: number;     // annual payment
  nonDebtCost: number;          // annual operating cost
  creditAmount: number;
  vitalNivel?: 1 | 2 | 3 | 4;  // Affects management factor
  iotCalibration?: { realTimeStress: number; confidence: 'high' | 'medium' | 'low' | 'none' };
}

export interface RoiSimResult {
  expectedIncrementalNet: number;
  pIncrementalNetNegative: number;   // PRN
  expectedDSCR: number;
  pDSCRBelow1: number;
  varP5IncrementalNet: number;       // VaR P5
  usedRealTimeCalibration: boolean;
  effectiveStressFactor: number;
  sampleCount: number;
}

// ── Simulation ──

export function runMonteCarloSimulation(
  input: RoiSimInput,
  n: number = CALIBRATED_DEFAULTS.simulation.defaultN,
  seed: number = CALIBRATED_DEFAULTS.simulation.defaultSeed,
): RoiSimResult {
  const rng = xorshift32(seed);
  const { intervention, climate, pest, price } = CALIBRATED_DEFAULTS;

  // Management factor from VITAL level
  const mgmtFactor: Record<number, number> = { 1: 0.7, 2: 0.85, 3: 1.0, 4: 1.15 };
  const managementFactor = mgmtFactor[input.vitalNivel ?? 2] ?? 0.85;

  // IoT calibration for climate probability
  let effectiveClimateP = climate.probability;
  let usedRealTime = false;
  if (input.iotCalibration && input.iotCalibration.confidence !== 'none') {
    const confidenceWeights: Record<string, number> = { high: 0.9, medium: 0.7, low: 0.4, none: 0 };
    const w = confidenceWeights[input.iotCalibration.confidence] ?? 0;
    effectiveClimateP = climate.probability * (1 - w) + input.iotCalibration.realTimeStress * w;
    usedRealTime = true;
  }

  const baseProduction = input.areaHa * input.baseYieldKgHa;
  const baseRevenue = baseProduction * input.pricePerKg;
  const baseNet = baseRevenue - input.nonDebtCost;

  const incrementalNets: number[] = [];
  const dscrs: number[] = [];

  for (let i = 0; i < n; i++) {
    // 1. Yield lift from intervention
    const lift = normalRandom(rng, intervention.yieldLiftMean, intervention.yieldLiftStd);
    let yieldMultiplier = (1 + Math.max(0, lift)) * managementFactor;

    // 2. Climate shock
    if (rng() < effectiveClimateP) {
      const climateLoss = normalRandom(rng, climate.yieldLossMean, climate.yieldLossStd);
      yieldMultiplier *= (1 - Math.max(0, Math.min(1, climateLoss)));
    }

    // 3. Pest shock
    if (rng() < pest.probability) {
      const pestLoss = normalRandom(rng, pest.yieldLossMean, pest.yieldLossStd);
      yieldMultiplier *= (1 - Math.max(0, Math.min(1, pestLoss)));
    }

    // 4. Price volatility
    const priceMultiplier = 1 + normalRandom(rng, price.mean, price.std);
    const effectivePrice = input.pricePerKg * Math.max(0.5, priceMultiplier);

    // 5. Revenue
    const production = baseProduction * Math.max(0, yieldMultiplier);
    const revenue = production * effectivePrice;

    // 6. Cash available for debt
    const cashForDebt = Math.max(0, revenue - input.nonDebtCost);
    const dscr = input.totalDebtService > 0 ? cashForDebt / input.totalDebtService : 999;

    // 7. Incremental net
    const incrementalNet = (revenue - input.nonDebtCost - input.totalDebtService) - baseNet;

    incrementalNets.push(incrementalNet);
    dscrs.push(dscr);
  }

  // Sort for percentile calculations
  const sortedNets = [...incrementalNets].sort((a, b) => a - b);
  const sortedDscrs = [...dscrs].sort((a, b) => a - b);

  const avgNet = incrementalNets.reduce((s, v) => s + v, 0) / n;
  const avgDscr = dscrs.reduce((s, v) => s + v, 0) / n;
  const negativeCount = incrementalNets.filter(v => v < 0).length;
  const dscrBelow1Count = dscrs.filter(v => v < 1).length;
  const varP5Index = Math.floor(n * 0.05);

  return {
    expectedIncrementalNet: Math.round(avgNet),
    pIncrementalNetNegative: negativeCount / n,
    expectedDSCR: Math.round(avgDscr * 100) / 100,
    pDSCRBelow1: dscrBelow1Count / n,
    varP5IncrementalNet: Math.round(sortedNets[varP5Index] ?? sortedNets[0]),
    usedRealTimeCalibration: usedRealTime,
    effectiveStressFactor: effectiveClimateP,
    sampleCount: n,
  };
}

// ── Demo mock ──

export const MOCK_ROI_INPUT: RoiSimInput = {
  areaHa: 3.2,
  baseYieldKgHa: 1100,
  pricePerKg: 3.20,
  totalDebtService: 6800, // USD annual
  nonDebtCost: 4500,
  creditAmount: 8500,
  vitalNivel: 3,
};

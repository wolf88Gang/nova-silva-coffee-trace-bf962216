/**
 * Score Crediticio Nova (SCN) — Motor Completo
 * Formula: SCN = (CapacidadPago × 0.50) + (Carácter × 0.30) + (Colateral × 0.20)
 * Result: Score 0-100 with automatic decision.
 */

// ── Types ──

export interface NovaScoreInput {
  // Financial
  dscr: number;                    // Debt Service Coverage Ratio
  prn: number;                     // Prob. Retorno Negativo (0-1) from Monte Carlo
  cashFlowRatio: number;           // Free cash flow / debt service

  // Behavior
  employerRating: number | null;   // 0-100, from Jornales module
  deliveryConsistency: number;     // 0-1, % deliveries fulfilled
  yearsWithCooperative: number;
  sideSelling: boolean;
  onTimePaymentRate: number | null; // 0-1

  // Collateral
  vitalNivel: 1 | 2 | 3 | 4;
  vitalGlobalIndex: number;        // 0-1
  carbonValuePerHa: number;        // USD/ha
  hasMrvVerification: boolean;
  geolocVerified: boolean;

  // Optional AI anomaly
  aiAnomalyScore?: { score: number; confidence: number; flaggedMetrics: string[] };
}

export interface NovaScoreResult {
  totalScore: number;
  decision: 'aprobacion_rapida' | 'revision_manual' | 'rechazo_o_garantia';
  semaforo: 'verde' | 'ambar' | 'rojo';
  breakdown: {
    paymentCapacity: { score: number; weight: number; weightedScore: number; details: { dscrScore: number; prnScore: number; cashFlowScore: number } };
    characterBehavior: { score: number; weight: number; weightedScore: number; details: { employerRatingScore: number; deliveryScore: number; loyaltyScore: number } };
    collateralCapital: { score: number; weight: number; weightedScore: number; details: { vitalScore: number; carbonScore: number; geolocScore: number } };
  };
  riskFactors: string[];
  strengths: string[];
  recommendations: string[];
  aiAnomalyAdjustment?: { adjustment: number; flaggedMetrics: string[]; confidence: number };
  calculatedAt: string;
}

// ── Scoring functions ──

function interpolate(value: number, ranges: [number, number, number][]): number {
  for (const [threshold, minScore, maxScore] of ranges) {
    if (value >= threshold) {
      if (minScore === maxScore) return minScore;
      return minScore + (maxScore - minScore) * Math.min(1, (value - threshold) / (threshold * 0.5 || 1));
    }
  }
  return 0;
}

function scoreDSCR(dscr: number): number {
  if (dscr >= 2.0) return 100;
  if (dscr >= 1.5) return 80 + (dscr - 1.5) / 0.5 * 20;
  if (dscr >= 1.2) return 60 + (dscr - 1.2) / 0.3 * 20;
  if (dscr >= 1.0) return 40 + (dscr - 1.0) / 0.2 * 20;
  if (dscr >= 0.8) return 20 + (dscr - 0.8) / 0.2 * 20;
  return Math.max(0, dscr / 0.8 * 20);
}

function scorePRN(prn: number): number {
  if (prn <= 0.05) return 100;
  if (prn <= 0.10) return 85 + (0.10 - prn) / 0.05 * 15;
  if (prn <= 0.15) return 70 + (0.15 - prn) / 0.05 * 15;
  if (prn <= 0.25) return 50 + (0.25 - prn) / 0.10 * 20;
  if (prn <= 0.40) return 25 + (0.40 - prn) / 0.15 * 25;
  return Math.max(0, (1 - prn) * 25);
}

function scoreCashFlow(ratio: number): number {
  if (ratio >= 3.0) return 100;
  if (ratio >= 2.0) return 80 + (ratio - 2.0) / 1.0 * 20;
  if (ratio >= 1.5) return 60 + (ratio - 1.5) / 0.5 * 20;
  if (ratio >= 1.0) return 40 + (ratio - 1.0) / 0.5 * 20;
  return Math.max(0, ratio / 1.0 * 40);
}

function scoreDelivery(consistency: number, years: number): number {
  let base: number;
  if (consistency >= 0.95) base = 100;
  else if (consistency >= 0.85) base = 80 + (consistency - 0.85) / 0.10 * 20;
  else if (consistency >= 0.70) base = 60 + (consistency - 0.70) / 0.15 * 20;
  else if (consistency >= 0.50) base = 30 + (consistency - 0.50) / 0.20 * 30;
  else base = consistency / 0.50 * 30;

  const bonus = Math.min(10, years * 2);
  return Math.min(100, base + bonus);
}

function scoreLoyalty(sideSelling: boolean, onTimeRate: number | null): number {
  let score = 70;
  if (sideSelling) score -= 40;
  if (onTimeRate !== null) {
    score += onTimeRate * 30;
  } else {
    score += 15; // Neutral
  }
  return Math.max(0, Math.min(100, score));
}

function scoreVITAL(nivel: 1 | 2 | 3 | 4, globalIndex: number): number {
  const baseMap: Record<number, number> = { 1: 25, 2: 50, 3: 75, 4: 100 };
  const base = baseMap[nivel] ?? 50;
  const adjustment = (globalIndex - 0.5) * 20;
  return Math.max(0, Math.min(100, base + adjustment));
}

function scoreCarbon(valuePerHa: number, hasMrv: boolean): number {
  let base: number;
  if (valuePerHa >= 500) base = 100;
  else if (valuePerHa >= 300) base = 80 + (valuePerHa - 300) / 200 * 20;
  else if (valuePerHa >= 150) base = 60 + (valuePerHa - 150) / 150 * 20;
  else if (valuePerHa >= 50) base = 30 + (valuePerHa - 50) / 100 * 30;
  else if (valuePerHa > 0) base = valuePerHa / 50 * 30;
  else base = 20; // Sin datos

  const bonus = hasMrv ? 10 : 0;
  return Math.min(100, base + bonus);
}

function scoreGeoloc(verified: boolean): number {
  return verified ? 100 : 30;
}

// ── Main engine ──

export function calculateNovaScore(input: NovaScoreInput): NovaScoreResult {
  const riskFactors: string[] = [];
  const strengths: string[] = [];
  const recommendations: string[] = [];

  // Component 1: Payment Capacity (50%)
  const dscrScore = scoreDSCR(input.dscr);
  const prnScore = scorePRN(input.prn);
  const cashFlowScore = scoreCashFlow(input.cashFlowRatio);
  const paymentCapacityScore = dscrScore * 0.40 + prnScore * 0.35 + cashFlowScore * 0.25;

  if (input.dscr < 1.0) riskFactors.push('DSCR por debajo de 1.0 — riesgo de impago');
  if (input.dscr >= 1.5) strengths.push('DSCR favorable — buena cobertura de deuda');
  if (input.prn > 0.25) riskFactors.push('Alta probabilidad de retorno negativo');

  // Component 2: Character/Behavior (30%)
  const employerRatingScore = input.employerRating ?? 50;
  const deliveryScore = scoreDelivery(input.deliveryConsistency, input.yearsWithCooperative);
  const loyaltyScore = scoreLoyalty(input.sideSelling, input.onTimePaymentRate);
  const characterScore = employerRatingScore * 0.35 + deliveryScore * 0.40 + loyaltyScore * 0.25;

  if (input.deliveryConsistency < 0.70) riskFactors.push('Entregas inconsistentes — cumplimiento < 70%');
  if (input.deliveryConsistency >= 0.90) strengths.push('Entregas excelentes — alta consistencia');
  if (input.sideSelling) riskFactors.push('Side-selling detectado — riesgo de lealtad');
  if (employerRatingScore >= 75) strengths.push('Buen rating como empleador');

  // Component 3: Collateral/Capital (20%)
  const vScore = scoreVITAL(input.vitalNivel, input.vitalGlobalIndex);
  const carbonScore = scoreCarbon(input.carbonValuePerHa, input.hasMrvVerification);
  const geolocScore = scoreGeoloc(input.geolocVerified);
  const collateralScore = vScore * 0.50 + carbonScore * 0.30 + geolocScore * 0.20;

  if (input.vitalNivel <= 2) riskFactors.push('Nivel VITAL bajo — poca resiliencia');
  if (input.vitalNivel >= 3) strengths.push('VITAL favorable — resiliencia alta');
  if (!input.geolocVerified) riskFactors.push('Parcelas sin geolocalización verificada');
  if (input.geolocVerified) strengths.push('EUDR compliant — geolocalización verificada');
  if (input.carbonValuePerHa >= 150) strengths.push('Activos de carbono significativos');

  // Total
  let totalScore = paymentCapacityScore * 0.50 + characterScore * 0.30 + collateralScore * 0.20;

  // AI anomaly adjustment
  let aiAdjustment: NovaScoreResult['aiAnomalyAdjustment'];
  if (input.aiAnomalyScore) {
    const penalty = input.aiAnomalyScore.score * 10 * input.aiAnomalyScore.confidence;
    totalScore = Math.max(0, totalScore - penalty);
    aiAdjustment = {
      adjustment: -penalty,
      flaggedMetrics: input.aiAnomalyScore.flaggedMetrics,
      confidence: input.aiAnomalyScore.confidence,
    };
  }

  totalScore = Math.round(Math.max(0, Math.min(100, totalScore)));

  // Decision
  const decision = totalScore >= 80 ? 'aprobacion_rapida' : totalScore >= 60 ? 'revision_manual' : 'rechazo_o_garantia';
  const semaforo = totalScore >= 80 ? 'verde' : totalScore >= 60 ? 'ambar' : 'rojo';

  // Recommendations
  if (totalScore < 60) recommendations.push('Considerar monto menor al solicitado');
  if (input.dscr < 1.2) recommendations.push('Recomendar seguro agrícola');
  if (input.vitalNivel <= 2) recommendations.push('Acompañamiento técnico prioritario');
  if (input.sideSelling) recommendations.push('Requiere compromiso de exclusividad');
  if (!input.geolocVerified) recommendations.push('Completar geolocalización de parcelas');
  if (input.carbonValuePerHa < 50) recommendations.push('Documentar árboles de sombra para carbono');

  return {
    totalScore,
    decision,
    semaforo,
    breakdown: {
      paymentCapacity: {
        score: Math.round(paymentCapacityScore),
        weight: 0.50,
        weightedScore: Math.round(paymentCapacityScore * 0.50),
        details: { dscrScore: Math.round(dscrScore), prnScore: Math.round(prnScore), cashFlowScore: Math.round(cashFlowScore) },
      },
      characterBehavior: {
        score: Math.round(characterScore),
        weight: 0.30,
        weightedScore: Math.round(characterScore * 0.30),
        details: { employerRatingScore: Math.round(employerRatingScore), deliveryScore: Math.round(deliveryScore), loyaltyScore: Math.round(loyaltyScore) },
      },
      collateralCapital: {
        score: Math.round(collateralScore),
        weight: 0.20,
        weightedScore: Math.round(collateralScore * 0.20),
        details: { vitalScore: Math.round(vScore), carbonScore: Math.round(carbonScore), geolocScore: Math.round(geolocScore) },
      },
    },
    riskFactors,
    strengths,
    recommendations,
    aiAnomalyAdjustment: aiAdjustment,
    calculatedAt: new Date().toISOString(),
  };
}

// ── Demo mock input ──

export const MOCK_SCORE_INPUT: NovaScoreInput = {
  dscr: 1.65,
  prn: 0.12,
  cashFlowRatio: 2.1,
  employerRating: 78,
  deliveryConsistency: 0.92,
  yearsWithCooperative: 7,
  sideSelling: false,
  onTimePaymentRate: 0.85,
  vitalNivel: 3,
  vitalGlobalIndex: 0.68,
  carbonValuePerHa: 180,
  hasMrvVerification: false,
  geolocVerified: true,
};

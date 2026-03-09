/**
 * Soil Biological Intelligence Engine — Motor de Inteligencia Edáfica
 * 
 * Implementa:
 *   §3  Soil Intelligence Engine (bloqueo por toxicidad)
 *   §4  IFBS — Índice Funcional Biológico del Suelo
 *   §5  Calibración heurística (Kamprath, suficiencia de P)
 * 
 * Source: Whitepaper "Inteligencia Agronómica Distribuida" + Manual Nutrición Paramétrica
 */

// ══════════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════════

export interface SoilAnalysisInput {
  ph: number | null;
  mo_pct: number | null;        // Materia orgánica %
  p_ppm: number | null;         // Fósforo (Bray II / Mehlich)
  k_cmol: number | null;        // Potasio cmol(+)/L
  ca_cmol: number | null;       // Calcio cmol(+)/L
  mg_cmol: number | null;       // Magnesio cmol(+)/L
  s_ppm: number | null;         // Azufre ppm
  cice: number | null;          // Cap. Intercambio Cationes Efectiva
  al_cmol?: number | null;      // Aluminio intercambiable cmol(+)/L
  textura?: string | null;      // Arcilloso, Franco, Arenoso, etc.
  // Proxies heurísticos (opcionales)
  cobertura_vegetal_pct?: number;   // 0-100
  sombra_agroforestal?: boolean;
  manejo_regenerativo?: boolean;
}

export interface LimingRecommendation {
  required: boolean;
  reason: string;
  doseKgHa: number;              // kg CaCO₃/ha
  doseSacosHa: number;           // sacos 50kg/ha
  prnt: number;                  // Poder Relativo de Neutralización Total usado
  alSatPct: number;              // Saturación de Al calculada
  alSatMaxTolerated: number;     // Umbral máximo tolerado
  formula: string;               // Fórmula aplicada (trazabilidad)
}

export interface ToxicityCheck {
  blocked: boolean;              // Si true, NO recomendar NPK
  alerts: ToxicityAlert[];
}

export interface ToxicityAlert {
  type: 'ph_critico' | 'al_toxico' | 'al_sat_alta' | 'p_fijado' | 'cice_baja' | 'k_exceso' | 'ca_mg_desequilibrio';
  severity: 'critico' | 'alto' | 'medio';
  message: string;
  value: number | null;
  threshold: string;
}

export type NutrientStatus = 'critico' | 'bajo' | 'optimo' | 'alto' | 'exceso';

export interface NutrientSufficiency {
  nutrient: string;
  value: number | null;
  status: NutrientStatus;
  unit: string;
  range: string;
}

export interface IFBSResult {
  score: number;                // 0-1
  scorePct: number;             // 0-100
  nivel: 'muy_bajo' | 'bajo' | 'medio' | 'alto' | 'muy_alto';
  subindices: {
    carbono: { score: number; weight: number; raw: number | null };
    acidez: { score: number; weight: number; raw: number | null };
    nutricion: { score: number; weight: number; raw: number | null };
    integridad: { score: number; weight: number; raw: number | null };
  };
  interpretation: string;
}

export interface SoilIntelligenceResult {
  toxicity: ToxicityCheck;
  liming: LimingRecommendation;
  ifbs: IFBSResult;
  sufficiency: NutrientSufficiency[];
  canRecommendNPK: boolean;
  summary: string;
}

// ══════════════════════════════════════════════════════════════
// Constants
// ══════════════════════════════════════════════════════════════

const AL_SAT_MAX_COFFEE = 0.25;           // 25% máximo tolerado para café
const AL_INTERCAMBIABLE_MAX = 0.3;        // meq/100g
const PH_CRITICO = 5.0;
const PH_OPTIMO_MIN = 5.5;
const PH_OPTIMO_MAX = 6.5;
const CICE_MINIMA = 5.0;                  // meq/100g
const K_EXCESO_THRESHOLD = 1.5;           // cmol — induce clorosis Mg
const DEFAULT_PRNT = 85;                  // % para cal dolomita común
const PROFUNDIDAD_CM = 20;
const PESO_SUELO_HA = 2_000_000;          // kg suelo/ha (0-20cm)

// P sufficiency (Bray II / Mehlich 3 para Andisoles)
const P_RANGES = {
  critico: { max: 10 },
  bajo: { max: 20 },
  optimo: { max: 30 },
  alto: { max: 40 },
  // >40 = exceso
};

// IFBS weights (Whitepaper §4)
const IFBS_WEIGHTS = {
  carbono: 0.35,
  acidez: 0.25,
  nutricion: 0.20,
  integridad: 0.20,
};

// ══════════════════════════════════════════════════════════════
// §3 — Toxicity Check (Bloqueo por toxicidad)
// ══════════════════════════════════════════════════════════════

export function checkToxicity(input: SoilAnalysisInput): ToxicityCheck {
  const alerts: ToxicityAlert[] = [];

  // pH crítico
  if (input.ph !== null && input.ph < PH_CRITICO) {
    alerts.push({
      type: 'ph_critico',
      severity: 'critico',
      message: `pH ${input.ph.toFixed(1)} está por debajo del umbral crítico (${PH_CRITICO}). La mineralización biológica se detiene y hasta el 60% del ortofosfato precipita como fosfato de aluminio.`,
      value: input.ph,
      threshold: `≥ ${PH_CRITICO}`,
    });
  }

  // Al intercambiable tóxico
  if (input.al_cmol != null && input.al_cmol > AL_INTERCAMBIABLE_MAX) {
    alerts.push({
      type: 'al_toxico',
      severity: 'critico',
      message: `Aluminio intercambiable ${input.al_cmol.toFixed(2)} cmol excede el máximo tolerado (${AL_INTERCAMBIABLE_MAX}). Paralización de rizobacterias PGPR y bloqueo de absorción de fósforo.`,
      value: input.al_cmol,
      threshold: `≤ ${AL_INTERCAMBIABLE_MAX} cmol`,
    });
  }

  // Saturación de Al
  const alSat = calculateAlSaturation(input);
  if (alSat !== null && alSat > AL_SAT_MAX_COFFEE) {
    alerts.push({
      type: 'al_sat_alta',
      severity: 'critico',
      message: `Saturación de aluminio ${(alSat * 100).toFixed(1)}% excede el límite de ${AL_SAT_MAX_COFFEE * 100}%. Inhibición fulminante del crecimiento radicular y actividad enzimática (ureasa, fosfatasa).`,
      value: alSat,
      threshold: `≤ ${AL_SAT_MAX_COFFEE * 100}%`,
    });
  }

  // CICE baja → fraccionamiento extremo
  if (input.cice !== null && input.cice < CICE_MINIMA) {
    alerts.push({
      type: 'cice_baja',
      severity: 'alto',
      message: `CICE ${input.cice.toFixed(1)} meq/100g es baja (< ${CICE_MINIMA}). Riesgo de lixiviación de bases. Se requiere fraccionamiento extremo de fertilización.`,
      value: input.cice,
      threshold: `≥ ${CICE_MINIMA}`,
    });
  }

  // Exceso de K → antagonismo Mg
  if (input.k_cmol !== null && input.k_cmol > K_EXCESO_THRESHOLD) {
    alerts.push({
      type: 'k_exceso',
      severity: 'medio',
      message: `Potasio ${input.k_cmol.toFixed(2)} cmol excede ${K_EXCESO_THRESHOLD} cmol. Posible clorosis por deficiencia inducida de magnesio (antagonismo K/Mg).`,
      value: input.k_cmol,
      threshold: `≤ ${K_EXCESO_THRESHOLD} cmol`,
    });
  }

  // Desequilibrio Ca/Mg
  if (input.ca_cmol !== null && input.mg_cmol !== null && input.mg_cmol > 0) {
    const caMgRatio = input.ca_cmol / input.mg_cmol;
    if (caMgRatio < 2 || caMgRatio > 5) {
      alerts.push({
        type: 'ca_mg_desequilibrio',
        severity: 'medio',
        message: `Relación Ca/Mg = ${caMgRatio.toFixed(1)} fuera del rango óptimo (2-5). Afecta absorción de nutrientes y estructura del suelo.`,
        value: caMgRatio,
        threshold: '2.0 – 5.0',
      });
    }
  }

  // Bloqueo: pH crítico + Al tóxico → no recomendar NPK
  const blocked = alerts.some(a => a.type === 'ph_critico' || a.type === 'al_toxico' || a.type === 'al_sat_alta');

  return { blocked, alerts };
}

// ══════════════════════════════════════════════════════════════
// §5 — Kamprath Liming Algorithm (Encalado)
// ══════════════════════════════════════════════════════════════

function calculateAlSaturation(input: SoilAnalysisInput): number | null {
  if (input.al_cmol == null || input.cice == null || input.cice <= 0) return null;
  return input.al_cmol / input.cice;
}

/**
 * Approximate Al saturation from pH when Al data is unavailable.
 * Based on empirical correlations for tropical Andisoles/Ultisoles.
 * pH 4.0 → ~60% Al sat, pH 5.0 → ~25%, pH 5.5 → ~10%, pH 6.0+ → ~2%
 */
function estimateAlSatFromPH(ph: number): number {
  if (ph >= 6.0) return 0.02;
  if (ph >= 5.5) return 0.02 + (6.0 - ph) / 0.5 * 0.08;   // 2-10%
  if (ph >= 5.0) return 0.10 + (5.5 - ph) / 0.5 * 0.15;   // 10-25%
  if (ph >= 4.5) return 0.25 + (5.0 - ph) / 0.5 * 0.20;   // 25-45%
  return 0.45 + (4.5 - ph) / 0.5 * 0.15;                   // 45-60%
}

export function calculateLimingRecommendation(input: SoilAnalysisInput, prnt: number = DEFAULT_PRNT): LimingRecommendation {
  const cice = input.cice ?? 5.0;

  // Determine Al saturation
  let alSat = calculateAlSaturation(input);
  let formula = '';

  if (alSat != null && !isNaN(alSat)) {
    formula = `Kamprath directo: Al_sat = Al/${cice.toFixed(1)} = ${(alSat * 100).toFixed(1)}%`;
  } else if (input.ph != null && !isNaN(input.ph)) {
    alSat = estimateAlSatFromPH(input.ph);
    formula = `Estimación heurística desde pH ${input.ph.toFixed(1)} → Al_sat ≈ ${((alSat ?? 0) * 100).toFixed(1)}%`;
  } else {
    return {
      required: false,
      reason: 'Datos insuficientes: se requiere pH o Al intercambiable para calcular encalado.',
      doseKgHa: 0,
      doseSacosHa: 0,
      prnt,
      alSatPct: 0,
      alSatMaxTolerated: AL_SAT_MAX_COFFEE * 100,
      formula: 'No calculable — datos insuficientes',
    };
  }

  // Safety: alSat should always be a number at this point
  const alSatSafe = alSat ?? 0;

  if (alSatSafe <= AL_SAT_MAX_COFFEE) {
    return {
      required: false,
      reason: `Saturación de aluminio (${(alSat * 100).toFixed(1)}%) dentro del rango tolerado (≤ ${AL_SAT_MAX_COFFEE * 100}%). No requiere encalado correctivo.`,
      doseKgHa: 0,
      doseSacosHa: 0,
      prnt,
      alSatPct: Math.round(alSat * 1000) / 10,
      alSatMaxTolerated: AL_SAT_MAX_COFFEE * 100,
      formula,
    };
  }

  // Kamprath: dose = (Al_sat_observed - Al_sat_max) × CICE × factor_equivalente / (PRNT/100)
  // Factor: 1 cmol Al neutralizado requiere ~1120 kg CaCO₃/ha (para 0-20cm, 2M kg suelo)
  // Simplified: dose(t/ha) = (Al_sat - 0.25) × CICE × 1.5 / (PRNT/100)
  const alExcess = alSat - AL_SAT_MAX_COFFEE;
  const doseRaw = alExcess * cice * 1.5; // t/ha without PRNT
  const doseCorrected = doseRaw / (prnt / 100);
  const doseKgHa = Math.round(doseCorrected * 1000);
  const doseSacosHa = Math.ceil(doseKgHa / 50);

  formula += ` → Dosis = (${(alSat * 100).toFixed(1)}% - ${AL_SAT_MAX_COFFEE * 100}%) × ${cice.toFixed(1)} × 1.5 / (${prnt}% PRNT) = ${doseCorrected.toFixed(2)} t/ha`;

  return {
    required: true,
    reason: `Saturación de aluminio ${(alSat * 100).toFixed(1)}% excede el máximo tolerado (${AL_SAT_MAX_COFFEE * 100}%). Se requiere encalado correctivo antes de fertilizar.`,
    doseKgHa,
    doseSacosHa,
    prnt,
    alSatPct: Math.round(alSat * 1000) / 10,
    alSatMaxTolerated: AL_SAT_MAX_COFFEE * 100,
    formula,
  };
}

// ══════════════════════════════════════════════════════════════
// §5 — Nutrient Sufficiency Classification
// ══════════════════════════════════════════════════════════════

function classifyP(ppm: number): NutrientStatus {
  if (ppm < P_RANGES.critico.max) return 'critico';
  if (ppm < P_RANGES.bajo.max) return 'bajo';
  if (ppm <= P_RANGES.optimo.max) return 'optimo';
  if (ppm <= P_RANGES.alto.max) return 'alto';
  return 'exceso';
}

function classifyK(cmol: number): NutrientStatus {
  if (cmol < 0.2) return 'critico';
  if (cmol < 0.4) return 'bajo';
  if (cmol <= 0.8) return 'optimo';
  if (cmol <= 1.5) return 'alto';
  return 'exceso';
}

function classifyCa(cmol: number): NutrientStatus {
  if (cmol < 2) return 'critico';
  if (cmol < 4) return 'bajo';
  if (cmol <= 8) return 'optimo';
  if (cmol <= 12) return 'alto';
  return 'exceso';
}

function classifyMg(cmol: number): NutrientStatus {
  if (cmol < 0.5) return 'critico';
  if (cmol < 1.0) return 'bajo';
  if (cmol <= 2.5) return 'optimo';
  if (cmol <= 4.0) return 'alto';
  return 'exceso';
}

function classifyMO(pct: number): NutrientStatus {
  if (pct < 2) return 'critico';
  if (pct < 4) return 'bajo';
  if (pct <= 8) return 'optimo';
  if (pct <= 12) return 'alto';
  return 'exceso';
}

function classifypH(ph: number): NutrientStatus {
  if (ph < 4.5) return 'critico';
  if (ph < 5.0) return 'bajo';
  if (ph <= 6.5) return 'optimo';
  if (ph <= 7.5) return 'alto';
  return 'exceso';
}

export function classifyNutrients(input: SoilAnalysisInput): NutrientSufficiency[] {
  const results: NutrientSufficiency[] = [];

  if (input.ph != null) results.push({ nutrient: 'pH', value: input.ph, status: classifypH(input.ph), unit: '', range: '5.0 – 6.5' });
  if (input.mo_pct != null) results.push({ nutrient: 'Materia Orgánica', value: input.mo_pct, status: classifyMO(input.mo_pct), unit: '%', range: '4.0 – 8.0' });
  if (input.p_ppm != null) results.push({ nutrient: 'Fósforo (P)', value: input.p_ppm, status: classifyP(input.p_ppm), unit: 'ppm', range: '10 – 30' });
  if (input.k_cmol != null) results.push({ nutrient: 'Potasio (K)', value: input.k_cmol, status: classifyK(input.k_cmol), unit: 'cmol', range: '0.4 – 0.8' });
  if (input.ca_cmol != null) results.push({ nutrient: 'Calcio (Ca)', value: input.ca_cmol, status: classifyCa(input.ca_cmol), unit: 'cmol', range: '4.0 – 8.0' });
  if (input.mg_cmol != null) results.push({ nutrient: 'Magnesio (Mg)', value: input.mg_cmol, status: classifyMg(input.mg_cmol), unit: 'cmol', range: '1.0 – 2.5' });

  return results;
}

// ══════════════════════════════════════════════════════════════
// §4 — IFBS (Índice Funcional Biológico del Suelo)
// ══════════════════════════════════════════════════════════════

/** Normalize with "more is better" asymptotic curve */
function normalizeMoreIsBetter(value: number, optimal: number): number {
  if (value >= optimal) return 1.0;
  return Math.max(0, value / optimal);
}

/** Normalize with bell curve (optimal range) */
function normalizeBellCurve(value: number, optMin: number, optMax: number, extremeMin: number, extremeMax: number): number {
  if (value >= optMin && value <= optMax) return 1.0;
  if (value < optMin) {
    if (value <= extremeMin) return 0;
    return (value - extremeMin) / (optMin - extremeMin);
  }
  // value > optMax
  if (value >= extremeMax) return 0;
  return (extremeMax - value) / (extremeMax - optMax);
}

export function calculateIFBS(input: SoilAnalysisInput): IFBSResult {
  // Subíndice 1: Carbono (W=0.35) — MO como proxy
  const moValue = input.mo_pct ?? 0;
  const carbonoScore = normalizeMoreIsBetter(moValue, 8.0); // Andisol target ~8%

  // Subíndice 2: Acidez (W=0.25) — pH bell curve
  const phValue = input.ph ?? 5.0;
  let acidezScore = normalizeBellCurve(phValue, PH_OPTIMO_MIN, PH_OPTIMO_MAX, 4.0, 8.0);
  // Penalización exponencial por Al sat alta
  const alSat = calculateAlSaturation(input) ?? (input.ph != null ? estimateAlSatFromPH(input.ph) : null);
  if (alSat !== null && alSat > AL_SAT_MAX_COFFEE) {
    acidezScore *= Math.max(0, 1 - (alSat - AL_SAT_MAX_COFFEE) * 3);
  }

  // Subíndice 3: Nutrición (W=0.20) — Balance catiónico
  let nutricionScore = 0.5; // Default if no data
  const cationsAvailable = input.ca_cmol != null && input.mg_cmol != null && input.k_cmol != null;
  if (cationsAvailable) {
    const caScore = normalizeBellCurve(input.ca_cmol!, 4, 8, 1, 15);
    const mgScore = normalizeBellCurve(input.mg_cmol!, 1, 2.5, 0.2, 5);
    const kScore = normalizeBellCurve(input.k_cmol!, 0.4, 0.8, 0.1, 2);
    // Ca/Mg ratio penalty
    const caMg = input.ca_cmol! / Math.max(0.01, input.mg_cmol!);
    const ratioScore = normalizeBellCurve(caMg, 2, 5, 0.5, 10);
    nutricionScore = (caScore * 0.30 + mgScore * 0.25 + kScore * 0.20 + ratioScore * 0.25);
  }
  if (input.p_ppm != null) {
    const pScore = normalizeBellCurve(input.p_ppm, 10, 30, 2, 60);
    nutricionScore = cationsAvailable ? nutricionScore * 0.7 + pScore * 0.3 : pScore;
  }

  // Subíndice 4: Integridad estructural (W=0.20) — Proxies heurísticos
  let integridadScore = 0.5; // Default sin datos observacionales
  let integridadFactors = 0;
  let integridadSum = 0;

  if (input.cobertura_vegetal_pct != null) {
    integridadSum += normalizeMoreIsBetter(input.cobertura_vegetal_pct, 80);
    integridadFactors++;
  }
  if (input.sombra_agroforestal != null) {
    integridadSum += input.sombra_agroforestal ? 0.9 : 0.3;
    integridadFactors++;
  }
  if (input.manejo_regenerativo != null) {
    integridadSum += input.manejo_regenerativo ? 1.0 : 0.4;
    integridadFactors++;
  }
  // Textura as proxy
  if (input.textura) {
    const texturaScores: Record<string, number> = {
      'Franco': 1.0, 'Franco-arcilloso': 0.85, 'Franco-arenoso': 0.75,
      'Arcilloso': 0.6, 'Arenoso': 0.5,
    };
    integridadSum += texturaScores[input.textura] ?? 0.6;
    integridadFactors++;
  }
  if (integridadFactors > 0) {
    integridadScore = integridadSum / integridadFactors;
  }

  // IFBS = Σ(Wi × Ni)
  const score =
    IFBS_WEIGHTS.carbono * carbonoScore +
    IFBS_WEIGHTS.acidez * acidezScore +
    IFBS_WEIGHTS.nutricion * nutricionScore +
    IFBS_WEIGHTS.integridad * integridadScore;

  const scorePct = Math.round(score * 100);
  const nivel = scorePct >= 80 ? 'muy_alto' : scorePct >= 60 ? 'alto' : scorePct >= 40 ? 'medio' : scorePct >= 20 ? 'bajo' : 'muy_bajo';

  const interpretations: Record<typeof nivel, string> = {
    muy_alto: 'Suelo biológicamente activo con excelente capacidad de amortiguamiento. Alta eficiencia en uso de fertilizantes.',
    alto: 'Buen vigor biológico. El suelo responde favorablemente a la fertilización y tolera estrés moderado.',
    medio: 'Capacidad biológica intermedia. Considerar enmiendas orgánicas y correctivos de acidez.',
    bajo: 'Suelo comprometido. Se requiere intervención prioritaria: encalado, materia orgánica, cobertura.',
    muy_bajo: 'Suelo biológicamente inerte. Bloquear fertilización convencional hasta corregir acidez y restablecer materia orgánica.',
  };

  return {
    score: Math.round(score * 1000) / 1000,
    scorePct,
    nivel,
    subindices: {
      carbono: { score: Math.round(carbonoScore * 100) / 100, weight: IFBS_WEIGHTS.carbono, raw: input.mo_pct },
      acidez: { score: Math.round(acidezScore * 100) / 100, weight: IFBS_WEIGHTS.acidez, raw: input.ph },
      nutricion: { score: Math.round(nutricionScore * 100) / 100, weight: IFBS_WEIGHTS.nutricion, raw: input.cice },
      integridad: { score: Math.round(integridadScore * 100) / 100, weight: IFBS_WEIGHTS.integridad, raw: null },
    },
    interpretation: interpretations[nivel],
  };
}

// ══════════════════════════════════════════════════════════════
// Main Engine — Full analysis
// ══════════════════════════════════════════════════════════════

export function analyzeSoil(input: SoilAnalysisInput): SoilIntelligenceResult {
  const toxicity = checkToxicity(input);
  const liming = calculateLimingRecommendation(input);
  const ifbs = calculateIFBS(input);
  const sufficiency = classifyNutrients(input);

  const canRecommendNPK = !toxicity.blocked;

  let summary: string;
  if (toxicity.blocked) {
    summary = `⛔ Suelo bloqueado para fertilización NPK. ${liming.required ? `Aplicar ${liming.doseKgHa} kg/ha de cal (${liming.doseSacosHa} sacos/ha) antes de fertilizar.` : ''} IFBS: ${ifbs.scorePct}/100 (${ifbs.nivel}).`;
  } else if (liming.required) {
    summary = `⚠️ Se recomienda encalado correctivo (${liming.doseKgHa} kg/ha) para optimizar la respuesta a fertilización. IFBS: ${ifbs.scorePct}/100 (${ifbs.nivel}).`;
  } else {
    summary = `✅ Suelo apto para fertilización. IFBS: ${ifbs.scorePct}/100 (${ifbs.nivel}). ${sufficiency.filter(s => s.status === 'critico').length > 0 ? 'Atención: nutrientes en nivel crítico detectados.' : 'Balance nutricional aceptable.'}`;
  }

  return { toxicity, liming, ifbs, sufficiency, canRecommendNPK, summary };
}

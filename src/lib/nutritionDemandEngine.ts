/**
 * Motor matemático determinístico de demanda nutricional para café.
 * Basado en CENICAFE y literatura agronómica.
 * - Tablas de extracción por tonelada (CENICAFE)
 * - Eficiencias de absorción (N=50%, P=30%, K=60%, etc.)
 * - Coeficientes de altitud, edad, variedad, estrés
 * - Aportes orgánicos (MO, cobertura, podas, compost)
 * - Ley de Liebig (nutriente limitante)
 * - Conversión a fertilizantes comerciales
 * - Calendario fenológico (4 aplicaciones)
 * - Integración económica (costo + ROI)
 * - Trazabilidad (explain trace)
 */

// ========== CENICAFE: Extracción por tonelada de café pergamino seco (11% humedad) ==========
export const EXTRACTION_PER_TON: Record<string, number> = {
  N: 30.9,   // kg N
  P: 2.3,    // kg P elemental → P2O5 = P * 2.29
  K: 36.9,   // kg K elemental → K2O = K * 1.2
  Ca: 4.3,   // kg Ca elemental → CaO = Ca * 1.4
  Mg: 2.3,   // kg Mg elemental → MgO = Mg * 1.66
  S: 1.2,    // kg S
  Fe: 0.107, // kg
  Mn: 0.061,
  B: 0.05,
  Cu: 0.033,
  Zn: 0.018,
};

// Eficiencias de absorción (fracción que la planta aprovecha)
export const ABSORPTION_EFFICIENCY: Record<string, number> = {
  N: 0.50, P: 0.30, K: 0.60, Ca: 0.40, Mg: 0.45, S: 0.50,
  Fe: 0.15, Mn: 0.20, B: 0.25, Cu: 0.20, Zn: 0.25,
};

// Conversión elemental → óxido (para fertilizantes)
export const TO_OXIDE: Record<string, number> = {
  P: 2.29,  // P → P2O5
  K: 1.2,   // K → K2O
  Ca: 1.4,  // Ca → CaO
  Mg: 1.66, // Mg → MgO
};

// Variedades con factor de demanda base (del seed ag_variedades)
export const VARIETY_FACTORS: Record<string, number> = {
  Caturra: 1.0, Catuaí: 1.05, Bourbon: 0.9, Typica: 0.85, Colombia: 1.12,
  Castillo: 1.15, Tabi: 1.1, Geisha: 0.9, SL28: 0.95, SL34: 1.0,
  Pacamara: 1.05, Maragogipe: 0.95, 'Mundo Novo': 1.0, 'Villa Sarchí': 0.95,
  Obatã: 1.15, Catimor: 1.1, Sarchimor: 1.12, Marsellesa: 1.12,
  Starmaya: 1.18, 'H1 Centroamérica Oro': 1.2, Parainema: 1.1,
  'IHCAFE 90': 1.12, 'Costa Rica 95': 1.12, Batian: 1.15,
  'Ruiru 11': 1.15, K7: 1.1, 'Anacafé 14': 1.12, Lempira: 1.15,
  Java: 0.95, Mokka: 0.9,
};

// Zona altitudinal → coeficiente
function zonaFromAltitud(msnm: number): 'baja' | 'media' | 'alta' {
  if (msnm < 1200) return 'baja';
  if (msnm < 1500) return 'media';
  return 'alta';
}

// Edad del cafetal (años) → factor
function factorEdad(edadAnios: number): number {
  if (edadAnios < 2) return 0.6;
  if (edadAnios < 4) return 0.85;
  if (edadAnios < 8) return 1.0;
  if (edadAnios < 15) return 1.05;
  return 0.95;
}

// Estrés fitosanitario/climático → factor (1 = sin estrés)
function factorEstres(nivel: 'bajo' | 'medio' | 'alto'): number {
  return { bajo: 1.0, medio: 1.1, alto: 1.2 }[nivel];
}

export interface OrganicInputs {
  materiaOrganicaPct?: number;  // 0-10
  coberturaViva?: boolean;
  podasRecientes?: boolean;
  compostAnualKgHa?: number;
}

export interface DemandInput {
  yieldEstimadoKgHa: number;
  areaHa: number;
  variedad: string;
  altitudMsnm: number;
  edadAnios?: number;
  estresFitosanitario?: 'bajo' | 'medio' | 'alto';
  suelo?: { pH?: number; MO?: number; P?: number; K?: number; Al?: number; CIC?: number };
  organicos?: OrganicInputs;
}

export interface NutrientDemand {
  nutriente: string;
  kgElemental: number;
  kgOxido?: number;
  eficiencia: number;
  demandaAjustada: number;
  aporteOrganico: number;
  demandaFertilizante: number;
  esLimitante: boolean;
  explainCode: string;
}

export interface FenologicPhase {
  fase: string;
  diasPostFloracion: [number, number];
  proporcionPct: number;
  nutrientesDominantes: string[];
  dosisNutrientes: Record<string, number>;
}

export interface FertilizerRecommendation {
  producto: string;
  formula: string;
  kgHa: number;
  costoUnitarioUsd?: number;
  costoTotalUsd?: number;
}

export interface DemandResult {
  demandaTotal: NutrientDemand[];
  nutrienteLimitante: string;
  fases: FenologicPhase[];
  fertilizantes: FertilizerRecommendation[];
  costoEstimadoUsd?: number;
  roiEstimado?: number;
  explainTrace: ExplainStep[];
}

export interface ExplainStep {
  step: string;
  code: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
}

/** Aporte orgánico estimado (kg/ha) por fuente */
function calcAporteOrganico(input: DemandInput, nutriente: string): number {
  const org = input.organicos ?? {};
  let aporte = 0;

  if (org.materiaOrganicaPct && org.materiaOrganicaPct >= 5 && nutriente === 'N') {
    aporte += input.yieldEstimadoKgHa * 0.02; // ~2% del yield como N orgánico
  }
  if (org.coberturaViva && nutriente === 'N') aporte += 15;
  if (org.podasRecientes && (nutriente === 'K' || nutriente === 'N')) aporte += nutriente === 'K' ? 8 : 5;
  if (org.compostAnualKgHa && org.compostAnualKgHa > 0) {
    const compostNutrients: Record<string, number> = { N: 0.015, P: 0.008, K: 0.01 };
    aporte += (org.compostAnualKgHa * (compostNutrients[nutriente] ?? 0)) || 0;
  }
  return Math.min(aporte, input.yieldEstimadoKgHa * 0.15); // cap 15% del yield
}

/** Demanda bruta por extracción CENICAFE */
function demandaBruta(yieldKgHa: number, nutriente: string): number {
  const tonHa = yieldKgHa / 1000;
  const ext = EXTRACTION_PER_TON[nutriente] ?? 0;
  return tonHa * ext;
}

/** Ley de Liebig: identifica nutriente limitante */
function findLimitante(demandas: NutrientDemand[]): string {
  const macronutrientes = ['N', 'P', 'K'];
  let minRatio = Infinity;
  let limitante = 'N';
  for (const d of demandas) {
    if (!macronutrientes.includes(d.nutriente)) continue;
    const ratio = d.demandaFertilizante / (d.demandaAjustada || 1);
    if (ratio > 0 && ratio < minRatio) {
      minRatio = ratio;
      limitante = d.nutriente;
    }
  }
  return limitante;
}

/** Convierte demanda a fertilizantes comerciales (simplificado) */
function toFertilizers(demandas: NutrientDemand[], areaHa: number): FertilizerRecommendation[] {
  const recs: FertilizerRecommendation[] = [];
  const n = demandas.find(d => d.nutriente === 'N')?.demandaFertilizante ?? 0;
  const p = demandas.find(d => d.nutriente === 'P')?.demandaFertilizante ?? 0;
  const k = demandas.find(d => d.nutriente === 'K')?.demandaFertilizante ?? 0;

  if (n > 0 || p > 0 || k > 0) {
    recs.push({
      producto: 'Fertilizante completo NPK',
      formula: '18-6-12 o similar',
      kgHa: Math.ceil((n / 0.18 + p / 0.06 + k / 0.12) / 3) * 3,
      costoUnitarioUsd: 0.45,
    });
  }
  const ca = demandas.find(d => d.nutriente === 'Ca')?.demandaFertilizante ?? 0;
  if (ca > 0) {
    recs.push({
      producto: 'Cal dolomita',
      formula: 'CaO + MgO',
      kgHa: Math.ceil(ca * 2),
      costoUnitarioUsd: 0.08,
    });
  }
  recs.forEach(r => {
    if (r.costoUnitarioUsd) r.costoTotalUsd = (r.kgHa ?? 0) * areaHa * r.costoUnitarioUsd;
  });
  return recs;
}

/** Calendario fenológico 4 aplicaciones (zonas baja/media/alta) */
const FENOLOGIA: Record<string, { fase: string; dias: [number, number]; pct: number; nutrientes: string[] }[]> = {
  baja: [
    { fase: 'cabeza_alfiler', dias: [0, 45], pct: 15, nutrientes: ['N', 'P', 'Ca'] },
    { fase: 'expansion_rapida', dias: [45, 100], pct: 35, nutrientes: ['N', 'K'] },
    { fase: 'llenado_grano', dias: [100, 150], pct: 35, nutrientes: ['K', 'N'] },
    { fase: 'maduracion', dias: [150, 220], pct: 15, nutrientes: ['K', 'Mg', 'B'] },
  ],
  media: [
    { fase: 'cabeza_alfiler', dias: [0, 55], pct: 15, nutrientes: ['N', 'P', 'Ca'] },
    { fase: 'expansion_rapida', dias: [55, 120], pct: 35, nutrientes: ['N', 'K'] },
    { fase: 'llenado_grano', dias: [120, 180], pct: 35, nutrientes: ['K', 'N'] },
    { fase: 'maduracion', dias: [180, 250], pct: 15, nutrientes: ['K', 'Mg', 'B'] },
  ],
  alta: [
    { fase: 'cabeza_alfiler', dias: [0, 65], pct: 15, nutrientes: ['N', 'P', 'Ca'] },
    { fase: 'expansion_rapida', dias: [65, 140], pct: 35, nutrientes: ['N', 'K'] },
    { fase: 'llenado_grano', dias: [140, 200], pct: 35, nutrientes: ['K', 'N'] },
    { fase: 'maduracion', dias: [200, 280], pct: 15, nutrientes: ['K', 'Mg', 'B'] },
  ],
};

/**
 * Calcula la demanda nutricional completa.
 */
export function calcFullNutrientDemand(input: DemandInput): DemandResult {
  const trace: ExplainStep[] = [];
  const zona = zonaFromAltitud(input.altitudMsnm);
  const varietyFactor = VARIETY_FACTORS[input.variedad] ?? 1.0;
  const ageFactor = factorEdad(input.edadAnios ?? 5);
  const stressFactor = factorEstres(input.estresFitosanitario ?? 'bajo');

  trace.push({
    step: 'Coeficientes',
    code: 'COEF_INIT',
    input: { zona, variedad: input.variedad, varietyFactor, ageFactor, stressFactor },
  });

  const macronutrientes = ['N', 'P', 'K', 'Ca', 'Mg', 'S'];
  const demandas: NutrientDemand[] = [];

  for (const nut of macronutrientes) {
    const bruta = demandaBruta(input.yieldEstimadoKgHa, nut);
    const eff = ABSORPTION_EFFICIENCY[nut] ?? 0.5;
    const ajustada = bruta * varietyFactor * ageFactor * stressFactor / eff;
    const aporteOrg = calcAporteOrganico(input, nut);
    const demandaFert = Math.max(0, ajustada - aporteOrg);

    const kgOxido = TO_OXIDE[nut] ? demandaFert * TO_OXIDE[nut] : undefined;

    demandas.push({
      nutriente: nut,
      kgElemental: bruta,
      kgOxido,
      eficiencia: eff,
      demandaAjustada: ajustada,
      aporteOrganico: aporteOrg,
      demandaFertilizante: demandaFert,
      esLimitante: false,
      explainCode: `DEMANDA_${nut}`,
    });
  }

  const limitante = findLimitante(demandas);
  demandas.forEach(d => { d.esLimitante = d.nutriente === limitante; });

  trace.push({
    step: 'Demanda calculada',
    code: 'DEMANDA_TOTAL',
    output: { limitante, totalN: demandas.find(d => d.nutriente === 'N')?.demandaFertilizante },
  });

  const fases: FenologicPhase[] = FENOLOGIA[zona].map(f => {
    const dosis: Record<string, number> = {};
    for (const nut of f.nutrientes) {
      const d = demandas.find(x => x.nutriente === nut);
      if (d) dosis[nut] = (d.demandaFertilizante * f.pct / 100);
    }
    return {
      fase: f.fase,
      diasPostFloracion: f.dias,
      proporcionPct: f.pct,
      nutrientesDominantes: f.nutrientes,
      dosisNutrientes: dosis,
    };
  });

  const fertilizantes = toFertilizers(demandas, input.areaHa);
  const costoEstimadoUsd = fertilizantes.reduce((s, f) => s + (f.costoTotalUsd ?? 0), 0);
  const ingresoEstimadoUsd = (input.yieldEstimadoKgHa * input.areaHa / 1000) * 4.5; // USD/kg
  const roiEstimado = costoEstimadoUsd > 0 ? (ingresoEstimadoUsd / costoEstimadoUsd) : 0;

  trace.push({
    step: 'Economía',
    code: 'ECON_ROI',
    output: { costoEstimadoUsd, roiEstimado },
  });

  return {
    demandaTotal: demandas,
    nutrienteLimitante: limitante,
    fases,
    fertilizantes,
    costoEstimadoUsd,
    roiEstimado,
    explainTrace: trace,
  };
}

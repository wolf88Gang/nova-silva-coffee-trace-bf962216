/**
 * Motor Nutricional Tramo A — Bloque 2: Modelo Matemático Determinístico
 *
 * Implements:
 *   - Nutrient demand calculation (extraction × yield / efficiency)
 *   - Altitude, age, density, variety adjustments
 *   - Organic matter contribution estimation
 *   - Limiting nutrient detection (Liebig's Law)
 *   - Environmental constraints (rulesets)
 *   - Fertilizer conversion
 *   - Application calendar splitting
 *   - Economic integration (cost, ROI)
 *
 * All calculations are deterministic and fully auditable.
 * Designed to work with incomplete data using safe fallbacks.
 */

// ══════════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════════

export type NutrientCode = 'N' | 'P' | 'K' | 'Ca' | 'Mg' | 'S' | 'B' | 'Zn' | 'Cu' | 'Fe' | 'Mn';

export interface ExtractionCoefficient {
  nutrient: NutrientCode;
  kgPerTonMin: number;
  kgPerTonMax: number;
  kgPerTonDefault: number;
}

export interface EfficiencyCoefficient {
  nutrient: NutrientCode;
  absorptionRate: number; // 0-1
}

export interface PlotContext {
  areaHa: number;
  altitudMsnm: number;
  edadAnios: number;
  plantasPorHa: number;
  variedad: string | null;
  textura: string | null;
  pendiente: number | null; // %
  // Organic matter inputs
  materiaOrganicaPct: number | null;
  coberturaVegetalPct: number | null;
  residuosPoda: boolean;
  compost: boolean;
  // Stress factors
  royaPct: number | null;  // % incidencia
  brocaPct: number | null;
  sequiaProlongada: boolean;
  lluviaExcesiva: boolean;
}

export interface SoilSupply {
  N: number | null;
  P: number | null;
  K: number | null;
  Ca: number | null;
  Mg: number | null;
  S: number | null;
}

export interface Ruleset {
  region: string;
  pais: string;
  version: number;
  maxNKgHa: number | null;
  maxPKgHa: number | null;
}

export interface YieldTarget {
  yieldTonHa: number;       // Rendimiento objetivo en ton/ha
  intervalError: number;     // ±ton
  confianza: 'alta' | 'media' | 'baja';
  fuente: 'nova_yield' | 'historico' | 'regional' | 'manual';
}

export interface NutrientDemandResult {
  nutrient: NutrientCode;
  nombre: string;
  tipo: 'macro_primario' | 'macro_secundario' | 'micro';
  extractionKgPerTon: number;
  demandaBaseKgHa: number;       // extraction × yield
  coefAltitud: number;
  coefEdad: number;
  coefVariedad: number;
  coefEstres: number;
  demandaAjustadaKgHa: number;  // after adjustments
  aportesSueloKgHa: number;
  aporteOrganicoKgHa: number;
  eficienciaAbsorcion: number;
  dosisNetaKgHa: number;        // (demand - supply) / efficiency
  dosisConPerdidasKgHa: number; // + loss factor
  limitadoPorRuleset: boolean;
  dosisFinalKgHa: number;
  indiceSuficiencia: number;    // supply / demand (0-∞)
  indiceLimitacion: number;     // 1 - min(1, sufficiency)
}

export interface LimitingNutrientResult {
  nutrient: NutrientCode;
  nombre: string;
  indiceLimitacion: number;
  impactoRendimiento: string;
  explicacion: string;
}

export interface FertilizerRecommendation {
  nombre: string;
  tipo: string;
  cantidadKgHa: number;
  cantidadTotal: number; // × area
  nutrientesAportados: Partial<Record<NutrientCode, number>>;
  costoEstimadoUsd: number | null;
}

export interface ApplicationEvent {
  fase: string;
  numero: number;
  fechaEstimada: string | null;
  porcentajeDosis: number;
  nutrientes: Partial<Record<NutrientCode, number>>;
  tipoAplicacion: 'edáfica' | 'foliar';
  manoDeObraJornales: number;
  duracionEstimadaHoras: number;
}

export interface NutritionPlanResult {
  yieldTarget: YieldTarget;
  demandas: NutrientDemandResult[];
  nutrienteLimitante: LimitingNutrientResult | null;
  fertilizantes: FertilizerRecommendation[];
  calendario: ApplicationEvent[];
  costoTotalEstimadoUsd: number;
  roiEstimado: number | null;
  restriccionesAplicadas: string[];
  engineVersion: string;
  explainTrace: string[];
}

// ══════════════════════════════════════════════════════════════
// Constants — Extraction per ton café pergamino seco (CENICAFE)
// ══════════════════════════════════════════════════════════════

const ENGINE_VERSION = 'tramo_a_v1.0';

const EXTRACTION_TABLE: ExtractionCoefficient[] = [
  { nutrient: 'N',  kgPerTonMin: 40, kgPerTonMax: 50, kgPerTonDefault: 45 },
  { nutrient: 'P',  kgPerTonMin: 5,  kgPerTonMax: 7,  kgPerTonDefault: 6 },
  { nutrient: 'K',  kgPerTonMin: 45, kgPerTonMax: 60, kgPerTonDefault: 52 },
  { nutrient: 'Ca', kgPerTonMin: 10, kgPerTonMax: 15, kgPerTonDefault: 12 },
  { nutrient: 'Mg', kgPerTonMin: 5,  kgPerTonMax: 8,  kgPerTonDefault: 6 },
  { nutrient: 'S',  kgPerTonMin: 3,  kgPerTonMax: 5,  kgPerTonDefault: 4 },
];

const EFFICIENCY_TABLE: EfficiencyCoefficient[] = [
  { nutrient: 'N',  absorptionRate: 0.50 },
  { nutrient: 'P',  absorptionRate: 0.30 },
  { nutrient: 'K',  absorptionRate: 0.60 },
  { nutrient: 'Ca', absorptionRate: 0.70 },
  { nutrient: 'Mg', absorptionRate: 0.65 },
  { nutrient: 'S',  absorptionRate: 0.50 },
];

const NUTRIENT_NAMES: Record<NutrientCode, { nombre: string; tipo: 'macro_primario' | 'macro_secundario' | 'micro' }> = {
  N:  { nombre: 'Nitrógeno', tipo: 'macro_primario' },
  P:  { nombre: 'Fósforo',   tipo: 'macro_primario' },
  K:  { nombre: 'Potasio',   tipo: 'macro_primario' },
  Ca: { nombre: 'Calcio',    tipo: 'macro_secundario' },
  Mg: { nombre: 'Magnesio',  tipo: 'macro_secundario' },
  S:  { nombre: 'Azufre',    tipo: 'macro_secundario' },
  B:  { nombre: 'Boro',      tipo: 'micro' },
  Zn: { nombre: 'Zinc',      tipo: 'micro' },
  Cu: { nombre: 'Cobre',     tipo: 'micro' },
  Fe: { nombre: 'Hierro',    tipo: 'micro' },
  Mn: { nombre: 'Manganeso', tipo: 'micro' },
};

// Variety coefficients (coeficiente_nutricional)
const VARIETY_COEFFICIENTS: Record<string, number> = {
  'Caturra': 1.00,
  'Catuaí': 1.05,
  'Catimor': 0.95,
  'Sarchimor': 0.95,
  'SL28': 1.10,
  'SL34': 1.08,
  'Geisha': 0.90,
  'Bourbon': 1.02,
  'Typica': 0.98,
  'Pacamara': 1.05,
  'Castillo': 0.97,
  'Colombia': 0.96,
  'Obatá': 0.98,
  'Mundo Novo': 1.03,
  'Marsellesa': 0.95,
};

// Loss factors by texture
const LOSS_FACTORS: Record<string, number> = {
  'Arenoso': 1.20,       // 20% extra loss (lixiviación)
  'Franco-arenoso': 1.10,
  'Franco': 1.00,        // Base
  'Franco-arcilloso': 1.05,
  'Arcilloso': 1.08,     // P fixation
};

// Phenological calendar for application splitting
const CALENDAR_PHASES = [
  { fase: 'post_cosecha',       porcentaje: 0.25, mes: 1,  tipo: 'edáfica' as const, descripcion: 'Recuperación post-cosecha, alta demanda N' },
  { fase: 'crecimiento_vegetativo', porcentaje: 0.30, mes: 4, tipo: 'edáfica' as const, descripcion: 'Máxima expansión vegetativa, demanda NPK' },
  { fase: 'floracion',          porcentaje: 0.20, mes: 6,  tipo: 'edáfica' as const, descripcion: 'Floración-cuajado, demanda B y Zn foliar' },
  { fase: 'llenado_fruto',      porcentaje: 0.25, mes: 8,  tipo: 'edáfica' as const, descripcion: 'Llenado de fruto, alta demanda K' },
];

// ══════════════════════════════════════════════════════════════
// Coefficient Calculators
// ══════════════════════════════════════════════════════════════

export function getAltitudeCoefficient(altitudMsnm: number): number {
  if (altitudMsnm > 1500) return 0.90;
  if (altitudMsnm >= 1200) return 1.00;
  return 1.10;
}

export function getAgeCoefficient(edadAnios: number): number {
  if (edadAnios <= 2) return 0.60;
  if (edadAnios <= 6) return 1.00;
  if (edadAnios <= 10) return 0.90;
  return 0.75;
}

export function getVarietyCoefficient(variedad: string | null): number {
  if (!variedad) return 1.00;
  // Fuzzy match
  const key = Object.keys(VARIETY_COEFFICIENTS).find(
    k => k.toLowerCase() === variedad.toLowerCase() || variedad.toLowerCase().includes(k.toLowerCase())
  );
  return key ? VARIETY_COEFFICIENTS[key] : 1.00;
}

export function getStressCoefficient(plot: PlotContext): number {
  let coef = 1.00;
  // Phytosanitary stress reduces demand (avoid wasting fertilizer on sick plants)
  if (plot.royaPct != null && plot.royaPct > 40) {
    coef *= Math.max(0.70, 1 - (plot.royaPct - 40) / 100);
  }
  if (plot.brocaPct != null && plot.brocaPct > 5) {
    coef *= Math.max(0.85, 1 - plot.brocaPct / 100);
  }
  // Climate stress adjustments
  if (plot.sequiaProlongada) {
    coef *= 0.85; // Reduce N, increase K relative weight
  }
  if (plot.lluviaExcesiva) {
    coef *= 0.90; // Higher leaching losses handled separately
  }
  return Math.round(coef * 100) / 100;
}

export function getLossFactor(textura: string | null): number {
  if (!textura) return 1.00;
  return LOSS_FACTORS[textura] ?? 1.00;
}

// ══════════════════════════════════════════════════════════════
// Organic Matter Contribution Estimation (§4 Tramo A)
// ══════════════════════════════════════════════════════════════

export function estimateOrganicContribution(
  moPct: number | null,
  cobertura: number | null,
  residuosPoda: boolean,
  compost: boolean
): Partial<Record<NutrientCode, number>> {
  const contributions: Partial<Record<NutrientCode, number>> = {};

  // N release from MO mineralization: ~30-50 kg N/ha per 1% MO above 4%
  if (moPct != null && moPct > 4) {
    const moExcess = moPct - 4;
    contributions.N = Math.round(moExcess * 12); // Conservative: 12 kg N per 1% excess
    contributions.S = Math.round(moExcess * 2);
  }

  // Cover crop contribution
  if (cobertura != null && cobertura > 60) {
    contributions.N = (contributions.N ?? 0) + Math.round((cobertura - 60) * 0.3);
    contributions.K = Math.round((cobertura - 60) * 0.15);
  }

  // Pruning residues
  if (residuosPoda) {
    contributions.K = (contributions.K ?? 0) + 8;
    contributions.Ca = 5;
  }

  // Compost
  if (compost) {
    contributions.N = (contributions.N ?? 0) + 15;
    contributions.P = 5;
    contributions.K = (contributions.K ?? 0) + 10;
    contributions.Ca = 8;
    contributions.Mg = 3;
  }

  return contributions;
}

// ══════════════════════════════════════════════════════════════
// Core Demand Calculator
// ══════════════════════════════════════════════════════════════

export function calculateNutrientDemands(
  yieldTarget: YieldTarget,
  plot: PlotContext,
  soilSupply: SoilSupply,
  ruleset: Ruleset | null
): { demandas: NutrientDemandResult[]; restricciones: string[]; trace: string[] } {
  const trace: string[] = [];
  const restricciones: string[] = [];

  const coefAltitud = getAltitudeCoefficient(plot.altitudMsnm);
  const coefEdad = getAgeCoefficient(plot.edadAnios);
  const coefVariedad = getVarietyCoefficient(plot.variedad);
  const coefEstres = getStressCoefficient(plot);
  const lossFactor = getLossFactor(plot.textura);

  trace.push(`Yield objetivo: ${yieldTarget.yieldTonHa} ton/ha (${yieldTarget.confianza})`);
  trace.push(`Coeficientes: altitud=${coefAltitud} edad=${coefEdad} variedad=${coefVariedad} estrés=${coefEstres} pérdidas=${lossFactor}`);

  const organicContributions = estimateOrganicContribution(
    plot.materiaOrganicaPct,
    plot.coberturaVegetalPct,
    plot.residuosPoda,
    plot.compost
  );

  if (Object.keys(organicContributions).length > 0) {
    trace.push(`Aporte orgánico estimado: ${JSON.stringify(organicContributions)}`);
  }

  const demandas: NutrientDemandResult[] = EXTRACTION_TABLE.map(ext => {
    const nutrientInfo = NUTRIENT_NAMES[ext.nutrient];
    const efficiency = EFFICIENCY_TABLE.find(e => e.nutrient === ext.nutrient)?.absorptionRate ?? 0.50;

    // Base demand = extraction × yield
    const demandaBase = ext.kgPerTonDefault * yieldTarget.yieldTonHa;

    // Adjusted demand with contextual factors
    const demandaAjustada = demandaBase * coefAltitud * coefEdad * coefVariedad * coefEstres;

    // Soil supply (convert units — simplified for macros)
    const soilValue = soilSupply[ext.nutrient as keyof SoilSupply] ?? 0;
    const aportesSuelo = soilValue; // Already in kg/ha equivalent

    // Organic contribution
    const aporteOrganico = organicContributions[ext.nutrient] ?? 0;

    // Net dose = (demand - supply) / efficiency
    const netNeed = Math.max(0, demandaAjustada - aportesSuelo - aporteOrganico);
    const dosisNeta = netNeed / efficiency;

    // With loss factor
    const dosisConPerdidas = dosisNeta * lossFactor;

    // Environmental constraints
    let dosisFinal = dosisConPerdidas;
    let limitado = false;

    if (ruleset) {
      if (ext.nutrient === 'N' && ruleset.maxNKgHa != null && dosisFinal > ruleset.maxNKgHa) {
        restricciones.push(`N limitado de ${Math.round(dosisFinal)} a ${ruleset.maxNKgHa} kg/ha por ruleset ${ruleset.region} v${ruleset.version}`);
        dosisFinal = ruleset.maxNKgHa;
        limitado = true;
      }
      if (ext.nutrient === 'P' && ruleset.maxPKgHa != null && dosisFinal > ruleset.maxPKgHa) {
        restricciones.push(`P limitado de ${Math.round(dosisFinal)} a ${ruleset.maxPKgHa} kg/ha por ruleset ${ruleset.region} v${ruleset.version}`);
        dosisFinal = ruleset.maxPKgHa;
        limitado = true;
      }
    }

    // Sufficiency index
    const totalSupply = aportesSuelo + aporteOrganico;
    const indiceSuficiencia = demandaAjustada > 0 ? totalSupply / demandaAjustada : 1;
    const indiceLimitacion = Math.max(0, 1 - Math.min(1, indiceSuficiencia));

    return {
      nutrient: ext.nutrient,
      nombre: nutrientInfo.nombre,
      tipo: nutrientInfo.tipo,
      extractionKgPerTon: ext.kgPerTonDefault,
      demandaBaseKgHa: round2(demandaBase),
      coefAltitud,
      coefEdad,
      coefVariedad,
      coefEstres,
      demandaAjustadaKgHa: round2(demandaAjustada),
      aportesSueloKgHa: round2(aportesSuelo),
      aporteOrganicoKgHa: round2(aporteOrganico),
      eficienciaAbsorcion: efficiency,
      dosisNetaKgHa: round2(dosisNeta),
      dosisConPerdidasKgHa: round2(dosisConPerdidas),
      limitadoPorRuleset: limitado,
      dosisFinalKgHa: round2(dosisFinal),
      indiceSuficiencia: round2(indiceSuficiencia),
      indiceLimitacion: round2(indiceLimitacion),
    };
  });

  return { demandas, restricciones, trace };
}

// ══════════════════════════════════════════════════════════════
// Limiting Nutrient Detection (Liebig's Law of Minimum)
// ══════════════════════════════════════════════════════════════

export function detectLimitingNutrient(demandas: NutrientDemandResult[]): LimitingNutrientResult | null {
  const macros = demandas.filter(d => d.tipo === 'macro_primario' || d.tipo === 'macro_secundario');
  if (macros.length === 0) return null;

  const limitante = macros.reduce((min, d) =>
    d.indiceSuficiencia < min.indiceSuficiencia ? d : min
  );

  if (limitante.indiceLimitacion <= 0.05) return null; // All sufficient

  const severidad = limitante.indiceLimitacion > 0.5 ? 'severa' : limitante.indiceLimitacion > 0.3 ? 'moderada' : 'leve';

  return {
    nutrient: limitante.nutrient,
    nombre: limitante.nombre,
    indiceLimitacion: limitante.indiceLimitacion,
    impactoRendimiento: `Reducción potencial de rendimiento: ~${Math.round(limitante.indiceLimitacion * 100)}%`,
    explicacion: `El factor principal que limita el rendimiento es ${limitante.nombre} (índice de suficiencia: ${(limitante.indiceSuficiencia * 100).toFixed(0)}%). Deficiencia ${severidad}. ${
      limitante.nutrient === 'K' ? 'Crítico para llenado de fruto y transporte de azúcares.' :
      limitante.nutrient === 'N' ? 'Esencial para crecimiento vegetativo y fotosíntesis.' :
      limitante.nutrient === 'P' ? 'Clave para desarrollo radicular y floración.' :
      `Importante para funciones metabólicas generales.`
    }`,
  };
}

// ══════════════════════════════════════════════════════════════
// Fertilizer Conversion
// ══════════════════════════════════════════════════════════════

interface Fertilizer {
  nombre: string;
  tipo: string;
  pctN: number;
  pctP: number;
  pctK: number;
  pctCa: number;
  pctMg: number;
  pctS: number;
  precioUsdKg: number | null;
}

const DEFAULT_FERTILIZERS: Fertilizer[] = [
  { nombre: 'Urea 46-0-0',          tipo: 'granular', pctN: 46, pctP: 0,  pctK: 0,  pctCa: 0, pctMg: 0, pctS: 0,  precioUsdKg: 0.55 },
  { nombre: 'DAP 18-46-0',          tipo: 'granular', pctN: 18, pctP: 46, pctK: 0,  pctCa: 0, pctMg: 0, pctS: 0,  precioUsdKg: 0.72 },
  { nombre: 'KCl 0-0-60',           tipo: 'granular', pctN: 0,  pctP: 0,  pctK: 60, pctCa: 0, pctMg: 0, pctS: 0,  precioUsdKg: 0.48 },
  { nombre: 'Sulfato de Magnesio',  tipo: 'granular', pctN: 0,  pctP: 0,  pctK: 0,  pctCa: 0, pctMg: 16, pctS: 13, precioUsdKg: 0.35 },
  { nombre: 'Cal Dolomita',         tipo: 'enmienda', pctN: 0,  pctP: 0,  pctK: 0,  pctCa: 30, pctMg: 18, pctS: 0, precioUsdKg: 0.08 },
];

export function convertToFertilizers(
  demandas: NutrientDemandResult[],
  areaHa: number,
  fertilizers: Fertilizer[] = DEFAULT_FERTILIZERS
): FertilizerRecommendation[] {
  const recommendations: FertilizerRecommendation[] = [];

  // Strategy: Pick primary source for N, P, K individually
  const needN = demandas.find(d => d.nutrient === 'N')?.dosisFinalKgHa ?? 0;
  const needP = demandas.find(d => d.nutrient === 'P')?.dosisFinalKgHa ?? 0;
  const needK = demandas.find(d => d.nutrient === 'K')?.dosisFinalKgHa ?? 0;
  const needMg = demandas.find(d => d.nutrient === 'Mg')?.dosisFinalKgHa ?? 0;

  // N source: Urea
  if (needN > 0) {
    const urea = fertilizers.find(f => f.nombre.includes('Urea'));
    if (urea && urea.pctN > 0) {
      const kgHa = round2(needN / (urea.pctN / 100));
      recommendations.push({
        nombre: urea.nombre,
        tipo: urea.tipo,
        cantidadKgHa: kgHa,
        cantidadTotal: round2(kgHa * areaHa),
        nutrientesAportados: { N: needN },
        costoEstimadoUsd: urea.precioUsdKg ? round2(kgHa * areaHa * urea.precioUsdKg) : null,
      });
    }
  }

  // P source: DAP (also contributes some N)
  if (needP > 0) {
    const dap = fertilizers.find(f => f.nombre.includes('DAP'));
    if (dap && dap.pctP > 0) {
      const kgHa = round2(needP / (dap.pctP / 100));
      const nFromDap = round2(kgHa * dap.pctN / 100);
      recommendations.push({
        nombre: dap.nombre,
        tipo: dap.tipo,
        cantidadKgHa: kgHa,
        cantidadTotal: round2(kgHa * areaHa),
        nutrientesAportados: { P: needP, N: nFromDap },
        costoEstimadoUsd: dap.precioUsdKg ? round2(kgHa * areaHa * dap.precioUsdKg) : null,
      });
    }
  }

  // K source: KCl
  if (needK > 0) {
    const kcl = fertilizers.find(f => f.nombre.includes('KCl'));
    if (kcl && kcl.pctK > 0) {
      const kgHa = round2(needK / (kcl.pctK / 100));
      recommendations.push({
        nombre: kcl.nombre,
        tipo: kcl.tipo,
        cantidadKgHa: kgHa,
        cantidadTotal: round2(kgHa * areaHa),
        nutrientesAportados: { K: needK },
        costoEstimadoUsd: kcl.precioUsdKg ? round2(kgHa * areaHa * kcl.precioUsdKg) : null,
      });
    }
  }

  // Mg source
  if (needMg > 5) {
    const mgSrc = fertilizers.find(f => f.pctMg > 0 && f.tipo !== 'enmienda');
    if (mgSrc) {
      const kgHa = round2(needMg / (mgSrc.pctMg / 100));
      recommendations.push({
        nombre: mgSrc.nombre,
        tipo: mgSrc.tipo,
        cantidadKgHa: kgHa,
        cantidadTotal: round2(kgHa * areaHa),
        nutrientesAportados: { Mg: needMg },
        costoEstimadoUsd: mgSrc.precioUsdKg ? round2(kgHa * areaHa * mgSrc.precioUsdKg) : null,
      });
    }
  }

  return recommendations;
}

// ══════════════════════════════════════════════════════════════
// Application Calendar
// ══════════════════════════════════════════════════════════════

export function buildApplicationCalendar(
  demandas: NutrientDemandResult[],
  areaHa: number,
  fechaInicio: Date = new Date()
): ApplicationEvent[] {
  return CALENDAR_PHASES.map((phase, idx) => {
    const nutrientes: Partial<Record<NutrientCode, number>> = {};
    demandas.forEach(d => {
      const amount = d.dosisFinalKgHa * phase.porcentaje;
      if (amount > 0) nutrientes[d.nutrient] = round2(amount);
    });

    // Estimate labor: ~0.5 jornales per hectare per application
    const manoDeObra = Math.ceil(areaHa * 0.5);

    const fecha = new Date(fechaInicio);
    fecha.setMonth(fecha.getMonth() + phase.mes);

    return {
      fase: phase.fase,
      numero: idx + 1,
      fechaEstimada: fecha.toISOString().split('T')[0],
      porcentajeDosis: phase.porcentaje,
      nutrientes,
      tipoAplicacion: phase.tipo,
      manoDeObraJornales: manoDeObra,
      duracionEstimadaHoras: manoDeObra * 6,
    };
  });
}

// ══════════════════════════════════════════════════════════════
// Economic Integration
// ══════════════════════════════════════════════════════════════

export function estimateROI(
  costoFertilizantesUsd: number,
  costoManoObraUsd: number,
  yieldIncrementalTon: number,
  precioCafePorKg: number = 2.80
): number | null {
  const totalCosto = costoFertilizantesUsd + costoManoObraUsd;
  if (totalCosto <= 0) return null;
  const ingresoIncremental = yieldIncrementalTon * 1000 * precioCafePorKg;
  return round2((ingresoIncremental - totalCosto) / totalCosto);
}

// ══════════════════════════════════════════════════════════════
// Main Orchestrator
// ══════════════════════════════════════════════════════════════

export function generateNutritionPlan(
  yieldTarget: YieldTarget,
  plot: PlotContext,
  soilSupply: SoilSupply,
  ruleset: Ruleset | null = null,
  coffeePricePerKg: number = 2.80,
  laborCostPerDay: number = 25.0
): NutritionPlanResult {
  const trace: string[] = [`Motor Nutricional ${ENGINE_VERSION}`];

  // Step 1: Calculate demands
  const { demandas, restricciones, trace: demandTrace } = calculateNutrientDemands(yieldTarget, plot, soilSupply, ruleset);
  trace.push(...demandTrace);

  // Step 2: Detect limiting nutrient
  const nutrienteLimitante = detectLimitingNutrient(demandas);
  if (nutrienteLimitante) {
    trace.push(`Nutriente limitante: ${nutrienteLimitante.nombre} (limitación: ${(nutrienteLimitante.indiceLimitacion * 100).toFixed(0)}%)`);
  }

  // Step 3: Convert to fertilizers
  const fertilizantes = convertToFertilizers(demandas, plot.areaHa);
  const costoFertilizantes = fertilizantes.reduce((sum, f) => sum + (f.costoEstimadoUsd ?? 0), 0);
  trace.push(`Fertilizantes: ${fertilizantes.length} productos, costo total: $${costoFertilizantes.toFixed(2)}`);

  // Step 4: Build calendar
  const calendario = buildApplicationCalendar(demandas, plot.areaHa);
  const totalJornales = calendario.reduce((sum, e) => sum + e.manoDeObraJornales, 0);
  const costoManoObra = totalJornales * laborCostPerDay;

  // Step 5: Economic analysis
  const costoTotal = costoFertilizantes + costoManoObra;
  // Assume nutrition can improve yield by ~20% of limitation
  const yieldIncremental = nutrienteLimitante
    ? yieldTarget.yieldTonHa * nutrienteLimitante.indiceLimitacion * 0.20
    : yieldTarget.yieldTonHa * 0.05;
  const roi = estimateROI(costoFertilizantes, costoManoObra, yieldIncremental, coffeePricePerKg);

  trace.push(`Costo total: $${costoTotal.toFixed(2)} (fertilizantes: $${costoFertilizantes.toFixed(2)} + mano obra: $${costoManoObra.toFixed(2)})`);
  if (roi != null) trace.push(`ROI estimado: ${(roi * 100).toFixed(0)}%`);

  return {
    yieldTarget,
    demandas,
    nutrienteLimitante,
    fertilizantes,
    calendario,
    costoTotalEstimadoUsd: round2(costoTotal),
    roiEstimado: roi,
    restriccionesAplicadas: restricciones,
    engineVersion: ENGINE_VERSION,
    explainTrace: trace,
  };
}

// ══════════════════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════════════════

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ══════════════════════════════════════════════════════════════
// Exports for testing / UI
// ══════════════════════════════════════════════════════════════

export { EXTRACTION_TABLE, EFFICIENCY_TABLE, VARIETY_COEFFICIENTS, CALENDAR_PHASES, ENGINE_VERSION };

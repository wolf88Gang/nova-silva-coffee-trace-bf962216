/**
 * Valoración de Activos de Carbono — MRV
 * Fórmula: Carbono = N_Árboles × 10.9 kg C × speciesFactor × ageFactor
 *          CO2 = Carbono × 3.67 / 1000
 *          Valor = CO2 × precio/tCO2
 */

// ── Constants ──

const BASE_CARBON_KG_PER_TREE = 10.9;
const C_TO_CO2_FACTOR = 3.67;

export const SPECIES_FACTORS: Record<string, number> = {
  inga: 1.00,
  erythrina: 0.85,
  cordia: 1.15,
  cedrela: 1.30,
  mixed: 1.00,
  unknown: 0.90,
};

export type AgeCategory = 'young' | 'medium' | 'mature' | 'old';

export const AGE_FACTORS: Record<AgeCategory, number> = {
  young: 0.60,    // < 5 years
  medium: 0.85,   // 5-10 years
  mature: 1.00,   // 10-20 years
  old: 1.15,      // > 20 years
};

export const PRICE_TIERS = {
  conservative: 10.00,
  market: 15.00,
  premium: 25.00,
} as const;

const HAIRCUTS = {
  noMrv: 0.50,
  withMrvNoCert: 0.30,
  withMrvAndCert: 0.15,
};

// ── Types ──

export interface CarbonInput {
  treeCount: number;
  species: keyof typeof SPECIES_FACTORS;
  ageCategory: AgeCategory;
  areaHa: number;
  hasMrv: boolean;
  hasCertification: boolean;
}

export interface CarbonValuation {
  carbonTotalKg: number;
  co2Tonnes: number;
  co2PerHa: number;
  valuations: {
    conservative: number;
    market: number;
    premium: number;
  };
  guaranteeEligibility: {
    eligible: boolean;
    haircut: number;
    eligibleValue: number;
    reason: string;
  };
  treeDensityPerHa: number;
}

// ── Engine ──

export function calculateCarbonValuation(input: CarbonInput): CarbonValuation {
  const speciesFactor = SPECIES_FACTORS[input.species] ?? 0.90;
  const ageFactor = AGE_FACTORS[input.ageCategory];

  const carbonPerTree = BASE_CARBON_KG_PER_TREE * speciesFactor * ageFactor;
  const carbonTotalKg = input.treeCount * carbonPerTree;
  const co2Tonnes = (carbonTotalKg * C_TO_CO2_FACTOR) / 1000;
  const co2PerHa = input.areaHa > 0 ? co2Tonnes / input.areaHa : 0;

  const valuations = {
    conservative: co2Tonnes * PRICE_TIERS.conservative,
    market: co2Tonnes * PRICE_TIERS.market,
    premium: co2Tonnes * PRICE_TIERS.premium,
  };

  // Guarantee eligibility
  const haircut = input.hasMrv && input.hasCertification
    ? HAIRCUTS.withMrvAndCert
    : input.hasMrv
    ? HAIRCUTS.withMrvNoCert
    : HAIRCUTS.noMrv;

  const eligibleValue = valuations.conservative * (1 - haircut);
  const treeDensityPerHa = input.areaHa > 0 ? input.treeCount / input.areaHa : 0;

  let eligible = eligibleValue >= 500 && treeDensityPerHa >= 50;
  let reason = '';
  if (eligibleValue < 500) reason = `Valor elegible ($${eligibleValue.toFixed(0)}) menor al mínimo de $500`;
  else if (treeDensityPerHa < 50) reason = `Densidad (${treeDensityPerHa.toFixed(0)} árboles/ha) menor al mínimo de 50`;
  else reason = `Cumple requisitos — ${Math.round((1 - haircut) * 100)}% del valor conservador`;

  return {
    carbonTotalKg: Math.round(carbonTotalKg),
    co2Tonnes: Math.round(co2Tonnes * 100) / 100,
    co2PerHa: Math.round(co2PerHa * 100) / 100,
    valuations: {
      conservative: Math.round(valuations.conservative * 100) / 100,
      market: Math.round(valuations.market * 100) / 100,
      premium: Math.round(valuations.premium * 100) / 100,
    },
    guaranteeEligibility: { eligible, haircut, eligibleValue: Math.round(eligibleValue * 100) / 100, reason },
    treeDensityPerHa: Math.round(treeDensityPerHa),
  };
}

// ── Age helper ──

export function getAgeCategory(years: number): AgeCategory {
  if (years < 5) return 'young';
  if (years <= 10) return 'medium';
  if (years <= 20) return 'mature';
  return 'old';
}

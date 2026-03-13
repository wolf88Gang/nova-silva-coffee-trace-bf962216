/**
 * Nova Silva Pricing Engine v2
 *
 * Two pricing models:
 *   farmer     → finca privada, finca empresarial  (base + escala + packs)
 *   aggregator → cooperativa, beneficio, exportador (plan tiers + packs)
 */

// ── Pricing model ──

export type PricingModel = 'farmer' | 'aggregator';

/**
 * Solo productores pequeños individuales (finca privada) usan pricing farmer.
 * Cualquier organización que compre a terceros o gestione productores
 * (beneficio, finca empresarial, cooperativa, exportador) paga como aggregator.
 */
export function getPricingModel(orgType: string): PricingModel {
  if (orgType === 'productor_privado') return 'farmer';
  return 'aggregator'; // cooperativa, beneficio, finca_empresarial, productor_empresarial, exportador
}

// ═══════════════════════════════════════════════
// FARMER MODEL  — base + escala de parcelas + packs
// ═══════════════════════════════════════════════

export const FARMER_BASE = 15; // USD/month

export interface FarmerScaleTier {
  label: string;
  minPlots: number;
  maxPlots: number | null;
  surcharge: number; // USD/month on top of base
}

export const FARMER_SCALE: FarmerScaleTier[] = [
  { label: '1–10 parcelas',   minPlots: 1,   maxPlots: 10,   surcharge: 0 },
  { label: '11–50 parcelas',  minPlots: 11,  maxPlots: 50,   surcharge: 10 },
  { label: '51–200 parcelas', minPlots: 51,  maxPlots: 200,  surcharge: 30 },
  { label: '200+ parcelas',   minPlots: 201, maxPlots: null,  surcharge: 60 },
];

export function getFarmerScaleSurcharge(plotCount: number): number {
  for (let i = FARMER_SCALE.length - 1; i >= 0; i--) {
    if (plotCount >= FARMER_SCALE[i].minPlots) return FARMER_SCALE[i].surcharge;
  }
  return 0;
}

export function getFarmerScaleTierIndex(plotCount: number): number {
  for (let i = FARMER_SCALE.length - 1; i >= 0; i--) {
    if (plotCount >= FARMER_SCALE[i].minPlots) return i;
  }
  return 0;
}

export interface PackDef {
  key: string;
  label: string;
  desc: string;
  price: number;       // USD/month
  modules: string[];   // module keys included
  includes: string[];  // human-readable features
}

export const FARMER_PACKS: PackDef[] = [
  {
    key: 'agronomia', label: 'Agronomía', price: 12,
    desc: 'Nutrición + Nova Guard + Nova Yield',
    modules: ['nutricion', 'guard', 'yield'],
    includes: ['Nutrición vegetal', 'Nova Guard (sanidad)', 'Nova Yield (estimación cosecha)'],
  },
  {
    key: 'cumplimiento', label: 'Cumplimiento', price: 10,
    desc: 'EUDR + Trazabilidad avanzada + Documentos',
    modules: ['eudr', 'trazabilidad', 'data_room'],
    includes: ['EUDR / deforestación cero', 'Trazabilidad avanzada', 'Documentos legales'],
  },
  {
    key: 'calidad', label: 'Calidad', price: 10,
    desc: 'Nova Cup + Evaluación de lotes',
    modules: ['calidad', 'nova_cup'],
    includes: ['Cataciones SCA', 'Perfiles sensoriales', 'Evaluación de lotes'],
  },
  {
    key: 'operacion', label: 'Operación', price: 12,
    desc: 'Jornales + Cuadrillas + Costos laborales',
    modules: ['jornales', 'inventario'],
    includes: ['Jornales y cuadrillas', 'Costos laborales', 'Inventario de insumos'],
  },
  {
    key: 'catalogo', label: 'Catálogo de insumos', price: 8,
    desc: 'Proveedores y registro de compras',
    modules: ['catalogo_insumos'],
    includes: ['Ver proveedores', 'Registrar compras de insumos'],
  },
];

export interface FarmerEstimate {
  base: number;
  scaleSurcharge: number;
  packs: number;
  monthly: number;
  annual: number;
  annualSavings: number;
}

export function estimateFarmerPrice(plotCount: number, selectedPacks: string[]): FarmerEstimate {
  const base = FARMER_BASE;
  const scaleSurcharge = getFarmerScaleSurcharge(plotCount);
  const packs = selectedPacks.reduce((sum, key) => {
    const pack = FARMER_PACKS.find(p => p.key === key);
    return sum + (pack?.price ?? 0);
  }, 0);
  const monthly = base + scaleSurcharge + packs;
  const annual = monthly * 12;
  const annualDiscounted = Math.round(annual * 0.85);
  return {
    base,
    scaleSurcharge,
    packs,
    monthly,
    annual: annualDiscounted,
    annualSavings: annual - annualDiscounted,
  };
}

// ═══════════════════════════════════════════════
// AGGREGATOR MODEL — plan tiers + packs
// ═══════════════════════════════════════════════

export type PlanTier = 'Smart' | 'Plus' | 'Enterprise';

export interface PlanDef {
  tier: PlanTier;
  label: string;
  desc: string;
  base: number;
  limit: string;
  badge?: string;
}

export const AGGREGATOR_PLANS: PlanDef[] = [
  { tier: 'Smart',      label: 'Smart',      desc: 'Cooperativas y beneficios medianos',          base: 750,  limit: 'Hasta 500 parcelas · 20 usuarios', badge: 'Popular' },
  { tier: 'Plus',       label: 'Plus',       desc: 'Operaciones grandes con múltiples módulos',    base: 1400, limit: 'Hasta 2000 parcelas · 50 usuarios' },
  { tier: 'Enterprise', label: 'Enterprise', desc: 'Exportadores y cadenas complejas sin límites',  base: 2500, limit: 'Sin límite · Soporte prioritario' },
];

export const AGGREGATOR_PACKS: PackDef[] = [
  { key: 'agronomia',      label: 'Agronomía',      price: 300, desc: 'Nutrición + Nova Guard + Nova Yield', modules: ['nutricion', 'guard', 'yield'], includes: ['Nutrición vegetal', 'Nova Guard', 'Nova Yield'] },
  { key: 'cumplimiento',   label: 'Cumplimiento',   price: 250, desc: 'EUDR + Trazabilidad + Data Room', modules: ['eudr', 'trazabilidad', 'data_room'], includes: ['EUDR', 'Trazabilidad', 'Data Room'] },
  { key: 'calidad',        label: 'Calidad',         price: 200, desc: 'Nova Cup + Perfiles de taza', modules: ['calidad', 'nova_cup'], includes: ['Nova Cup', 'Perfiles sensoriales'] },
  { key: 'operacion',      label: 'Operación',       price: 150, desc: 'Jornales + Inventario', modules: ['jornales', 'inventario'], includes: ['Jornales', 'Inventario'] },
  { key: 'abastecimiento', label: 'Abastecimiento',  price: 250, desc: 'Compras + Recepción + Riesgo', modules: ['abastecimiento_cafe', 'recepcion', 'riesgo_origen'], includes: ['Compras', 'Recepción', 'Riesgo origen'] },
  { key: 'catalogo',       label: 'Catálogo',        price: 120, desc: 'Venta de insumos a productores', modules: ['catalogo_insumos'], includes: ['Catálogo de insumos'] },
];

export interface AggregatorEstimate {
  base: number;
  packs: number;
  monthly: number;
  annual: number;
  annualSavings: number;
}

export function estimateAggregatorPrice(plan: PlanTier, selectedPacks: string[]): AggregatorEstimate {
  const planDef = AGGREGATOR_PLANS.find(p => p.tier === plan) || AGGREGATOR_PLANS[0];
  const base = planDef.base;
  const packs = selectedPacks.reduce((sum, key) => {
    const pack = AGGREGATOR_PACKS.find(p => p.key === key);
    return sum + (pack?.price ?? 0);
  }, 0);
  const monthly = base + packs;
  const annual = monthly * 12;
  const annualDiscounted = Math.round(annual * 0.85);
  return {
    base,
    packs,
    monthly,
    annual: annualDiscounted,
    annualSavings: annual - annualDiscounted,
  };
}

// ═══════════════════════════════════════════════
// SHARED helpers
// ═══════════════════════════════════════════════

/** @deprecated — kept for backward compat with DemoBanner */
export const PLANS = AGGREGATOR_PLANS;
export const PACKS = AGGREGATOR_PACKS;

export function getPacksForModel(model: PricingModel): PackDef[] {
  return model === 'farmer' ? FARMER_PACKS : AGGREGATOR_PACKS;
}

/** @deprecated backward compat shim used by DemoSetupWizard / CrearCuenta */
export function estimatePrice(plan: PlanTier, packKeys: string[]): { base: number; addons: number; total: number } {
  const est = estimateAggregatorPrice(plan, packKeys);
  return { base: est.base, addons: est.packs, total: est.monthly };
}

/** Module-level price for per-toggle display in StepModules (farmer model) */
export function getModulePrice(model: PricingModel, moduleKey: string): number {
  if (model === 'farmer') {
    // Farmer doesn't have per-module prices; pricing is base + scale + packs
    return 0;
  }
  const AGGREGATOR_MODULE_PRICES: Record<string, number> = {
    productores: 15, parcelas: 12, entregas: 10, lotes_acopio: 10,
    lotes_comerciales: 18, contratos: 15, calidad: 20, vital: 25,
    eudr: 30, finanzas: 12, creditos: 18, jornales: 8,
    inventario: 8, mensajes: 5, inclusion: 10, nutricion: 25,
  };
  return AGGREGATOR_MODULE_PRICES[moduleKey] ?? 0;
}

export interface DemoSetupConfig {
  orgType: string;
  operatingModel: string;
  interests: string[];
  scalePlots: string;
  scaleProducers: string;
  scaleUsers: string;
  hasLabor: boolean;
  hasInventory: boolean;
  hasExports: boolean;
}

export function recommendPacks(config: DemoSetupConfig): string[] {
  const packs: Set<string> = new Set();
  if (config.interests.includes('agronomy')) packs.add('agronomia');
  if (config.interests.includes('compliance')) packs.add('cumplimiento');
  if (config.interests.includes('quality')) packs.add('calidad');
  if (config.interests.includes('supply')) packs.add('abastecimiento');
  if (config.interests.includes('catalog')) packs.add('catalogo');
  if (config.hasLabor || config.hasInventory || config.interests.includes('labor') || config.interests.includes('inventory')) {
    packs.add('operacion');
  }
  if (config.hasExports) packs.add('abastecimiento');
  return [...packs];
}

export function recommendPlan(config: DemoSetupConfig): PlanTier {
  const producers = parseScale(config.scaleProducers);
  const plots = parseScale(config.scalePlots);
  if (producers > 500 || plots > 2000) return 'Enterprise';
  if (producers > 100 || plots > 500) return 'Plus';
  return 'Smart';
}

function parseScale(value: string): number {
  if (!value) return 0;
  const match = value.match(/(\d+)/);
  if (!match) return 0;
  const num = parseInt(match[1]);
  if (value.includes('+')) return num + 1;
  return num;
}

export function getSetupConfig(): DemoSetupConfig | null {
  try {
    const raw = sessionStorage.getItem('novasilva_demo_setup');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getModelLabel(model: string): string {
  const map: Record<string, string> = {
    single_farm: 'Finca independiente',
    estate: 'Finca empresarial',
    estate_hybrid: 'Producción propia + compra a terceros',
    aggregator: 'Agrupación de productores',
    trader: 'Exportación y comercialización',
    auditor: 'Auditoría y verificación',
  };
  return map[model] || model;
}

export function getOrgTypeLabel(orgType: string): string {
  const map: Record<string, string> = {
    productor_privado: 'Finca privada',
    finca_empresarial: 'Finca empresarial',
    cooperativa: 'Cooperativa',
    beneficio: 'Beneficio / Procesador',
    exportador: 'Exportador',
    certificadora: 'Certificadora',
    otro: 'Otro',
  };
  return map[orgType] || orgType;
}

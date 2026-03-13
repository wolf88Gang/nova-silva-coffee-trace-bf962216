/**
 * Nova Silva Pricing Engine
 * Recommends plan, packs, and calculates estimated monthly price
 * based on demo/onboarding configuration.
 *
 * Three pricing models:
 *   farmer     → finca privada, finca empresarial (small scale)
 *   aggregator → cooperativa, beneficio privado
 *   trader     → exportador
 */

// ── Pricing model ──

export type PricingModel = 'farmer' | 'aggregator' | 'trader';
export type PlanTier = 'Lite' | 'Smart' | 'Plus';

export function getPricingModel(orgType: string): PricingModel {
  switch (orgType) {
    case 'productor_privado':
    case 'productor_empresarial':
    case 'finca_empresarial':
      return 'farmer';
    case 'exportador':
      return 'trader';
    default: // cooperativa, beneficio, etc.
      return 'aggregator';
  }
}

// ── Plan definitions per model ──

export interface PlanDef {
  tier: PlanTier;
  label: string;
  desc: string;
  base: number;       // USD/month
  limit: string;
  badge?: string;
}

const FARMER_PLANS: PlanDef[] = [
  { tier: 'Lite',  label: 'Lite',  desc: 'Para fincas pequeñas y operaciones independientes',            base: 15,   limit: 'Hasta 10 parcelas · 2 usuarios' },
  { tier: 'Smart', label: 'Smart', desc: 'Para fincas medianas con más área y equipo',                   base: 45,   limit: 'Hasta 50 parcelas · 5 usuarios', badge: 'Popular' },
  { tier: 'Plus',  label: 'Plus',  desc: 'Fincas grandes con operación completa',                        base: 120,  limit: 'Hasta 300 parcelas · 20 usuarios' },
];

const AGGREGATOR_PLANS: PlanDef[] = [
  { tier: 'Lite',  label: 'Lite',  desc: 'Ideal para cooperativas pequeñas',                             base: 400,  limit: 'Hasta 50 parcelas · 5 usuarios' },
  { tier: 'Smart', label: 'Smart', desc: 'Para cooperativas, fincas grandes y operaciones medianas',      base: 800,  limit: 'Hasta 500 parcelas · 20 usuarios', badge: 'Popular' },
  { tier: 'Plus',  label: 'Plus',  desc: 'Operaciones complejas y sin límites',                           base: 1500, limit: 'Sin límite · Soporte prioritario' },
];

const TRADER_PLANS: PlanDef[] = [
  { tier: 'Lite',  label: 'Lite',  desc: 'Exportadores con volúmenes moderados',                         base: 500,  limit: 'Hasta 50 proveedores · 5 usuarios' },
  { tier: 'Smart', label: 'Smart', desc: 'Exportadores con múltiples orígenes',                           base: 1000, limit: 'Hasta 200 proveedores · 15 usuarios', badge: 'Popular' },
  { tier: 'Plus',  label: 'Plus',  desc: 'Traders grandes, sin límites y soporte prioritario',            base: 1800, limit: 'Sin límite · Soporte prioritario' },
];

const PLANS_BY_MODEL: Record<PricingModel, PlanDef[]> = {
  farmer: FARMER_PLANS,
  aggregator: AGGREGATOR_PLANS,
  trader: TRADER_PLANS,
};

/** @deprecated Use getPlansForModel instead */
export const PLANS = AGGREGATOR_PLANS;

export function getPlansForModel(model: PricingModel): PlanDef[] {
  return PLANS_BY_MODEL[model];
}

// ── Pack definitions per model ──

export interface PackDef {
  key: string;
  label: string;
  desc: string;
  price: number;       // USD/month
  modules: string[];   // module keys included
}

const FARMER_PACKS: PackDef[] = [
  { key: 'agronomia',    label: 'Agronomía',    desc: 'Nutrición + Nova Guard + Nova Yield',      price: 12, modules: ['nutricion', 'guard', 'yield'] },
  { key: 'cumplimiento', label: 'Cumplimiento', desc: 'EUDR + Trazabilidad + Data Room',          price: 10, modules: ['eudr', 'trazabilidad', 'data_room'] },
  { key: 'calidad',      label: 'Calidad',      desc: 'Nova Cup + Perfiles de taza',              price: 10, modules: ['calidad', 'nova_cup'] },
  { key: 'operacion',    label: 'Operación',    desc: 'Jornales + Inventario',                    price: 12, modules: ['jornales', 'inventario'] },
];

const AGGREGATOR_PACKS: PackDef[] = [
  { key: 'agronomia',      label: 'Agronomía',      desc: 'Nutrición + Nova Guard + Nova Yield',    price: 300, modules: ['nutricion', 'guard', 'yield'] },
  { key: 'cumplimiento',   label: 'Cumplimiento',   desc: 'EUDR + Trazabilidad + Data Room',        price: 250, modules: ['eudr', 'trazabilidad', 'data_room'] },
  { key: 'calidad',        label: 'Calidad',         desc: 'Nova Cup + Perfiles de taza',            price: 200, modules: ['calidad', 'nova_cup'] },
  { key: 'operacion',      label: 'Operación',       desc: 'Jornales + Inventario',                  price: 150, modules: ['jornales', 'inventario'] },
  { key: 'abastecimiento', label: 'Abastecimiento',  desc: 'Compras + Recepción + Riesgo',           price: 250, modules: ['abastecimiento_cafe', 'recepcion', 'riesgo_origen'] },
  { key: 'catalogo',       label: 'Catálogo',        desc: 'Venta de insumos a productores',         price: 120, modules: ['catalogo_insumos'] },
];

const TRADER_PACKS: PackDef[] = [
  { key: 'cumplimiento',   label: 'Cumplimiento',   desc: 'EUDR + Trazabilidad + Data Room',        price: 300, modules: ['eudr', 'trazabilidad', 'data_room'] },
  { key: 'calidad',        label: 'Calidad',         desc: 'Nova Cup + Perfiles de taza',            price: 250, modules: ['calidad', 'nova_cup'] },
  { key: 'abastecimiento', label: 'Abastecimiento',  desc: 'Compras + Recepción + Riesgo',           price: 300, modules: ['abastecimiento_cafe', 'recepcion', 'riesgo_origen'] },
];

const PACKS_BY_MODEL: Record<PricingModel, PackDef[]> = {
  farmer: FARMER_PACKS,
  aggregator: AGGREGATOR_PACKS,
  trader: TRADER_PACKS,
};

/** @deprecated Use getPacksForModel instead */
export const PACKS = AGGREGATOR_PACKS;

export function getPacksForModel(model: PricingModel): PackDef[] {
  return PACKS_BY_MODEL[model];
}

// ── Module price lookup (for StepModules per-module display) ──

const FARMER_MODULE_PRICES: Record<string, number> = {
  productores: 0, parcelas: 5, entregas: 5, lotes_acopio: 5,
  lotes_comerciales: 8, contratos: 8, calidad: 10, vital: 10,
  eudr: 10, finanzas: 5, creditos: 8, jornales: 5,
  inventario: 5, mensajes: 3, inclusion: 5, nutricion: 12,
};

const AGGREGATOR_MODULE_PRICES: Record<string, number> = {
  productores: 15, parcelas: 12, entregas: 10, lotes_acopio: 10,
  lotes_comerciales: 18, contratos: 15, calidad: 20, vital: 25,
  eudr: 30, finanzas: 12, creditos: 18, jornales: 8,
  inventario: 8, mensajes: 5, inclusion: 10, nutricion: 25,
};

const TRADER_MODULE_PRICES: Record<string, number> = {
  productores: 20, parcelas: 15, entregas: 12, lotes_acopio: 12,
  lotes_comerciales: 25, contratos: 20, calidad: 25, vital: 30,
  eudr: 35, finanzas: 15, creditos: 20, jornales: 10,
  inventario: 10, mensajes: 5, inclusion: 12, nutricion: 30,
};

const MODULE_PRICES_BY_MODEL: Record<PricingModel, Record<string, number>> = {
  farmer: FARMER_MODULE_PRICES,
  aggregator: AGGREGATOR_MODULE_PRICES,
  trader: TRADER_MODULE_PRICES,
};

export function getModulePrice(model: PricingModel, moduleKey: string): number {
  return MODULE_PRICES_BY_MODEL[model]?.[moduleKey] ?? 0;
}

// ── Config shape (matches demoSetup sessionStorage) ──

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

// ── Recommendation engine ──

export function recommendPlan(config: DemoSetupConfig): PlanTier {
  if (config.operatingModel === 'trader') return 'Plus';
  if (config.operatingModel === 'auditor') return 'Plus';

  const producers = parseScale(config.scaleProducers);
  const plots = parseScale(config.scalePlots);

  if (producers > 200 || plots > 200) return 'Plus';
  if (plots > 50 || producers > 50) return 'Smart';

  return 'Lite';
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

export function estimatePrice(plan: PlanTier, packKeys: string[], model: PricingModel = 'aggregator'): { base: number; addons: number; total: number } {
  const plans = getPlansForModel(model);
  const packs = getPacksForModel(model);
  const planDef = plans.find(p => p.tier === plan) || plans[1];
  const base = planDef.base;
  const addons = packKeys.reduce((sum, key) => {
    const pack = packs.find(p => p.key === key);
    return sum + (pack?.price || 0);
  }, 0);
  return { base, addons, total: base + addons };
}

// ── Helpers ──

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

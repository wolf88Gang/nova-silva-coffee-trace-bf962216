/**
 * Nova Silva Pricing Engine
 * Recommends plan, packs, and calculates estimated monthly price
 * based on demo/onboarding configuration.
 */

// ── Plan definitions ──

export type PlanTier = 'Lite' | 'Smart' | 'Plus';

export interface PlanDef {
  tier: PlanTier;
  label: string;
  desc: string;
  base: number;       // USD/month
  limit: string;
  badge?: string;
}

export const PLANS: PlanDef[] = [
  { tier: 'Lite', label: 'Lite', desc: 'Ideal para fincas pequeñas y productores independientes', base: 400, limit: 'Hasta 50 parcelas · 5 usuarios' },
  { tier: 'Smart', label: 'Smart', desc: 'Para cooperativas, fincas grandes y operaciones medianas', base: 800, limit: 'Hasta 500 parcelas · 20 usuarios', badge: 'Popular' },
  { tier: 'Plus', label: 'Plus', desc: 'Exportadores, operaciones complejas y sin límites', base: 1500, limit: 'Sin límite · Soporte prioritario' },
];

// ── Pack definitions ──

export interface PackDef {
  key: string;
  label: string;
  desc: string;
  price: number;       // USD/month
  modules: string[];   // module keys included
}

export const PACKS: PackDef[] = [
  { key: 'agronomia', label: 'Agronomía', desc: 'Nutrición + Nova Guard + Nova Yield', price: 300, modules: ['nutricion', 'guard', 'yield'] },
  { key: 'cumplimiento', label: 'Cumplimiento', desc: 'EUDR + Trazabilidad + Data Room', price: 250, modules: ['eudr', 'trazabilidad', 'data_room'] },
  { key: 'calidad', label: 'Calidad', desc: 'Nova Cup + Perfiles de taza', price: 200, modules: ['calidad', 'nova_cup'] },
  { key: 'operacion', label: 'Operación', desc: 'Jornales + Inventario', price: 150, modules: ['jornales', 'inventario'] },
  { key: 'abastecimiento', label: 'Abastecimiento', desc: 'Compras + Recepción + Riesgo', price: 250, modules: ['abastecimiento_cafe', 'recepcion', 'riesgo_origen'] },
  { key: 'catalogo', label: 'Catálogo', desc: 'Venta de insumos a productores', price: 120, modules: ['catalogo_insumos'] },
];

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

  // Scale-based
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

export function estimatePrice(plan: PlanTier, packKeys: string[]): { base: number; addons: number; total: number } {
  const planDef = PLANS.find(p => p.tier === plan) || PLANS[1];
  const base = planDef.base;
  const addons = packKeys.reduce((sum, key) => {
    const pack = PACKS.find(p => p.key === key);
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
  if (value.includes('+')) return num + 1; // e.g. "200+" → treat as 201
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

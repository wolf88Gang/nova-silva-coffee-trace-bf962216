/**
 * Motor de recomendación de plan y precio estimado para demo → cuenta.
 * Usa 3 planes base + packs funcionales.
 */
import type { DemoSetupConfig, WizardModuleKey } from './demoSetupConfig';

export type PlanKey = 'Lite' | 'Smart' | 'Plus';
export type PackKey =
  | 'agronomia'
  | 'cumplimiento'
  | 'calidad'
  | 'operacion'
  | 'abastecimiento'
  | 'catalogo';

const PLAN_PRICES: Record<PlanKey, { monthly: number; annual: number }> = {
  Lite: { monthly: 400, annual: 4000 },
  Smart: { monthly: 800, annual: 8000 },
  Plus: { monthly: 1500, annual: 15000 },
};

const PACK_PRICES: Record<PackKey, { monthly: number; annual: number }> = {
  agronomia: { monthly: 300, annual: 3000 },
  cumplimiento: { monthly: 250, annual: 2500 },
  calidad: { monthly: 200, annual: 2000 },
  operacion: { monthly: 150, annual: 1500 },
  abastecimiento: { monthly: 250, annual: 2500 },
  catalogo: { monthly: 120, annual: 1200 },
};

/** Mapea wizard operatingModel a clave usada por pricing */
function toPricingOpModel(
  op: DemoSetupConfig['operatingModel']
): 'single_farm' | 'estate' | 'estate_hybrid' | 'aggregator' | 'trader' | 'auditor' {
  const m: Record<string, string> = {
    solo_produccion: 'single_farm',
    produccion_y_compra: 'estate_hybrid',
    agrupamos_productores: 'aggregator',
    compramos_comercializamos: 'trader',
    auditamos: 'auditor',
    vendemos_insumos: 'aggregator',
  };
  return (m[op] ?? 'single_farm') as any;
}

export function recommendPlan(config: DemoSetupConfig): PlanKey {
  const op = toPricingOpModel(config.operatingModel);
  const { plotCount, producerOrSupplierCount, userCount } = config.scaleProfile;

  if (op === 'trader') return 'Plus';
  if (op === 'aggregator' && producerOrSupplierCount > 200) return 'Plus';
  if (producerOrSupplierCount > 200) return 'Plus';
  if (plotCount > 100) return 'Plus';

  if (producerOrSupplierCount > 5 || plotCount > 50 || userCount > 3) return 'Smart';

  return 'Lite';
}

export function recommendPacks(config: DemoSetupConfig): PackKey[] {
  const packs: PackKey[] = [];
  const mods = config.modulesEnabled ?? [];
  const { hasLabor, hasInventory, hasExports } = config.scaleProfile;

  if (mods.includes('agronomia')) packs.push('agronomia');
  if (mods.includes('cumplimiento')) packs.push('cumplimiento');
  if (mods.includes('calidad')) packs.push('calidad');
  if (mods.includes('catalogo_insumos')) packs.push('catalogo');
  if (mods.includes('abastecimiento')) packs.push('abastecimiento');

  if (hasLabor || hasInventory) {
    if (!packs.includes('operacion')) packs.push('operacion');
  }
  if (hasExports && !packs.includes('abastecimiento')) {
    packs.push('abastecimiento');
  }

  return [...new Set(packs)];
}

export interface PriceEstimate {
  basePlan: PlanKey;
  packs: PackKey[];
  lineItems: { description: string; amount: number }[];
  subtotal: number;
  total: number;
  currency: string;
  billingCycle: 'monthly' | 'annual';
}

export function estimatePrice(
  config: DemoSetupConfig,
  billingCycle: 'monthly' | 'annual' = 'monthly'
): PriceEstimate {
  const plan = recommendPlan(config);
  const packs = recommendPacks(config);

  const lineItems: { description: string; amount: number }[] = [];
  const planPrices = PLAN_PRICES[plan];
  const baseAmount = billingCycle === 'annual' ? planPrices.annual : planPrices.monthly;
  lineItems.push({ description: `Plan ${plan}`, amount: baseAmount });

  let total = baseAmount;
  for (const p of packs) {
    const prices = PACK_PRICES[p];
    const amount = billingCycle === 'annual' ? prices.annual : prices.monthly;
    const labels: Record<PackKey, string> = {
      agronomia: 'Agronomía',
      cumplimiento: 'Cumplimiento',
      calidad: 'Calidad',
      operacion: 'Operación',
      abastecimiento: 'Abastecimiento',
      catalogo: 'Catálogo',
    };
    lineItems.push({ description: `${labels[p]} pack`, amount });
    total += amount;
  }

  return {
    basePlan: plan,
    packs,
    lineItems,
    subtotal: total,
    total,
    currency: 'USD',
    billingCycle,
  };
}

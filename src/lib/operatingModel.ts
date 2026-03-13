/**
 * Operating model & visibility policy for Nova Silva.
 *
 * This is the SINGLE SOURCE OF TRUTH for entity/module visibility.
 * Every sidebar item, table column, KPI card, and dashboard block
 * must derive its visibility from getVisibilityPolicy().
 *
 * Models:
 * - single_farm:   Productor independiente
 * - estate:        Finca empresarial (operación propia)
 * - estate_hybrid: Finca empresarial + compra a terceros
 * - aggregator:    Cooperativa / beneficio
 * - trader:        Exportador
 * - auditor:       Certificadora
 */

import { getDemoConfig } from '@/hooks/useDemoConfig';

export type OperatingModel = 'single_farm' | 'estate' | 'estate_hybrid' | 'aggregator' | 'trader' | 'auditor';

// ── Visibility Policy ──

export interface VisibilityPolicy {
  // Producción
  canSeeProductionSummary: boolean;
  canSeePlots: boolean;
  canSeeCrops: boolean;
  canSeeProducers: boolean;
  canSeeDeliveries: boolean;
  canSeeDocuments: boolean;
  // Abastecimiento café
  canSeeCoffeeSuppliers: boolean;
  canSeeReception: boolean;
  canSeePurchases: boolean;
  canSeeSupplierEvidence: boolean;
  canSeeOriginRisk: boolean;
  // Insumos
  canSeeInputSuppliers: boolean;
  canSeeInputCatalog: boolean;
  // Agronomía
  canSeeAgronomy: boolean;
  // Jornales
  canSeeLabor: boolean;
  // Resiliencia
  canSeeVital: boolean;
  // Cumplimiento
  canSeeTraceability: boolean;
  canSeeLots: boolean;
  canSeeEudr: boolean;
  canSeeDataRoom: boolean;
  canSeeAudits: boolean;
  // Calidad
  canSeeNovaCup: boolean;
  // Finanzas
  canSeeFarmCosts: boolean;
  canSeeCoffeePurchases: boolean;
  canSeeIncome: boolean;
  // Comercial
  canSeeCommercial: boolean;
  // Analítica (trader-centric)
  canSeeAnalytics: boolean;
  // Orígenes (trader-centric)
  canSeeOrigins: boolean;
  // Inventario
  canSeeInventory: boolean;
  // Plot editing
  canEditPlots: boolean;
}

/**
 * Definitive visibility matrix — aligned with product spec.
 * ✔ = full access, ⚪ = read-only/analytical, ✖ = hidden
 */
const POLICIES: Record<OperatingModel, VisibilityPolicy> = {
  single_farm: {
    canSeeProductionSummary: true,
    canSeePlots: true,
    canSeeCrops: true,
    canSeeProducers: false,
    canSeeDeliveries: false,
    canSeeDocuments: true,
    canSeeCoffeeSuppliers: false,
    canSeeReception: false,
    canSeePurchases: false,
    canSeeSupplierEvidence: false,
    canSeeOriginRisk: false,
    canSeeInputSuppliers: true,
    canSeeInputCatalog: false,
    canSeeAgronomy: true,
    canSeeLabor: true,
    canSeeVital: true,
    canSeeTraceability: true,
    canSeeLots: false,
    canSeeEudr: true,
    canSeeDataRoom: false,
    canSeeAudits: false,
    canSeeNovaCup: true,
    canSeeFarmCosts: true,
    canSeeCoffeePurchases: false,
    canSeeIncome: true,
    canSeeCommercial: false,
    canSeeAnalytics: false,
    canSeeOrigins: false,
    canSeeInventory: true,
    canEditPlots: true,
  },
  estate: {
    canSeeProductionSummary: true,
    canSeePlots: true,
    canSeeCrops: true,
    canSeeProducers: false,
    canSeeDeliveries: false,
    canSeeDocuments: true,
    canSeeCoffeeSuppliers: false,
    canSeeReception: false,
    canSeePurchases: false,
    canSeeSupplierEvidence: false,
    canSeeOriginRisk: false,
    canSeeInputSuppliers: true,
    canSeeInputCatalog: false,
    canSeeAgronomy: true,
    canSeeLabor: true,
    canSeeVital: true,
    canSeeTraceability: true,
    canSeeLots: true,
    canSeeEudr: true,
    canSeeDataRoom: true,
    canSeeAudits: true,
    canSeeNovaCup: true,
    canSeeFarmCosts: true,
    canSeeCoffeePurchases: false,
    canSeeIncome: true,
    canSeeCommercial: true,
    canSeeAnalytics: false,
    canSeeOrigins: false,
    canSeeInventory: true,
    canEditPlots: true,
  },
  estate_hybrid: {
    canSeeProductionSummary: true,
    canSeePlots: true,
    canSeeCrops: true,
    canSeeProducers: false,
    canSeeDeliveries: false,
    canSeeDocuments: true,
    canSeeCoffeeSuppliers: true,
    canSeeReception: true,
    canSeePurchases: true,
    canSeeSupplierEvidence: true,
    canSeeOriginRisk: true,
    canSeeInputSuppliers: true,
    canSeeInputCatalog: false,
    canSeeAgronomy: true,
    canSeeLabor: true,
    canSeeVital: true,
    canSeeTraceability: true,
    canSeeLots: true,
    canSeeEudr: true,
    canSeeDataRoom: true,
    canSeeAudits: true,
    canSeeNovaCup: true,
    canSeeFarmCosts: true,
    canSeeCoffeePurchases: true,
    canSeeIncome: true,
    canSeeCommercial: true,
    canSeeAnalytics: false,
    canSeeOrigins: false,
    canSeeInventory: true,
    canEditPlots: true,
  },
  aggregator: {
    canSeeProductionSummary: true,
    canSeePlots: true,
    canSeeCrops: true,
    canSeeProducers: true,
    canSeeDeliveries: true,
    canSeeDocuments: true,
    canSeeCoffeeSuppliers: true,
    canSeeReception: true,
    canSeePurchases: true,
    canSeeSupplierEvidence: true,
    canSeeOriginRisk: true,
    canSeeInputSuppliers: true,
    canSeeInputCatalog: true,
    canSeeAgronomy: true,
    canSeeLabor: false,
    canSeeVital: true,
    canSeeClimate: true,
    canSeeTraceability: true,
    canSeeLots: true,
    canSeeEudr: true,
    canSeeDataRoom: true,
    canSeeAudits: true,
    canSeeNovaCup: true,
    canSeeFarmCosts: false,
    canSeeCoffeePurchases: true,
    canSeeIncome: true,
    canSeeCommercial: true,
    canSeeAnalytics: false,
    canSeeOrigins: false,
    canSeeInventory: true,
    canEditPlots: false,
  },
  trader: {
    canSeeProductionSummary: false,
    canSeePlots: false,
    canSeeCrops: false,
    canSeeProducers: false,
    canSeeDeliveries: true,
    canSeeDocuments: true,
    canSeeCoffeeSuppliers: true,
    canSeeReception: true,
    canSeePurchases: true,
    canSeeSupplierEvidence: true,
    canSeeOriginRisk: true,
    canSeeInputSuppliers: false,
    canSeeInputCatalog: false,
    canSeeAgronomy: false,
    canSeeLabor: false,
    canSeeVital: false,
    canSeeClimate: true,
    canSeeTraceability: true,
    canSeeLots: true,
    canSeeEudr: true,
    canSeeDataRoom: true,
    canSeeAudits: true,
    canSeeNovaCup: true,
    canSeeFarmCosts: false,
    canSeeCoffeePurchases: true,
    canSeeIncome: true,
    canSeeCommercial: true,
    canSeeAnalytics: true,
    canSeeOrigins: true,
    canSeeInventory: false,
    canEditPlots: false,
  },
  auditor: {
    canSeeProductionSummary: false,
    canSeePlots: false,
    canSeeCrops: false,
    canSeeProducers: false,
    canSeeDeliveries: false,
    canSeeDocuments: true,
    canSeeCoffeeSuppliers: false,
    canSeeReception: false,
    canSeePurchases: false,
    canSeeSupplierEvidence: true,
    canSeeOriginRisk: true,
    canSeeInputSuppliers: false,
    canSeeInputCatalog: false,
    canSeeAgronomy: false,
    canSeeLabor: false,
    canSeeVital: true,
    canSeeClimate: true,
    canSeeTraceability: true,
    canSeeLots: true,
    canSeeEudr: true,
    canSeeDataRoom: true,
    canSeeAudits: true,
    canSeeNovaCup: true,
    canSeeFarmCosts: false,
    canSeeCoffeePurchases: false,
    canSeeIncome: false,
    canSeeCommercial: false,
    canSeeAnalytics: false,
    canSeeOrigins: false,
    canSeeInventory: false,
    canEditPlots: false,
  },
};

export function getVisibilityPolicy(model: OperatingModel): VisibilityPolicy {
  return POLICIES[model] ?? POLICIES.aggregator;
}

// ── Model resolution ──

export function getOperatingModel(orgType?: string | null): OperatingModel {
  const cfg = getDemoConfig();
  if (cfg?.operatingModel) {
    const valid: OperatingModel[] = ['single_farm', 'estate', 'estate_hybrid', 'aggregator', 'trader', 'auditor'];
    if (valid.includes(cfg.operatingModel as OperatingModel)) return cfg.operatingModel as OperatingModel;
  }

  const t = orgType || cfg?.orgType || 'cooperativa';
  switch (t) {
    case 'productor_privado': return 'single_farm';
    case 'finca_empresarial': return 'estate_hybrid';
    case 'cooperativa': return 'aggregator';
    case 'exportador': return 'trader';
    case 'certificadora': return 'auditor';
    default: return 'aggregator';
  }
}

/** React hook for current operating model */
export function useOperatingModel(): OperatingModel {
  const cfg = getDemoConfig();
  return getOperatingModel(cfg?.orgType);
}

/** React hook for current visibility policy */
export function useVisibilityPolicy(): VisibilityPolicy {
  return getVisibilityPolicy(useOperatingModel());
}

// ── Legacy convenience helpers (delegate to policy) ──

export function showsProductores(model: OperatingModel): boolean {
  return getVisibilityPolicy(model).canSeeProducers;
}

export function showsProveedores(model: OperatingModel): boolean {
  return getVisibilityPolicy(model).canSeeCoffeeSuppliers;
}

export function showsAbastecimiento(model: OperatingModel): boolean {
  const p = getVisibilityPolicy(model);
  return p.canSeePurchases || p.canSeeReception || p.canSeeCoffeeSuppliers;
}

export function showsRecepcion(model: OperatingModel): boolean {
  return getVisibilityPolicy(model).canSeeReception;
}

export function showsJornales(model: OperatingModel): boolean {
  return getVisibilityPolicy(model).canSeeLabor;
}

export function showsInventario(model: OperatingModel): boolean {
  return getVisibilityPolicy(model).canSeeInventory;
}

export function showsAgronomia(model: OperatingModel): boolean {
  return getVisibilityPolicy(model).canSeeAgronomy;
}

export function showsComercial(model: OperatingModel): boolean {
  return getVisibilityPolicy(model).canSeeCommercial;
}

export function showsCumplimiento(model: OperatingModel): boolean {
  const p = getVisibilityPolicy(model);
  return p.canSeeTraceability || p.canSeeEudr || p.canSeeAudits;
}

export function showsOrigenes(model: OperatingModel): boolean {
  return getVisibilityPolicy(model).canSeeOrigins;
}

export function showsAnalitica(model: OperatingModel): boolean {
  return getVisibilityPolicy(model).canSeeAnalytics;
}

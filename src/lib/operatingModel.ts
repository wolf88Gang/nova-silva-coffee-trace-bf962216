/**
 * Operating model helpers for Nova Silva.
 * Determines entity visibility based on organization type.
 *
 * Operating models:
 * - single_farm: Finca privada / productor independiente
 * - estate: Finca empresarial (own production only)
 * - estate_hybrid: Finca empresarial + compra a terceros
 * - aggregator: Cooperativa / beneficio
 * - trader: Exportador
 * - auditor: Certificadora
 */

import { getDemoConfig } from '@/hooks/useDemoConfig';

export type OperatingModel = 'single_farm' | 'estate' | 'estate_hybrid' | 'aggregator' | 'trader' | 'auditor';

// ── Visibility Policy ──

export interface VisibilityPolicy {
  canSeeProducers: boolean;
  canSeeSuppliers: boolean;
  canSeeOwnedPlots: boolean;
  canSeeThirdPartyPlots: boolean;
  canEditPlots: boolean;
  canSeePurchases: boolean;
  canSeeReception: boolean;
  canSeeLabor: boolean;
  canSeeEudr: boolean;
  canSeeNovaCup: boolean;
  canSeeAgronomy: boolean;
  canSeeInventory: boolean;
  canSeeResilience: boolean;
  canSeeCommercial: boolean;
  canSeeCompliance: boolean;
  canSeeAnalytics: boolean;
  canSeeOrigins: boolean;
}

const POLICIES: Record<OperatingModel, VisibilityPolicy> = {
  single_farm: {
    canSeeProducers: false,
    canSeeSuppliers: false,
    canSeeOwnedPlots: true,
    canSeeThirdPartyPlots: false,
    canEditPlots: true,
    canSeePurchases: false,
    canSeeReception: false,
    canSeeLabor: true,
    canSeeEudr: true,
    canSeeNovaCup: true,
    canSeeAgronomy: true,
    canSeeInventory: true,
    canSeeResilience: true,
    canSeeCommercial: false,
    canSeeCompliance: false,
    canSeeAnalytics: false,
    canSeeOrigins: false,
  },
  estate: {
    canSeeProducers: false,
    canSeeSuppliers: false,
    canSeeOwnedPlots: true,
    canSeeThirdPartyPlots: false,
    canEditPlots: true,
    canSeePurchases: false,
    canSeeReception: false,
    canSeeLabor: true,
    canSeeEudr: true,
    canSeeNovaCup: true,
    canSeeAgronomy: true,
    canSeeInventory: true,
    canSeeResilience: true,
    canSeeCommercial: true,
    canSeeCompliance: true,
    canSeeAnalytics: false,
    canSeeOrigins: false,
  },
  estate_hybrid: {
    canSeeProducers: false,
    canSeeSuppliers: true,
    canSeeOwnedPlots: true,
    canSeeThirdPartyPlots: true,
    canEditPlots: true,
    canSeePurchases: true,
    canSeeReception: true,
    canSeeLabor: true,
    canSeeEudr: true,
    canSeeNovaCup: true,
    canSeeAgronomy: true,
    canSeeInventory: true,
    canSeeResilience: true,
    canSeeCommercial: true,
    canSeeCompliance: true,
    canSeeAnalytics: false,
    canSeeOrigins: false,
  },
  aggregator: {
    canSeeProducers: true,
    canSeeSuppliers: false,
    canSeeOwnedPlots: false,
    canSeeThirdPartyPlots: true,
    canEditPlots: false,
    canSeePurchases: true,
    canSeeReception: true,
    canSeeLabor: false,
    canSeeEudr: true,
    canSeeNovaCup: true,
    canSeeAgronomy: true,
    canSeeInventory: true,
    canSeeResilience: true,
    canSeeCommercial: true,
    canSeeCompliance: true,
    canSeeAnalytics: false,
    canSeeOrigins: false,
  },
  trader: {
    canSeeProducers: false,
    canSeeSuppliers: true,
    canSeeOwnedPlots: false,
    canSeeThirdPartyPlots: true,
    canEditPlots: false,
    canSeePurchases: true,
    canSeeReception: true,
    canSeeLabor: false,
    canSeeEudr: true,
    canSeeNovaCup: true,
    canSeeAgronomy: false,
    canSeeInventory: false,
    canSeeResilience: false,
    canSeeCommercial: true,
    canSeeCompliance: true,
    canSeeAnalytics: true,
    canSeeOrigins: true,
  },
  auditor: {
    canSeeProducers: false,
    canSeeSuppliers: true,
    canSeeOwnedPlots: false,
    canSeeThirdPartyPlots: true,
    canEditPlots: false,
    canSeePurchases: false,
    canSeeReception: false,
    canSeeLabor: false,
    canSeeEudr: true,
    canSeeNovaCup: false,
    canSeeAgronomy: false,
    canSeeInventory: false,
    canSeeResilience: false,
    canSeeCommercial: false,
    canSeeCompliance: true,
    canSeeAnalytics: false,
    canSeeOrigins: false,
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
    case 'finca_empresarial': return 'estate_hybrid'; // default to hybrid for estate
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
  return getVisibilityPolicy(model).canSeeSuppliers;
}

export function showsAbastecimiento(model: OperatingModel): boolean {
  const p = getVisibilityPolicy(model);
  return p.canSeePurchases || p.canSeeReception;
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
  return getVisibilityPolicy(model).canSeeCompliance;
}

export function showsOrigenes(model: OperatingModel): boolean {
  return getVisibilityPolicy(model).canSeeOrigins;
}

export function showsAnalitica(model: OperatingModel): boolean {
  return getVisibilityPolicy(model).canSeeAnalytics;
}

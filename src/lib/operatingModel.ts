/**
 * Operating model helpers for Nova Silva.
 * Determines entity visibility based on organization type.
 *
 * Operating models:
 * - single_farm: Finca privada / productor independiente
 * - estate: Finca empresarial grande
 * - aggregator: Cooperativa / beneficio
 * - trader: Exportador
 * - auditor: Certificadora
 */

import { getDemoConfig } from '@/hooks/useDemoConfig';

export type OperatingModel = 'single_farm' | 'estate' | 'aggregator' | 'trader' | 'auditor';

export function getOperatingModel(orgType?: string | null): OperatingModel {
  // First check demo config for explicit operating model
  const cfg = getDemoConfig();
  if (cfg?.operatingModel) {
    const valid: OperatingModel[] = ['single_farm', 'estate', 'aggregator', 'trader', 'auditor'];
    if (valid.includes(cfg.operatingModel as OperatingModel)) return cfg.operatingModel as OperatingModel;
  }

  const t = orgType || cfg?.orgType || 'cooperativa';
  switch (t) {
    case 'productor_privado': return 'single_farm';
    case 'finca_empresarial': return 'estate';
    case 'cooperativa': return 'aggregator';
    case 'exportador': return 'trader';
    case 'certificadora': return 'auditor';
    default: return 'aggregator';
  }
}

/** Current operating model based on demo config or org context */
export function useOperatingModel(): OperatingModel {
  const cfg = getDemoConfig();
  return getOperatingModel(cfg?.orgType);
}

// ── Entity visibility rules ──

export function showsProductores(model: OperatingModel): boolean {
  return model === 'aggregator' || model === 'trader';
}

export function showsProveedores(model: OperatingModel): boolean {
  return model === 'aggregator' || model === 'trader' || model === 'estate';
}

export function showsAbastecimiento(model: OperatingModel): boolean {
  return model === 'aggregator' || model === 'trader' || model === 'estate';
}

export function showsRecepcion(model: OperatingModel): boolean {
  return model === 'aggregator' || model === 'estate' || model === 'trader';
}

export function showsJornales(model: OperatingModel): boolean {
  return model === 'single_farm' || model === 'estate' || model === 'aggregator';
}

export function showsInventario(model: OperatingModel): boolean {
  return model === 'single_farm' || model === 'estate' || model === 'aggregator';
}

export function showsAgronomia(model: OperatingModel): boolean {
  return model !== 'auditor' && model !== 'trader';
}

export function showsComercial(model: OperatingModel): boolean {
  return model === 'aggregator' || model === 'trader' || model === 'estate';
}

export function showsCumplimiento(model: OperatingModel): boolean {
  return model !== 'single_farm'; // single_farm may need EUDR but simplified
}

export function showsOrigenes(model: OperatingModel): boolean {
  return model === 'trader';
}

export function showsAnalitica(model: OperatingModel): boolean {
  return model === 'trader';
}

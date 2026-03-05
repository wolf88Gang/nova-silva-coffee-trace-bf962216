export type OrgTipo =
  | 'cooperativa'
  | 'exportador'
  | 'productor'
  | 'productor_empresarial'
  | 'beneficio_privado'
  | 'certificadora'
  | 'aggregator'
  | 'tecnico'
  | 'admin';

export type OrgModule =
  | 'core'
  | 'productores'
  | 'parcelas'
  | 'entregas'
  | 'lotes_acopio'
  | 'lotes_comerciales'
  | 'contratos'
  | 'calidad'
  | 'vital'
  | 'eudr'
  | 'finanzas'
  | 'creditos'
  | 'jornales'
  | 'inventario'
  | 'mensajes'
  | 'inclusion'
  | 'admin';

const DEFAULTS: Record<OrgTipo, OrgModule[]> = {
  cooperativa: ['core','productores','parcelas','entregas','lotes_acopio','calidad','vital','finanzas','creditos','jornales','inventario','mensajes','inclusion'],
  exportador: ['core','productores','parcelas','entregas','lotes_acopio','lotes_comerciales','contratos','calidad','eudr','finanzas','mensajes'],
  productor: ['core','parcelas','vital','finanzas','inventario','mensajes'],
  productor_empresarial: ['core','parcelas','vital','finanzas','inventario','mensajes'],
  beneficio_privado: ['core','productores','parcelas','entregas','lotes_acopio','calidad','vital','finanzas','jornales','inventario','mensajes'],
  certificadora: ['core','vital','eudr'],
  aggregator: ['core','productores','lotes_acopio','lotes_comerciales','contratos','calidad','eudr','finanzas'],
  tecnico: ['core','productores','parcelas','vital'],
  admin: ['core','admin'],
};

export function getOrgDefaultModules(orgTipo: OrgTipo): OrgModule[] {
  return DEFAULTS[orgTipo] ?? DEFAULTS.cooperativa;
}

export function resolveActiveModules(
  orgTipo: OrgTipo,
  modulesJsonb: string[] | null,
  legacyFlags?: { is_eudr_active?: boolean; is_vital_active?: boolean },
): OrgModule[] {
  if (modulesJsonb && modulesJsonb.length > 0) {
    return modulesJsonb as OrgModule[];
  }
  const defaults = getOrgDefaultModules(orgTipo);
  if (legacyFlags?.is_eudr_active && !defaults.includes('eudr')) defaults.push('eudr');
  if (legacyFlags?.is_vital_active && !defaults.includes('vital')) defaults.push('vital');
  return defaults;
}

export function hasModule(activeModules: OrgModule[], mod: OrgModule): boolean {
  return activeModules.includes(mod);
}

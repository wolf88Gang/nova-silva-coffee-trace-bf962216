/**
 * Config del wizard de demo.
 * Mapea opciones del wizard a arquetipos y módulos existentes.
 */
import type { OrgType, OperatingModel } from './demoArchitecture';

export type WizardOrgType =
  | 'productor_privado'
  | 'finca_empresarial'
  | 'cooperativa'
  | 'beneficio'
  | 'exportador'
  | 'certificadora'
  | 'otro';

export type WizardOperatingModel =
  | 'solo_produccion'
  | 'produccion_y_compra'
  | 'agrupamos_productores'
  | 'compramos_comercializamos'
  | 'auditamos'
  | 'vendemos_insumos';

export type WizardModuleKey =
  | 'produccion'
  | 'agronomia'
  | 'cumplimiento'
  | 'calidad'
  | 'jornales'
  | 'inventario'
  | 'catalogo_insumos'
  | 'abastecimiento';

export interface DemoSetupConfig {
  orgType: WizardOrgType;
  operatingModel: WizardOperatingModel;
  modulesEnabled: WizardModuleKey[];
  scaleProfile: {
    plotCount: number;
    producerOrSupplierCount: number;
    userCount: number;
    hasLabor: boolean;
    hasInventory: boolean;
    hasExports: boolean;
  };
}

export const WIZARD_ORG_OPTIONS: { value: WizardOrgType; label: string }[] = [
  { value: 'productor_privado', label: 'Finca privada' },
  { value: 'finca_empresarial', label: 'Finca empresarial' },
  { value: 'cooperativa', label: 'Cooperativa' },
  { value: 'beneficio', label: 'Beneficio / procesador' },
  { value: 'exportador', label: 'Exportador' },
  { value: 'certificadora', label: 'Certificadora' },
  { value: 'otro', label: 'Otro' },
];

export const WIZARD_OP_MODEL_OPTIONS: { value: WizardOperatingModel; label: string }[] = [
  { value: 'solo_produccion', label: 'Solo producimos café propio' },
  { value: 'produccion_y_compra', label: 'Producimos y también compramos café a terceros' },
  { value: 'agrupamos_productores', label: 'Agrupamos productores' },
  { value: 'compramos_comercializamos', label: 'Compramos y comercializamos café' },
  { value: 'auditamos', label: 'Auditamos o verificamos cumplimiento' },
  { value: 'vendemos_insumos', label: 'Vendemos insumos a productores' },
];

export const WIZARD_MODULE_OPTIONS: { value: WizardModuleKey; label: string }[] = [
  { value: 'produccion', label: 'Producción y trazabilidad' },
  { value: 'agronomia', label: 'Agronomía y recomendaciones' },
  { value: 'cumplimiento', label: 'EUDR y cumplimiento' },
  { value: 'calidad', label: 'Calidad / Nova Cup' },
  { value: 'jornales', label: 'Jornales y costos' },
  { value: 'inventario', label: 'Inventario e insumos' },
  { value: 'catalogo_insumos', label: 'Catálogo de insumos para productores' },
  { value: 'abastecimiento', label: 'Compras y abastecimiento' },
];

/** Mapea wizard orgType → archetype orgType */
export function wizardOrgToArchetype(w: WizardOrgType): OrgType {
  const m: Record<WizardOrgType, OrgType> = {
    productor_privado: 'productor_privado',
    finca_empresarial: 'finca_empresarial',
    cooperativa: 'cooperativa',
    beneficio: 'cooperativa',
    exportador: 'exportador',
    certificadora: 'certificadora',
    otro: 'productor_privado',
  };
  return m[w];
}

/** Mapea wizard operatingModel → archetype operatingModel */
export function wizardOpToArchetype(w: WizardOperatingModel): OperatingModel {
  const m: Record<WizardOperatingModel, OperatingModel> = {
    solo_produccion: 'solo_produccion_propia',
    produccion_y_compra: 'produccion_propia_y_compra_terceros',
    agrupamos_productores: 'agregacion_cooperativa',
    compramos_comercializamos: 'originacion_masiva',
    auditamos: 'auditoria',
    vendemos_insumos: 'agregacion_cooperativa',
  };
  return m[w];
}

/** Mapea wizard modules → keys de domainNav (modules activos) */
export function wizardModulesToDomainKeys(modules: WizardModuleKey[]): Record<string, boolean> {
  const keys: Record<string, boolean> = {
    produccion: false,
    abastecimiento: false,
    agronomia: false,
    resiliencia: true,
    cumplimiento: false,
    calidad: false,
    finanzas: true,
    jornales: false,
  };
  for (const m of modules) {
    if (m === 'produccion') keys.produccion = true;
    if (m === 'abastecimiento') keys.abastecimiento = true;
    if (m === 'agronomia') keys.agronomia = true;
    if (m === 'cumplimiento') keys.cumplimiento = true;
    if (m === 'calidad') keys.calidad = true;
    if (m === 'jornales') keys.jornales = true;
    if (m === 'inventario') keys.jornales = true;
    if (m === 'catalogo_insumos') keys.abastecimiento = true;
  }
  if (modules.length === 0) {
    keys.produccion = true;
    keys.resiliencia = true;
    keys.cumplimiento = true;
  }
  return keys;
}

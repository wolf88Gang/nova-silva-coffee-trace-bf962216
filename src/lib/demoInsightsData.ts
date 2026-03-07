import type { ModuleSnapshot } from '@/lib/interModuleEngine';
import type { BlockedIngredient, PhaseoutIngredient } from '@/hooks/useComplianceEngine';
import type { OrgCertification } from '@/hooks/useOrgCertifications';
import type { OrgExportMarket } from '@/hooks/useOrgExportMarkets';

export const DEMO_SNAPSHOT: ModuleSnapshot = {
  yieldExpected: 22.5,
  yieldUncertainty: 2.8,
  yieldPotential: 28.0,
  diseasePressureIndex: 0.28,
  diseaseFactor: 0.83,
  nutrientLimitationScore: 0.35,
  limitingNutrient: 'K',
  nutrientFactor: 0.78,
  resilienceIndex: 0.62,
  waterStressIndex: 0.15,
  waterFactor: 0.91,
  yieldAdjusted: 16.8,
};

export const DEMO_SNAPSHOTS_HISTORY = [
  { ciclo: '2022-2023', yield_expected: 20, yield_adjusted: 14.5, yield_real: 13.8 },
  { ciclo: '2023-2024', yield_expected: 21, yield_adjusted: 15.2, yield_real: 15.0 },
  { ciclo: '2024-2025', yield_expected: 22.5, yield_adjusted: 16.8, yield_real: null },
];

export const DEMO_BLOCKED_INGREDIENTS: BlockedIngredient[] = [
  { ingredient_id: '1', nombre_comun: 'Clorpirifos', clase_funcional: 'Insecticida', bloqueado_por: 'Mercado', nivel: 'prohibido', detalle: 'Prohibido en EU desde 2020 y USA desde 2022' },
  { ingredient_id: '2', nombre_comun: 'Paraquat', clase_funcional: 'Herbicida', bloqueado_por: 'Mercado', nivel: 'prohibido', detalle: 'Prohibido en EU. LMR = 0 en todos los mercados' },
  { ingredient_id: '3', nombre_comun: 'Endosulfán', clase_funcional: 'Insecticida', bloqueado_por: 'Convenio Internacional', nivel: 'cancelado', detalle: 'Convenio de Estocolmo — eliminación global' },
  { ingredient_id: '4', nombre_comun: 'Carbofuran', clase_funcional: 'Insecticida', bloqueado_por: 'Certificación', nivel: 'lista_roja', detalle: 'Lista roja Rainforest Alliance y Fairtrade' },
  { ingredient_id: '5', nombre_comun: 'Fipronil', clase_funcional: 'Insecticida', bloqueado_por: 'Certificación', nivel: 'lista_roja', detalle: 'Prohibido por Rainforest Alliance 2024' },
  { ingredient_id: '6', nombre_comun: 'Metamidofos', clase_funcional: 'Insecticida', bloqueado_por: 'Mercado', nivel: 'prohibido', detalle: 'No registrado en EU ni USA para café' },
];

export const DEMO_PHASEOUT_INGREDIENTS: PhaseoutIngredient[] = [
  { ingredient_id: '7', nombre_comun: 'Glifosato', certificadora: 'Rainforest Alliance', nivel_restriccion: 'phase_out_2026', fecha_phase_out: '2026-12-31', dias_restantes: 299 },
  { ingredient_id: '8', nombre_comun: 'Mancozeb', certificadora: 'EU', nivel_restriccion: 'phase_out_2026', fecha_phase_out: '2026-06-30', dias_restantes: 115 },
  { ingredient_id: '9', nombre_comun: 'Imidacloprid', certificadora: 'Fairtrade', nivel_restriccion: 'phase_out_2030', fecha_phase_out: '2030-01-01', dias_restantes: 1395 },
];

export const DEMO_CERTIFICATIONS: OrgCertification[] = [
  { id: 'demo-1', organization_id: 'demo', certificadora: 'fairtrade', codigo: 'FT-2024-0892', fecha_emision: '2024-03-15', fecha_vencimiento: '2027-03-14', activo: true },
  { id: 'demo-2', organization_id: 'demo', certificadora: 'rainforest_alliance', codigo: 'RA-CF-1204', fecha_emision: '2024-06-01', fecha_vencimiento: '2027-05-31', activo: true },
  { id: 'demo-3', organization_id: 'demo', certificadora: '4c', codigo: '4C-2023-5521', fecha_emision: '2023-11-20', fecha_vencimiento: '2025-11-19', activo: false },
];

export const DEMO_EXPORT_MARKETS: OrgExportMarket[] = [
  { id: 'demo-m1', organization_id: 'demo', mercado: 'EU', principal: true },
  { id: 'demo-m2', organization_id: 'demo', mercado: 'USA', principal: false },
  { id: 'demo-m3', organization_id: 'demo', mercado: 'JAPAN', principal: false },
];

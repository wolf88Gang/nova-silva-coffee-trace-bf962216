import type { ArchetypeKey } from './demoOverviewRegistry';

export interface JornalesOverview {
  organization_id: string;
  campañas: number;
  partes_diarios: number;
}

export function demoJornales(archetype: ArchetypeKey) {
  const hasJornales = ['cooperativa', 'finca_empresarial', 'productor_privado'].includes(archetype);
  return hasJornales ? { campañas: 2, partes_diarios: 45 } : { campañas: 0, partes_diarios: 0 };
}

export function demoJornalesOverview(archetype: ArchetypeKey): JornalesOverview {
  const counts = demoJornales(archetype);
  return {
    organization_id: 'demo',
    campañas: counts.campañas,
    partes_diarios: counts.partes_diarios,
  };
}

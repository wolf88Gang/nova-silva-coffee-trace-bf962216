import type { ArchetypeKey } from './demoOverviewRegistry';

export interface YieldOverview {
  organization_id: string;
  estimaciones: number;
  resultados_cosecha: number;
}

export interface EstimacionReciente {
  parcela_nombre: string;
  kg_estimado: number;
  fecha: string;
}

export function demoYield(archetype: ArchetypeKey) {
  if (archetype === 'exportador' || archetype === 'certificadora') return { estimaciones: 0, resultados_cosecha: 0 };
  return { estimaciones: 8, resultados_cosecha: 12 };
}

export function demoYieldOverview(archetype: ArchetypeKey): YieldOverview {
  const counts = demoYield(archetype);
  return {
    organization_id: 'demo',
    estimaciones: counts.estimaciones,
    resultados_cosecha: counts.resultados_cosecha,
  };
}

export function demoEstimacionesRecientes(archetype: ArchetypeKey): EstimacionReciente[] {
  if (archetype === 'exportador' || archetype === 'certificadora') return [];
  return [
    { parcela_nombre: 'Lote Norte', kg_estimado: 1200, fecha: '2025-03-01' },
    { parcela_nombre: 'El Mirador', kg_estimado: 800, fecha: '2025-02-28' },
    { parcela_nombre: 'La Esperanza', kg_estimado: 950, fecha: '2025-02-25' },
  ];
}

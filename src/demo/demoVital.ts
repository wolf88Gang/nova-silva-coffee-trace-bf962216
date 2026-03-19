import type { ArchetypeKey } from './demoOverviewRegistry';

export interface VitalOverview {
  organization_id: string;
  evaluaciones: number;
  scores: number;
}

export interface VitalScoreDist {
  estado: string;
  parcelas: number;
}

export function demoVital(archetype: ArchetypeKey) {
  if (archetype === 'exportador' || archetype === 'certificadora') return { evaluaciones: 0, scores: 0 };
  return { evaluaciones: 6, scores: 12 };
}

export function demoVitalOverview(archetype: ArchetypeKey): VitalOverview {
  const counts = demoVital(archetype);
  return {
    organization_id: 'demo',
    evaluaciones: counts.evaluaciones,
    scores: counts.scores,
  };
}

export function demoVitalDistribucion(archetype: ArchetypeKey): VitalScoreDist[] {
  if (archetype === 'exportador' || archetype === 'certificadora') return [];
  return [
    { estado: 'Alto', parcelas: 4 },
    { estado: 'Medio', parcelas: 8 },
    { estado: 'Bajo', parcelas: 2 },
  ];
}

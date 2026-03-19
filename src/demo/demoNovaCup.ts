import type { ArchetypeKey } from './demoOverviewRegistry';

export interface NovaCupOverview {
  organization_id: string;
  snapshots: number;
}

export interface MuestraDestacada {
  lote: string;
  puntaje: number;
  notas: string;
}

export function demoNovaCup(archetype: ArchetypeKey) {
  if (archetype === 'productor_privado') return { snapshots: 2 };
  if (archetype === 'certificadora') return { snapshots: 15 };
  return { snapshots: 8 };
}

export function demoNovaCupOverview(archetype: ArchetypeKey): NovaCupOverview {
  const counts = demoNovaCup(archetype);
  return {
    organization_id: 'demo',
    snapshots: counts.snapshots,
  };
}

export function demoMuestrasDestacadas(archetype: ArchetypeKey): MuestraDestacada[] {
  if (archetype === 'productor_privado') {
    return [{ lote: 'Mi lote', puntaje: 84, notas: 'Cítrico, cuerpo medio' }];
  }
  if (archetype === 'certificadora') return [];
  return [
    { lote: 'LOT-001', puntaje: 86, notas: 'Cítrico, chocolate' },
    { lote: 'LOT-002', puntaje: 82, notas: 'Floral, cuerpo alto' },
    { lote: 'LOT-003', puntaje: 88, notas: 'Frutos rojos, acidez brillante' },
  ];
}

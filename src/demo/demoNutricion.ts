import type { ArchetypeKey } from './demoOverviewRegistry';

export interface NutricionOverview {
  organization_id: string;
  planes: number;
  aplicaciones: number;
}

export interface PlanActivo {
  parcela_nombre: string;
  estado: string;
  ultima_aplicacion: string;
}

export function demoNutricion(archetype: ArchetypeKey) {
  if (archetype === 'exportador' || archetype === 'certificadora') return { planes: 0, aplicaciones: 0 };
  return { planes: 12, aplicaciones: 28 };
}

export function demoNutricionOverview(archetype: ArchetypeKey): NutricionOverview {
  const counts = demoNutricion(archetype);
  return {
    organization_id: 'demo',
    planes: counts.planes,
    aplicaciones: counts.aplicaciones,
  };
}

export function demoPlanesActivos(archetype: ArchetypeKey): PlanActivo[] {
  if (archetype === 'exportador' || archetype === 'certificadora') return [];
  return [
    { parcela_nombre: 'Lote Norte', estado: 'En ejecución', ultima_aplicacion: '2025-02-28' },
    { parcela_nombre: 'El Mirador', estado: 'Completado', ultima_aplicacion: '2025-02-25' },
    { parcela_nombre: 'La Esperanza', estado: 'Pendiente', ultima_aplicacion: '2025-02-20' },
  ];
}

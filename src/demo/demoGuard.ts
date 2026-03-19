import type { ArchetypeKey } from './demoOverviewRegistry';

export interface GuardOverview {
  organization_id: string;
  casos: number;
  alertas: number;
}

export interface AlertaActiva {
  parcela_nombre: string;
  severidad: string;
  diagnostico: string;
  fecha: string;
}

export function demoGuard(archetype: ArchetypeKey) {
  if (archetype === 'exportador' || archetype === 'certificadora') return { casos: 0, alertas: 0 };
  return { casos: 5, alertas: 2 };
}

export function demoGuardOverview(archetype: ArchetypeKey): GuardOverview {
  const counts = demoGuard(archetype);
  return {
    organization_id: 'demo',
    casos: counts.casos,
    alertas: counts.alertas,
  };
}

export function demoAlertasActivas(archetype: ArchetypeKey): AlertaActiva[] {
  if (archetype === 'exportador' || archetype === 'certificadora') return [];
  return [
    { parcela_nombre: 'Lote Norte', severidad: 'Media', diagnostico: 'Roya', fecha: '2025-03-01' },
    { parcela_nombre: 'La Esperanza', severidad: 'Baja', diagnostico: 'Ojo de gallo', fecha: '2025-02-28' },
  ];
}

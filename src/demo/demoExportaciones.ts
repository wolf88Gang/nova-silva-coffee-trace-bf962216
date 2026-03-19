import type { ArchetypeKey } from './demoOverviewRegistry';

export interface ExportacionesOverview {
  envios: number;
  volumen_kg: number;
}

export function demoExportaciones(archetype: ArchetypeKey) {
  const hasExport = ['exportador', 'cooperativa', 'finca_empresarial'].includes(archetype);
  return hasExport ? { envios: 5, volumen_kg: 12500 } : { envios: 0, volumen_kg: 0 };
}

export function demoExportacionesOverview(archetype: ArchetypeKey): ExportacionesOverview {
  return {
    ...demoExportaciones(archetype),
  };
}

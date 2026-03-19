import type { ArchetypeKey } from './demoOverviewRegistry';

export interface ComplianceOverview {
  organization_id: string;
  eudr_logs: number;
  certificaciones: number;
}

export interface EudrDossier {
  lote: string;
  estado: 'verde' | 'ambar' | 'rojo';
  fecha_verificacion: string;
}

export function demoCompliance(archetype: ArchetypeKey) {
  if (archetype === 'productor_privado') return { eudr_logs: 2, certificaciones: 1 };
  if (archetype === 'certificadora') return { eudr_logs: 0, certificaciones: 8 };
  return { eudr_logs: 12, certificaciones: 3 };
}

export function demoComplianceOverview(archetype: ArchetypeKey): ComplianceOverview {
  const counts = demoCompliance(archetype);
  return {
    organization_id: 'demo',
    eudr_logs: counts.eudr_logs,
    certificaciones: counts.certificaciones,
  };
}

export function demoEudrDossiers(archetype: ArchetypeKey): EudrDossier[] {
  if (archetype === 'certificadora') return [];
  return [
    { lote: 'LOT-2025-001', estado: 'verde', fecha_verificacion: '2025-02-28' },
    { lote: 'LOT-2025-002', estado: 'ambar', fecha_verificacion: '2025-02-25' },
    { lote: 'LOT-2025-003', estado: 'verde', fecha_verificacion: '2025-02-20' },
  ];
}

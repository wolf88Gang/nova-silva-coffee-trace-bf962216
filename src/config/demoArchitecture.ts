/**
 * Mocks demo para arquitectura Nova Silva.
 * Organizaciones y perfiles por arquetipo operativo.
 * NO toca APIs reales.
 */

export type OrgType = 'cooperativa' | 'finca_empresarial' | 'exportador' | 'productor_privado' | 'certificadora';
export type OperatingModel =
  | 'agregacion_cooperativa'
  | 'produccion_propia_y_compra_terceros'
  | 'originacion_masiva'
  | 'solo_produccion_propia'
  | 'auditoria';

export interface DemoModule {
  id: string;
  key: string;
  label: string;
  active: boolean;
}

export interface DemoOrganization {
  id: string;
  name: string;
  orgType: OrgType;
  operatingModel: OperatingModel;
  modules: DemoModule[];
}

export interface DemoProfile {
  id: string;
  name: string;
  role: string;
  organizationId: string;
  email: string;
  password: string;
}

export const DEMO_ORGANIZATIONS: DemoOrganization[] = [
  {
    id: 'org-coop-1',
    name: 'Cooperativa Café de la Selva',
    orgType: 'cooperativa',
    operatingModel: 'agregacion_cooperativa',
    modules: [
      { id: 'm1', key: 'produccion', label: 'Producción', active: true },
      { id: 'm2', key: 'abastecimiento', label: 'Abastecimiento', active: true },
      { id: 'm3', key: 'agronomia', label: 'Agronomía', active: true },
      { id: 'm4', key: 'resiliencia', label: 'Resiliencia', active: true },
      { id: 'm5', key: 'cumplimiento', label: 'Cumplimiento', active: true },
      { id: 'm6', key: 'calidad', label: 'Calidad', active: true },
      { id: 'm7', key: 'finanzas', label: 'Finanzas', active: true },
      { id: 'm8', key: 'jornales', label: 'Jornales', active: true },
    ],
  },
  {
    id: 'org-finca-1',
    name: 'Finca El Mirador S.A.',
    orgType: 'finca_empresarial',
    operatingModel: 'produccion_propia_y_compra_terceros',
    modules: [
      { id: 'm1', key: 'produccion', label: 'Producción', active: true },
      { id: 'm2', key: 'abastecimiento', label: 'Abastecimiento', active: true },
      { id: 'm3', key: 'agronomia', label: 'Agronomía', active: true },
      { id: 'm4', key: 'resiliencia', label: 'Resiliencia', active: true },
      { id: 'm5', key: 'cumplimiento', label: 'Cumplimiento', active: true },
      { id: 'm6', key: 'calidad', label: 'Calidad', active: true },
      { id: 'm7', key: 'finanzas', label: 'Finanzas', active: true },
      { id: 'm8', key: 'jornales', label: 'Jornales', active: true },
    ],
  },
  {
    id: 'org-exp-1',
    name: 'Exportadora Sol de América',
    orgType: 'exportador',
    operatingModel: 'originacion_masiva',
    modules: [
      { id: 'm1', key: 'produccion', label: 'Producción', active: false },
      { id: 'm2', key: 'abastecimiento', label: 'Abastecimiento', active: true },
      { id: 'm3', key: 'agronomia', label: 'Agronomía', active: false },
      { id: 'm4', key: 'resiliencia', label: 'Resiliencia', active: false },
      { id: 'm5', key: 'cumplimiento', label: 'Cumplimiento', active: true },
      { id: 'm6', key: 'calidad', label: 'Calidad', active: true },
      { id: 'm7', key: 'finanzas', label: 'Finanzas', active: true },
      { id: 'm8', key: 'jornales', label: 'Jornales', active: false },
    ],
  },
  {
    id: 'org-prod-1',
    name: 'Finca El Cafetal',
    orgType: 'productor_privado',
    operatingModel: 'solo_produccion_propia',
    modules: [
      { id: 'm1', key: 'produccion', label: 'Producción', active: true },
      { id: 'm2', key: 'abastecimiento', label: 'Abastecimiento', active: false },
      { id: 'm3', key: 'agronomia', label: 'Agronomía', active: true },
      { id: 'm4', key: 'resiliencia', label: 'Resiliencia', active: true },
      { id: 'm5', key: 'cumplimiento', label: 'Cumplimiento', active: true },
      { id: 'm6', key: 'calidad', label: 'Calidad', active: false },
      { id: 'm7', key: 'finanzas', label: 'Finanzas', active: true },
      { id: 'm8', key: 'jornales', label: 'Jornales', active: true },
    ],
  },
  {
    id: 'org-cert-1',
    name: 'CertifiCafé Internacional',
    orgType: 'certificadora',
    operatingModel: 'auditoria',
    modules: [
      { id: 'm1', key: 'produccion', label: 'Producción', active: false },
      { id: 'm2', key: 'abastecimiento', label: 'Abastecimiento', active: false },
      { id: 'm3', key: 'agronomia', label: 'Agronomía', active: false },
      { id: 'm4', key: 'resiliencia', label: 'Resiliencia', active: false },
      { id: 'm5', key: 'cumplimiento', label: 'Cumplimiento', active: true },
      { id: 'm6', key: 'calidad', label: 'Calidad', active: true },
      { id: 'm7', key: 'finanzas', label: 'Finanzas', active: false },
      { id: 'm8', key: 'jornales', label: 'Jornales', active: false },
    ],
  },
];

/** Mapeo orgType → role legacy para ensure-demo-user */
const ORG_TO_LEGACY_ROLE: Record<OrgType, string> = {
  cooperativa: 'cooperativa',
  finca_empresarial: 'cooperativa',
  exportador: 'exportador',
  productor_privado: 'productor',
  certificadora: 'certificadora',
};

export const DEMO_PROFILES: DemoProfile[] = [
  { id: 'p1', name: 'María García', role: 'admin_org', organizationId: 'org-coop-1', email: 'demo.cooperativa@novasilva.com', password: 'demo123456' },
  { id: 'p2', name: 'Pedro Técnico', role: 'tecnico', organizationId: 'org-coop-1', email: 'demo.tecnico@novasilva.com', password: 'demo123456' },
  { id: 'p3', name: 'Juan Pérez', role: 'productor', organizationId: 'org-prod-1', email: 'demo.productor@novasilva.com', password: 'demo123456' },
  { id: 'p4', name: 'Carlos Mendoza', role: 'admin_org', organizationId: 'org-exp-1', email: 'demo.exportador@novasilva.com', password: 'demo123456' },
  { id: 'p5', name: 'Ana Certificadora', role: 'auditor', organizationId: 'org-cert-1', email: 'demo.certificadora@novasilva.com', password: 'demo123456' },
  { id: 'p6', name: 'Roberto Finca', role: 'admin_org', organizationId: 'org-finca-1', email: 'demo.cooperativa@novasilva.com', password: 'demo123456' },
];

export function getProfilesByOrg(orgId: string): DemoProfile[] {
  return DEMO_PROFILES.filter((p) => p.organizationId === orgId);
}

export function getOrgById(orgId: string): DemoOrganization | undefined {
  return DEMO_ORGANIZATIONS.find((o) => o.id === orgId);
}

export function getLegacyRoleForOrg(orgType: OrgType): string {
  return ORG_TO_LEGACY_ROLE[orgType];
}

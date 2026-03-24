/**
 * Demo Archetypes — commercial profiles for demo setup.
 *
 * Each archetype maps to ONE real demo organization (platform_organizations).
 * The archetype adds commercial richness without requiring more backend orgs.
 *
 * Modes:
 *   lead  → simplified set for prospect-facing demos
 *   admin → full set for internal Nova Silva staff
 */

import {
  Users, Leaf, Package, Ship, ShieldCheck, Factory, Sprout, Coffee,
  Truck, Building2, Globe, Landmark, Crown,
  type LucideIcon,
} from 'lucide-react';

// ── Types ──

export type DemoMode = 'lead' | 'admin';

export interface DemoArchetype {
  key: string;
  label: string;
  subtitle: string;
  icon: LucideIcon;
  /** Which modes this archetype appears in */
  modes: DemoMode[];
  /** Maps to real demo org for auth */
  demoOrgId: string;
  demoEmail: string;
  demoRole: string;
  redirectPath: string;
  /** Operating model used for pricing/config */
  operatingModel: string;
  /** OrgType key for pricing engine */
  orgType: string;
  /** Default modules activated */
  defaultModules: string[];
  /** Country hint for pricing/context */
  country?: string;
  /** Tags for filtering/search */
  tags?: string[];
}

// ── Archetype registry ──

export const DEMO_ARCHETYPES: DemoArchetype[] = [
  // ── Lead-facing archetypes ──
  {
    key: 'cooperativa',
    label: 'Cooperativa',
    subtitle: 'Agrupa productores, coordina operación y cumplimiento',
    icon: Users,
    modes: ['lead', 'admin'],
    demoOrgId: 'coop_demo',
    demoEmail: 'demo.cooperativa@novasilva.com',
    demoRole: 'cooperativa',
    redirectPath: '/produccion',
    operatingModel: 'aggregator',
    orgType: 'cooperativa',
    defaultModules: ['Producción', 'Agronomía', 'VITAL', 'EUDR', 'Finanzas', 'Nova Cup'],
    country: 'Costa Rica',
    tags: ['aggregator', 'socios', 'trazabilidad'],
  },
  {
    key: 'asociacion_privada',
    label: 'Asociación privada',
    subtitle: 'Red de productores con gestión profesionalizada',
    icon: Building2,
    modes: ['lead', 'admin'],
    demoOrgId: 'coop_demo',
    demoEmail: 'demo.cooperativa@novasilva.com',
    demoRole: 'cooperativa',
    redirectPath: '/produccion',
    operatingModel: 'aggregator',
    orgType: 'cooperativa',
    defaultModules: ['Producción', 'Agronomía', 'VITAL', 'Cumplimiento', 'Finanzas'],
    country: 'Guatemala',
    tags: ['aggregator', 'asociación'],
  },
  {
    key: 'exportador',
    label: 'Exportador',
    subtitle: 'Compra y exporta café a mercados internacionales',
    icon: Ship,
    modes: ['lead', 'admin'],
    demoOrgId: 'exporter_demo',
    demoEmail: 'demo.exportador@novasilva.com',
    demoRole: 'exportador',
    redirectPath: '/origenes',
    operatingModel: 'trader',
    orgType: 'exportador',
    defaultModules: ['Orígenes', 'Cumplimiento', 'EUDR', 'Lotes', 'Analítica', 'Nova Cup', 'Finanzas'],
    country: 'Centroamérica',
    tags: ['trader', 'supply chain', 'EUDR'],
  },
  {
    key: 'exportador_red',
    label: 'Exportador con red de productores',
    subtitle: 'Exporta y gestiona proveedores directos en campo',
    icon: Globe,
    modes: ['lead', 'admin'],
    demoOrgId: 'exporter_demo',
    demoEmail: 'demo.exportador@novasilva.com',
    demoRole: 'exportador',
    redirectPath: '/origenes',
    operatingModel: 'trader',
    orgType: 'exportador',
    defaultModules: ['Orígenes', 'Producción', 'Cumplimiento', 'EUDR', 'Lotes', 'Analítica', 'Finanzas'],
    country: 'Colombia',
    tags: ['trader', 'field', 'traceability'],
  },
  {
    key: 'beneficio',
    label: 'Beneficio / Procesador',
    subtitle: 'Compra, procesa y prepara café para venta',
    icon: Package,
    modes: ['lead', 'admin'],
    demoOrgId: 'coop_demo',
    demoEmail: 'demo.cooperativa@novasilva.com',
    demoRole: 'cooperativa',
    redirectPath: '/produccion',
    operatingModel: 'aggregator',
    orgType: 'beneficio',
    defaultModules: ['Producción', 'Abastecimiento', 'Calidad', 'Cumplimiento', 'Finanzas'],
    country: 'Honduras',
    tags: ['aggregator', 'processing'],
  },
  {
    key: 'beneficio_exportador',
    label: 'Beneficio exportador',
    subtitle: 'Procesa y exporta directamente a compradores',
    icon: Factory,
    modes: ['admin'],
    demoOrgId: 'exporter_demo',
    demoEmail: 'demo.exportador@novasilva.com',
    demoRole: 'exportador',
    redirectPath: '/origenes',
    operatingModel: 'trader',
    orgType: 'exportador',
    defaultModules: ['Producción', 'Abastecimiento', 'Orígenes', 'EUDR', 'Calidad', 'Lotes', 'Finanzas'],
    country: 'Costa Rica',
    tags: ['processing', 'export'],
  },
  {
    key: 'trader',
    label: 'Trader / Comercializador',
    subtitle: 'Compra y revende café sin procesar directamente',
    icon: Coffee,
    modes: ['admin'],
    demoOrgId: 'exporter_demo',
    demoEmail: 'demo.exportador@novasilva.com',
    demoRole: 'exportador',
    redirectPath: '/origenes',
    operatingModel: 'trader',
    orgType: 'exportador',
    defaultModules: ['Orígenes', 'Lotes', 'Cumplimiento', 'Analítica', 'Finanzas'],
    tags: ['trader', 'commercial'],
  },
  {
    key: 'finca_privada',
    label: 'Finca privada',
    subtitle: 'Productor independiente con parcelas propias',
    icon: Leaf,
    modes: ['lead', 'admin'],
    demoOrgId: 'farm_demo',
    demoEmail: 'demo.productor@novasilva.com',
    demoRole: 'productor',
    redirectPath: '/produccion',
    operatingModel: 'single_farm',
    orgType: 'productor_privado',
    defaultModules: ['Producción', 'Agronomía', 'Jornales', 'VITAL', 'Finanzas', 'Nova Cup'],
    country: 'Costa Rica',
    tags: ['farmer', 'independent'],
  },
  {
    key: 'finca_empresarial',
    label: 'Finca empresarial',
    subtitle: 'Operación grande con manejo intensivo y compras externas',
    icon: Sprout,
    modes: ['lead', 'admin'],
    demoOrgId: 'estate_demo',
    demoEmail: 'demo.cooperativa@novasilva.com',
    demoRole: 'cooperativa',
    redirectPath: '/produccion',
    operatingModel: 'estate_hybrid',
    orgType: 'finca_empresarial',
    defaultModules: ['Producción', 'Abastecimiento', 'Jornales', 'Agronomía', 'VITAL', 'EUDR', 'Nova Cup', 'Finanzas'],
    country: 'Costa Rica',
    tags: ['estate', 'hybrid'],
  },
  {
    key: 'certificadora',
    label: 'Certificadora / Auditor',
    subtitle: 'Audita y verifica cumplimiento de estándares',
    icon: ShieldCheck,
    modes: ['lead', 'admin'],
    demoOrgId: 'cert_demo',
    demoEmail: 'demo.certificadora@novasilva.com',
    demoRole: 'certificadora',
    redirectPath: '/cumplimiento',
    operatingModel: 'auditor',
    orgType: 'certificadora',
    defaultModules: ['Auditorías', 'Data Room', 'Dossiers'],
    tags: ['audit', 'verification'],
  },

  // ── Admin-only archetypes ──
  {
    key: 'demo_institucional',
    label: 'Demo institucional / Donor',
    subtitle: 'Visión de programa: indicadores, impacto, cumplimiento',
    icon: Landmark,
    modes: ['admin'],
    demoOrgId: 'coop_demo',
    demoEmail: 'demo.cooperativa@novasilva.com',
    demoRole: 'cooperativa',
    redirectPath: '/produccion',
    operatingModel: 'aggregator',
    orgType: 'cooperativa',
    defaultModules: ['Producción', 'VITAL', 'Cumplimiento', 'Analítica', 'Finanzas'],
    tags: ['institutional', 'donor', 'program'],
  },
  {
    key: 'admin_novasilva',
    label: 'Vista administrativa Nova Silva',
    subtitle: 'Consola interna: Sales Intelligence, Calibración, Sistema',
    icon: Crown,
    modes: ['admin'],
    demoOrgId: 'platform_admin',
    demoEmail: 'info@novasilva.co',
    demoRole: 'admin',
    redirectPath: '/admin',
    operatingModel: 'platform',
    orgType: 'admin',
    defaultModules: ['Admin', 'Sales Intelligence', 'Calibración', 'Sistema'],
    tags: ['internal', 'platform'],
  },
];

// ── Helpers ──

export function getArchetypesForMode(mode: DemoMode): DemoArchetype[] {
  return DEMO_ARCHETYPES.filter(a => a.modes.includes(mode));
}

export function getArchetypeByKey(key: string): DemoArchetype | undefined {
  return DEMO_ARCHETYPES.find(a => a.key === key);
}

/**
 * Maps a selected archetype to the real demo login credentials.
 * This is the layer between commercial archetypes and physical demo orgs.
 */
export function mapArchetypeToDemoOrg(archetype: DemoArchetype) {
  return {
    orgId: archetype.demoOrgId,
    email: archetype.demoEmail,
    role: archetype.demoRole,
    redirectPath: archetype.redirectPath,
    orgName: archetype.label,
    modules: [...new Set(archetype.defaultModules)],
    operatingModel: archetype.operatingModel,
    orgType: archetype.orgType,
  };
}

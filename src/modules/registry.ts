/**
 * Module Registry — Single source of truth for all platform modules.
 *
 * Each module defines:
 * - Identity (id, label, description)
 * - Access rules (allowedOrgTipos, requiredRoles)
 * - Navigation routes
 * - Data resources (tables, views, RPCs)
 * - Dependencies + feature flags
 * - Permissions per role per resource
 *
 * The registry is consumed by:
 * - useActiveModules() → resolves which modules a user sees
 * - Sidebar → renders nav items
 * - Dashboard → renders widgets
 * - Guards → checks canAccess()
 */

import type { LucideIcon } from 'lucide-react';
import type { UserRole } from '@/types';
import type { OrgTipo } from '@/lib/org-terminology';
import {
  LayoutDashboard, Users, Package, Map as MapIcon, Sprout, Shield,
  DollarSign, Award, Settings, MessageSquare, FileText,
  Bug, Coffee, Calendar, ShieldCheck, Building2, Wallet,
  Leaf, Briefcase, BarChart3, AlertTriangle, Boxes,
} from 'lucide-react';

// ── Types ──

export type PermissionLevel = 'none' | 'read' | 'write' | 'admin';

export interface ModuleRoute {
  path: string;
  label: string;
  icon: LucideIcon;
}

export interface ResourcePermission {
  resource: string;
  /** Permission by role. Roles not listed default to 'none'. */
  permissions: Partial<Record<UserRole, PermissionLevel>>;
}

export interface ModuleDefinition {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;

  /** Org types that can activate this module. Empty = any. */
  allowedOrgTipos: OrgTipo[];
  /** Roles that can see this module. Empty = any authenticated. */
  requiredRoles: UserRole[];

  /** Other module IDs this depends on */
  dependsOn: string[];
  /** Feature flags that must be truthy to enable */
  flags: string[];

  /** DB tables, views, RPCs, edge functions this module touches */
  dataResources: string[];

  /** Fine-grained permissions per resource per role */
  resourcePermissions: ResourcePermission[];

  /** Nav routes contributed by this module */
  routes: ModuleRoute[];

  /** Whether this module contributes dashboard widgets */
  hasDashboardWidget: boolean;
}

// ── Helpers ──

const ALL_ORG_TIPOS: OrgTipo[] = [];
const ALL_ROLES: UserRole[] = [];

const stdPerm = (resource: string, overrides?: Partial<Record<UserRole, PermissionLevel>>): ResourcePermission => ({
  resource,
  permissions: {
    cooperativa: 'write',
    exportador: 'write',
    productor: 'read',
    tecnico: 'read',
    certificadora: 'read',
    admin: 'admin',
    ...overrides,
  },
});

// ── Registry ──

export const MODULE_REGISTRY: ModuleDefinition[] = [
  // ─── Core (always active) ───
  {
    id: 'core',
    label: 'Panel Principal',
    description: 'Dashboard, perfil, configuración base',
    icon: LayoutDashboard,
    allowedOrgTipos: ALL_ORG_TIPOS,
    requiredRoles: ALL_ROLES,
    dependsOn: [],
    flags: [],
    dataResources: ['profiles', 'platform_organizations', 'user_roles'],
    resourcePermissions: [
      stdPerm('profiles'),
      stdPerm('platform_organizations', { productor: 'none', tecnico: 'none' }),
    ],
    routes: [],
    hasDashboardWidget: true,
  },

  // ─── Actors (productores/socios/proveedores) ───
  {
    id: 'core_actors',
    label: 'Actores',
    description: 'Gestión de socios, proveedores o unidades productivas',
    icon: Users,
    allowedOrgTipos: ['cooperativa', 'exportador', 'beneficio_privado', 'aggregator', 'productor_empresarial'],
    requiredRoles: ALL_ROLES,
    dependsOn: [],
    flags: [],
    dataResources: ['productores'],
    resourcePermissions: [
      stdPerm('productores', { productor: 'read', tecnico: 'read', certificadora: 'read' }),
    ],
    routes: [
      { path: '/cooperativa/productores-hub', label: 'Actores', icon: Users },
    ],
    hasDashboardWidget: true,
  },

  // ─── Parcelas ───
  {
    id: 'core_plots',
    label: 'Parcelas',
    description: 'Fincas, geolocalización, mapas',
    icon: MapIcon,
    allowedOrgTipos: ['cooperativa', 'exportador', 'beneficio_privado', 'productor', 'productor_empresarial'],
    requiredRoles: ALL_ROLES,
    dependsOn: ['core_actors'],
    flags: [],
    dataResources: ['parcelas'],
    resourcePermissions: [
      stdPerm('parcelas', { productor: 'read', tecnico: 'write' }),
    ],
    routes: [
      { path: '/parcelas', label: 'Parcelas', icon: MapIcon },
    ],
    hasDashboardWidget: true,
  },

  // ─── Entregas ───
  {
    id: 'core_deliveries',
    label: 'Entregas',
    description: 'Recepción de café, acopio',
    icon: Package,
    allowedOrgTipos: ['cooperativa', 'exportador', 'beneficio_privado', 'aggregator', 'productor_empresarial'],
    requiredRoles: ALL_ROLES,
    dependsOn: ['core_actors'],
    flags: [],
    dataResources: ['entregas'],
    resourcePermissions: [
      stdPerm('entregas', { productor: 'read', tecnico: 'none' }),
    ],
    routes: [
      { path: '/entregas', label: 'Entregas', icon: Package },
    ],
    hasDashboardWidget: true,
  },

  // ─── EUDR ───
  {
    id: 'eudr',
    label: 'EUDR',
    description: 'Cumplimiento de regulación europea de deforestación',
    icon: Leaf,
    allowedOrgTipos: ['cooperativa', 'exportador', 'beneficio_privado', 'aggregator'],
    requiredRoles: ALL_ROLES,
    dependsOn: ['core_plots'],
    flags: [],
    dataResources: ['paquetes_eudr', 'parcelas', 'documentos'],
    resourcePermissions: [
      stdPerm('paquetes_eudr', { productor: 'none', tecnico: 'read' }),
    ],
    routes: [
      { path: '/exportador/eudr', label: 'EUDR', icon: Leaf },
    ],
    hasDashboardWidget: true,
  },

  // ─── Protocolo VITAL ───
  {
    id: 'vital_clima',
    label: 'Protocolo VITAL',
    description: 'Diagnósticos de sostenibilidad y plan de acción',
    icon: Shield,
    allowedOrgTipos: ['cooperativa', 'beneficio_privado', 'productor', 'productor_empresarial', 'certificadora'],
    requiredRoles: ALL_ROLES,
    dependsOn: [],
    flags: [],
    dataResources: ['clima_diagnosticos', 'clima_plan_acciones', 'clima_scores'],
    resourcePermissions: [
      stdPerm('clima_diagnosticos', { tecnico: 'write', certificadora: 'read' }),
    ],
    routes: [
      { path: '/cooperativa/vital', label: 'Protocolo VITAL', icon: Shield },
    ],
    hasDashboardWidget: true,
  },

  // ─── Nova Guard (alertas tempranas) ───
  {
    id: 'nova_guard',
    label: 'Nova Guard',
    description: 'Alertas tempranas fitosanitarias y ambientales',
    icon: AlertTriangle,
    allowedOrgTipos: ['cooperativa', 'beneficio_privado', 'productor', 'productor_empresarial'],
    requiredRoles: ALL_ROLES,
    dependsOn: ['core_plots'],
    flags: ['ENABLE_NOVA_GUARD'],
    dataResources: ['alertas'],
    resourcePermissions: [
      stdPerm('alertas', { tecnico: 'write', productor: 'read' }),
    ],
    routes: [],
    hasDashboardWidget: true,
  },

  // ─── Créditos ───
  {
    id: 'credits',
    label: 'Créditos',
    description: 'Préstamos y financiamiento a actores',
    icon: Wallet,
    allowedOrgTipos: ['cooperativa'],
    requiredRoles: ['cooperativa', 'admin'],
    dependsOn: ['core_actors'],
    flags: ['ENABLE_CREDITS'],
    dataResources: ['creditos'],
    resourcePermissions: [
      stdPerm('creditos', { cooperativa: 'write', productor: 'read', exportador: 'none', tecnico: 'none' }),
    ],
    routes: [
      { path: '/cooperativa/finanzas-hub', label: 'Créditos', icon: Wallet },
    ],
    hasDashboardWidget: true,
  },

  // ─── Jornales ───
  {
    id: 'labor_jornales',
    label: 'Jornales',
    description: 'Gestión de mano de obra y cuadrillas',
    icon: Briefcase,
    allowedOrgTipos: ['cooperativa', 'beneficio_privado', 'productor_empresarial'],
    requiredRoles: ['cooperativa', 'admin'],
    dependsOn: [],
    flags: [],
    dataResources: ['jornales'],
    resourcePermissions: [
      stdPerm('jornales', { productor: 'none', tecnico: 'none', exportador: 'none' }),
    ],
    routes: [
      { path: '/cooperativa/operaciones', label: 'Jornales', icon: Briefcase },
    ],
    hasDashboardWidget: false,
  },

  // ─── Inventario ───
  {
    id: 'inventory',
    label: 'Inventario',
    description: 'Insumos, equipos y suministros',
    icon: Boxes,
    allowedOrgTipos: ['cooperativa', 'beneficio_privado', 'productor_empresarial'],
    requiredRoles: ['cooperativa', 'admin'],
    dependsOn: [],
    flags: [],
    dataResources: ['inventario'],
    resourcePermissions: [
      stdPerm('inventario', { productor: 'none', tecnico: 'none', exportador: 'none' }),
    ],
    routes: [],
    hasDashboardWidget: false,
  },

  // ─── Finanzas ───
  {
    id: 'finance',
    label: 'Finanzas',
    description: 'Transacciones, cuentas por pagar/cobrar',
    icon: DollarSign,
    allowedOrgTipos: ['cooperativa', 'exportador', 'beneficio_privado', 'productor_empresarial'],
    requiredRoles: ALL_ROLES,
    dependsOn: [],
    flags: [],
    dataResources: ['finanzas_transacciones'],
    resourcePermissions: [
      stdPerm('finanzas_transacciones', { productor: 'read', tecnico: 'none' }),
    ],
    routes: [
      { path: '/cooperativa/finanzas-hub', label: 'Finanzas', icon: DollarSign },
    ],
    hasDashboardWidget: true,
  },

  // ─── Calidad / Nova Cup ───
  {
    id: 'quality_cupping',
    label: 'Nova Cup',
    description: 'Cataciones, puntajes de calidad',
    icon: Award,
    allowedOrgTipos: ['cooperativa', 'exportador', 'beneficio_privado'],
    requiredRoles: ALL_ROLES,
    dependsOn: [],
    flags: [],
    dataResources: ['cataciones', 'lotes_acopio'],
    resourcePermissions: [
      stdPerm('cataciones', { productor: 'read', tecnico: 'none' }),
    ],
    routes: [
      { path: '/cooperativa/calidad', label: 'Nova Cup', icon: Award },
    ],
    hasDashboardWidget: true,
  },

  // ─── Exporter Trade ───
  {
    id: 'exporter_trade',
    label: 'Gestión Comercial',
    description: 'Lotes comerciales, contratos, embarques',
    icon: Coffee,
    allowedOrgTipos: ['exportador', 'aggregator'],
    requiredRoles: ['exportador', 'admin'],
    dependsOn: [],
    flags: [],
    dataResources: ['lotes_comerciales', 'contratos'],
    resourcePermissions: [
      stdPerm('lotes_comerciales', { cooperativa: 'none', productor: 'none', tecnico: 'none' }),
      stdPerm('contratos', { cooperativa: 'none', productor: 'none', tecnico: 'none' }),
    ],
    routes: [
      { path: '/exportador/lotes', label: 'Gestión de Café', icon: Coffee },
      { path: '/exportador/contratos', label: 'Contratos', icon: FileText },
    ],
    hasDashboardWidget: true,
  },

  // ─── Nutrición ───
  {
    id: 'nutrition',
    label: 'Nutrición',
    description: 'Análisis de suelo/foliar, planes de fertilización',
    icon: Sprout,
    allowedOrgTipos: ['cooperativa', 'beneficio_privado', 'productor_empresarial'],
    requiredRoles: ['cooperativa', 'admin'],
    dependsOn: ['core_plots'],
    flags: [],
    dataResources: ['ag_parcela_contexto', 'ag_suelo_analisis', 'ag_hoja_analisis', 'ag_nutrition_planes', 'ag_nutrition_aplicaciones'],
    resourcePermissions: [
      stdPerm('ag_suelo_analisis', { productor: 'read', tecnico: 'write', exportador: 'none' }),
      stdPerm('ag_nutrition_planes', { productor: 'read', tecnico: 'read', exportador: 'none' }),
    ],
    routes: [
      { path: '/cooperativa/nutricion', label: 'Nutrición', icon: Sprout },
    ],
    hasDashboardWidget: true,
  },

  // ─── Governance (diagnóstico organizacional) ───
  {
    id: 'governance',
    label: 'Diagnóstico Organizacional',
    description: 'Evaluación de gobernanza y estructura',
    icon: BarChart3,
    allowedOrgTipos: ['cooperativa'],
    requiredRoles: ['cooperativa', 'admin'],
    dependsOn: [],
    flags: [],
    dataResources: ['diagnostico_organizacional'],
    resourcePermissions: [
      stdPerm('diagnostico_organizacional', { productor: 'none', tecnico: 'none', exportador: 'none' }),
    ],
    routes: [
      { path: '/cooperativa/diagnostico', label: 'Diagnóstico', icon: BarChart3 },
    ],
    hasDashboardWidget: false,
  },

  // ─── Admin ───
  {
    id: 'platform_admin',
    label: 'Administración',
    description: 'Panel de administración de la plataforma',
    icon: Settings,
    allowedOrgTipos: ALL_ORG_TIPOS,
    requiredRoles: ['admin'],
    dependsOn: [],
    flags: [],
    dataResources: ['platform_organizations', 'profiles', 'user_roles'],
    resourcePermissions: [],
    routes: [
      { path: '/admin', label: 'Panel Admin', icon: Shield },
    ],
    hasDashboardWidget: false,
  },
];

// ── Lookup helpers ──

const registryMap = new Map<string, ModuleDefinition>(MODULE_REGISTRY.map(m => [m.id, m]));

export function getModuleById(id: string): ModuleDefinition | undefined {
  return registryMap.get(id);
}

export function getModulePermission(
  moduleId: string,
  resource: string,
  role: UserRole,
): PermissionLevel {
  const mod = registryMap.get(moduleId);
  if (!mod) return 'none';
  const rp = mod.resourcePermissions.find(r => r.resource === resource);
  if (!rp) return 'none';
  return rp.permissions[role] ?? 'none';
}

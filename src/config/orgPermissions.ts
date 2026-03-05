/**
 * Configuración de permisos granulares por rol interno y tipo de organización.
 *
 * Fuente de verdad para:
 * - Roles internos disponibles
 * - Permisos por defecto de cada rol
 * - Agrupación de permisos por tipo de organización (UI)
 */

// ── Tipos ──

export type RolInterno = 'admin_org' | 'tecnico' | 'comercial' | 'auditor' | 'viewer';

export const ROL_INTERNO_LABELS: Record<RolInterno, string> = {
  admin_org: 'Administrador',
  tecnico: 'Técnico de campo',
  comercial: 'Comercial',
  auditor: 'Auditor interno',
  viewer: 'Solo lectura',
};

export const PERMISSION_KEYS = [
  'permiso_gestion_productores',
  'permiso_crear_editar_productores',
  'permiso_ver_parcelas_clima',
  'permiso_gestion_lotes_acopio',
  'permiso_ver_eudr_exportador',
  'permiso_gestion_contratos',
  'permiso_gestion_configuracion_org',
  'permiso_ver_informes_financieros',
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  permiso_gestion_productores: 'Gestión de productores',
  permiso_crear_editar_productores: 'Crear y editar productores',
  permiso_ver_parcelas_clima: 'Ver parcelas y evaluación VITAL',
  permiso_gestion_lotes_acopio: 'Gestión de lotes de acopio',
  permiso_ver_eudr_exportador: 'Ver paquetes EUDR y trazabilidad',
  permiso_gestion_contratos: 'Gestión de contratos',
  permiso_gestion_configuracion_org: 'Configuración de la organización',
  permiso_ver_informes_financieros: 'Ver informes financieros',
};

// ── Permisos por defecto según rol ──

export type PermissionDefaults = Record<PermissionKey, boolean>;

export const DEFAULT_PERMISSIONS_BY_ROLE: Record<RolInterno, PermissionDefaults> = {
  admin_org: {
    permiso_gestion_productores: true,
    permiso_crear_editar_productores: true,
    permiso_ver_parcelas_clima: true,
    permiso_gestion_lotes_acopio: true,
    permiso_ver_eudr_exportador: true,
    permiso_gestion_contratos: true,
    permiso_gestion_configuracion_org: true,
    permiso_ver_informes_financieros: true,
  },
  tecnico: {
    permiso_gestion_productores: true,
    permiso_crear_editar_productores: true,
    permiso_ver_parcelas_clima: true,
    permiso_gestion_lotes_acopio: false,
    permiso_ver_eudr_exportador: false,
    permiso_gestion_contratos: false,
    permiso_gestion_configuracion_org: false,
    permiso_ver_informes_financieros: false,
  },
  comercial: {
    permiso_gestion_productores: false,
    permiso_crear_editar_productores: false,
    permiso_ver_parcelas_clima: false,
    permiso_gestion_lotes_acopio: true,
    permiso_ver_eudr_exportador: true,
    permiso_gestion_contratos: true,
    permiso_gestion_configuracion_org: false,
    permiso_ver_informes_financieros: true,
  },
  auditor: {
    permiso_gestion_productores: false,
    permiso_crear_editar_productores: false,
    permiso_ver_parcelas_clima: true,
    permiso_gestion_lotes_acopio: false,
    permiso_ver_eudr_exportador: true,
    permiso_gestion_contratos: false,
    permiso_gestion_configuracion_org: false,
    permiso_ver_informes_financieros: true,
  },
  viewer: {
    permiso_gestion_productores: false,
    permiso_crear_editar_productores: false,
    permiso_ver_parcelas_clima: false,
    permiso_gestion_lotes_acopio: false,
    permiso_ver_eudr_exportador: false,
    permiso_gestion_contratos: false,
    permiso_gestion_configuracion_org: false,
    permiso_ver_informes_financieros: false,
  },
};

// ── Agrupación de permisos por tipo de organización ──

export interface PermissionGroup {
  label: string;
  permissions: PermissionKey[];
}

const COOPERATIVA_GROUPS: PermissionGroup[] = [
  {
    label: 'Personas productoras y fincas',
    permissions: ['permiso_gestion_productores', 'permiso_crear_editar_productores'],
  },
  {
    label: 'Parcelas y Protocolo VITAL',
    permissions: ['permiso_ver_parcelas_clima'],
  },
  {
    label: 'Lotes de acopio',
    permissions: ['permiso_gestion_lotes_acopio'],
  },
  {
    label: 'Administración',
    permissions: ['permiso_gestion_configuracion_org'],
  },
];

const EXPORTADOR_GROUPS: PermissionGroup[] = [
  {
    label: 'Inventario y lotes comerciales',
    permissions: ['permiso_gestion_lotes_acopio', 'permiso_ver_eudr_exportador'],
  },
  {
    label: 'Comercio y contratos',
    permissions: ['permiso_gestion_contratos', 'permiso_ver_informes_financieros'],
  },
  {
    label: 'Proveedores',
    permissions: ['permiso_ver_parcelas_clima'],
  },
  {
    label: 'Administración',
    permissions: ['permiso_gestion_configuracion_org'],
  },
];

/** All permissions shown for org types without specific grouping */
const DEFAULT_GROUPS: PermissionGroup[] = [
  { label: 'Permisos', permissions: [...PERMISSION_KEYS] },
];

export function getPermissionGroupsForOrgType(tipo: string | null | undefined): PermissionGroup[] {
  if (tipo === 'cooperativa') return COOPERATIVA_GROUPS;
  if (tipo === 'exportador') return EXPORTADOR_GROUPS;
  return DEFAULT_GROUPS;
}

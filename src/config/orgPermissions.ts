export type RolInterno = 'admin_org' | 'tecnico' | 'comercial' | 'auditor' | 'viewer';

export const ROL_INTERNO_LABELS: Record<RolInterno, string> = {
  admin_org: 'Administrador',
  tecnico: 'Tecnico de campo',
  comercial: 'Comercial',
  auditor: 'Auditor interno',
  viewer: 'Solo lectura',
};

export interface PermissionDefaults {
  permiso_gestion_productores: boolean;
  permiso_crear_editar_productores: boolean;
  permiso_ver_parcelas_clima: boolean;
  permiso_gestion_lotes_acopio: boolean;
  permiso_ver_eudr_exportador: boolean;
  permiso_gestion_contratos: boolean;
  permiso_gestion_configuracion_org: boolean;
  permiso_ver_informes_financieros: boolean;
}

export const PERMISSION_DEFAULTS: Record<RolInterno, PermissionDefaults> = {
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

export function getDefaultPermissions(rolInterno: RolInterno): PermissionDefaults {
  return PERMISSION_DEFAULTS[rolInterno] ?? PERMISSION_DEFAULTS.viewer;
}

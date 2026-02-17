export type OrganizationType =
  | 'cooperativa'
  | 'exportador'
  | 'certificadora'
  | 'productor'
  | 'tecnico'
  | 'admin';

export type OrganizationTypeExtended =
  | OrganizationType
  | 'finca_privada'
  | 'grupo_empresarial';

export const ORGANIZATION_TYPE_LABELS: Record<OrganizationType, string> = {
  cooperativa: 'Cooperativa',
  exportador: 'Exportador',
  certificadora: 'Certificadora',
  productor: 'Productor',
  tecnico: 'Técnico de Campo',
  admin: 'Administrador',
};

export const ORGANIZATION_TYPE_DESCRIPTIONS: Record<OrganizationType, string> = {
  cooperativa: 'Cooperativa cafetalera o beneficio que gestiona productores, parcelas y lotes de acopio',
  exportador: 'Empresa exportadora con obligaciones de debida diligencia EUDR',
  certificadora: 'Organismo certificador o auditor con acceso de solo lectura',
  productor: 'Productor individual o finca con venta directa',
  tecnico: 'Técnico de campo con acceso restringido a visitas, diagnósticos y productores asignados',
  admin: 'Administrador interno de Nova Silva con acceso a configuración del sistema',
};

export type InternalRole =
  | 'admin'
  | 'field_tech'
  | 'warehouse'
  | 'compliance'
  | 'viewer';

export const INTERNAL_ROLE_LABELS: Record<InternalRole, string> = {
  admin: 'Administrador',
  field_tech: 'Técnico de campo',
  warehouse: 'Usuario de acopio',
  compliance: 'Responsable de cumplimiento',
  viewer: 'Usuario de consulta',
};

export type ExporterRole =
  | 'admin'
  | 'trader'
  | 'logistics'
  | 'quality_lab'
  | 'compliance'
  | 'management';

export type Permission =
  | 'view' | 'create' | 'edit' | 'delete'
  | 'share' | 'approve' | 'export' | 'manage_users';

export type Resource =
  | 'productores' | 'parcelas' | 'entregas' | 'lotes_acopio'
  | 'lotes_comerciales' | 'documentos' | 'contratos'
  | 'paquetes_eudr' | 'usuarios' | 'configuracion';

export const PERMISSION_MATRIX: Record<InternalRole, Record<Resource, Permission[]>> = {
  admin: {
    productores: ['view', 'create', 'edit', 'delete'],
    parcelas: ['view', 'create', 'edit', 'delete'],
    entregas: ['view', 'create', 'edit', 'delete'],
    lotes_acopio: ['view', 'create', 'edit', 'delete', 'share', 'approve'],
    lotes_comerciales: ['view', 'create', 'edit', 'delete', 'approve'],
    documentos: ['view', 'create', 'edit', 'delete'],
    contratos: ['view', 'create', 'edit', 'delete'],
    paquetes_eudr: ['view', 'create', 'export'],
    usuarios: ['view', 'create', 'edit', 'delete', 'manage_users'],
    configuracion: ['view', 'edit'],
  },
  field_tech: {
    productores: ['view', 'create', 'edit'],
    parcelas: ['view', 'create', 'edit'],
    entregas: ['view'],
    lotes_acopio: ['view'],
    lotes_comerciales: [],
    documentos: ['view', 'create', 'edit'],
    contratos: [],
    paquetes_eudr: [],
    usuarios: [],
    configuracion: [],
  },
  warehouse: {
    productores: ['view'],
    parcelas: ['view'],
    entregas: ['view', 'create', 'edit'],
    lotes_acopio: ['view', 'create', 'edit'],
    lotes_comerciales: ['view'],
    documentos: ['view'],
    contratos: [],
    paquetes_eudr: [],
    usuarios: [],
    configuracion: [],
  },
  compliance: {
    productores: ['view'],
    parcelas: ['view'],
    entregas: ['view'],
    lotes_acopio: ['view', 'approve'],
    lotes_comerciales: ['view', 'approve'],
    documentos: ['view', 'edit'],
    contratos: ['view'],
    paquetes_eudr: ['view', 'create', 'export'],
    usuarios: [],
    configuracion: [],
  },
  viewer: {
    productores: ['view'],
    parcelas: ['view'],
    entregas: ['view'],
    lotes_acopio: ['view'],
    lotes_comerciales: ['view'],
    documentos: ['view'],
    contratos: ['view'],
    paquetes_eudr: ['view'],
    usuarios: [],
    configuracion: [],
  },
};

export function hasPermission(role: InternalRole, resource: Resource, permission: Permission): boolean {
  return (PERMISSION_MATRIX[role]?.[resource] || []).includes(permission);
}

export function canAccess(role: InternalRole, resource: Resource): boolean {
  return hasPermission(role, resource, 'view');
}

export function canModify(role: InternalRole, resource: Resource): boolean {
  const permissions = PERMISSION_MATRIX[role]?.[resource] || [];
  return permissions.some(p => ['create', 'edit', 'delete'].includes(p));
}

export type UserRole = OrganizationType;
export const USER_ROLE_LABELS = ORGANIZATION_TYPE_LABELS;

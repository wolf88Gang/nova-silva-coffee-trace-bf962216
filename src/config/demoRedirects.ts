/**
 * Mapeo profile.role → ruta de destino post-login.
 * Mantiene compatibilidad con rutas legacy por rol.
 */
export const PROFILE_TO_DASHBOARD: Record<string, string> = {
  admin_org: '/dashboard',
  tecnico: '/dashboard',
  productor: '/dashboard',
  auditor: '/dashboard',
};

/** Mapeo role legacy (ensure-demo-user) → ruta legacy por si se usa redirect por rol */
export const LEGACY_ROLE_REDIRECTS: Record<string, string> = {
  cooperativa: '/cooperativa/dashboard',
  exportador: '/exportador/dashboard',
  certificadora: '/certificadora/dashboard',
  productor: '/productor/dashboard',
  tecnico: '/tecnico/dashboard',
};

/** Mapeo email demo → role para ensure-demo-user (el backend crea usuarios por email/role) */
export const EMAIL_TO_LEGACY_ROLE: Record<string, string> = {
  'demo.cooperativa@novasilva.com': 'cooperativa',
  'demo.tecnico@novasilva.com': 'tecnico',
  'demo.productor@novasilva.com': 'productor',
  'demo.exportador@novasilva.com': 'exportador',
  'demo.certificadora@novasilva.com': 'certificadora',
};

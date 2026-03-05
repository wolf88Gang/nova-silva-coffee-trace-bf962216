/**
 * Centralized hook to fetch the current user's granular permissions
 * from `organizacion_usuarios` for their active organization.
 *
 * Returns the 8 boolean permission flags, rol_interno, activo status,
 * and convenience helpers like `isOrgAdmin`, `isPlatformAdmin`, `hasPermission`.
 *
 * Platform admins (user_roles.role = 'admin') get full access even without
 * a row in organizacion_usuarios.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from '@/hooks/useOrgContext';
import { useAuth } from '@/contexts/AuthContext';
import type { PermissionKey } from '@/config/orgPermissions';
import { PERMISSION_KEYS } from '@/config/orgPermissions';

/** Explicit select to reduce payload — must match PERMISSION_KEYS + meta columns */
const SELECT_COLUMNS = [
  'id',
  'activo',
  'rol_interno',
  'rol_visible',
  ...PERMISSION_KEYS,
].join(',');

export interface CurrentUserPermissions {
  /** Whether the query has resolved */
  isLoading: boolean;
  /** Whether a matching row was found in organizacion_usuarios */
  hasRecord: boolean;
  /** User is active in the org */
  activo: boolean;
  /** Internal role from organizacion_usuarios */
  rolInterno: string | null;
  /** Display role (free text badge) */
  rolVisible: string | null;
  /** Individual permission flags */
  permiso_gestion_productores: boolean;
  permiso_crear_editar_productores: boolean;
  permiso_ver_parcelas_clima: boolean;
  permiso_gestion_lotes_acopio: boolean;
  permiso_ver_eudr_exportador: boolean;
  permiso_gestion_contratos: boolean;
  permiso_gestion_configuracion_org: boolean;
  permiso_ver_informes_financieros: boolean;
  /** Convenience: rolInterno === 'admin_org' */
  isOrgAdmin: boolean;
  /** Platform-level admin (from user_roles, not org-scoped) */
  isPlatformAdmin: boolean;
  /** Check a specific permission key — returns true for platform admins */
  hasPermission: (key: PermissionKey) => boolean;
}

const EMPTY: CurrentUserPermissions = {
  isLoading: false,
  hasRecord: false,
  activo: false,
  rolInterno: null,
  rolVisible: null,
  permiso_gestion_productores: false,
  permiso_crear_editar_productores: false,
  permiso_ver_parcelas_clima: false,
  permiso_gestion_lotes_acopio: false,
  permiso_ver_eudr_exportador: false,
  permiso_gestion_contratos: false,
  permiso_gestion_configuracion_org: false,
  permiso_ver_informes_financieros: false,
  isOrgAdmin: false,
  isPlatformAdmin: false,
  hasPermission: () => false,
};

export function useCurrentUserPermissions(): CurrentUserPermissions {
  const { organizationId, role } = useOrgContext();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const isPlatformAdmin = role === 'admin';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['current-user-permissions', organizationId, userId],
    enabled: !!organizationId && !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data: row, error } = await (supabase as any)
        .from('organizacion_usuarios')
        .select(SELECT_COLUMNS)
        .eq('organizacion_id', organizationId)
        .eq('user_id', userId)
        .maybeSingle();
      if (error) {
        console.error('[useCurrentUserPermissions] RLS/query error:', error.message);
        throw error;
      }
      return row as Record<string, unknown> | null;
    },
  });

  if (isLoading) return { ...EMPTY, isLoading: true, isPlatformAdmin };

  // Platform admin without org row → full access
  if (isPlatformAdmin && (!data || isError)) {
    return {
      ...EMPTY,
      isPlatformAdmin: true,
      isOrgAdmin: true,
      activo: true,
      hasPermission: () => true,
    };
  }

  if (!data || isError) return EMPTY;

  const perms: Record<string, boolean> = {};
  for (const k of PERMISSION_KEYS) {
    perms[k] = !!data[k];
  }

  const hasPermission = isPlatformAdmin
    ? () => true
    : (key: PermissionKey) => !!data[key];

  return {
    isLoading: false,
    hasRecord: true,
    activo: !!data.activo,
    rolInterno: (data.rol_interno as string) ?? null,
    rolVisible: (data.rol_visible as string) ?? null,
    ...perms,
    isOrgAdmin: data.rol_interno === 'admin_org',
    isPlatformAdmin,
    hasPermission,
  } as CurrentUserPermissions;
}

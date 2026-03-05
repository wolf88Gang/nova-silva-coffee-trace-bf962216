/**
 * Centralized hook to fetch the current user's granular permissions
 * from `organizacion_usuarios` for their active organization.
 *
 * Returns the 8 boolean permission flags, rol_interno, activo status,
 * and convenience helpers like `canManageProductores`, `isOrgAdmin`, etc.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from '@/hooks/useOrgContext';
import { useAuth } from '@/contexts/AuthContext';
import type { PermissionKey } from '@/config/orgPermissions';
import { PERMISSION_KEYS } from '@/config/orgPermissions';

export interface CurrentUserPermissions {
  /** Whether the query has resolved */
  isLoading: boolean;
  /** Whether a matching row was found */
  hasRecord: boolean;
  /** User is active in the org */
  activo: boolean;
  /** Internal role */
  rolInterno: string | null;
  /** Display role */
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
  /** Check a specific permission key */
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
  hasPermission: () => false,
};

export function useCurrentUserPermissions(): CurrentUserPermissions {
  const { organizationId } = useOrgContext();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const { data, isLoading } = useQuery({
    queryKey: ['current-user-permissions', organizationId, userId],
    enabled: !!organizationId && !!userId,
    staleTime: 5 * 60 * 1000, // 5 min cache
    queryFn: async () => {
      const { data: row, error } = await (supabase as any)
        .from('organizacion_usuarios')
        .select('*')
        .eq('organizacion_id', organizationId)
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return row as Record<string, any> | null;
    },
  });

  if (isLoading) return { ...EMPTY, isLoading: true };
  if (!data) return EMPTY;

  const perms: Record<string, boolean> = {};
  for (const k of PERMISSION_KEYS) {
    perms[k] = !!data[k];
  }

  return {
    isLoading: false,
    hasRecord: true,
    activo: !!data.activo,
    rolInterno: data.rol_interno ?? null,
    rolVisible: data.rol_visible ?? null,
    ...perms,
    isOrgAdmin: data.rol_interno === 'admin_org',
    hasPermission: (key: PermissionKey) => !!data[key],
  } as CurrentUserPermissions;
}

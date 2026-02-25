/**
 * Hook para obtener organization_id del usuario actual.
 * Lee de user.organizationId (cargado desde profiles en AuthContext).
 * Usar para filtrar queries por tenant.
 *
 * Fallback: si organization_id es null, usar cooperativa_id durante transición.
 */
import { useAuth } from '@/contexts/AuthContext';

export interface CurrentOrgState {
  organizationId: string | null;
  isLoading: boolean;
  error: Error | null;
}

export function useCurrentOrgId(): CurrentOrgState {
  const { user, isLoading: authLoading } = useAuth();
  return {
    organizationId: user?.organizationId ?? null,
    isLoading: authLoading,
    error: null,
  };
}

/**
 * Valor para filtrar queries. Preferir organization_id; fallback cooperativa_id durante transición.
 */
export function getOrgFilterValue(
  organizationId: string | null | undefined,
  legacyCooperativaId: string | null | undefined
): string | null {
  return organizationId ?? legacyCooperativaId ?? null;
}

/**
 * Ejemplo de query:
 * const { organizationId } = useCurrentOrgId();
 * const orgId = getOrgFilterValue(organizationId, legacyCooperativaId);
 * let q = supabase.from('productores').select('*');
 * if (orgId) q = q.or(`organization_id.eq.${orgId},cooperativa_id.eq.${orgId}`); // fallback legacy
 */

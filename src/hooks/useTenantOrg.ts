/**
 * Hook to obtain tenant_org_id for the current user.
 * Used for filtering queries by tenant (organizations.id).
 *
 * In Fase 1: resolves from usuarios_org or profile; fallback to cooperativa_id for legacy.
 */
import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface TenantOrgState {
  tenantOrgId: string | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Returns the tenant organization ID for the current user.
 * Fetches from usuarios_org where user_id = auth.uid() and estado = 'activo'.
 * Admin users may have access to multiple tenants; this returns the primary one.
 *
 * TODO: When usuarios_org is wired, replace mock with real query:
 *   const { data } = await supabase.from('usuarios_org').select('organization_id').eq('user_id', userId).eq('estado','activo').limit(1).single();
 */
export function useTenantOrg(): TenantOrgState {
  const { session } = useAuth();

  return useMemo(() => {
    if (!session?.user?.id) {
      return { tenantOrgId: null, isLoading: false, error: null };
    }
    // Placeholder: fetch from usuarios_org when wired:
    // const { data } = await supabase.from('usuarios_org')
    //   .select('organization_id').eq('user_id', session.user.id).eq('estado','activo').limit(1).single();
    return {
      tenantOrgId: null,
      isLoading: false,
      error: null,
    };
  }, [session?.user?.id]);
}

/**
 * Helper for queries: use tenant_org_id when available, else cooperativa_id (legacy).
 * Usage: .eq('tenant_org_id', tenantOrgId ?? cooperativaId)
 */
export function tenantFilter(
  tenantOrgId: string | null | undefined,
  legacyCooperativaId: string | null | undefined
): Record<string, string> {
  const id = tenantOrgId ?? legacyCooperativaId;
  if (!id) return {};
  return { tenant_org_id: id };
}

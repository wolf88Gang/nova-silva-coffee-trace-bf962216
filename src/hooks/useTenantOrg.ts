/**
 * @deprecated Use useOrgContext() from '@/hooks/useOrgContext' instead.
 * This hook is kept only for backward compatibility during migration.
 * It returns null tenantOrgId — all callers should migrate to useOrgContext().
 */
import { useOrgContext } from '@/hooks/useOrgContext';

export interface TenantOrgState {
  tenantOrgId: string | null;
  isLoading: boolean;
  error: Error | null;
}

/** @deprecated Use useOrgContext().organizationId instead */
export function useTenantOrg(): TenantOrgState {
  const { organizationId, isLoading } = useOrgContext();
  return { tenantOrgId: organizationId, isLoading, error: null };
}

/** @deprecated Use organizationId from useOrgContext() directly */
export function tenantFilter(
  tenantOrgId: string | null | undefined,
  legacyCooperativaId: string | null | undefined
): Record<string, string> {
  const id = tenantOrgId ?? legacyCooperativaId;
  if (!id) return {};
  return { tenant_org_id: id };
}

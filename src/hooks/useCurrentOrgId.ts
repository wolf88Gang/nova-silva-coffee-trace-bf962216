/**
 * @deprecated Use useOrgContext() from '@/hooks/useOrgContext' instead.
 * Kept for backward compatibility. Delegates to useOrgContext internally.
 */
import { useOrgContext } from '@/hooks/useOrgContext';

export interface CurrentOrgState {
  organizationId: string | null;
  isLoading: boolean;
  error: Error | null;
}

/** @deprecated Use useOrgContext().organizationId */
export function useCurrentOrgId(): CurrentOrgState {
  const { organizationId, isLoading } = useOrgContext();
  return { organizationId, isLoading, error: null };
}

/** @deprecated Use organizationId from useOrgContext() directly */
export function getOrgFilterValue(
  organizationId: string | null | undefined,
  legacyCooperativaId: string | null | undefined
): string | null {
  return organizationId ?? legacyCooperativaId ?? null;
}

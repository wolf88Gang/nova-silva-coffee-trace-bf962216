/**
 * Central hook for org-centric (tenant) context.
 * Exposes organizationId, productorId, role, orgTipo, orgName, activeModules.
 *
 * All data hooks should use organizationId from here for tenant filtering.
 * NEVER use user.id as cooperativa_id — always use organizationId.
 */
import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { OrgTipo } from '@/contexts/AuthContext';
import { getActiveModules, type OrgModule } from '@/lib/org-modules';

export interface OrgContext {
  /** UUID of the tenant organization (from profiles.organization_id) */
  organizationId: string | null;
  /** UUID of the productor entity (from profiles.productor_id), null for non-productor roles */
  productorId: string | null;
  /** User's app_role from user_roles */
  role: string | null;
  /** Organization type from organizaciones.tipo_organizacion */
  orgTipo: OrgTipo | null;
  /** Organization display name */
  orgName: string | null;
  /** Active modules for this organization */
  activeModules: OrgModule[];
  /** Whether the org context is still loading */
  isLoading: boolean;
  /** Whether the user is authenticated and org context is resolved */
  isReady: boolean;
}

/**
 * Returns the org-centric context for the current authenticated user.
 *
 * Usage:
 * ```ts
 * const { organizationId, activeModules } = useOrgContext();
 * if (hasModule(activeModules, 'vital')) { ... }
 * ```
 */
export function useOrgContext(): OrgContext {
  const { user, isLoading } = useAuth();

  return useMemo(() => {
    const activeModules = getActiveModules(
      user ? {
        modules: user.activeModules ?? null,
        is_eudr_active: user.isEudrActive,
        is_vital_active: user.isVitalActive,
        tipo: user.orgTipo ?? null,
      } : null
    );

    return {
      organizationId: user?.organizationId ?? null,
      productorId: user?.productorId ?? null,
      role: user?.role ?? null,
      orgTipo: user?.orgTipo ?? null,
      orgName: user?.organizationName ?? null,
      activeModules,
      isLoading,
      isReady: !isLoading && !!user,
    };
  }, [user, isLoading]);
}

/**
 * @deprecated Legacy helper. Use applyOrgFilter() from '@/lib/orgFilter' instead.
 * Always returns 'organization_id' now that ORG_ID_ONLY is active.
 */
export function getTenantColumn(_tableName: string): string {
  return 'organization_id';
}

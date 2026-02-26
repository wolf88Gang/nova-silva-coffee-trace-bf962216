/**
 * Centralized org-tenant filter for all Supabase queries.
 *
 * Usage:
 * ```ts
 * let q = supabase.from('productores').select('*');
 * q = applyOrgFilter(q, organizationId);
 * ```
 */
import { ORG_ID_ONLY } from '@/config/featureFlags';

export interface OrgFilterOptions {
  /** Use legacy cooperativa_id fallback (default: !ORG_ID_ONLY) */
  legacyFallback?: boolean;
  /** Legacy column name (default: 'cooperativa_id') */
  legacyColumn?: string;
  /** Organization column name (default: 'organization_id') */
  orgColumn?: string;
}

/**
 * Apply organization-scoped filter to a Supabase query builder.
 * Returns the query with the appropriate .eq or .or filter applied.
 *
 * @param query - Supabase query builder (from .from().select())
 * @param organizationId - The tenant org UUID
 * @param options - Override defaults
 * @returns The filtered query
 */
export function applyOrgFilter<T>(
  query: T,
  organizationId: string | null,
  options?: OrgFilterOptions,
): T {
  if (!organizationId) return query;

  const {
    legacyFallback = !ORG_ID_ONLY,
    legacyColumn = 'cooperativa_id',
    orgColumn = 'organization_id',
  } = options ?? {};

  const q = query as any;

  if (legacyFallback) {
    return q.or(`${orgColumn}.eq.${organizationId},${legacyColumn}.eq.${organizationId}`) as T;
  }

  return q.eq(orgColumn, organizationId) as T;
}

/**
 * Build the fields object for INSERT/UPDATE mutations with org tenant.
 * Always includes organization_id; includes cooperativa_id during transition.
 */
export function orgWriteFields(organizationId: string | null): Record<string, string | null> {
  if (!organizationId) return {};

  const fields: Record<string, string | null> = {
    organization_id: organizationId,
  };

  if (!ORG_ID_ONLY) {
    fields.cooperativa_id = organizationId;
  }

  return fields;
}

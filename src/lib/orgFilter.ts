/**
 * Centralized org-tenant filter for all Supabase queries.
 * Phase 2: organization_id only, no legacy fallback.
 *
 * Usage:
 * ```ts
 * let q = supabase.from('productores').select('*');
 * q = applyOrgFilter(q, organizationId);
 * ```
 */

/**
 * Apply organization-scoped filter to a Supabase query builder.
 * Uses .eq('organization_id', orgId) exclusively.
 */
export function applyOrgFilter<T>(
  query: T,
  organizationId: string | null,
): T {
  if (!organizationId) return query;
  return (query as any).eq('organization_id', organizationId) as T;
}

/**
 * Build the fields object for INSERT/UPDATE mutations with org tenant.
 * Only includes organization_id (no legacy columns).
 */
export function orgWriteFields(organizationId: string | null): Record<string, string | null> {
  if (!organizationId) return {};
  return { organization_id: organizationId };
}

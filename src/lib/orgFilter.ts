import type { PostgrestFilterBuilder } from '@supabase/postgrest-js';

/**
 * Applies the canonical organization_id filter to a Supabase query.
 * All tenant-scoped queries MUST use this instead of raw .eq('cooperativa_id', ...).
 */
export function applyOrgFilter<T extends PostgrestFilterBuilder<any, any, any>>(
  query: T,
  organizationId: string | null,
  column: string = 'organization_id',
): T {
  if (!organizationId) {
    console.warn('applyOrgFilter: organizationId is null, query will return no results');
  }
  return query.eq(column, organizationId ?? '00000000-0000-0000-0000-000000000000') as T;
}

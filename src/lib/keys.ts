/**
 * Canonical column keys for the 3-level data model.
 *
 * Use these constants instead of hardcoding column name strings.
 * This ensures consistency and makes a future DB rename trivial.
 *
 * Levels:
 *   ORG   → platform_organizations.id  (tenant)
 *   ACTOR → productores.id             (member/supplier/unit)
 *   ASSET → parcelas.id                (plot/farm)
 *   EVENT → entregas.id, cataciones.id  (transaction/measurement)
 */

// ── Column keys (as stored in Supabase) ──

/** Tenant filter column — every row in every table has this */
export const ORG_KEY = 'organization_id' as const;

/** Actor FK — legacy name is `productor_id` in parcelas, entregas, etc. */
export const ACTOR_KEY = 'productor_id' as const;

/** Asset FK — used in documentos, evidencias, alertas, etc. */
export const ASSET_KEY = 'parcela_id' as const;

/** Lot FK — used in cataciones, paquetes_eudr, etc. */
export const LOT_KEY = 'lote_id' as const;

/** Document FK */
export const DOCUMENT_KEY = 'documento_id' as const;

// ── Table names (canonical, not renamed yet) ──

export const TABLE = {
  ORGS: 'platform_organizations',
  ACTORS: 'productores',
  PLOTS: 'parcelas',
  DELIVERIES: 'entregas',
  DOCUMENTS: 'documentos',
  LOTS_ACOPIO: 'lotes_acopio',
  LOTS_COMMERCIAL: 'lotes_comerciales',
  CONTRACTS: 'contratos',
  CREDITS: 'creditos',
  CUPPINGS: 'cataciones',
  ALERTS: 'alertas',
  EUDR_PACKAGES: 'paquetes_eudr',
  PROFILES: 'profiles',
  USER_ROLES: 'user_roles',
  NOTIFICATIONS: 'notifications',
  LOTES_OFRECIDOS: 'lotes_ofrecidos',
  LOTES_OFRECIDOS_EXPORTADORES: 'lotes_ofrecidos_exportadores',
} as const;

// ── Scope types ──

export type DataScope = 'org' | 'actor' | 'asset' | 'event';

export interface ScopeFilter {
  organizationId: string;
  actorId?: string;
  assetId?: string;
}

/**
 * Build a Supabase filter chain from a ScopeFilter.
 * Always applies org, optionally narrows to actor and/or asset.
 */
export function applyScopeFilter<T>(
  query: T,
  scope: ScopeFilter,
): T {
  let q = (query as any).eq(ORG_KEY, scope.organizationId);
  if (scope.actorId) q = q.eq(ACTOR_KEY, scope.actorId);
  if (scope.assetId) q = q.eq(ASSET_KEY, scope.assetId);
  return q as T;
}

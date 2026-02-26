/**
 * Feature flags for migration phases.
 * Flip ORG_ID_ONLY to true once backend has NOT NULL + FK on organization_id.
 */

/** When true, all queries use organization_id exclusively (no cooperativa_id fallback). */
export const ORG_ID_ONLY = false;

/**
 * When ORG_ID_ONLY is true:
 * - applyOrgFilter uses .eq('organization_id', orgId) only
 * - writes do NOT send cooperativa_id
 * - getTenantColumn always returns 'organization_id'
 *
 * When false (current):
 * - applyOrgFilter uses .or('organization_id.eq.X,cooperativa_id.eq.X')
 * - writes send both organization_id and cooperativa_id
 */

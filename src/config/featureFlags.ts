/**
 * Feature flags for migration phases.
 * ORG_ID_ONLY = true: Phase 2 complete. All queries use organization_id only.
 */

/** All queries use organization_id exclusively. No cooperativa_id fallback. */
export const ORG_ID_ONLY = true;

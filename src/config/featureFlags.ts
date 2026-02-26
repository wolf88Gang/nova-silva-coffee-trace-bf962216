/**
 * Feature flags for migration phases and module gating.
 *
 * ORG_ID_ONLY = true: Phase 2 complete. All queries use organization_id only.
 * Module flags control optional features in the module registry.
 */

/** All queries use organization_id exclusively. No cooperativa_id fallback. */
export const ORG_ID_ONLY = true;

/** Module-level feature flags */
export const ENABLE_CREDITS = true;
export const ENABLE_EXPORTER_MODULE = true;
export const ENABLE_NOVA_GUARD = false; // Not yet implemented
export const ENABLE_VITAL = true;
export const ENABLE_QUALITY = true;
export const ENABLE_EVIDENCE_BLOCKCHAIN = false; // Future

/**
 * Flat map consumed by useActiveModules to check flags by name.
 * Keys MUST match the `flags` strings used in registry.ts.
 */
export const FEATURE_FLAGS: Record<string, boolean> = {
  ORG_ID_ONLY,
  ENABLE_CREDITS,
  ENABLE_EXPORTER_MODULE,
  ENABLE_NOVA_GUARD,
  ENABLE_VITAL,
  ENABLE_QUALITY,
  ENABLE_EVIDENCE_BLOCKCHAIN,
};

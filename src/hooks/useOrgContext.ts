/**
 * Central hook for org-centric (tenant) context.
 * Exposes organizationId, productorId, role, orgTipo, orgName.
 *
 * All data hooks should use organizationId from here for tenant filtering.
 * NEVER use user.id as cooperativa_id — always use organizationId.
 */
import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { OrgTipo } from '@/contexts/AuthContext';

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
 * const { organizationId, productorId, role, orgTipo } = useOrgContext();
 *
 * // Filtering data by tenant:
 * supabase.from('productores').select('*').eq('cooperativa_id', organizationId)
 *
 * // For productor role, filter own data:
 * if (role === 'productor' && productorId) {
 *   query = query.eq('id', productorId);
 * }
 * ```
 */
export function useOrgContext(): OrgContext {
  const { user, isLoading } = useAuth();

  return useMemo(() => ({
    organizationId: user?.organizationId ?? null,
    productorId: user?.productorId ?? null,
    role: user?.role ?? null,
    orgTipo: user?.orgTipo ?? null,
    orgName: user?.organizationName ?? null,
    isLoading,
    isReady: !isLoading && !!user,
  }), [user, isLoading]);
}

/**
 * Helper: get the correct column name for tenant filtering on legacy tables.
 * Most legacy tables use `cooperativa_id`, newer ones use `organization_id`.
 *
 * @param tableName - Name of the table to query
 * @returns The column name to use for tenant filtering
 */
export function getTenantColumn(tableName: string): string {
  const ORG_ID_TABLES = [
    'contratos', 'finance_transactions', 'finance_categories',
    'creditos_productor', 'labor_campaigns', 'certificaciones',
    'blockchain_anchors', 'reclamos_postventa', 'org_people',
  ];
  const ORGANIZACION_ID_TABLES = [
    'equipos_organizacion', 'inventario_insumos_org',
    'cataciones', 'muestras_calidad', 'insumos_organizacion',
  ];

  if (ORG_ID_TABLES.includes(tableName)) return 'organization_id';
  if (ORGANIZACION_ID_TABLES.includes(tableName)) return 'organizacion_id';
  // Default: legacy cooperativa_id (productores, entregas, lotes_acopio, jornales_*, parcelas, etc.)
  return 'cooperativa_id';
}

/**
 * Helpers para filtrar queries por tenant (organization_id / cooperativa_id legacy).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyLegacyOrgFilter<T>(q: any, organizationId: string | null | undefined): any {
  if (!organizationId) return q;
  return q.or(`organization_id.eq.${organizationId},cooperativa_id.eq.${organizationId}`);
}

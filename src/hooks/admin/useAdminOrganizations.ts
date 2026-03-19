/**
 * Hook: listado de organizaciones para admin.
 * Usa adminOrganizationsService. Filtros opcionales.
 */

import { useQuery } from '@tanstack/react-query';
import { fetchOrganizations, type OrgListFilters } from '@/services/admin/adminOrganizationsService';

export function useAdminOrganizations(filters?: OrgListFilters) {
  return useQuery({
    queryKey: ['admin_organizations', filters],
    queryFn: () => fetchOrganizations(filters),
  });
}

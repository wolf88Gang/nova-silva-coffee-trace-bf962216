/**
 * Hook: detalle de organización para admin.
 */

import { useQuery } from '@tanstack/react-query';
import { fetchOrganizationById } from '@/services/admin/adminOrganizationsService';

export function useAdminOrganizationDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['admin_organization', id],
    queryFn: () => fetchOrganizationById(id!),
    enabled: !!id,
  });
}

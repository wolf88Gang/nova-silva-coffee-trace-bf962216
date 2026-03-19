/**
 * Hook: mutación para actualizar estado de organización.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateOrganizationStatus } from '@/services/admin/adminOrganizationsService';
import type { OrgStatus } from '@/types/admin';

export function useAdminUpdateOrganizationStatus(organizationId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: OrgStatus) => updateOrganizationStatus(organizationId!, status),
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ['admin_organizations'] });
      queryClient.invalidateQueries({ queryKey: ['admin_organization', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['admin_overview'] });
    },
  });
}

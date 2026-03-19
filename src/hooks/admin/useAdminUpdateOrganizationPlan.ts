/**
 * Hook: mutación para cambiar plan de organización.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateOrganizationPlan } from '@/services/admin/adminOrganizationsService';
import type { OrgPlan } from '@/types/admin';

export function useAdminUpdateOrganizationPlan(organizationId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (plan: OrgPlan) => updateOrganizationPlan(organizationId!, plan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_organizations'] });
      queryClient.invalidateQueries({ queryKey: ['admin_organization', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['admin_subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['admin_revenue'] });
    },
  });
}

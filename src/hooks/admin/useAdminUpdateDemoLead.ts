/**
 * Hook: mutación para actualizar lead demo (status, notes).
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateDemoLead } from '@/services/admin/adminGrowthService';

export function useAdminUpdateDemoLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status?: string; notes?: string | null }) =>
      updateDemoLead(id, { status, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_demo_leads'] });
    },
  });
}

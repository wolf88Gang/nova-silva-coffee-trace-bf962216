/**
 * Hook: mutación para crear factura manual.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createInvoice } from '@/services/admin/adminBillingService';
import type { CreateInvoiceInput } from '@/repositories/admin/adminBillingRepository';

export function useAdminCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateInvoiceInput) => createInvoice(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_invoices'] });
      queryClient.invalidateQueries({ queryKey: ['admin_revenue'] });
      queryClient.invalidateQueries({ queryKey: ['admin_subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['admin_compliance_issues'] });
    },
  });
}

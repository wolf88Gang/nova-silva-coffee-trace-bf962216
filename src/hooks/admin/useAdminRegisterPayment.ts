/**
 * Hook: mutación para registrar pago.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { registerPayment } from '@/services/admin/adminBillingService';
import type { RegisterPaymentInput } from '@/repositories/admin/adminBillingRepository';

export function useAdminRegisterPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RegisterPaymentInput) => registerPayment(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin_payments'] });
      queryClient.invalidateQueries({ queryKey: ['admin_invoices'] });
      queryClient.invalidateQueries({ queryKey: ['admin_revenue'] });
      queryClient.invalidateQueries({ queryKey: ['admin_subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['admin_compliance_issues'] });
      if (variables.invoiceId) {
        queryClient.invalidateQueries({ queryKey: ['admin_invoice_detail', variables.invoiceId] });
      }
    },
  });
}
